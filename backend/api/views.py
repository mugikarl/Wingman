from django.shortcuts import render
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from django.contrib.auth.hashers import check_password
from django.middleware.csrf import get_token
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission
from rest_framework.authentication import BaseAuthentication
from rest_framework import exceptions
from django.http import JsonResponse
from .serializers import *
from .models import *
from .supabase_client import supabase_anon, supabase_service, jwt_secret, is_valid_supabase_token 
from django.views.decorators.csrf import csrf_exempt
import json
import jwt
from datetime import datetime, timezone
import base64
import io
from django.utils.timezone import now
from .utils.conversion import convert_value
import uuid
import  mimetypes
from io import BytesIO

#AUTHETICATE USER/ADMIN

def authenticate_user(request):
    """
    Authenticates the user based on the Supabase JWT token provided in the
    Authorization header, validates the token, retrieves the user from
    Supabase Auth, and looks up the corresponding employee record.

    Assumptions:
      - The Supabase Auth user ID (UUID) is stored in the employee table's
        `user_id` column.
      - The primary key of the employee table (an integer) is referenced in the
        employee_role table.

    Returns:
        A dictionary containing:
          - client: The Supabase client to use (authenticated or anonymous).
          - token: The extracted JWT token.
          - auth_user_uuid: The UUID of the authenticated user.
          - employee_pk: The employee's primary key (integer) from the employee table.

    Raises:
        Exception: If the token is missing/invalid, if the user cannot be retrieved,
                   or if the employee record is not found.
    """
    # Retrieve the token from the Authorization header.
    auth_header = request.headers.get("Authorization")
    token = None
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]

    # Validate the token and select the appropriate Supabase client.
    if token and is_valid_supabase_token(token):
        client = supabase_service  # Use the authenticated client.
    else:
        client = supabase_anon     # Fall back to the anonymous client.

    # Retrieve the user from Supabase Auth using the token.
    user_response = supabase_service.auth.get_user(token)
    if not (user_response and user_response.user):
        raise Exception("Unauthorized. Could not fetch user.")

    auth_user_uuid = user_response.user.id

    # Look up the employee record by matching the Supabase auth UUID with employee.user_id.
    employee_lookup = client.table("employee") \
        .select("id") \
        .eq("user_id", auth_user_uuid) \
        .single() \
        .execute()

    if not employee_lookup.data:
        raise Exception("Employee record not found.")

    employee_pk = employee_lookup.data["id"]

    return {
        "client": client,
        "token": token,
        "auth_user_uuid": auth_user_uuid,
        "employee_pk": employee_pk,
    }

class SupabaseAuthentication(BaseAuthentication):
    def authenticate(self, request):
        try:
            # Call your existing function to authenticate the user.
            auth_data = authenticate_user(request)
        except Exception as e:
            # If the authentication fails, raise an AuthenticationFailed exception.
            raise exceptions.AuthenticationFailed(str(e))
        
        # Mark the auth_data dictionary as authenticated.
        auth_data["is_authenticated"] = True
        
        # Retrieve the token (if needed).
        token = auth_data.get("token")
        
        # Return a tuple of (user, token). Here, the user is your auth_data dictionary.
        return (auth_data, token)
    
class SupabaseIsAuthenticated(BasePermission):
    def has_permission(self, request, view):
        # Check that request.user is a dict and that is_authenticated is True.
        return isinstance(request.user, dict) and request.user.get("is_authenticated", False)

class SupabaseIsAdmin(BasePermission):
    """
    Allows access only to employees with the "Admin" role.
    This permission expects that request.user is a dictionary (from SupabaseAuthentication)
    that contains the employee's primary key as "employee_pk".
    """
    def has_permission(self, request, view):
        # First, ensure the request has been authenticated using our custom authentication.
        if not (isinstance(request.user, dict) and request.user.get("is_authenticated", False)):
            return False
        
        employee_pk = request.user.get("employee_pk")
        if not employee_pk:
            return False

        try:
            # Query the employee_role table to get the role IDs for this employee.
            role_mapping = supabase_service.table("employee_role") \
                .select("role_id") \
                .eq("employee_id", employee_pk) \
                .execute()

            if not role_mapping.data:
                return False

            # Extract role IDs from the mapping.
            role_ids = [entry["role_id"] for entry in role_mapping.data]

            # Now query the role table to retrieve the role names corresponding to these IDs.
            roles_response = supabase_service.table("role") \
                .select("role_name") \
                .in_("id", role_ids) \
                .execute()

            if not roles_response.data:
                return False

            role_names = [role["role_name"] for role in roles_response.data]

            # Check if "Admin" is one of the roles.
            return "Admin" in role_names

        except Exception as e:
            # Optionally log the error here.
            print("Error in SupabaseIsAdmin permission:", e)
            return False


# LOGIN AS ADMIN


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def login_view(request):
    try:
        data = json.loads(request.body)
        email = data.get("email")
        passcode = data.get("passcode")

        if not email or not passcode:
            return Response({"error": "Both email and passcode are required"}, status=400)

        # Use Supabase Auth to authenticate the user
        auth_response = supabase_anon.auth.sign_in_with_password({
            "email": email,
            "password": passcode
        })
        if not auth_response or not auth_response.user:
            return Response({"error": "Invalid credentials"}, status=401)

        user = auth_response.user

        # Fetch the employee record from Supabase
        employee_response = supabase_anon.table("employee").select("*").eq("user_id", user.id).execute()
        if not employee_response.data:
            return Response({"error": "Employee record not found"}, status=404)
        employee = employee_response.data[0]

        # Fetch roles assigned to this employee
        role_response = supabase_anon.table("employee_role").select("role_id").eq("employee_id", employee["id"]).execute()
        if not role_response.data:
            return Response({"error": "User has no roles assigned"}, status=403)

        # Retrieve the Admin role's ID
        admin_role_response = supabase_anon.table("role").select("id").eq("role_name", "Admin").execute()
        if not admin_role_response.data:
            return Response({"error": "Admin role not found"}, status=500)
        admin_role_id = admin_role_response.data[0]["id"]

        # Check if the employee has the Admin role
        is_admin = any(role["role_id"] == admin_role_id for role in role_response.data)
        if not is_admin:
            return Response({"error": "Access denied: Only Admins can log in"}, status=403)

        # Extract the Supabase JWT token from the session
        supabase_token = auth_response.session.access_token

        return Response({"access_token": supabase_token, "is_admin": True})

    except Exception as e:
        print("Error in login_view:", str(e))
        return Response({"error": "Internal server error"}, status=500)

        
def test_connection(request):
    return Response({"message": "Backend and frontend are connected successfully!"})


#STAFF PROFILING

# Fetch employee data
@api_view(['GET'])
@authentication_classes([SupabaseAuthentication])
@permission_classes([SupabaseIsAdmin])
def fetch_employee_data(request):
    try:
        # Authenticate the user; if unauthorized, authenticate_user() will raise an exception.
        auth_data = authenticate_user(request)
        supabase_client = auth_data["client"]  # Use the authenticated client for table queries

        # Fetch statuses
        status_response = supabase_client.table("employee_status") \
            .select("id, status_name") \
            .execute()
        statuses = status_response.data if status_response.data else []

        # Fetch roles
        roles_response = supabase_client.table("role") \
            .select("id, role_name") \
            .execute()
        roles = roles_response.data if roles_response.data else []

        # Fetch employees with roles and status
        employee_response = supabase_client.table("employee") \
            .select(
                "id, first_name, last_name, contact, base_salary, user_id, "
                "employee_role(role_id, role(id, role_name)), "
                "employee_status(id, status_name)"
            ) \
            .execute()
        employees = employee_response.data if employee_response.data else []

        # Reformat the employee data and fetch auth details for each employee using the admin client.
        formatted_employees = []
        for employee in employees:
            user_email = None
            if employee.get("user_id"):
                # Use the admin client (with service role key) to fetch user details.
                user_response = supabase_client.auth.admin.get_user_by_id(employee["user_id"])
                if user_response and user_response.user:
                    user_email = user_response.user.email
                else:
                    # Optionally, log the failure to fetch user details.
                    print(f"Could not fetch auth details for user_id: {employee['user_id']}")

            employee_roles = [
                {
                    "id": role_data["role"]["id"],
                    "role_name": role_data["role"]["role_name"]
                }
                for role_data in employee.get("employee_role", [])
                if "role" in role_data
            ]

            # Retrieve the status name 
            status_value = employee["employee_status"].get("id")
            
            formatted_employees.append({
                "id": employee["id"],
                "first_name": employee["first_name"],
                "last_name": employee["last_name"],
                "contact": employee["contact"],
                "base_salary": employee["base_salary"],
                "email": user_email,
                "roles": employee_roles,
                "status": status_value
            })

        return Response({
            "statuses": statuses,
            "roles": roles,
            "employees": formatted_employees
        })

    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['POST'])
@authentication_classes([SupabaseAuthentication])
@permission_classes([SupabaseIsAdmin])
def add_employee(request):
    try:
        # Use the helper function to authenticate and retrieve employee info.
        auth_data = authenticate_user(request)
        supabase_client = auth_data["client"]
        employee_pk = auth_data["employee_pk"]

        # Step 3: Check if the employee has an Admin role using the integer primary key.
        admin_role_check = supabase_client.table("employee_role") \
            .select("role_id") \
            .eq("employee_id", employee_pk) \
            .execute()

        user_roles = admin_role_check.data if admin_role_check.data else []
        role_ids = [role["role_id"] for role in user_roles]

        role_names_response = supabase_client.table("role") \
            .select("id, role_name") \
            .in_("id", role_ids) \
            .execute()

        role_names = [role["role_name"] for role in role_names_response.data if "role_name" in role]

        if "Admin" not in role_names:
            return Response({"error": "Forbidden. Only Admin users can add employees."}, status=403)

        # Step 4: Extract new employee data from the request body.
        data = json.loads(request.body.decode("utf-8"))
        first_name = data.get("first_name")
        last_name = data.get("last_name")
        middle_initial = data.get("middle_initial", "")
        email = data.get("email")
        contact = data.get("contact")
        base_salary = data.get("base_salary")
        passcode = data.get("passcode")  # Password for authentication.
        roles = data.get("roles", [])    # List of role IDs.

        # Step 5: Check if the employee (user) already exists in Supabase Auth.
        existing_users_response = supabase_client.auth.admin.list_users()
        user = next((user_data for user_data in existing_users_response if user_data.email == email), None)

        # Use the existing user's UUID or create a new one.
        if user:
            new_employee_user_uuid = user.id
        else:
            auth_response = supabase_client.auth.admin.create_user({
                "email": email,
                "password": passcode,
                "email_confirm": True  # Auto-confirm email.
            })
            if not auth_response or not hasattr(auth_response, 'user'):
                return Response({"error": "Failed to create user in Supabase Auth"}, status=500)
            new_employee_user_uuid = auth_response.user.id

        # Step 6: Insert the new employee record.
        insert_data = {
            "first_name": first_name,
            "last_name": last_name,
            "middle_initial": middle_initial,
            "contact": contact,
            "base_salary": base_salary,
            "user_id": new_employee_user_uuid,  # The UUID from Supabase Auth.
            "status_id": 1  # Automatically assign Active status.
        }
        response = supabase_client.table("employee").insert(insert_data).execute()
        if not response.data:
            return Response({"error": "Failed to create employee"}, status=500)

        # Retrieve the new employee record's primary key (an integer).
        new_employee_pk = response.data[0]["id"]

        # Step 7: If roles are provided, assign them using the employee's primary key.
        if roles:
            role_entries = [{"employee_id": new_employee_pk, "role_id": role} for role in roles]
            supabase_client.table("employee_role").insert(role_entries).execute()

        return Response({"message": "Employee added successfully"}, status=201)

    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['DELETE'])
@authentication_classes([SupabaseAuthentication])
@permission_classes([SupabaseIsAdmin])
def delete_employee(request, employee_id):
    try:
        # Authenticate the user and retrieve details.
        auth_data = authenticate_user(request)
        supabase_client = auth_data["client"]
        authenticated_employee_pk = auth_data["employee_pk"]

        # Prevent self-deletion: An admin cannot delete their own record.
        if authenticated_employee_pk == employee_id:
            return Response({"error": "Admins cannot delete their own records."}, status=403)

        # Fetch the employee record to be deleted.
        response = supabase_client.table("employee").select("id, user_id").eq("id", employee_id).single().execute()

        if not response.data:
            return Response({"error": "Employee not found"}, status=404)

        target_employee_user_id = response.data["user_id"]

        # Delete the authentication record from Supabase Auth.
        # This call removes the user's auth details (email, password, etc.).
        supabase_client.auth.admin.delete_user(target_employee_user_id)
        # Optionally, inspect delete_auth_response for any errors.

        # Delete associated roles first.
        supabase_client.table("employee_role").delete().eq("employee_id", employee_id).execute()

        # Delete the employee record.
        supabase_client.table("employee").delete().eq("id", employee_id).execute()

        return Response({"message": "Employee deleted successfully"}, status=200)

    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['PUT'])
@authentication_classes([SupabaseAuthentication])
@permission_classes([SupabaseIsAdmin])
def edit_employee(request, employee_id):
    try:
        # Step 1: Authenticate user
        auth_data = authenticate_user(request)
        client = auth_data["client"]
        auth_user_uuid = auth_data["auth_user_uuid"]
        employee_pk = auth_data["employee_pk"]  # Authenticated employee ID

        # Step 2: Check if the authenticated user is an Admin
        admin_role_check = client.table("employee_role") \
            .select("role_id") \
            .eq("employee_id", employee_pk) \
            .execute()

        user_roles = admin_role_check.data if admin_role_check.data else []
        role_ids = [role["role_id"] for role in user_roles]

        if not role_ids:
            return Response({"error": "Unauthorized. No roles assigned."}, status=403)

        # Fetch role names
        role_names_response = client.table("role") \
            .select("id, role_name") \
            .in_("id", role_ids) \
            .execute()

        role_names = [role["role_name"] for role in role_names_response.data] if role_names_response.data else []

        is_admin = "Admin" in role_names

        # Restrict access: Only Admins can edit
        if not is_admin:
            return Response({"error": "Forbidden. Only Admins can edit employee records."}, status=403)

        # Step 3: Parse request data
        data = json.loads(request.body.decode("utf-8"))
        first_name = data.get("first_name")
        last_name = data.get("last_name")
        middle_initial = data.get("middle_initial", "")
        email = data.get("email")
        contact = data.get("contact")
        base_salary = data.get("base_salary")
        passcode = data.get("passcode")  # Plain text passcode (optional)
        roles = data.get("roles", [])  # List of role IDs
        status_id = data.get("status_id")

        # Step 4: Update the employee table
        update_data = {
            "first_name": first_name,
            "last_name": last_name,
            "middle_initial": middle_initial,
            "contact": contact,
            "base_salary": base_salary,
            "status_id": status_id,
        }

        client.table("employee").update(update_data).eq("id", employee_id).execute()

        # Step 5: Update Supabase Auth if email or password is changed
        employee_record = client.table("employee").select("user_id").eq("id", employee_id).execute()
        if not employee_record.data:
            return Response({"error": "Employee record not found after update"}, status=404)

        auth_user_id = employee_record.data[0]["user_id"]
        auth_update_data = {}

        if email:
            auth_update_data["email"] = email
        if passcode:
            auth_update_data["password"] = passcode

        if auth_update_data:
            client.auth.admin.update_user_by_id(auth_user_id, auth_update_data)

        # Step 6: Update employee roles if needed
        new_roles = set(roles)
        existing_roles_response = client.table("employee_role") \
            .select("role_id") \
            .eq("employee_id", employee_id) \
            .execute()

        existing_roles = {role["role_id"] for role in existing_roles_response.data} if existing_roles_response.data else set()

        if new_roles != existing_roles:
            client.table("employee_role").delete().eq("employee_id", employee_id).execute()
            role_entries = [{"employee_id": employee_id, "role_id": role_id} for role_id in new_roles]
            if role_entries:
                client.table("employee_role").insert(role_entries).execute()

        return Response({"message": "Employee updated successfully", "employee_id": employee_id}, status=200)

    except Exception as e:
        return Response({"error": str(e)}, status=500)    


# ATTENDANCE 

def extract_date(timestamp_str):
    """
    Extract the date portion from a timestamp string.
    If the timestamp contains a "T", split on it;
    otherwise, split on a space.
    """
    if "T" in timestamp_str:
        return timestamp_str.split("T")[0]
    else:
        return timestamp_str.split(" ")[0]

@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def fetch_attendance_data(request):
    """
    Fetch employees along with:
      - Their own employee status (from employee_status table)
      - Attendance details including:
          • Attendance status (from attendance_status table) – retrieving id and status_name.
          • Time in and time out (from attendance_time table)
    
    If an employee's attendance record for the selected date is missing a time in,
    update that attendance record to have an attendance_status of Absent ("A", which is id:2).
    
    Only active employees (i.e. those with employee_status.status_id equal to 1) are retrieved.
    This view is public and intended for admin usage.
    """
    try:
        # Retrieve the date parameter (format: YYYY-MM-DD) from the query string or POST data.
        date_str = request.GET.get("date") or request.data.get("date")
        if not date_str:
            date_str = datetime.now().strftime("%Y-%m-%d")
        print("Filtering attendance for date:", date_str)
        
        # Query for employees with joined employee_status and attendance details.
        # Retrieve status_id along with status_name.
        response = supabase_anon.table("employee").select(
            "id, first_name, last_name, "
            "employee_status:employee_status(id,status_name), "
            "attendance:attendance(attendance_status:attendance_status(id,status_name), attendance_time:attendance_time(time_in,time_out))"
        ).execute()
        
        employees = response.data if response.data else []
        attendance_data = []
        
        for emp in employees:
            # Skip inactive employees.
            emp_status_obj = emp.get("employee_status")
            if not emp_status_obj or emp_status_obj.get("id") != 1:
                continue

            full_name = f"{emp.get('first_name', '')} {emp.get('last_name', '')}".strip()
            employee_status = emp_status_obj.get("status_name", "N/A")
            
            attendance = emp.get("attendance")
            current_attendance_status = "N/A"
            time_in = "-"
            time_out = "-"
            
            # Look for an attendance record for the specified date.
            attendance_record = None
            if attendance:
                if isinstance(attendance, list):
                    for record in attendance:
                        time_obj = record.get("attendance_time")
                        if time_obj:
                            t_in = time_obj.get("time_in")
                            if t_in:
                                # Extract the date part using our helper function.
                                record_date = extract_date(t_in)
                                print(f"Employee {emp.get('id')} record_date: {record_date}")
                                if record_date == date_str:
                                    attendance_record = record
                                    break
                elif isinstance(attendance, dict):
                    time_obj = attendance.get("attendance_time")
                    if time_obj:
                        t_in = time_obj.get("time_in")
                        if t_in:
                            record_date = extract_date(t_in)
                            print(f"Employee {emp.get('id')} record_date: {record_date}")
                            if record_date == date_str:
                                attendance_record = attendance
            
            if attendance_record:
                attendance_id = attendance_record.get("id")
                time_obj = attendance_record.get("attendance_time")
                status_obj = attendance_record.get("attendance_status")
                time_in_val = time_obj.get("time_in") if time_obj else None
                time_out_val = time_obj.get("time_out") if time_obj else None
                
                # If the record exists but lacks a time in, update it to Absent (status id:2).
                if not time_in_val:
                    update_response = supabase_anon.table("attendance").update(
                        {"attendance_status": 2}
                    ).eq("id", attendance_id).execute()
                    current_attendance_status = "Absent"
                else:
                    # Map status id 1 to "Present" and 2 to "Absent".
                    if status_obj and status_obj.get("id") == 1:
                        current_attendance_status = "Present"
                    elif status_obj and status_obj.get("id") == 2:
                        current_attendance_status = "Absent"
                    else:
                        current_attendance_status = "N/A"
                
                time_in = time_in_val if time_in_val else "-"
                time_out = time_out_val if time_out_val else "-"
            else:
                # If no attendance record exists for the date, assume the employee is absent.
                current_attendance_status = "Absent"
            
            attendance_data.append({
                "id": emp.get("id"),
                "name": full_name,
                "employeeStatus": employee_status,
                "attendanceStatus": current_attendance_status,
                "timeIn": time_in,
                "timeOut": time_out,
            })
        
        return Response(attendance_data)
    
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def time_in(request):
    """
    Verifies an employee's passcode for attendance (time in) and updates/creates the attendance record.
    
    Expects a POST payload with:
      - employee_id: the selected employee's id (from the employee table)
      - email: the provided email (from the frontend)
      - passcode: the entered 6-digit passcode
    
    Workflow:
      1. Verify the employee’s credentials.
      2. Ensure that the provided email matches the email associated with the employee.
      3. Query for existing attendance records for this employee (including joined attendance_time to check time_in).
      4. If a record for today exists and is marked as absent (status = 2), update it to present (status = 1).
         Otherwise, create a new attendance record:
             a. Insert a new record into attendance_time with the current time_in.
             b. Insert a new attendance record referencing that attendance_time and mark it as present.
    
    Note: By default, an attendance record is absent until the employee times in.
    """
    try:
        employee_id = request.data.get("employee_id")
        entered_passcode = request.data.get("passcode")
        provided_email = request.data.get("email")  # Email entered by the user

        if not employee_id or not entered_passcode or not provided_email:
            return Response({"error": "Missing required fields."}, status=400)

        # Query the employee record.
        employee_response = (
            supabase_service.table("employee")
            .select("id, user_id, first_name, last_name")
            .eq("id", employee_id)
            .single()
            .execute()
        )
        if not employee_response.data:
            return Response({"error": "Employee not found."}, status=404)

        employee = employee_response.data
        if not employee.get("user_id"):
            return Response({"error": "Employee not linked to an auth user."}, status=400)

        # Fetch user details using the admin client.
        user_response = supabase_service.auth.admin.get_user_by_id(employee["user_id"])
        if not (user_response and user_response.user):
            return Response({"error": "Unable to fetch user authentication details."}, status=404)

        # Ensure the provided email matches the employee's registered email.
        if provided_email.lower() != user_response.user.email.lower():
            return Response(
                {"error": "Provided email does not match the selected employee's email."},
                status=400,
            )

        # Attempt to sign in using the provided email and passcode.
        sign_in_response = supabase_service.auth.sign_in_with_password({
            "email": provided_email,
            "password": entered_passcode
        })
        if not getattr(sign_in_response, "user", None):
            return Response({"error": "Invalid passcode."}, status=401)
        # Sign out after successful sign in.
        supabase_service.auth.sign_out()

        # Determine today's date (as a string in YYYY-MM-DD format).
        today_str = datetime.now().strftime("%Y-%m-%d")

        # Query for existing attendance records for this employee,
        # joining the related attendance_time (to check its time_in).
        existing_response = supabase_service.table("attendance").select(
            "id, attendance_status, attendance_time(time_in)"
        ).eq("employee_id", employee_id).execute()

        attendance_record = None
        if existing_response.data:
            for record in existing_response.data:
                att_time = record.get("attendance_time")
                if att_time and isinstance(att_time, dict):
                    time_in_val = att_time.get("time_in")
                    # Check if the time_in value starts with today's date.
                    if time_in_val and time_in_val.startswith(today_str):
                        attendance_record = record
                        break

        if attendance_record:
            attendance_id = attendance_record["id"]
            # If the record is still marked absent (status = 2), update it to present (status = 1).
            if attendance_record.get("attendance_status") == 2:
                update_response = supabase_service.table("attendance").update(
                    {"attendance_status": 1}
                ).eq("id", attendance_id).execute()
                if not update_response.data:
                    return Response({"error": "Error updating attendance status."}, status=500)
        else:
            # 1. Insert a new record into the attendance_time table.
            new_time_record = {
                "time_in": datetime.now().isoformat(),
                "time_out": None
            }
            time_response = supabase_service.table("attendance_time").insert(new_time_record).execute()
            if not time_response.data:
                return Response({"error": "Error inserting time record."}, status=500)
            attendance_time_id = time_response.data[0]["id"]

            # 2. Insert a new attendance record referencing the new attendance_time.
            new_attendance = {
                "employee_id": employee_id,
                "attendance_status": 1,   # Mark as present.
                "attendance_time": attendance_time_id
            }
            attendance_response = supabase_service.table("attendance").insert(new_attendance).execute()
            if not attendance_response.data:
                return Response({"error": "Error inserting attendance record."}, status=500)
            attendance_id = attendance_response.data[0]["id"]

        # Build the full employee name.
        full_name = f"{employee.get('first_name', '')} {employee.get('last_name', '')}".strip()

        return Response({
            "success": True,
            "message": "Time in successful.",
            "employee": {
                "id": employee.get("id"),
                "name": full_name
            }
        })

    except Exception as e:
        return Response({"error": str(e)}, status=500)
    
@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def time_out(request):
    """
    Handles employee time-out by ensuring they have already timed in for the current day.

    Expected POST payload:
      - employee_id: the ID of the employee
      - email: employee's registered email
      - passcode: the entered 6-digit passcode

    Steps:
      1. Validate employee credentials.
      2. Ensure the provided email matches the employee’s registered email.
      3. Authenticate the user using their passcode.
      4. Check if there is an existing time-in record for today.
      5. If time-in exists, update the corresponding attendance_time record with the time-out.

    Note: Employees can only time out if they have already timed in for the same day.
    """
    try:
        employee_id = request.data.get("employee_id")
        provided_email = request.data.get("email")
        entered_passcode = request.data.get("passcode")

        if not employee_id or not provided_email or not entered_passcode:
            return Response({"error": "Missing required fields."}, status=400)

        # Query the employee record
        employee_response = (
            supabase_service.table("employee")
            .select("id, user_id, first_name, last_name")
            .eq("id", employee_id)
            .single()
            .execute()
        )

        if not employee_response.data:
            return Response({"error": "Employee not found."}, status=404)

        employee = employee_response.data
        if not employee.get("user_id"):
            return Response({"error": "Employee not linked to an auth user."}, status=400)

        # Fetch user details using the admin client
        user_response = supabase_service.auth.admin.get_user_by_id(employee["user_id"])
        if not (user_response and user_response.user):
            return Response({"error": "Unable to fetch user authentication details."}, status=404)

        # Ensure provided email matches the employee's registered email
        if provided_email.lower() != user_response.user.email.lower():
            return Response({"error": "Email mismatch."}, status=400)

        # Authenticate using the provided passcode
        sign_in_response = supabase_service.auth.sign_in_with_password({
            "email": provided_email,
            "password": entered_passcode
        })
        if not getattr(sign_in_response, "user", None):
            return Response({"error": "Invalid passcode."}, status=401)
        # Sign out after successful sign-in
        supabase_service.auth.sign_out()

        # Get today's date
        today_str = datetime.now().strftime("%Y-%m-%d")

        # Check if the employee has a time-in record for today
        existing_response = supabase_service.table("attendance").select(
            "id, attendance_status, attendance_time(id, time_in, time_out)"
        ).eq("employee_id", employee_id).execute()

        attendance_record = None
        for record in existing_response.data:
            att_time = record.get("attendance_time")
            if att_time and isinstance(att_time, dict):
                time_in_val = att_time.get("time_in")
                if time_in_val and time_in_val.startswith(today_str):
                    attendance_record = record
                    break

        if not attendance_record:
            return Response({"error": "No time-in record found for today."}, status=400)

        attendance_time_id = attendance_record["attendance_time"]["id"]
        time_out_val = attendance_record["attendance_time"]["time_out"]

        if time_out_val:
            return Response({"error": "Time-out already recorded."}, status=400)

        # Update attendance_time with the time-out
        update_response = supabase_service.table("attendance_time").update(
            {"time_out": datetime.now().isoformat()}
        ).eq("id", attendance_time_id).execute()

        if not update_response.data:
            return Response({"error": "Failed to update time-out."}, status=500)

        return Response({
            "success": True,
            "message": "Time out successful."
        })

    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
@authentication_classes([])  # You can add authentication classes if needed
@permission_classes([AllowAny])
def fetch_item_data(request):
    """
    Fetches units, categories, items, inventory, stock-in and out data, menus, menu items, and menu types.
    """
    try:
        # Fetch units
        units_response = supabase_anon.table("unit_of_measurement") \
            .select("id, symbol, unit_category, unit_category") \
            .execute()
        units = units_response.data if units_response.data else []

        # Fetch categories
        categories_response = supabase_anon.table("item_category") \
            .select("id, name") \
            .execute()
        categories = categories_response.data if categories_response.data else []

        # Fetch items
        items_response = supabase_anon.table("items") \
            .select("id, name, stock_trigger, "
                    "unit_of_measurement(id, symbol), "
                    "item_category(id, name)"
            ) \
            .execute()
        items = items_response.data if items_response.data else []
	
        formatted_items = []
        for item in items:
            unit_value = item["unit_of_measurement"].get("id")
            category_value = item["item_category"].get("id")

            formatted_items.append({
                "id": item["id"],
                "name": item["name"],
                "stock_trigger": item["stock_trigger"],
                "measurement": unit_value,
                "category": category_value
            })

        # Fetch inventory data
        inventory_response = supabase_anon.table("inventory") \
            .select("id, item, quantity") \
            .execute()
        inventory_data = inventory_response.data if inventory_response.data else []
	
	    # Format inventory with item details
        formatted_inventory = []
        for inventory in inventory_data:
            # Find the corresponding item data
            item = next((i for i in items if i["id"] == inventory.get("item")), None)
            
            if item:
                formatted_inventory.append({
                    "id": inventory.get("id"),
                    "item": item["id"],
                    "name": item["name"],
                    "measurement": item["unit_of_measurement"].get("id"),
                    "category": item["item_category"].get("id"),
                    "quantity": inventory.get("quantity", 0)
                })
        
        #Fetch suppliers

        suppliers_response = supabase_anon.table("supplier") \
            .select("id","name") \
            .execute()
        suppliers = suppliers_response.data if suppliers_response.data else []

        # Fetch receipts
        receipts_response = supabase_anon.table("receipts") \
            .select("id, receipt_no, supplier (id, name), date") \
            .execute()
        receipts = receipts_response.data if receipts_response.data else []

        formatted_receipts = []

        for receipt in receipts:
            receipt_id = receipt["id"]

            # Fetch stock-in records for this receipt
            stockins_response = supabase_anon.table("stockin") \
                .select("id, price, quantity_in, inventory_id") \
                .eq("receipt_id", receipt_id) \
                .execute()
            stockins_data = []

            if stockins_response.data:
                for stockin in stockins_response.data:
                    inventory_id = stockin.get("inventory_id")
                    inventory_details = None
                    item_details = None

                    if inventory_id:
                        inventory_response = supabase_anon.table("inventory") \
                            .select("id, item, quantity") \
                            .eq("id", inventory_id) \
                            .execute()

                        if inventory_response.data:
                            inventory_details = inventory_response.data[0]
                            item_id = inventory_details.get("item")

                            if item_id:
                                item_response = supabase_anon.table("items") \
                                    .select("id, name, category, measurement, stock_trigger") \
                                    .eq("id", item_id) \
                                    .execute()

                                item_details = item_response.data[0] if item_response.data else None

                    stockins_data.append({
                        "id": stockin["id"],
                        "price": stockin["price"],
                        "quantity_in": stockin["quantity_in"],
                        "inventory": {
                            "id": inventory_details["id"] if inventory_details else None,
                            "current_stock": inventory_details["quantity"] if inventory_details else None,
                            "item": item_details
                        } if inventory_details else None
                    })

            formatted_receipts.append({
                "receipt_id": receipt["id"],
                "receipt_no": receipt["receipt_no"],
                "supplier": receipt["supplier"],
                "date": receipt["date"][:10],
                "stock_ins": stockins_data
            })

        # Fetch employees
        active_status_id = 1  # Adjust based on your actual "Active" status ID

        employees_response = supabase_anon.table("employee") \
            .select("id, first_name, last_name, status_id") \
            .eq("status_id", active_status_id) \
            .execute()

        employees = employees_response.data if employees_response.data else []

        # Fetch disposed inventory
        # Fetch disposed inventory with related item details
        disposed_inventory_response = supabase_anon.table("disposed_inventory") \
            .select("id, inventory_id, disposed_quantity, disposed_unit(id, symbol), "
                    "reason_id(id, name), disposer(id, first_name, last_name), disposal_datetime, other_reason, "
                    "inventory(id, item, quantity, items(name))") \
            .execute()

        disposed_inventory = disposed_inventory_response.data if disposed_inventory_response.data else []

        formatted_disposed_inventory = []
        for disposal in disposed_inventory:
            item_name = disposal.get("inventory", {}).get("items", {}).get("name", "Unknown Item")
            
            formatted_disposed_inventory.append({
                "id": disposal.get("id"),
                "inventory_id": disposal.get("inventory_id"),
                "item_name": item_name,  # Include the item name
                "disposed_quantity": disposal.get("disposed_quantity"),
                "disposed_unit": disposal["disposed_unit"]["symbol"] if disposal.get("disposed_unit") else None,
                "reason": disposal["reason_id"]["name"] if disposal.get("reason_id") else None,
                "disposer": f"{disposal['disposer']['first_name']} {disposal['disposer']['last_name']}" if disposal.get("disposer") else "Unknown",
                "disposal_datetime": disposal.get("disposal_datetime"),
                "other_reason": disposal.get("other_reason")
            })

            
        # Fetch reasons of disposal
        reason_disposal_response = supabase_anon.table("reason_of_disposal") \
            .select("id, name") \
            .execute()
        reason_disposal = reason_disposal_response.data if reason_disposal_response.data else []

        # Fetch menu types
        menu_types_response = supabase_anon.table("menu_type") \
            .select("id, name") \
            .execute()
        menu_types = menu_types_response.data if menu_types_response.data else []

        # Fetch menu statuses
        menu_statuses_response = supabase_anon.table("menu_status") \
            .select("id, name") \
            .execute()
        menu_statuses = menu_statuses_response.data if menu_statuses_response.data else []

        # Fetch menu categories
        menu_categories_response = supabase_anon.table("menu_category") \
            .select("id, name") \
            .execute()
        menu_categories = menu_categories_response.data if menu_categories_response.data else []

        # Fetch menus
        menus_response = supabase_anon.table("menu") \
            .select("id, name, type_id, price, image, status_id, category_id") \
            .execute()
        menus = menus_response.data if menus_response.data else []

        formatted_menus = []
        for menu in menus:
            # Generate a public URL for the image
            image_url = None
            if menu["image"]:
                try:
                    image_url = supabase_anon.storage.from_("menu-images").get_public_url(menu["image"])

                except Exception as e:
                    print(f"Error generating URL for image {menu['image']}: {e}")

            formatted_menus.append({
                "id": menu["id"],
                "name": menu["name"],
                "type_id": menu["type_id"],
                "category_id": menu["category_id"],
                "price": menu["price"],
                "image": image_url,
                "status_id": menu["status_id"]
            })

        # Fetch menu items
        menu_items_response = supabase_anon.table("menu_item") \
            .select("id, menu_id, item_id, quantity, unit_id") \
            .execute()
        menu_items = menu_items_response.data if menu_items_response.data else []

        formatted_menu_items = []
        for menu_item in menu_items:
            formatted_menu_items.append({
                "id": menu_item["id"],
                "menu_id": menu_item["menu_id"],
                "item_id": menu_item["item_id"],
                "quantity": menu_item["quantity"],
                "unit_id": menu_item["unit_id"]
            })

        # Combine menu items with their respective menu.
        for menu in formatted_menus:
            menu["menu_items"] = [
                mi for mi in formatted_menu_items if mi["menu_id"] == menu["id"]
            ]

        return Response({
            "employees": employees,
            "units": units,
            "categories": categories,
            "items": formatted_items,
            "inventory": formatted_inventory,
            "supplier": suppliers,
            "receipts": formatted_receipts,
            "disposed_inventory": formatted_disposed_inventory,
            "disposalreason": reason_disposal,
            "menu_types": menu_types,
            "menu_statuses": menu_statuses,
            "menu_categories":menu_categories,
            "menus": formatted_menus,
            "menu_items": formatted_menu_items,
        })
    
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['POST'])
@authentication_classes([SupabaseAuthentication])
@permission_classes([SupabaseIsAdmin])
def add_inventory(request): # MAIN PURPOSE OF THIS IS TO MAKE A NEW DATA ENTRY WHEN STOCKING IN IF THERE IS NO EXISTING DATA ENTRY, CANNOT ADD QUANTITY
    """
    Handles adding a new inventory record for an item with initial quantity set to 0
    Will be used only if there is no existing data when stocking in 
    """
    try:
        # Authenticate the user and get the authenticated Supabase client
        auth_data = authenticate_user(request)
        supabase_client = auth_data["client"]

        data = json.loads(request.body)
        item_id = data.get("item")
        if not item_id:
            return Response({"error": "Item field is required."}, status=400)

        # Insert a new inventory record with quantity set to 0
        insert_response = supabase_client.table("inventory").insert({
            "item": item_id,
            "quantity": 0
        }).execute()

        if insert_response.data:
            # Return the created inventory record
            return Response({
                "message": "Inventory record created.",
                "inventory": insert_response.data[0]
            }, status=201)
        else:
            return Response({"error": "Failed to create inventory record."}, status=500)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['POST'])
@authentication_classes([SupabaseAuthentication])
@permission_classes([SupabaseIsAdmin])
def add_item(request):
    """
    Handles adding a new item to the database.
    """
    try:
        # Authenticate the user and get the authenticated Supabase client
        auth_data = authenticate_user(request)
        supabase_client = auth_data["client"]

        data = json.loads(request.body)
        name = data.get("name")
        stock_trigger = data.get("stock_trigger")
        unit_id = data.get("measurement")
        category_id = data.get("category")

        if not name or not stock_trigger or not unit_id or not category_id:
            return Response({"error": "All fields are required."}, status=400)

        # Insert new item
        insert_response = supabase_client.table("items").insert({
            "name": name,
            "stock_trigger": stock_trigger,
            "measurement": unit_id,
            "category": category_id
        }).execute()

        if insert_response.data:
            return Response({
                "message": "Item added successfully.",
                "item": insert_response.data[0]
            }, status=201)
        else:
            return Response({"error": "Failed to add item."}, status=500)

    except Exception as e:
        return Response({"error": str(e)}, status=500)

    
@api_view(['PUT'])
@authentication_classes([SupabaseAuthentication])
@permission_classes([SupabaseIsAdmin]) 
def edit_item(request, item_id):
    """
    This view handles the update of an existing item.
    """
    try:
        # Authenticate the user and get the authenticated Supabase client
        auth_data = authenticate_user(request)
        supabase_client = auth_data["client"]

        data = json.loads(request.body)
        name = data.get("name")
        stock_trigger = data.get("stock_trigger")
        unit_id = data.get("measurement")
        category_id = data.get("category")

        if not name or not stock_trigger or not unit_id or not category_id:
            return Response({
                "error": "All fields (name, stock_trigger, unit_id, category_id) are required."
            }, status=400)

        # Check if the item exists
        item_response = supabase_client.table("items").select("*").eq("id", item_id).execute()
        item = item_response.data[0] if item_response.data else None

        if not item:
            return Response({"error": "Item not found."}, status=404)

        # Update the item
        update_response = supabase_client.table("items").update({
            "name": name,
            "stock_trigger": stock_trigger,
            "measurement": unit_id,
            "category": category_id
        }).eq("id", item_id).execute()

        if update_response.data:
            return Response({"message": "Item updated successfully."}, status=200)
        else:
            return Response({"error": "Failed to update item."}, status=500)

    except Exception as e:
        return Response({"error": str(e)}, status=500)
    
@api_view(['DELETE'])
@authentication_classes([SupabaseAuthentication])  # Use appropriate authentication
@permission_classes([SupabaseIsAdmin])  # Ensure only admins can delete items
def delete_item(request, item_id):
    """
    This view handles the deletion of an existing item.
    """
    try:
         # Authenticate the user and get the authenticated Supabase client
        auth_data = authenticate_user(request)
        supabase_client = auth_data["client"]

        # Verify the item exists
        item_response = supabase_client.table("items").select("*").eq("id", item_id).execute()
        if not item_response.data:
            return Response({"error": "Item not found."}, status=404)

        # Delete the item
        delete_response = supabase_client.table("items").delete().eq("id", item_id).execute()

        if delete_response.data:
            return Response({"message": "Item deleted successfully."}, status=200)
        else:
            return Response({"error": "Failed to delete item."}, status=500)
    
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['POST'])
@authentication_classes([SupabaseAuthentication])
@permission_classes([SupabaseIsAdmin])
def add_category(request):
    """
    Handles adding a new category to the databae
    """
    try:
        # Authenticate the user and get the authenticated Supabase client
        auth_data = authenticate_user(request)
        supabase_client = auth_data["client"]

        data = json.loads(request.body)
        name = data.get("name")

        if not name:
            return Response({"error": "All fields are required"}, status=400)

        # Insert new item category
        insert_response = supabase_client.table("item_category").insert({
            "name": name
        }).execute()

        if insert_response.data:
            return Response({
                "message": "Item Category added successfully"
            }, status=201)
        else:
            return Response({"error": "Failed to add Item Category"}, status=500)
        
    except Exception as e:
        return Response({"error" : str(e)}, status=500)

@api_view(['PUT'])
@authentication_classes([SupabaseAuthentication])
@permission_classes([SupabaseIsAdmin])
def edit_category(request, category_id):
    """
    Handles updating an existing category name
    """
    try:
        # Authenticate the user and get the authenticated Supabase client
        auth_data = authenticate_user(request)
        supabase_client = auth_data["client"]

        data = json.loads(request.body)
        new_name = data.get("name")

        if not new_name:
            return Response({"error": "Name is required."}, status=400)

        # Check if category exists
        category_response = supabase_client.table("item_category").select("*").eq("id", category_id).execute()
        if not category_response.data:
            return Response({"error": "Item Category not found."}, status=404)

        # Update category name
        update_response = supabase_client.table("item_category").update({
            "name": new_name
        }).eq("id", category_id).execute()

        if update_response.data:
            return Response({"message": "Item Category updated successfully."}, status=200)
        else:
            return Response({"error": "Failed to update Item Category."}, status=500)

    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['DELETE'])
@authentication_classes([SupabaseAuthentication])  # Use appropriate authentication
@permission_classes([SupabaseIsAdmin])  # Ensure only admins can delete categories
def delete_category(request, category_id):
    """
    This view handles the deletion of an existing category
    """
    try:
        # Authenticate the user and get the authenticated Supabase client
        auth_data = authenticate_user(request)
        supabase_client = auth_data["client"]

        # Verify category exists
        category_response = supabase_client.table("item_category").select("*").eq("id", category_id).execute()
        if not category_response.data:
            return Response({"error": "Item Category not found."}, status=404)

        # Delete category
        delete_response = supabase_client.table("item_category").delete().eq("id", category_id).execute()

        if delete_response.data:
            return Response({"message": "Item Category deleted successfully."}, status=200)
        else:
            return Response({"error": "Failed to delete Item Category."}, status=500)
    
    except Exception as e:
        return Response({"error": str(e)}, status=500)
    

@api_view(['POST'])
@authentication_classes([SupabaseAuthentication])
@permission_classes([SupabaseIsAdmin])
def add_supplier(request):
    """
    Handles adding a new supplier to the databae
    """
    try:
        # Authenticate the user and get the authenticated Supabase client
        auth_data = authenticate_user(request)
        supabase_client = auth_data["client"]

        data = json.loads(request.body)
        name = data.get("name")

        if not name:
            return Response({"error": "All fields are required"}, status=400)

        # Insert new supplier
        insert_response = supabase_client.table("supplier").insert({
            "name": name
        }).execute()

        if insert_response.data:
            return Response({
                "message": "Supplier added successfully"
            }, status=201)
        else:
            return Response({"error": "Failed to add Supplier"}, status=500)
        
    except Exception as e:
        return Response({"error" : str(e)}, status=500)

@api_view(['PUT'])
@authentication_classes([SupabaseAuthentication])
@permission_classes([SupabaseIsAdmin])
def edit_supplier(request, supplier_id):
    """
    Handles updating an existing supplier name
    """
    try:
        # Authenticate the user and get the authenticated Supabase client
        auth_data = authenticate_user(request)
        supabase_client = auth_data["client"]

        data = json.loads(request.body)
        new_name = data.get("name")

        if not new_name:
            return Response({"error": "Name is required."}, status=400)

        # Check if supplier exists
        supplier_response = supabase_client.table("supplier").select("*").eq("id", supplier_id).execute()
        if not supplier_response.data:
            return Response({"error": "Supplier not found."}, status=404)

        # Update supplier name
        update_response = supabase_client.table("supplier").update({
            "name": new_name
        }).eq("id", supplier_id).execute()

        if update_response.data:
            return Response({"message": "Supplier updated successfully."}, status=200)
        else:
            return Response({"error": "Failed to update Supplier."}, status=500)

    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['DELETE'])
@authentication_classes([SupabaseAuthentication])  # Use appropriate authentication
@permission_classes([SupabaseIsAdmin])  # Ensure only admins can delete supplier
def delete_supplier(request, supplier_id):
    """
    This view handles the deletion of an existing supplier
    """
    try:
        # Authenticate the user and get the authenticated Supabase client
        auth_data = authenticate_user(request)
        supabase_client = auth_data["client"]

        # Verify category exists
        supplier_response = supabase_client.table("supplier").select("*").eq("id", supplier_id).execute()
        if not supplier_response.data:
            return Response({"error": "Supplier not found."}, status=404)

        # Delete category
        delete_response = supabase_client.table("supplier").delete().eq("id", supplier_id).execute()

        if delete_response.data:
            return Response({"message": "Supplier deleted successfully."}, status=200)
        else:
            return Response({"error": "Failed to delete Supplier."}, status=500)
    
    except Exception as e:
        return Response({"error": str(e)}, status=500)
    
@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def add_stockin_data(request):
    """
    Handles stocking in items and adding it to the inventory.
    Inserts a new item and updates the current quantity of the item in the inventory
    """
    try:
        data = json.loads(request.body)
        receipt_no = data.get("receipt_no")
        supplier = data.get("supplier_id")
        date = data.get("date")
        stock_ins = data.get("stock_ins", [])

        # Validate receipt fields and stock in arrays
        if not receipt_no or not supplier or not date or not stock_ins:
            return Response(
                {"error": "Receipt fields and at aleast one stock in entry are required"},
                status=400
            )
        
        receipt_response = supabase_anon.table("receipts").insert({
            "receipt_no": receipt_no,
            "supplier": supplier,
            "date": date 
        }).execute()

        if not receipt_response.data:
            return Response({"error": "Failed to add receipt."}, status=500)
        
        # Get the newly created receipt ID
        receipt_id = receipt_response.data[0].get("id")
        if not receipt_id:
            return Response({"error": "Receipt ID not returned."}, status=500)
        
        # Process each stock in entry
        for entry in stock_ins:
            inventory_id = entry.get("inventory_id")
            item_id = entry.get("item_id")
            quantity_in = entry.get("quantity_in")
            price = entry.get("price")

            if not inventory_id or not item_id or quantity_in is None or price is None:
                return Response(
                    {"error": "All fields (inventory_id, item_id, quantity_in, price) are required for each stock in entry."},
                    status=400
                )
            
            try:
                quantity_in = int(quantity_in)
                price = float(price)
            except Exception:
                return Response({"error": "Invalid quantity or price format."}, status=400)
            
            # Insert the Stock In records with the Receipt ID
            stock_in_response = supabase_anon.table("stockin").insert({\
                "receipt_id": receipt_id,
                "inventory_id": inventory_id,
                "item_id": item_id,
                "quantity_in": quantity_in,
                "price": price
            }).execute()
            
            if not stock_in_response.data:
                return Response(
                    {"error": f"Failed to add stock in entry for ID {inventory_id}."},
                    status=500
                )
            
            # Retrieve current inventory to update quantity
            inventory_response = supabase_anon.table("inventory") \
                .select("quantity, item") \
                .eq("id", inventory_id) \
                .execute()
            
            if not inventory_response.data or len(inventory_response.data) == 0:
                return Response(
                    {"error": f"Inventory record not found for ID {inventory_id}"},
                    status=404
                )
            
            inventory_record = inventory_response.data[0]
            current_quantity = inventory_record.get("quantity", 0)

            # Validate that the inventory's item matches the provided Item ID
            if str(inventory_record.get("item")) != str(item_id):
                return Response(
                    {"error": f"Mismatch between provided Item ID {item_id} and inventory record for Inventory ID {inventory_id}."},
                    status=400
                )
            
            new_quantity = current_quantity + quantity_in

            # Update the inventory record with the new quantity
            update_response = supabase_service.table("inventory").update({
                "quantity": new_quantity
            }).eq("id", inventory_id).execute()

            if not update_response.data:
                return Response(
                    {"error": f"Failed to update inventory for inventory_id {inventory_id}."},
                    status=500
                )
            
        return Response(
            {"message": "Receipt and stock in entries added; inventory updated successfully."},
            status=201
        )

    except Exception as e:
        return Response({"error": str(e)}, status=500)
    

@api_view(['PUT'])
@authentication_classes([])
@permission_classes([AllowAny]) 
def edit_receipt_stockin_data(request, receipt_id):
    """
    Updates receipt details (receipt_no, supplier_name, date) and the associated stock-in entries.
    For each stock-in update:
      - If a 'delete' flag is present and True, delete the existing record (if any) and adjust inventory.
      - Else, if an 'id' is provided, update the existing record.
      - If no 'id' is provided, insert a new stock-in entry.
    Inventory quantities are adjusted based on the changes.
    All changes are only committed when the user clicks the submit button.
    Returns the updated receipt (including updated stock_ins) so the frontend can immediately show new IDs.
    """
    try:
        data = json.loads(request.body)

        # Extract receipt details
        receipt_no = data.get("receipt_no")
        supplier = data.get("supplier")
        date = data.get("date")
        stock_in_updates = data.get("stock_in_updates", [])

        # Validate receipt fields
        if not receipt_no or not supplier or not date:
            return Response(
                {"error": "Receipt fields (receipt_no, supplier_name, date) are required."},
                status=400,
            )

        # Update receipt details
        supabase_service.table("receipts").update({
            "receipt_no": receipt_no,
            "supplier": supplier,
            "date": date
        }).eq("id", receipt_id).execute()

        # Process stock_in updates
        for stock in stock_in_updates:
            # If marked for deletion, process deletion and adjust inventory.
            if stock.get("delete"):
                if "id" in stock and stock["id"]:
                    stockin_response = supabase_service.table("stockin") \
                        .select("*") \
                        .eq("id", stock["id"]).execute()
                    if not stockin_response.data:
                        return Response({"error": f"Stock-in record with id {stock['id']} not found."}, status=404)
                    existing_stock = stockin_response.data[0]
                    inventory_id = existing_stock.get("inventory_id")
                    inv_response = supabase_service.table("inventory") \
                        .select("quantity") \
                        .eq("id", inventory_id).execute()
                    if not inv_response.data:
                        return Response({"error": f"Inventory record not found for inventory_id {inventory_id}"}, status=404)
                    current_quantity = int(inv_response.data[0].get("quantity", 0))
                    quantity_to_subtract = int(existing_stock.get("quantity_in", 0))
                    new_inv_quantity = current_quantity - quantity_to_subtract
                    supabase_service.table("inventory") \
                        .update({"quantity": new_inv_quantity}) \
                        .eq("id", inventory_id).execute()
                    supabase_service.table("stockin") \
                        .delete().eq("id", stock["id"]).execute()
                # For new entries marked for deletion, nothing to do.
                continue

            # Process updates for existing records.
            if "id" in stock and stock["id"]:
                stockin_id = stock["id"]
                stockin_response = supabase_service.table("stockin") \
                    .select("*").eq("id", stockin_id).execute()
                if not stockin_response.data:
                    return Response({"error": f"Stock-in record with id {stockin_id} not found."}, status=404)
                existing_stock = stockin_response.data[0]
                old_quantity = int(stock.get("old_quantity", existing_stock.get("quantity_in", 0)))
                new_quantity = int(stock.get("quantity_in", 0))
                price = float(stock.get("price", 0))
                diff = new_quantity - old_quantity

                supabase_service.table("stockin").update({
                    "quantity_in": new_quantity,
                    "price": price
                }).eq("id", stockin_id).execute()

                inventory_id = existing_stock.get("inventory_id")
                inv_response = supabase_service.table("inventory") \
                    .select("quantity").eq("id", inventory_id).execute()
                if not inv_response.data:
                    return Response({"error": f"Inventory record not found for inventory_id {inventory_id}"}, status=404)
                current_quantity = int(inv_response.data[0].get("quantity", 0))
                new_inv_quantity = current_quantity + diff
                supabase_service.table("inventory").update({"quantity": new_inv_quantity}) \
                    .eq("id", inventory_id).execute()

            else:
                # Process insertion for new stockin entries.
                inventory_id = stock.get("inventory_id")
                item_id = stock.get("item_id")
                if not inventory_id or not item_id or stock.get("quantity_in") is None or stock.get("price") is None:
                    return Response({"error": "For new stock-in entries, inventory_id, item_id, quantity_in, and price are required."}, status=400)
                try:
                    quantity_in = int(stock.get("quantity_in"))
                    price = float(stock.get("price"))
                except ValueError:
                    return Response({"error": "Invalid quantity or price format."}, status=400)
                insert_response = supabase_service.table("stockin").insert({
                    "receipt_id": receipt_id,
                    "inventory_id": inventory_id,
                    "item_id": item_id,
                    "quantity_in": quantity_in,
                    "price": price
                }).execute()
                if not insert_response.data:
                    return Response({"error": f"Failed to add new stock-in entry for inventory_id {inventory_id}."}, status=500)
                inv_response = supabase_service.table("inventory") \
                    .select("quantity").eq("id", inventory_id).execute()
                if not inv_response.data:
                    return Response({"error": f"Inventory record not found for inventory_id {inventory_id}."}, status=404)
                current_quantity = int(inv_response.data[0].get("quantity", 0))
                new_quantity = current_quantity + quantity_in
                supabase_service.table("inventory").update({"quantity": new_quantity}) \
                    .eq("id", inventory_id).execute()

        # Fetch updated receipt (with stockin entries)
        updated_receipt_resp = supabase_service.table("receipts") \
            .select("*").eq("id", receipt_id).execute()
        if not updated_receipt_resp.data:
            return Response({"error": "Receipt not found after update."}, status=404)
        updated_receipt = updated_receipt_resp.data[0]
        stockins_resp = supabase_service.table("stockin") \
            .select("*").eq("receipt_id", receipt_id).execute()
        updated_receipt["stock_ins"] = stockins_resp.data if stockins_resp.data else []

        return Response({
            "message": "Receipt and stock-in details updated successfully.",
            "receipt": updated_receipt
        }, status=200)

    except ValueError:
        return Response({"error": "Invalid quantity or price format. Ensure numeric values."}, status=400)
    except Exception as e:
        return Response({"error": str(e)}, status=500)



@api_view(['DELETE'])
@authentication_classes([])
@permission_classes([AllowAny]) 
def delete_receipt(request, receipt_id):
    """
    This view handles the deletion of an existing receipt and its associated stock-in entries.
    Before deletion, for each stock-in entry the inventory quantity is decreased by the stock-in quantity.
    """
    try:
        # Check if the receipt exists.
        receipt_response = supabase_service.table("receipts").select("*").eq("id", receipt_id).execute()
        if not receipt_response.data:
            return Response({"error": "Receipt not found."}, status=404)
        
        # Retrieve all associated stock-in entries.
        stockins_response = supabase_service.table("stockin").select("*").eq("receipt_id", receipt_id).execute()
        if stockins_response.data:
            for stock in stockins_response.data:
                inventory_id = stock.get("inventory_id")
                quantity_in = int(stock.get("quantity_in", 0))
                # Get the current inventory quantity.
                inv_response = supabase_service.table("inventory").select("quantity").eq("id", inventory_id).execute()
                if inv_response.data:
                    current_quantity = int(inv_response.data[0].get("quantity", 0))
                    # Subtract the stock-in quantity.
                    new_quantity = current_quantity - quantity_in
                    supabase_service.table("inventory").update({"quantity": new_quantity}).eq("id", inventory_id).execute()
                else:
                    return Response({"error": f"Inventory record not found for inventory_id {inventory_id}"}, status=404)
        
            # Delete all stock-in entries for this receipt.
            supabase_service.table("stockin").delete().eq("receipt_id", receipt_id).execute()
        
        # Delete the receipt.
        delete_response = supabase_service.table("receipts").delete().eq("id", receipt_id).execute()
        if delete_response.data:
            return Response({"message": "Receipt and associated stock-in entries deleted successfully."}, status=200)
        else:
            return Response({"error": "Failed to delete receipt."}, status=500)
    except Exception as e:
        return Response({"error": str(e)}, status=500)
    

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny]) 
def dispose_item(request):
    try:
        data = json.loads(request.body)
        inventory_id = int(data.get("inventory_id"))
        disposed_quantity = float(data.get("disposed_quantity", 0))
        disposed_unit_id = int(data.get("disposed_unit"))
        reason = data.get("reason_of_disposal", "")
        other_reason = data.get("other_reason", "")
        disposer_id = int(data.get("disposer"))  # Get disposer ID

        # 1. Fetch the inventory record.
        inv_response = supabase_anon.table("inventory").select("*").eq("id", inventory_id).execute()
        if not inv_response.data:
            return Response({"error": "Inventory record not found."}, status=404)
        inventory_record = inv_response.data[0]
        current_inventory_quantity = float(inventory_record["quantity"])

        # 2. Fetch the related item record.
        item_id = inventory_record["item"]
        item_response = supabase_anon.table("items").select("*").eq("id", item_id).execute()
        if not item_response.data:
            return Response({"error": "Item record not found."}, status=404)
        item_record = item_response.data[0]

        # 3. Fetch units and validate conversion
        item_measurement_id = item_record["measurement"]
        item_unit_response = supabase_anon.table("unit_of_measurement").select("*").eq("id", item_measurement_id).execute()
        if not item_unit_response.data:
            return Response({"error": "Item measurement unit not found."}, status=404)
        item_unit = item_unit_response.data[0]  

        disposed_unit_response = supabase_anon.table("unit_of_measurement").select("*").eq("id", disposed_unit_id).execute()
        if not disposed_unit_response.data:
            return Response({"error": "Disposed unit not found."}, status=404)
        disposed_unit = disposed_unit_response.data[0]  

        # 4. Convert the disposed quantity to the item's unit.
        category_str = "Weight" if item_unit["unit_category"] == 1 else "Volume"

        converted_disposed_qty = convert_value(
            disposed_quantity,
            from_unit=disposed_unit["symbol"],
            to_unit=item_unit["symbol"],
            category=category_str
        )

        # 5. Validate: disposed quantity should not exceed current inventory.
        if converted_disposed_qty > current_inventory_quantity:
            return Response({"error": "Disposed quantity exceeds current inventory quantity."}, status=400)

        # 6. Update inventory record.
        new_inventory_qty = current_inventory_quantity - converted_disposed_qty
        update_response = supabase_anon.table("inventory").update({"quantity": new_inventory_qty}).eq("id", inventory_id).execute()

        # 7. Insert disposal record including disposer.
        disposed_data = {
            "inventory_id": inventory_id,
            "disposed_quantity": disposed_quantity,  
            "disposed_unit": disposed_unit_id,
            "reason_id": reason,
            "other_reason": other_reason if reason == "4" else None,
            "disposer": disposer_id,  # Store disposer ID
        }
        insert_response = supabase_anon.table("disposed_inventory").insert(disposed_data).execute()

        return Response({
            "status": "success",
            "inventory_update": update_response.data,
            "disposed_record": insert_response.data
        }, status=200)

    except Exception as e:
        return Response({"error": f"Unexpected error: {e}"}, status=500)



@api_view(['POST'])
@authentication_classes([SupabaseAuthentication])
@permission_classes([SupabaseIsAdmin])
def add_menu_item(request):
    """
    Handles adding a new menu item, including uploading the image to Supabase Storage
    and storing the details in the Menu table.
    """
    try:
        # Authenticate the user and get the authenticated Supabase client
        auth_data = authenticate_user(request)
        supabase_client = auth_data["client"]

        # Access the data directly from request.data and request.FILES
        name = request.data.get("name")
        type_id = request.data.get("type_id")
        category_id = request.data.get("category_id")
        price = request.data.get("price")
        status_id = request.data.get("status_id")
        image = request.FILES.get("image")  # Access image from request.FILES

        # Read the image data
        image_data = image.read()

        # Validate the required fields
        if not name or not type_id or not price or not status_id or not image:
            return Response({"error": "All fields (name, type_id, price, image) are required."}, status=400)

        # Handle image upload to Supabase Storage
        image_filename = f"menu_images/menu-{name}-{type_id}.jpeg"
        storage_response = supabase_client.storage.from_("menu-images").upload(image_filename, image_data, {"content-type": "image.jpeg"})

        # Check if an error occurred during the upload
        if not storage_response:
            return Response({"error": "Failed to upload image to Supabase."}, status=500)

        # Insert menu details into the Menu table
        menu_response = supabase_client.table("menu").insert({
            "name": name,
            "type_id": type_id,
            "price": price,
            "image": image_filename,
            "status_id": status_id,
            "category_id": category_id,
        }).execute()

        # Check for errors in the menu response
        if hasattr(menu_response, 'error') and menu_response.error:
            return Response({"error": "Failed to add menu item"}, status=500)

        if not menu_response.data:
            return Response({"error": "No data returned from the menu insert operation."}, status=500)

        # Extract the menu ID from the response
        try:
            menu_id = menu_response.data[0]["id"]  # Access the 'id' field directly
            if not menu_id:
                return Response({"error": "Menu ID not returned."}, status=500)
        except (IndexError, KeyError) as e:
            return Response({"error": f"Failed to extract menu ID from response: {e}"}, status=500)

        # Handle adding menu items
        menu_items = request.data.get("menu_items", [])
        if not menu_items:
            return Response({"error": "At least one menu item must be provided."}, status=400)

        # Parse menu_items if it's a JSON string
        if isinstance(menu_items, str):
            try:
                menu_items = json.loads(menu_items)  # Convert JSON string to a list of dictionaries
            except json.JSONDecodeError:
                return Response({"error": "Invalid JSON format for menu_items."}, status=400)

        # Ensure menu_items is a list
        if not isinstance(menu_items, list):
            return Response({"error": "menu_items must be a list of dictionaries."}, status=400)

        for item in menu_items:
            # Ensure 'item' is a dictionary
            if not isinstance(item, dict):
                return Response({"error": "Each menu item must be a dictionary."}, status=400)

            item_id = item.get("item_id")
            quantity = item.get("quantity")
            unit_id = item.get("unit_id")

            # Validate menu item fields
            if not item_id or not quantity or not unit_id:
                return Response({"error": "All fields (item_id, quantity, unit_id) are required for each menu item."}, status=400)

            try:
                quantity = float(quantity)
            except Exception:
                return Response({"error": "Invalid quantity format."}, status=400)

            # Insert the Menu_Item record
            menu_item_response = supabase_client.table("menu_item").insert({
                "menu_id": menu_id,
                "item_id": item_id,
                "quantity": quantity,
                "unit_id": unit_id,
            }).execute()

            # Check for errors in the menu item response
            if hasattr(menu_item_response, 'error') and menu_item_response.error:
                return Response({"error": f"Failed to add menu item for item_id {item_id}."}, status=500)

        return Response({"message": "Menu and menu items added successfully."}, status=201)

    except Exception as e:
        return Response({"error": f"Unexpected error: {e}"}, status=500)
    

@api_view(['PUT'])
@authentication_classes([SupabaseAuthentication])
@permission_classes([SupabaseIsAdmin])
def edit_menu_item(request, menu_id):
    """
    Handles editing an existing menu item.
    """
    try:
        # Authenticate the user and get the Supabase client
        auth_data = authenticate_user(request)
        supabase_client = auth_data["client"]

        # Get fields from request data
        name = request.data.get("name")
        type_id = request.data.get("type_id")
        category_id = request.data.get("category_id")
        price = request.data.get("price")
        status_id = request.data.get("status_id")

        # Validate required fields
        if not name or not type_id or not price or not status_id:
            return Response(
                {"error": "Fields (name, type_id, price, status_id) are required."},
                status=400,
            )

        # Prepare the update data dictionary without image field for now
        update_data = {
            "name": name,
            "type_id": type_id,
            "price": price,
            "status_id": status_id,
            "category_id": category_id,
        }

        # Check if a new image file is provided; if yes, delete the current image and upload new one.
        image_file = request.FILES.get("image")
        if image_file:
            # Retrieve the current menu record to get the current image filename
            current_menu_response = supabase_client.table("menu").select("image").eq("id", menu_id).execute()
            if current_menu_response.data and len(current_menu_response.data) > 0:
                current_image = current_menu_response.data[0].get("image")
                if current_image:
                    # Delete the current image from Supabase Storage
                    delete_image_response = supabase_client.storage.from_("menu-images").remove([current_image])
                    # Optionally check for errors in deletion here
                    if hasattr(delete_image_response, "error") and delete_image_response.error:
                        # Log or handle deletion error as needed (here we just pass)
                        pass

            # Upload the new image file
            image_data = image_file.read()
            image_filename = f"menu_images/menu-{name}-{type_id}.jpeg"
            storage_response = supabase_client.storage.from_("menu-images").upload(
                image_filename, image_data, {"content-type": "image/jpeg"}
            )
            if not storage_response:
                return Response({"error": "Failed to upload image to Supabase."}, status=500)
            update_data["image"] = image_filename

        # Update the Menu record using update_data
        menu_update_response = supabase_client.table("menu").update(update_data).eq("id", menu_id).execute()

        if hasattr(menu_update_response, "error") and menu_update_response.error:
            return Response({"error": "Failed to update menu item."}, status=500)

        # Process recipe (menu_items) data
        menu_items = request.data.get("menu_items", [])
        if isinstance(menu_items, str):
            try:
                menu_items = json.loads(menu_items)
            except json.JSONDecodeError:
                return Response({"error": "Invalid JSON format for menu_items."}, status=400)

        if not isinstance(menu_items, list) or len(menu_items) == 0:
            return Response({"error": "At least one menu item must be provided."}, status=400)

        # Delete existing menu_item records for this menu
        delete_response = supabase_client.table("menu_item").delete().eq("menu_id", menu_id).execute()
        if hasattr(delete_response, "error") and delete_response.error:
            return Response({"error": "Failed to delete existing menu items."}, status=500)

        # Insert new menu_item records
        for item in menu_items:
            if not isinstance(item, dict):
                return Response({"error": "Each menu item must be a dictionary."}, status=400)

            item_id = item.get("item_id")
            quantity = item.get("quantity")
            unit_id = item.get("unit_id")
            if not item_id or not quantity or not unit_id:
                return Response(
                    {"error": "All fields (item_id, quantity, unit_id) are required for each menu item."},
                    status=400,
                )
            try:
                quantity = float(quantity)
            except Exception:
                return Response({"error": "Invalid quantity format."}, status=400)

            menu_item_response = supabase_client.table("menu_item").insert({
                "menu_id": menu_id,
                "item_id": item_id,
                "quantity": quantity,
                "unit_id": unit_id,
            }).execute()

            if hasattr(menu_item_response, "error") and menu_item_response.error:
                return Response({"error": f"Failed to add menu item for item_id {item_id}."}, status=500)

        return Response({"message": "Menu and menu items updated successfully."}, status=200)

    except Exception as e:
        return Response({"error": f"Unexpected error: {e}"}, status=500)

@api_view(['DELETE'])
@authentication_classes([SupabaseAuthentication])
@permission_classes([SupabaseIsAdmin])
def delete_menu_item(request, menu_id):
    """
    Handles deleting an existing menu item.
    Deletes the menu record, its associated image from Supabase Storage,
    and all related menu_item records.
    """
    try:
        # Authenticate the user and get the Supabase client
        auth_data = authenticate_user(request)
        supabase_client = auth_data["client"]

        # Retrieve the current menu record to get the image filename
        current_menu_response = supabase_client.table("menu").select("image").eq("id", menu_id).execute()
        if current_menu_response.data and len(current_menu_response.data) > 0:
            current_image = current_menu_response.data[0].get("image")
            if current_image:
                # Delete the current image from Supabase Storage
                delete_image_response = supabase_client.storage.from_("menu-images").remove([current_image])
                # Optionally log or handle deletion errors; here we continue even if deletion fails
                if hasattr(delete_image_response, "error") and delete_image_response.error:
                    print("Warning: Failed to delete image from storage.")

        # Delete associated menu_item records for this menu
        delete_menu_items_response = supabase_client.table("menu_item").delete().eq("menu_id", menu_id).execute()
        
        if hasattr(delete_menu_items_response, "error") and delete_menu_items_response.error:
            return Response({"error": "Failed to delete associated menu items."}, status=500)

        # Delete the menu record itself
        delete_menu_response = supabase_client.table("menu").delete().eq("id", menu_id).execute()
        if hasattr(delete_menu_response, "error") and delete_menu_response.error:
            return Response({"error": "Failed to delete menu item."}, status=500)

        return Response({"message": "Menu item and associated records deleted successfully."}, status=200)

    except Exception as e:
        return Response({"error": f"Unexpected error: {e}"}, status=500)