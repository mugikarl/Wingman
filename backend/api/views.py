from operator import ne
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
from .utils.conversion import convert_value, CONVERSION_FACTORS
import uuid
import  mimetypes
from io import BytesIO
import traceback

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
    Fetch employees along with their attendance details for a specific date.
    Handles None cases to avoid 'NoneType' errors.
    """
    try:
        # Retrieve the date parameter (format: YYYY-MM-DD) from the query string or POST data.
        date_str = request.GET.get("date") or request.data.get("date")
        if not date_str:
            date_str = datetime.now().strftime("%Y-%m-%d")

        # Query for active employees and their attendance details for the specified date.
        response = supabase_anon.table("employee").select(
            "id, first_name, last_name, "
            "employee_status:employee_status(id, status_name), "
            "attendance:attendance(attendance_status:attendance_status(id, status_name), "
            "attendance_time:attendance_time(time_in, time_out))"
        ).eq("employee_status.id", 1).execute()

        employees = response.data if response.data else []
        attendance_data = []

        for emp in employees:
            # Safely get employee_status or default to empty dict
            emp_status = emp.get("employee_status", {})
            if not emp_status:
                continue  # Skip if no employee_status (inactive or invalid)

            full_name = f"{emp.get('first_name', '')} {emp.get('last_name', '')}".strip()
            employee_status = emp_status.get("status_name", "N/A")
            attendance = emp.get("attendance", [])

            # Initialize default values
            current_attendance_status = "Absent"
            time_in = "-"
            time_out = "-"

            # Process attendance records if they exist
            if attendance:
                if isinstance(attendance, list):
                    for record in attendance:
                        time_obj = record.get("attendance_time", {})
                        t_in = time_obj.get("time_in")
                        if t_in and extract_date(t_in) == date_str:
                            status_obj = record.get("attendance_status", {})
                            time_in = t_in
                            time_out = time_obj.get("time_out", "-")
                            current_attendance_status = (
                                "Present" if status_obj.get("id") == 1 else "Absent"
                            )
                            break

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
      1. Verify the employee's credentials.
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
      2. Ensure the provided email matches the employee's registered email.
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
                "category": category_value,
                "is_archived": item.get("is_archived", False)
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
        menus_response = supabase_anon.table("menu_items") \
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

        # Fetch menu ingredients
        menu_items_response = supabase_anon.table("menu_ingredients") \
            .select("id, menu_id, inventory_id, quantity, unit_id") \
            .execute()
        menu_ingredients = menu_items_response.data if menu_items_response.data else []

        formatted_menu_ingredients = []
        for menu_ingredient in menu_ingredients:
            formatted_menu_ingredients.append({
                "id": menu_ingredient["id"],
                "menu_id": menu_ingredient["menu_id"],
                "inventory_id": menu_ingredient["inventory_id"],
                "quantity": menu_ingredient["quantity"],
                "unit_id": menu_ingredient["unit_id"]
            })

        # Combine menu items with their respective menu.
        for menu in formatted_menus:
            menu["menu_ingredients"] = [
                mi for mi in formatted_menu_ingredients if mi["menu_id"] == menu["id"]
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
            "menu_items": formatted_menus,
            "menu_ingredients": formatted_menu_ingredients,
        })
    
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def fetch_items_page_data(request):
    """Specialized endpoint for Items.jsx"""
    try:
        # Use supabase_anon for data retrieval
        items = supabase_anon.table('items').select('*').execute()
        categories = supabase_anon.table('item_category').select('*').execute()
        units = supabase_anon.table('unit_of_measurement').select('*').execute()
        
        # Process data into the expected format
        items_data = items.data
        categories_data = categories.data
        units_data = units.data
        
        return Response({
            'items': items_data,
            'categories': categories_data,
            'units': units_data,
        })
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def fetch_inventory_page_data(request):
    """
    Enhanced endpoint for Inventory.jsx that includes items data
    """
    try:
        # Fetch inventory with related item data
        inventory_response = supabase_anon.table("inventory") \
            .select("*, item:items(*)") \
            .execute()
        inventory_data = inventory_response.data if inventory_response.data else []
        
        # Fetch units
        units_response = supabase_anon.table("unit_of_measurement") \
            .select("*") \
            .execute()
        units_data = units_response.data if units_response.data else []
        
        # Fetch categories
        categories_response = supabase_anon.table("item_category") \
            .select("*") \
            .execute()
        categories_data = categories_response.data if categories_response.data else []
        
        # Fetch employees
        employees_response = supabase_anon.table("employee") \
            .select("id, first_name, last_name") \
            .execute()
        employees_data = employees_response.data if employees_response.data else []
        
        # Fetch disposal reasons
        disposal_reason_response = supabase_anon.table("reason_of_disposal") \
            .select("*") \
            .execute()
        disposal_reason_data = disposal_reason_response.data if disposal_reason_response.data else []
        
        # Fetch items (previously in fetch_items_page_data)
        items_response = supabase_anon.table('items') \
            .select('*') \
            .execute()
        items_data = items_response.data if items_response.data else []
        
        return Response({
            'inventory': inventory_data,
            'units': units_data,
            'categories': categories_data,
            'employees': employees_data,
            'disposalreason': disposal_reason_data,
            'items': items_data  # Added items data
        })
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def fetch_stockin_page_data(request):
    """Specialized endpoint for StockIn.jsx"""
    try:
        # Use supabase_anon for data retrieval with foreign keys
        receipts = supabase_anon.table('receipts').select('*').execute()
        stockin_items = supabase_anon.table('stockin').select('*').execute()
        suppliers = supabase_anon.table('supplier').select('*').execute()
        items = supabase_anon.table('items').select('*').execute()
        inventory = supabase_anon.table('inventory').select('*, item:items(*)').execute()
        units = supabase_anon.table('unit_of_measurement').select('*').execute()
        
        # Extract data
        receipts_data = receipts.data
        stockin_items_data = stockin_items.data
        suppliers_data = suppliers.data
        inventory_data = inventory.data
        items_data = items.data
        
        # Get all items indexed by ID for quick lookup
        items_lookup = {item['id']: item for item in items_data}
        
        # Get all inventory items indexed by ID
        inventory_lookup = {inv['id']: inv for inv in inventory_data}
        
        # Enrich receipts with supplier information
        for receipt in receipts_data:
            supplier_id = receipt.get('supplier')
            if supplier_id:
                # Find the supplier and add as nested object
                supplier = next((s for s in suppliers_data if s.get('id') == supplier_id), None)
                if supplier:
                    receipt['supplier'] = supplier
        
        # Process stock-in items and organize by receipt_id
        stock_ins_by_receipt = {}
        for stock_in in stockin_items_data:
            receipt_id = stock_in.get('receipt_id')
            if receipt_id not in stock_ins_by_receipt:
                stock_ins_by_receipt[receipt_id] = []
            
            # Get inventory details
            inventory_id = stock_in.get('inventory_id')
            inventory_item = inventory_lookup.get(inventory_id, {})
            
            # Get item details from inventory or directly
            item_id = stock_in.get('item_id')
            if not item_id and inventory_item and 'item' in inventory_item:
                if isinstance(inventory_item['item'], dict):
                    item_details = inventory_item['item']
                else:
                    item_id = inventory_item.get('item')
                    item_details = items_lookup.get(item_id, {})
            else:
                item_details = items_lookup.get(item_id, {})
            
            # Build a complete stock-in object with nested inventory and item data
            enriched_stock_in = {
                **stock_in,
                'inventory': {
                    'id': inventory_id,
                    'item': item_details
                }
            }
            
            stock_ins_by_receipt[receipt_id].append(enriched_stock_in)
        
        # Add stock-in items to each receipt
        for receipt in receipts_data:
            receipt_id = receipt.get('id')
            receipt['stock_ins'] = stock_ins_by_receipt.get(receipt_id, [])
        
        # Log the first receipt with stock-ins for debugging
        if receipts_data and len(receipts_data) > 0:
            first_receipt = receipts_data[0]
            stock_ins = first_receipt.get('stock_ins', [])
            print(f"First receipt has {len(stock_ins)} stock-in items")
            if stock_ins:
                print("First stock-in item structure:", stock_ins[0])
        
        return Response({
            'receipts': receipts_data,
            'supplier': suppliers_data,
            'items': items_data,
            'inventory': inventory_data,
            'units': units.data,
        })
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def fetch_menu_data(request):
    """
    Optimized endpoint for Menu.jsx that fetches menu-related data
    with improved performance.
    """
    try:
        # Fetch all data in parallel to save time on network requests
        # Let's use multiple tasks to fetch different pieces of data simultaneously
        
        # 1. Fetch static reference data and menus in parallel
        menu_categories_task = supabase_anon.table("menu_category").select("id, name").execute()
        menu_statuses_task = supabase_anon.table("menu_status").select("id, name").execute()
        menu_types_task = supabase_anon.table("menu_type").select("id, name").execute()
        units_task = supabase_anon.table("unit_of_measurement").select("id, symbol, unit_category").execute()
        menus_task = supabase_anon.table("menu_items").select("id, name, type_id, price, image, status_id, category_id").execute()
        
        # 2. Extract results
        menu_categories = menu_categories_task.data if menu_categories_task.data else []
        menu_statuses = menu_statuses_task.data if menu_statuses_task.data else []
        menu_types = menu_types_task.data if menu_types_task.data else []
        units = units_task.data if units_task.data else []
        menus = menus_task.data if menus_task.data else []
        
        # 3. Get all menu IDs for bulk ingredient query
        menu_ids = [menu["id"] for menu in menus]
        
        # 4. Fetch all menu ingredients in a single query
        all_ingredients = []
        inventory_ids = set()
        unit_ids = set()
        ingredients_by_menu = {}
        
        if menu_ids:
            menu_ingredients_response = supabase_anon.table("menu_ingredients").select("*").in_("menu_id", menu_ids).execute()
            all_ingredients = menu_ingredients_response.data if menu_ingredients_response.data else []
            
            # Group ingredients by menu_id and collect inventory/unit IDs
            for ingredient in all_ingredients:
                menu_id = ingredient.get("menu_id")
                inventory_id = ingredient.get("inventory_id")
                unit_id = ingredient.get("unit_id")
                
                if inventory_id:
                    inventory_ids.add(inventory_id)
                
                if unit_id:
                    unit_ids.add(unit_id)
                    
                if menu_id not in ingredients_by_menu:
                    ingredients_by_menu[menu_id] = []
                    
                ingredients_by_menu[menu_id].append(ingredient)
        
        # 5. Fetch only needed inventory items in bulk
        inventory_data = {}
        if inventory_ids:
            inventory_response = supabase_anon.table("inventory").select("id, item, items(id, name)").in_("id", list(inventory_ids)).execute()
            
            # Process inventory data
            for inv in inventory_response.data or []:
                item_data = inv.get("items", {})
                if item_data:
                    inventory_data[inv.get("id")] = {
                        "id": inv.get("id"),
                        "item": item_data.get("id"),
                        "name": item_data.get("name", "Unknown Item"),
                        "quantity": inv.get("quantity", 0)
                    }
        
        # 6. Create fast lookup maps
        unit_map = {unit["id"]: unit["symbol"] for unit in units if "id" in unit and "symbol" in unit}
        
        # 7. Build formatted menu items with all their ingredients
        formatted_menus = []
        for menu in menus:
            # Handle image URL
            image_url = None
            if menu["image"]:
                try:
                    image_url = supabase_anon.storage.from_("menu-images").get_public_url(menu["image"])
                except Exception as e:
                    print(f"Error generating URL for image {menu['image']}: {e}")
            
            # Process this menu's ingredients
            menu_ingredients = []
            for ingredient in ingredients_by_menu.get(menu["id"], []):
                inventory_id = ingredient["inventory_id"]
                unit_id = ingredient["unit_id"]
                
                # Get inventory item info from our cache
                inventory_item = inventory_data.get(inventory_id, {})
                item_name = inventory_item.get("name", "Unknown")
                
                # Get unit symbol from our cache
                unit_symbol = unit_map.get(unit_id, "")
                
                menu_ingredients.append({
                    "id": ingredient["id"],
                    "menu_id": ingredient["menu_id"],
                    "inventory_id": inventory_id,
                    "quantity": ingredient["quantity"],
                    "unit_id": unit_id,
                    "item_name": item_name,
                    "unit": unit_symbol
                })
            
            formatted_menus.append({
                "id": menu["id"],
                "name": menu["name"],
                "type_id": menu["type_id"],
                "category_id": menu["category_id"],
                "price": menu["price"],
                "image": image_url,
                "status_id": menu["status_id"],
                "menu_ingredients": menu_ingredients
            })
        
        # 8. Return all data in a single response
        return Response({
            "menu_categories": menu_categories,
            "menu_statuses": menu_statuses,
            "menu_types": menu_types,
            "units": units,
            "inventory": list(inventory_data.values()),  # Only the inventory items needed
            "menu_items": formatted_menus
        })
    
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return Response({"error": str(e)}, status=500)

@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def fetch_stockout_page_data(request):
    """Specialized endpoint for StockOut.jsx"""
    try:
        # Fetch disposed inventory with better joins to ensure we get all related data
        disposed_inventory_response = supabase_anon.table("disposed_inventory") \
            .select("id, inventory_id, disposed_quantity, reason_id, disposer, disposal_datetime, other_reason, "
                    "disposed_unit:unit_of_measurement(id, symbol), "
                    "reason:reason_id(id, name), "
                    "employee:disposer(id, first_name, last_name), "
                    "inventory:inventory_id(id, item, items(id, name, measurement))") \
            .execute()

        disposed_inventory = disposed_inventory_response.data if disposed_inventory_response.data else []

        # Format the data like in fetch_item_data
        formatted_disposed_inventory = []
        for disposal in disposed_inventory:
            # Carefully extract nested data, with fallbacks for missing values
            # Get item name from inventory's nested items
            inventory = disposal.get("inventory", {})
            item_data = inventory.get("items", {}) if inventory else {}
            item_name = item_data.get("name", "Unknown Item")
            
            # Get disposer's full name
            disposer_data = disposal.get("employee", {})
            disposer_name = ""
            if disposer_data:
                first_name = disposer_data.get("first_name", "")
                last_name = disposer_data.get("last_name", "")
                disposer_name = f"{first_name} {last_name}".strip()
            
            # Get unit symbol
            unit_data = disposal.get("disposed_unit", {})
            unit_symbol = unit_data.get("symbol", "") if unit_data else ""
            
            # Get reason name
            reason_data = disposal.get("reason", {})
            reason_name = reason_data.get("name", "") if reason_data else ""
            
            formatted_disposed_inventory.append({
                "id": disposal.get("id"),
                "inventory_id": disposal.get("inventory_id"),
                "item_name": item_name,
                "disposed_quantity": disposal.get("disposed_quantity", 0),
                "disposed_unit": unit_symbol,
                "reason": reason_name,
                "reason_name": reason_name,  # Added for clarity and consistency
                "disposer": disposer_name or disposal.get("disposer", "Unknown"),
                "disposer_name": disposer_name,  # Added for clarity and consistency
                "disposal_datetime": disposal.get("disposal_datetime"),
                "other_reason": disposal.get("other_reason", "")
            })
        
        # Log the first item for debugging
        if formatted_disposed_inventory and len(formatted_disposed_inventory) > 0:
            print("First disposed item:", formatted_disposed_inventory[0])
        
        # Fetch additional data needed for the DisposedInventory modal
        employees_response = supabase_anon.table("employee") \
            .select("id, first_name, last_name") \
            .execute()
        employees = employees_response.data if employees_response.data else []
        
        units_response = supabase_anon.table("unit_of_measurement") \
            .select("*") \
            .execute()
        units = units_response.data if units_response.data else []
        
        reason_disposal_response = supabase_anon.table("reason_of_disposal") \
            .select("id, name") \
            .execute()
        reason_disposal = reason_disposal_response.data if reason_disposal_response.data else []
        
        return Response({
            'disposed_inventory': formatted_disposed_inventory,
            'employees': employees,
            'units': units,
            'disposalreason': reason_disposal
        })
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return Response({'error': str(e)}, status=500)
    

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
            "category": category_id,
            "is_archived": False
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
def archive_item(request, item_id):
    """
    Archives an existing item instead of deleting it.
    """
    try:
        # Authenticate the user and get the authenticated Supabase client
        auth_data = authenticate_user(request)
        supabase_client = auth_data["client"]

        # Verify the item exists
        item_response = supabase_client.table("items").select("*").eq("id", item_id).execute()
        if not item_response.data:
            return Response({"error": "Item not found."}, status=404)

        # Archive the item by setting is_archived to True
        archive_response = supabase_client.table("items").update({
            "is_archived": True
        }).eq("id", item_id).execute()

        if archive_response.data:
            return Response({"message": "Item archived successfully."}, status=200)
        else:
            return Response({"error": "Failed to archive item."}, status=500)
    
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['PUT'])
@authentication_classes([SupabaseAuthentication])
@permission_classes([SupabaseIsAdmin])
def unarchive_item(request, item_id):
    """
    Restores an archived item.
    """
    try:
        # Authenticate the user and get the authenticated Supabase client
        auth_data = authenticate_user(request)
        supabase_client = auth_data["client"]

        # Verify the item exists
        item_response = supabase_client.table("items").select("*").eq("id", item_id).execute()
        if not item_response.data:
            return Response({"error": "Item not found."}, status=404)

        # Unarchive the item by setting is_archived to False
        unarchive_response = supabase_client.table("items").update({
            "is_archived": False
        }).eq("id", item_id).execute()

        if unarchive_response.data:
            return Response({"message": "Item restored successfully."}, status=200)
        else:
            return Response({"error": "Failed to restore item."}, status=500)
    
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
@authentication_classes([SupabaseAuthentication])
@permission_classes([SupabaseIsAdmin])
def delete_item(request, item_id):
    """
    This view handles the permanent deletion of an archived item.
    """
    try:
        # Authenticate the user and get the authenticated Supabase client
        auth_data = authenticate_user(request)
        supabase_client = auth_data["client"]

        # Verify the item exists and is archived
        item_response = supabase_client.table("items").select("*").eq("id", item_id).execute()
        if not item_response.data:
            return Response({"error": "Item not found."}, status=404)
        
        # Check if the item is archived
        item = item_response.data[0]
        if not item.get("is_archived", False):
            return Response({"error": "Cannot delete an active item. Archive it first."}, status=400)

        # Check if the item is used in any inventory records
        inventory_response = supabase_client.table("inventory").select("id").eq("item", item_id).execute()
        if inventory_response.data:
            inventory_ids = [inv["id"] for inv in inventory_response.data]
            
            # Check if any of these inventory items are used in menu_ingredients
            menu_check_query = supabase_client.table("menu_ingredients").select("menu_id, inventory_id").in_("inventory_id", inventory_ids).execute()
            
            if menu_check_query.data:
                # Get the menu details to provide a helpful error message
                menu_ids = set(item["menu_id"] for item in menu_check_query.data)
                menus_response = supabase_client.table("menu_items").select("id, name").in_("id", list(menu_ids)).execute()
                
                menu_names = [menu["name"] for menu in menus_response.data]
                menu_list = ", ".join(menu_names)
                
                return Response({
                    "error": f"Cannot delete this item because it is used in menu recipes: {menu_list}. Please update the recipes first."
                }, status=400)
        
        # Delete the item if it's not used in any menus
        delete_response = supabase_client.table("items").delete().eq("id", item_id).execute()

        if delete_response.data:
            return Response({"message": "Item deleted permanently."}, status=200)
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
@authentication_classes([SupabaseAuthentication])
@permission_classes([SupabaseIsAdmin])
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

        # Check if the category is used in any items
        items_using_category = supabase_client.table("items").select("id, name").eq("category", category_id).execute()

        if items_using_category.data and len(items_using_category.data) > 0:
            # Get the item names for a more useful error message
            item_names = [item["name"] for item in items_using_category.data]
            item_list = ", ".join(item_names)
            
            return Response({
                "error": f"Cannot delete this category because it is assigned to the following items: {item_list}. Please change the category of these items first."
            }, status=400)
        
        # Delete category if no items are using it
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
    Also creates an expense entry for the total cost of the stock-in
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
        
        # Calculate total cost for the expense entry
        total_cost = 0
        
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
                
                # Add to total cost (price per unit * quantity)
                total_cost += price * quantity_in
                
            except Exception:
                return Response({"error": "Invalid quantity or price format."}, status=400)
            
            # Insert the Stock In records with the Receipt ID
            stock_in_response = supabase_anon.table("stockin").insert({
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
        
        # Create expense entry for the total stock-in cost
        expense_data = {
            "type_id": 1,
            "stockin_id": receipt_id,
            "date": date,
            "cost": total_cost
        }
        
        # Insert expense record
        expense_response = supabase_service.table("expenses").insert(expense_data).execute()
        
        if not expense_response.data:
            return Response(
                {"error": "Failed to create expense entry for stock-in."},
                status=500
            )
            
        return Response(
            {"message": "Receipt, stock in entries, and expense record added; inventory updated successfully."},
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

        # Calculate new total cost for updated expense entry
        total_cost = 0
        stockins_resp = supabase_service.table("stockin") \
            .select("*").eq("receipt_id", receipt_id).execute()
        if stockins_resp.data:
            for stock in stockins_resp.data:
                quantity = int(stock.get("quantity_in", 0))
                price = float(stock.get("price", 0))
                total_cost += price * quantity

        # Update the expense record
        expense_response = supabase_service.table("expenses") \
            .update({"cost": total_cost}) \
            .eq("stockin_id", receipt_id) \
            .execute()

        if not expense_response.data:
            return Response({"error": "Failed to update expense record."}, status=500)

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
        
        # Delete the associated expense record
        expense_response = supabase_service.table("expenses") \
            .delete() \
            .eq("stockin_id", receipt_id) \
            .execute()

        # Delete the receipt.
        delete_response = supabase_service.table("receipts").delete().eq("id", receipt_id).execute()
        if delete_response.data:
            return Response({"message": "Receipt, associated stock-in entries, and expense record deleted successfully."}, status=200)
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
        if item_unit["unit_category"] == 3:  # Assuming 3 represents 'Count'
            converted_disposed_qty = disposed_quantity
        else:
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

        # After successful disposal and inventory update
        insert_response = supabase_anon.table("disposed_inventory").insert(disposed_data).execute()

        # Instead of directly calling the update_menu_availability function,
        # just perform similar operations inline
        try:
            affected_menu_items = []
            
            # Get menu ingredients that use the disposed inventory item
            menu_ingredients = supabase_anon.table("menu_ingredients").select("menu_id").eq("inventory_id", inventory_id).execute()
            
            if menu_ingredients.data:
                menu_ids = [item.get('menu_id') for item in menu_ingredients.data]
                unique_menu_ids = list(set(menu_ids))  # Remove duplicates
                
                # Update status of affected menu items to unavailable if inventory is insufficient
                for menu_id in unique_menu_ids:
                    # Check if this menu item should be marked unavailable
                    menu_item = supabase_anon.table("menu_items").select("*").eq("id", menu_id).execute().data[0]
                    
                    # Get the required quantity for this menu item from menu_ingredients
                    required_response = supabase_anon.table("menu_ingredients").select("quantity").eq("menu_id", menu_id).eq("inventory_id", inventory_id).execute()

                    if required_response.data:
                        required_quantity = float(required_response.data[0].get('quantity', 0))
                        
                        # Check if remaining inventory is less than what's required
                        if new_inventory_qty < required_quantity:
                            supabase_anon.table("menu_items").update({
                                "status_id": 2  # Unavailable
                            }).eq("id", menu_id).execute()
                            
                            affected_menu_items.append({
                                "menu_id": menu_id,
                                "name": menu_item.get('name', 'Unknown'),
                                "new_status": "Unavailable"
                            })
            
            availability_updated = True
            
        except Exception as e:
            # Don't fail the main function if availability update fails
            availability_updated = False
            affected_menu_items = []

        return Response({
            "status": "success",
            "inventory_update": update_response.data,
            "disposed_record": insert_response.data,
            "menu_availability_updated": availability_updated,
            "affected_menu_items": affected_menu_items if availability_updated else []
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
        menu_response = supabase_client.table("menu_items").insert({
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
        menu_items = request.data.get("menu_ingredients", [])
        if not menu_items:
            return Response({"error": "At least one menu item must be provided."}, status=400)

        # Parse menu_items if it's a JSON string
        if isinstance(menu_items, str):
            try:
                menu_items = json.loads(menu_items)  # Convert JSON string to a list of dictionaries
            except json.JSONDecodeError:
                return Response({"error": "Invalid JSON format for menu_ingredients."}, status=400)

        # Ensure menu_items is a list
        if not isinstance(menu_items, list):
            return Response({"error": "menu_ingredients must be a list of dictionaries."}, status=400)

        for item in menu_items:
            # Ensure 'item' is a dictionary
            if not isinstance(item, dict):
                return Response({"error": "Each menu item must be a dictionary."}, status=400)

            inventory_id = item.get("inventory_id")
            quantity = item.get("quantity")
            unit_id = item.get("unit_id")

            # Validate menu item fields
            if not inventory_id or not quantity or not unit_id:
                return Response({"error": "All fields (inventory_id, quantity, unit_id) are required for each menu item."}, status=400)

            try:
                quantity = float(quantity)
            except Exception:
                return Response({"error": "Invalid quantity format."}, status=400)

            # Insert the Menu_Ingredients record
            menu_item_response = supabase_client.table("menu_ingredients").insert({
                "menu_id": menu_id,
                "inventory_id": inventory_id,
                "quantity": quantity,
                "unit_id": unit_id,
            }).execute()

            # Check for errors in the menu item response
            if hasattr(menu_item_response, 'error') and menu_item_response.error:
                return Response({"error": f"Failed to add menu item for inventory_id {inventory_id}."}, status=500)

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
            current_menu_response = supabase_client.table("menu_items").select("image").eq("id", menu_id).execute()
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
        menu_update_response = supabase_client.table("menu_items").update(update_data).eq("id", menu_id).execute()

        if hasattr(menu_update_response, "error") and menu_update_response.error:
            return Response({"error": "Failed to update menu item."}, status=500)

        # Process recipe (menu_items) data
        menu_items = request.data.get("menu_ingredients", [])
        if isinstance(menu_items, str):
            try:
                menu_items = json.loads(menu_items)
            except json.JSONDecodeError:
                return Response({"error": "Invalid JSON format for menu_inventory."}, status=400)

        if not isinstance(menu_items, list) or len(menu_items) == 0:
            return Response({"error": "At least one menu item must be provided."}, status=400)

        # Delete existing menu_ingredients records for this menu
        delete_response = supabase_client.table("menu_ingredients").delete().eq("menu_id", menu_id).execute()
        if hasattr(delete_response, "error") and delete_response.error:
            return Response({"error": "Failed to delete existing menu items."}, status=500)

        # Insert new menu_ingredients records
        for item in menu_items:
            if not isinstance(item, dict):
                return Response({"error": "Each menu item must be a dictionary."}, status=400)

            inventory_id = item.get("inventory_id")
            quantity = item.get("quantity")
            unit_id = item.get("unit_id")
            if not inventory_id or not quantity or not unit_id:
                return Response(
                    {"error": "All fields (inventory_id, quantity, unit_id) are required for each menu item."},
                    status=400,
                )
            try:
                quantity = float(quantity)
            except Exception:
                return Response({"error": "Invalid quantity format."}, status=400)

            menu_item_response = supabase_client.table("menu_ingredients").insert({
                "menu_id": menu_id,
                "inventory_id": inventory_id,
                "quantity": quantity,
                "unit_id": unit_id,
            }).execute()

            if hasattr(menu_item_response, "error") and menu_item_response.error:
                return Response({"error": f"Failed to add menu item for inventory_id {inventory_id}."}, status=500)

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
    and all related menu_ingredients records.
    
    Will prevent deletion if the menu item is used in any transactions.
    """
    try:
        # Authenticate the user and get the Supabase client
        auth_data = authenticate_user(request)
        supabase_client = auth_data["client"]

        # Check if the menu item is used in any transactions (order_details)
        order_check_query = supabase_client.table("order_details").select("transaction_id").eq("menu_id", menu_id).execute()
        
        if order_check_query.data and len(order_check_query.data) > 0:
            # Get unique transaction IDs
            transaction_ids = list(set(item["transaction_id"] for item in order_check_query.data))
            
            # Get the first few transaction IDs to show in the error message
            tx_preview = transaction_ids[:3]
            tx_list = ", ".join([str(tx_id) for tx_id in tx_preview])
            
            # Total count of unique transactions
            total_count = len(transaction_ids)
            
            # Add "and X more" if there are more than the ones we're showing
            additional_text = f" and {total_count - 3} more" if total_count > 3 else ""
            
            return Response({
                "error": f"Cannot delete this menu item because it is used in transactions: {tx_list}{additional_text}. You need to modify these orders before deleting this menu item."
            }, status=400)

        # Retrieve the current menu record to get the image filename
        current_menu_response = supabase_client.table("menu_items").select("image").eq("id", menu_id).execute()
        if current_menu_response.data and len(current_menu_response.data) > 0:
            current_image = current_menu_response.data[0].get("image")
            if current_image:
                # Delete the current image from Supabase Storage
                delete_image_response = supabase_client.storage.from_("menu-images").remove([current_image])
                # Optionally log or handle deletion errors; here we continue even if deletion fails
                if hasattr(delete_image_response, "error") and delete_image_response.error:
                    print("Warning: Failed to delete image from storage.")

        # Delete associated menu_ingredients records for this menu
        delete_menu_items_response = supabase_client.table("menu_ingredients").delete().eq("menu_id", menu_id).execute()
        
        if hasattr(delete_menu_items_response, "error") and delete_menu_items_response.error:
            return Response({"error": "Failed to delete associated menu items."}, status=500)

        # Delete the menu record itself
        delete_menu_response = supabase_client.table("menu_items").delete().eq("id", menu_id).execute()
        if hasattr(delete_menu_response, "error") and delete_menu_response.error:
            return Response({"error": "Failed to delete menu item."}, status=500)

        return Response({"message": "Menu item and associated records deleted successfully."}, status=200)

    except Exception as e:
        return Response({"error": f"Unexpected error: {e}"}, status=500)

@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])   
def fetch_order_data(request, transactionId=None):
    try:
        # If transactionId is provided, only fetch data relevant to that transaction
        if transactionId is not None:
            try:
                # Fetch just the specific transaction
                transaction = supabase_anon.table("transaction").select(
                    "id, date, payment_amount, order_status(id, name), payment_method, employee_id"
                ).eq("id", transactionId).single().execute().data
                
                if not transaction:
                    return Response({"error": "Transaction not found."}, status=404)
                
                # Fetch only the order details for this transaction
                order_details = supabase_anon.table("order_details").select(
                    "id, quantity, menu_id, discount_id, instore_category, transaction_id, unli_wings_group"
                ).eq("transaction_id", transactionId).execute().data or []
                
                # Fetch only the data we need for this specific transaction
                menu_ids = [od.get("menu_id") for od in order_details if od.get("menu_id")]
                discount_ids = [od.get("discount_id") for od in order_details if od.get("discount_id")]
                instore_category_ids = [od.get("instore_category") for od in order_details if od.get("instore_category")]
                
                # Only fetch the related data
                menus = supabase_anon.table("menu_items").select(
                    "id, name, type_id, price, image, status_id, category_id"
                ).in_("id", menu_ids).execute().data or []
                
                # Always fetch all discounts for the component
                discounts = supabase_anon.table("discounts").select("id, type, percentage").execute().data or []
                
                instore_categories = supabase_anon.table("instore_category").select(
                    "id, name, base_amount"
                ).in_("id", instore_category_ids).execute().data or []
                
                payment_methods = supabase_anon.table("payment_methods").select(
                    "id, name"
                ).eq("id", transaction.get("payment_method")).execute().data or []
                
                # Only fetch the specific employee
                employee = None
                if transaction.get("employee_id"):
                    employee = supabase_anon.table("employee").select(
                        "id, first_name, last_name"
                    ).eq("id", transaction.get("employee_id")).single().execute().data
                
                # Create dictionaries for faster lookups
                menu_dict = {menu["id"]: menu for menu in menus}
                discount_dict = {discount["id"]: discount for discount in discounts}
                instore_category_dict = {cat["id"]: cat for cat in instore_categories}
                
                # Process order details for this transaction
                related_orders = []
                for order in order_details:
                    order_data = {
                        "id": order["id"],
                        "quantity": order["quantity"],
                        "menu_item": menu_dict.get(order["menu_id"]),
                        "discount": discount_dict.get(order["discount_id"]),
                        "instore_category": instore_category_dict.get(order["instore_category"]),
                        "unli_wings_group": order["unli_wings_group"]
                    }
                    related_orders.append(order_data)
                
                # Fetch GCash references for this transaction
                gcash_references = supabase_anon.table("gcash_reference").select(
                    "id, name, attached_transaction, paid_amount"
                ).eq("attached_transaction", transactionId).execute().data or []
                
                # Build the transaction response
                formatted_transaction = {
                    "id": transaction["id"],
                    "date": transaction["date"],
                    "payment_amount": transaction["payment_amount"],
                    "order_status": transaction["order_status"],
                    "payment_method": payment_methods[0] if payment_methods else None,
                    "employee": employee,
                    "order_details": related_orders,
                    "gcash_references": gcash_references
                }
                
                return Response(formatted_transaction)
            
            except Exception as e:
                return Response({"error": f"Error fetching transaction data: {str(e)}"}, status=500)
        
        # For the main list view, implement pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 50))  # Default to 50 items per page
        offset = (page - 1) * page_size
        
        # Fetch essential reference data first
        try:
            menu_types = supabase_anon.table("menu_type").select("id, name, deduction_percentage").execute().data or []
            menu_statuses = supabase_anon.table("menu_status").select("id, name").execute().data or []
            menu_categories = supabase_anon.table("menu_category").select("id, name").execute().data or []
            order_status_types = supabase_anon.table("order_status_type").select("id, name").execute().data or []
            
            # Always fetch ALL discounts since they're needed for the OrderEssentials component
            discounts = supabase_anon.table("discounts").select("id, type, percentage").execute().data or []
            
            # Always fetch payment methods for OrderEssentials component
            payment_methods = supabase_anon.table("payment_methods").select("id, name").execute().data or []
            
            # Always fetch instore categories for OrderEssentials component
            instore_categories = supabase_anon.table("instore_category").select("id, name, base_amount").execute().data or []
            
            # Only fetch and process transactions with pagination
            transactions = supabase_anon.table("transaction").select(
                "id, date, payment_amount, order_status(id, name), payment_method, employee_id"
            ).order("date", desc=True).range(offset, offset + page_size - 1).execute().data or []
            
            # Only fetch order details for these transactions
            transaction_ids = [tx.get("id") for tx in transactions]
            if not transaction_ids:
                # Return early with empty transactions but include reference data
                return Response({
                    "menu_types": menu_types,
                    "menu_statuses": menu_statuses,
                    "menu_categories": menu_categories,
                    "order_status_types": order_status_types,
                    "discounts": discounts,
                    "payment_methods": payment_methods,
                    "instore_categories": instore_categories,
                    "transactions": []
                })
            
            # Fetch only order details for the paginated transactions
            order_details = supabase_anon.table("order_details").select(
                "id, quantity, menu_id, discount_id, instore_category, transaction_id, unli_wings_group"
            ).in_("transaction_id", transaction_ids).execute().data or []
            
            # Extract all unique IDs needed for related data
            menu_ids = list(set([od.get("menu_id") for od in order_details if od.get("menu_id")]))
            
            # Fetch only the data needed for these transactions
            menus = supabase_anon.table("menu_items").select(
                "id, name, type_id, price, status_id, category_id, image"
            ).in_("id", menu_ids).execute().data or []
            
            # Only add image URLs for menus that have images
            formatted_menus = []
            for menu in menus:
                menu_data = {
                    "id": menu["id"],
                    "name": menu["name"],
                    "type_id": menu["type_id"],
                    "category_id": menu["category_id"],
                    "price": menu["price"],
                    "status_id": menu["status_id"]
                }
                if menu.get("image"):
                    menu_data["image"] = supabase_anon.storage.from_("menu-images").get_public_url(menu["image"])
                formatted_menus.append(menu_data)
            
            # Fetch menu ingredients for the specific menu items only if needed
            menu_ingredients = supabase_anon.table("menu_ingredients").select(
                "id, menu_id, inventory_id, quantity, unit_id"
            ).in_("menu_id", menu_ids).execute().data or []
            
            # Organize menu ingredients by menu_id for faster lookup
            menu_ingredients_dict = {}
            for mi in menu_ingredients:
                menu_id = mi.get("menu_id")
                if menu_id not in menu_ingredients_dict:
                    menu_ingredients_dict[menu_id] = []
                menu_ingredients_dict[menu_id].append(mi)
            
            # Attach ingredients to menus
            for menu in formatted_menus:
                menu["menu_ingredients"] = menu_ingredients_dict.get(menu["id"], [])
                
            # Fetch GCash references related to these transactions
            gcash_references = supabase_anon.table("gcash_reference").select(
                "id, name, attached_transaction, paid_amount"
            ).in_("attached_transaction", transaction_ids).execute().data or []
            
            # Get relevant employees based on their active status
            employees = supabase_anon.table("employee").select(
                "id, first_name, last_name, employee_role(role_id)"
            ).eq("status_id", 1).execute().data or []
            
            # Create dictionaries for faster lookups
            menu_dict = {menu["id"]: menu for menu in formatted_menus}
            discount_dict = {discount["id"]: discount for discount in discounts}
            instore_category_dict = {cat["id"]: cat for cat in instore_categories}
            payment_method_dict = {method["id"]: method for method in payment_methods}
            employee_dict = {emp["id"]: emp for emp in employees}
            
            # Group order details by transaction ID for faster lookups
            order_details_by_transaction = {}
            for order in order_details:
                tx_id = order.get("transaction_id")
                if tx_id not in order_details_by_transaction:
                    order_details_by_transaction[tx_id] = []
                order_details_by_transaction[tx_id].append(order)
            
            # Group GCash references by transaction ID for faster lookups
            gcash_refs_by_transaction = {}
            for ref in gcash_references:
                tx_id = ref.get("attached_transaction")
                if tx_id:
                    if tx_id not in gcash_refs_by_transaction:
                        gcash_refs_by_transaction[tx_id] = []
                    gcash_refs_by_transaction[tx_id].append(ref)
            
            # Process transactions with optimized lookups
            formatted_transactions = []
            for transaction in transactions:
                tx_id = transaction.get("id")
                related_orders = []
                
                # Get related order details
                for order in order_details_by_transaction.get(tx_id, []):
                    order_data = {
                        "id": order["id"],
                        "quantity": order["quantity"],
                        "menu_item": menu_dict.get(order["menu_id"]),
                        "discount": discount_dict.get(order["discount_id"]),
                        "instore_category": instore_category_dict.get(order["instore_category"]),
                        "unli_wings_group": order["unli_wings_group"]
                    }
                    related_orders.append(order_data)
                
                # Get GCash references
                gcash_references_for_transaction = gcash_refs_by_transaction.get(tx_id, [])
                
                # Build transaction object
                formatted_transactions.append({
                    "id": transaction["id"],
                    "date": transaction["date"],
                    "payment_amount": transaction["payment_amount"],
                    "order_status": transaction["order_status"],
                    "payment_method": payment_method_dict.get(transaction["payment_method"]),
                    "employee": employee_dict.get(transaction["employee_id"]),
                    "order_details": related_orders,
                    "gcash_references": gcash_references_for_transaction
                })
            
            # Return the data needed for the order table and components
            return Response({
                "menu_types": menu_types,
                "menu_statuses": menu_statuses,
                "menu_categories": menu_categories,
                "menu_items": formatted_menus,
                "menu_ingredients": menu_ingredients,
                "discounts": discounts,
                "payment_methods": payment_methods,
                "instore_categories": instore_categories,
                "order_status_types": order_status_types,
                "employees": employees,
                "transactions": formatted_transactions,
                "gcash_references": gcash_references
            })
            
        except Exception as e:
            return Response({"error": f"Error fetching order data: {str(e)}"}, status=500)
    
    except Exception as e:
        return Response({"error": f"Unexpected error: {str(e)}"}, status=500)

@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def fetch_inventory_order_data(request):
    try:
        # Fetch units of measurement
        units_response = supabase_anon.table("unit_of_measurement").select("*").execute()
        units = units_response.data if units_response.data else []
        
        # Fetch inventory items with their units and item information
        inventory_response = supabase_anon.table("inventory").select(
            "id, quantity, item, items(id, name, measurement, unit_of_measurement(id, symbol))"
        ).execute()
        inventory = inventory_response.data if inventory_response.data else []
        
        # Fetch items table
        items_response = supabase_anon.table("items").select(
            "id, name, measurement, unit_of_measurement(id, symbol)"
        ).execute()
        items = items_response.data if items_response.data else []
        
        return Response({
            "units": units,
            "inventory": inventory,
            "items": items
        })
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['POST'])
@authentication_classes([SupabaseAuthentication])
@permission_classes([SupabaseIsAdmin])
def add_discount(request):
    """
    Handles adding a new discount to the database
    """
    try:
        # Authenticate the user and get the authenticated Supabase client
        auth_data = authenticate_user(request)
        supabase_client = auth_data["client"]

        data = json.loads(request.body)
        type = data.get("type")
        percentage = data.get("percentage")

        if not type or percentage is None:
            return Response({"error": "All fields are required"}, status=400)

        # Insert new item category
        insert_response = supabase_client.table("discounts").insert({
            "type": type,
            "percentage": percentage,
        }).execute()

        if insert_response.data:
            return Response({
                "message": "Discount added successfully"
            }, status=201)
        else:
            return Response({"error": "Failed to Discount"}, status=500)
        
    except Exception as e:
        return Response({"error" : str(e)}, status=500)


@api_view(['PUT'])
@authentication_classes([SupabaseAuthentication])
@permission_classes([SupabaseIsAdmin])
def edit_discount(request, discount_id):
    """
    Handles updating an existing discount
    """
    try:
        # Authenticate the user and get the authenticated Supabase client
        auth_data = authenticate_user(request)
        supabase_client = auth_data["client"]

        data = json.loads(request.body)
        new_type = data.get("type")
        new_percentage = data.get("percentage")

        if not new_type or new_percentage is None:
            return Response({"error": "All fields are required."}, status=400)

        # Check if exists
        response = supabase_client.table("discounts").select("*").eq("id", discount_id).execute()
        if not response.data:
            return Response({"error": "Discount not found."}, status=404)

        # Update discounts
        update_response = supabase_client.table("discounts").update({
            "type": new_type,
            "percentage": new_percentage
        }).eq("id", discount_id).execute()

        if update_response.data:
            return Response({"message": "Discount updated successfully."}, status=200)
        else:
            return Response({"error": "Failed to update Discount."}, status=500)

    except Exception as e:
        return Response({"error": str(e)}, status=500)
    
@api_view(['DELETE'])
@authentication_classes([SupabaseAuthentication])  # Use appropriate authentication
@permission_classes([SupabaseIsAdmin])  # Ensure only admins can delete categories
def delete_discount(request, discount_id):
    """
    Handles deleting of discount
    """
    try:
        # Authenticate the user and get the authenticated Supabase client
        auth_data = authenticate_user(request)
        supabase_client = auth_data["client"]

        # Verify category exists
        response = supabase_client.table("discounts").select("*").eq("id", discount_id).execute()
        if not response.data:
            return Response({"error": "Discount not found."}, status=404)

        # Delete category
        delete_response = supabase_client.table("discounts").delete().eq("id", discount_id).execute()

        if delete_response.data:
            return Response({"message": "Discount deleted successfully."}, status=200)
        else:
            return Response({"error": "Failed to delete Discount."}, status=500)
    
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['PUT'])
@authentication_classes([SupabaseAuthentication])
@permission_classes([SupabaseIsAdmin])
def edit_delivery_deduction(request, delivery_id):
    """
    Handles updating an existing delivery deduction
    """
    try:
        # Authenticate the user and get the authenticated Supabase client
        auth_data = authenticate_user(request)
        supabase_client = auth_data["client"]

        data = json.loads(request.body)
        new_deduction = data.get("deduction_percentage")

        if new_deduction is None:
            return Response({"error": "All fields are required."}, status=400)

        # Check if exists
        response = supabase_client.table("menu_type").select("*").eq("id", delivery_id).execute()
        if not response.data:
            return Response({"error": "Delivery detail not found."}, status=404)

        # Update discounts
        update_response = supabase_client.table("menu_type").update({
            "deduction_percentage": new_deduction
        }).eq("id", delivery_id).execute()

        if update_response.data:
            return Response({"message": "Delivery deduction percentage updated successfully."}, status=200)
        else:
            return Response({"error": "Failed to update delivery deduction percentage."}, status=500)

    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['PUT'])
@authentication_classes([SupabaseAuthentication])
@permission_classes([SupabaseIsAdmin])
def edit_unli_wings_base_amount(request, category_id):
    """
    Handles updating the base amount for Unli Wings category
    """
    try:
        # Authenticate the user and get the authenticated Supabase client
        auth_data = authenticate_user(request)
        supabase_client = auth_data["client"]

        data = json.loads(request.body)
        new_base_amount = data.get("base_amount")

        if new_base_amount is None:
            return Response({"error": "Base amount is required."}, status=400)

        # Check if category exists
        response = supabase_client.table("instore_category").select("*").eq("id", category_id).execute()
        if not response.data:
            return Response({"error": "Category not found."}, status=404)

        # Update base amount
        update_response = supabase_client.table("instore_category").update({
            "base_amount": new_base_amount
        }).eq("id", category_id).execute()

        if update_response.data:
            return Response({"message": "Unli Wings base amount updated successfully."}, status=200)
        else:
            return Response({"error": "Failed to update Unli Wings base amount."}, status=500)

    except Exception as e:
        return Response({"error": str(e)}, status=500)
    
@api_view(['POST'])
@authentication_classes([SupabaseAuthentication])
@permission_classes([SupabaseIsAdmin])
def add_menu_category(request):
    """
    Handles adding a new menu category to the database
    """
    try:
        # Authenticate the user and get the authenticated Supabase client
        auth_data = authenticate_user(request)
        supabase_client = auth_data["client"]

        data = json.loads(request.body)
        name = data.get("name")

        if not name:
            return Response({"error": "All fields are required"}, status=400)

        # Insert new menu category
        insert_response = supabase_client.table("menu_category").insert({
            "name": name
        }).execute()

        if insert_response.data:
            return Response({
                "message": "Menu Category added successfully"
            }, status=201)
        else:
            return Response({"error": "Failed to add Menu Category"}, status=500)
        
    except Exception as e:
        return Response({"error" : str(e)}, status=500)

@api_view(['PUT'])
@authentication_classes([SupabaseAuthentication])
@permission_classes([SupabaseIsAdmin])
def edit_menu_category(request, category_id):
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
        category_response = supabase_client.table("menu_category").select("*").eq("id", category_id).execute()
        if not category_response.data:
            return Response({"error": "Menu Category not found."}, status=404)

        # Update category name
        update_response = supabase_client.table("menu_category").update({
            "name": new_name
        }).eq("id", category_id).execute()

        if update_response.data:
            return Response({"message": "Menu Category updated successfully."}, status=200)
        else:
            return Response({"error": "Failed to update Menu Category."}, status=500)

    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['DELETE'])
@authentication_classes([SupabaseAuthentication])
@permission_classes([SupabaseIsAdmin])
def delete_menu_category(request, category_id):
    """
    This view handles the deletion of an existing menu category.
    Checks if the category is used by any menu items before deletion.
    """
    try:
        # Authenticate the user and get the authenticated Supabase client
        auth_data = authenticate_user(request)
        supabase_client = auth_data["client"]

        # Verify category exists
        category_response = supabase_client.table("menu_category").select("*").eq("id", category_id).execute()
        if not category_response.data:
            return Response({"error": "Menu Category not found."}, status=404)

        # Check if any menu items are using this category
        menu_check_query = supabase_client.table("menu_items").select("id, name").eq("category_id", category_id).limit(5).execute()
        
        if menu_check_query.data and len(menu_check_query.data) > 0:
            # Get up to 3 menu names to show in error message
            menu_names = [menu["name"] for menu in menu_check_query.data[:3]]
            menu_list = ", ".join(menu_names)
            
            # Add "and X more" if there are more than we're showing
            additional_text = f" and {len(menu_check_query.data) - 3} more" if len(menu_check_query.data) > 3 else ""
            
            return Response({
                "error": f"Cannot delete this category because it is used by menu items: {menu_list}{additional_text}. Please change the category of these menu items first."
            }, status=400)
            
        # Delete category
        delete_response = supabase_client.table("menu_category").delete().eq("id", category_id).execute()

        if delete_response.data:
            return Response({"message": "Menu Category deleted successfully."}, status=200)
        else:
            return Response({"error": "Failed to delete Menu Category."}, status=500)
    
    except Exception as e:
        return Response({"error": str(e)}, status=500)
    

@api_view(['POST'])
@authentication_classes([])  
@permission_classes([AllowAny])   
def add_order(request):
    try:
        data = request.data
        employee_id = data.get("employee_id")
        payment_method = data.get("payment_method")
        payment_amount = data.get("payment_amount")  # Amount paid by customer
        reference_id = data.get("reference_id")  # Optional, can be null
        order_details = data.get("order_details", [])
        # Employee verification data
        provided_email = data.get("email")
        entered_passcode = data.get("passcode")
        
        if not order_details:
            return Response({"error": "No order details provided."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if we need to verify the employee (skip verification for admin users)
        is_admin = False
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            if token and is_valid_supabase_token(token):
                # Check if this token belongs to an admin user
                try:
                    user_response = supabase_service.auth.get_user(token)
                    if user_response and user_response.user:
                        auth_user_uuid = user_response.user.id
                        
                        # Look up the employee by user_id
                        employee_lookup = supabase_service.table("employee") \
                            .select("id") \
                            .eq("user_id", auth_user_uuid) \
                            .single() \
                            .execute()
                        
                        if employee_lookup.data:
                            admin_employee_pk = employee_lookup.data["id"]
                            
                            # Check if this employee has admin role
                            role_mapping = supabase_service.table("employee_role") \
                                .select("role_id") \
                                .eq("employee_id", admin_employee_pk) \
                                .execute()
                            
                            if role_mapping.data:
                                role_ids = [entry["role_id"] for entry in role_mapping.data]
                                
                                # Get admin role ID
                                admin_role = supabase_service.table("role") \
                                    .select("id") \
                                    .eq("role_name", "Admin") \
                                    .single() \
                                    .execute()
                                
                                if admin_role.data and admin_role.data["id"] in role_ids:
                                    is_admin = True
                except Exception as e:
                    print(f"Error checking admin status: {str(e)}")
        
        # Skip verification for admin users
        if not is_admin:
            # Verify employee credentials - similar to time_in function
            if not employee_id or not entered_passcode or not provided_email:
                return Response({"error": "Missing employee verification fields."}, status=400)
            
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
                
            # Ensure the provided email matches the employee's registered email
            if provided_email.lower() != user_response.user.email.lower():
                return Response(
                    {"error": "Provided email does not match the selected employee's email."},
                    status=400,
                )
                
            # Attempt to sign in using the provided email and passcode
            sign_in_response = supabase_service.auth.sign_in_with_password({
                "email": provided_email,
                "password": entered_passcode
            })
            if not getattr(sign_in_response, "user", None):
                return Response({"error": "Invalid passcode."}, status=401)
            # Sign out after successful sign in
            supabase_service.auth.sign_out()
  
        # Continue with original add_order logic
        # Validate employee
        employee = supabase_anon.table("employee").select("id").eq("id", employee_id).execute().data
        if not employee:
            return Response({"error": f"Employee with ID {employee_id} not found."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate payment method
        payment_method_data = supabase_anon.table("payment_methods").select("id").eq("id", payment_method).execute().data
        if not payment_method_data:
            return Response({"error": f"Payment method with ID {payment_method} not found."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Batch fetch menu items (including menu_type_id)
        menu_ids = [order["menu_id"] for order in order_details]
        menus_data = supabase_anon.table("menu_items").select("id, price, type_id").in_("id", menu_ids).execute().data
        menus = {menu["id"]: menu for menu in menus_data}
        missing_menus = [menu_id for menu_id in menu_ids if menu_id not in menus]
        if missing_menus:
            return Response({"error": f"Menu items with IDs {missing_menus} not found."}, status=status.HTTP_400_BAD_REQUEST)
        
        # For order details that include instore_category, fetch them.
        instore_orders = [order for order in order_details if "instore_category" in order]
        if instore_orders:
            instore_category_ids = list(set(order["instore_category"] for order in instore_orders))
            instore_categories_data = supabase_anon.table("instore_category").select("id, name, base_amount").in_("id", instore_category_ids).execute().data
            instore_categories = {cat["id"]: cat for cat in instore_categories_data}
            missing_categories = [cat_id for cat_id in instore_category_ids if cat_id not in instore_categories]
            if missing_categories:
                return Response({"error": f"In-Store Categories with IDs {missing_categories} not found."}, status=status.HTTP_400_BAD_REQUEST)
        else:
            instore_categories = {}
        
        # Batch fetch discounts, if any
        discount_ids = list(set(order.get("discount_id") for order in order_details if order.get("discount_id")))
        discounts_data = supabase_anon.table("discounts").select("id, percentage").in_("id", discount_ids).execute().data if discount_ids else []
        discounts = {d["id"]: d["percentage"] for d in discounts_data}
        missing_discounts = [d_id for d_id in discount_ids if d_id not in discounts]
        if missing_discounts:
            return Response({"error": f"Discounts with IDs {missing_discounts} not found."}, status=status.HTTP_400_BAD_REQUEST)
        
        # For Grab and FoodPanda orders (no instore_category), fetch their menu type details.
        menu_type_ids_needed = [menu["type_id"] for menu in menus_data if menu["type_id"] in [2, 3]]
        if menu_type_ids_needed:
            menu_type_ids = list(set(menu_type_ids_needed))
            menu_types_data = supabase_anon.table("menu_type").select("id, deduction_percentage").in_("id", menu_type_ids).execute().data
            menu_types = {mt["id"]: mt for mt in menu_types_data}
            missing_menu_types = [mt_id for mt_id in menu_type_ids if mt_id not in menu_types]
            if missing_menu_types:
                return Response({"error": f"Menu types with IDs {missing_menu_types} not found."}, status=status.HTTP_400_BAD_REQUEST)
        else:
            menu_types = {}
        
        # Create transaction record (removed reference_id and receipt_image)
        transaction_data = {
            "payment_amount": payment_amount,  
            "payment_method": payment_method,
            "employee_id": employee_id,
            "order_status": 1,  # e.g., Pending
        }
        transaction_response = supabase_anon.table("transaction").insert(transaction_data).execute()
        if not transaction_response.data:
            return Response({"error": "Failed to create transaction."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        transaction_id = transaction_response.data[0]["id"]
        
        # If payment method is GCash and we have a reference ID, save it to gcash_reference table
        # In add_order view, modify the GCash reference creation part:
        if payment_method == 2 and reference_id:  # GCash payment
            try:
                gcash_reference_data = {
                    "name": reference_id,
                    "attached_transaction": transaction_id,
                    "paid_amount": payment_amount  # Add this line to store individual payment amount
                }
                supabase_anon.table("gcash_reference").insert(gcash_reference_data).execute()
            except Exception as e:
                print(f"Failed to save GCash reference for transaction {transaction_id}")
        
        total_price = 0  # Running total for transaction
        order_items = []  # To be inserted for inventory purposes
        calculation_breakdown = []  # Detailed breakdown
        
        # For grouping Unli Wings orders via unli_wings_group
        unli_wings_groups = {}
        current_unli_wings_group_counter = 1
        
        # Process each order detail
        for order in order_details:
            menu_id = order["menu_id"]
            quantity = order["quantity"]
            discount_id = order.get("discount_id")
            menu_item = menus[menu_id]
            
            if "instore_category" in order:
                instore_category_id = order["instore_category"]
                instore_category = instore_categories.get(instore_category_id)
                if not instore_category:
                    return Response({"error": f"In-Store Category with ID {instore_category_id} not found."}, status=status.HTTP_400_BAD_REQUEST)
                
                if instore_category["name"] == "Ala Carte":
                    base_price = menu_item["price"] * quantity
                    price = base_price
                    discount_percentage = 0
                    if discount_id:
                        discount_percentage = discounts.get(discount_id, 0)
                        price = price - (price * discount_percentage)
                    base_price = round(base_price, 2)
                    price = round(price, 2)
                    total_price += price
                    calculation_breakdown.append({
                        "menu_id": menu_id,
                        "instore_category": "Ala Carte",
                        "quantity": quantity,
                        "base_price": base_price,
                        "discount_percentage": discount_percentage,
                        "final_price": price
                    })
                    order_items.append({
                        "transaction_id": transaction_id,
                        "menu_id": menu_id,
                        "quantity": quantity,
                        "discount_id": discount_id,
                        "instore_category": instore_category_id,
                        "unli_wings_group": None
                    })
                elif instore_category["name"] == "Unli Wings":
                    # Process Unli Wings with grouping
                    unli_wings_group = order.get("unli_wings_group")
                    if not unli_wings_group:
                        unli_wings_group = str(current_unli_wings_group_counter)
                        current_unli_wings_group_counter += 1
                    if unli_wings_group not in unli_wings_groups:
                        unli_wings_groups[unli_wings_group] = {
                            "total_quantity": 0,
                            "instore_category_id": instore_category_id,
                            "discount_id": discount_id
                        }
                    else:
                        if not unli_wings_groups[unli_wings_group]["discount_id"] and discount_id:
                            unli_wings_groups[unli_wings_group]["discount_id"] = discount_id
                    unli_wings_groups[unli_wings_group]["total_quantity"] += quantity
                    
                    # Store the base_amount at creation time
                    current_base_amount = instore_categories[instore_category_id]["base_amount"]
                    
                    order_items.append({
                        "transaction_id": transaction_id,
                        "menu_id": menu_id,
                        "quantity": quantity,
                        "discount_id": discount_id,
                        "instore_category": instore_category_id,
                        "unli_wings_group": unli_wings_group,
                        "base_amount": current_base_amount  # Store the base amount
                    })
                else:
                    return Response({"error": "Invalid In-Store Category."}, status=status.HTTP_400_BAD_REQUEST)
            else:
                # Grab/FoodPanda orders
                menu_type_id = menu_item.get("type_id")
                if menu_type_id not in [2, 3]:
                    return Response({"error": f"Order detail for menu_id {menu_id} is missing instore_category and is not a Grab/FoodPanda type."}, status=status.HTTP_400_BAD_REQUEST)
                base_price = menu_item["price"] * quantity
                deduction_percentage = menu_types.get(menu_type_id, {}).get("deduction_percentage", 0)
                price = base_price - (base_price * deduction_percentage)
                discount_percentage = 0
                if discount_id:
                    discount_percentage = discounts.get(discount_id, 0)
                    price = price - (price * discount_percentage)
                base_price = round(base_price, 2)
                price = round(price, 2)
                total_price += price
                calculation_breakdown.append({
                    "menu_id": menu_id,
                    "menu_type": "Grab" if menu_type_id == 2 else "FoodPanda",
                    "quantity": quantity,
                    "base_price": base_price,
                    "deduction_percentage": deduction_percentage,
                    "discount_percentage": discount_percentage,
                    "final_price": price
                })
                order_items.append({
                    "transaction_id": transaction_id,
                    "menu_id": menu_id,
                    "quantity": quantity,
                    "discount_id": discount_id,
                    "instore_category": None,
                    "unli_wings_group": None
                })
        
        # Process Unli Wings groups pricing (if any)
        for group_key, group in unli_wings_groups.items():
            # Find the first order item for this group to get its stored base_amount
            group_base_amount = None
            for item in order_items:
                if item.get("unli_wings_group") == group_key:
                    group_base_amount = item.get("base_amount")
                    break
            
            # If no stored base_amount found, fall back to the category base_amount
            base_price = group_base_amount or instore_categories[group["instore_category_id"]]["base_amount"]
            price = base_price
            discount_percentage = 0
            if group["discount_id"]:
                discount_percentage = discounts.get(group["discount_id"], 0)
                price = price - (price * (discount_percentage / 100))
            base_price = round(base_price, 2)
            price = round(price, 2)
            total_price += price
            calculation_breakdown.append({
                "instore_category": "Unli Wings",
                "unli_wings_group": group_key,
                "aggregated_quantity": group["total_quantity"],
                "base_price": base_price,
                "discount_percentage": discount_percentage,
                "final_price": price
            })
        
        total_price = round(total_price, 2)
        change = round(payment_amount - total_price, 2)
        
        # Insert order details
        order_details_response = supabase_anon.table("order_details").insert(order_items).execute()
        if not order_details_response.data:
            return Response({"error": "Failed to save order details."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({
            "message": "Order placed successfully.",
            "transaction_id": transaction_id,
            "total_price": total_price,
            "change": change,
            "calculation_details": calculation_breakdown
        }, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@authentication_classes([])  
@permission_classes([AllowAny])
def edit_order(request, transaction_id):
    try:
        if not transaction_id:
            return Response({"error": "Transaction ID not provided."}, status=400)
        
        data = request.data
        employee_id = data.get("employee_id")
        payment_method = data.get("payment_method")
        payment_amount = data.get("payment_amount")  # New/updated payment amount
        reference_id = data.get("reference_id")
        order_details = data.get("order_details", [])
        provided_email = data.get("email")
        entered_passcode = data.get("passcode")
        
        if not order_details:
            return Response({"error": "No order details provided."}, status=400)
        
        # Check if we need to verify the employee (skip verification for admin users)
        is_admin = False
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            if token and is_valid_supabase_token(token):
                # Check if this token belongs to an admin user
                try:
                    user_response = supabase_service.auth.get_user(token)
                    if user_response and user_response.user:
                        auth_user_uuid = user_response.user.id
                        
                        # Look up the employee by user_id
                        employee_lookup = supabase_service.table("employee") \
                            .select("id") \
                            .eq("user_id", auth_user_uuid) \
                            .single() \
                            .execute()
                        
                        if employee_lookup.data:
                            admin_employee_pk = employee_lookup.data["id"]
                            
                            # Check if this employee has admin role
                            role_mapping = supabase_service.table("employee_role") \
                                .select("role_id") \
                                .eq("employee_id", admin_employee_pk) \
                                .execute()
                            
                            if role_mapping.data:
                                role_ids = [entry["role_id"] for entry in role_mapping.data]
                                
                                # Get admin role ID
                                admin_role = supabase_service.table("role") \
                                    .select("id") \
                                    .eq("role_name", "Admin") \
                                    .single() \
                                    .execute()
                                
                                if admin_role.data and admin_role.data["id"] in role_ids:
                                    is_admin = True
                except Exception as e:
                    print(f"Error checking admin status: {str(e)}")
        
        # Skip verification for admin users
        if not is_admin:
            # Only perform verification if the user is not an admin
            if not employee_id or not entered_passcode or not provided_email:
                return Response({"error": "Missing employee verification fields."}, status=400)
                
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
                
            # Ensure the provided email matches the employee's registered email
            if provided_email.lower() != user_response.user.email.lower():
                return Response(
                    {"error": "Provided email does not match the selected employee's email."},
                    status=400,
                )
                
            # Attempt to sign in using the provided email and passcode
            sign_in_response = supabase_service.auth.sign_in_with_password({
                "email": provided_email,
                "password": entered_passcode
            })
            if not getattr(sign_in_response, "user", None):
                return Response({"error": "Invalid passcode."}, status=401)
            # Sign out after successful sign in
            supabase_service.auth.sign_out()
        
        # Continue with the existing order editing logic
        existing_order_details = None
        try:
            existing_response = supabase_anon.table("order_details").select("*").eq("transaction_id", transaction_id).execute()
            if existing_response and existing_response.data:
                existing_order_details = {
                    f"{detail.get('menu_id')}-{detail.get('unli_wings_group')}": detail.get('base_amount') 
                    for detail in existing_response.data 
                    if detail.get('unli_wings_group')
                }
        except Exception as e:
            print(f"Error fetching existing order details: {str(e)}")
            
        # Validate the existing transaction record
        existing_transaction_response = supabase_anon.table("transaction").select("id").eq("id", transaction_id).execute()
        if not existing_transaction_response.data:
            return Response({"error": f"Transaction with ID {transaction_id} not found."}, status=400)
        existing_order_details = None
        try:
            existing_response = supabase_anon.table("order_details").select("*").eq("transaction_id", transaction_id).execute()
            if existing_response and existing_response.data:
                existing_order_details = {
                    f"{detail.get('menu_id')}-{detail.get('unli_wings_group')}": detail.get('base_amount') 
                    for detail in existing_response.data 
                    if detail.get('unli_wings_group')
                }
        except Exception as e:
            print(f"Error fetching existing order details: {str(e)}")
            
        # Validate the existing transaction record
        existing_transaction_response = supabase_anon.table("transaction").select("id").eq("id", transaction_id).execute()
        if not existing_transaction_response.data:
            return Response({"error": f"Transaction with ID {transaction_id} not found."}, status=400)
        
        # Validate employee
        employee_response = supabase_anon.table("employee").select("id").eq("id", employee_id).execute()
        if not employee_response.data:
            return Response({"error": f"Employee with ID {employee_id} not found."}, status=400)
        
        # Validate payment method
        payment_method_response = supabase_anon.table("payment_methods").select("id").eq("id", payment_method).execute()
        if not payment_method_response.data:
            return Response({"error": f"Payment method with ID {payment_method} not found."}, status=400)
        
        # Batch fetch menu items (including type_id)
        menu_ids = [order["menu_id"] for order in order_details]
        menus_response = supabase_anon.table("menu_items").select("id, price, type_id").in_("id", menu_ids).execute()
        menus = {menu["id"]: menu for menu in menus_response.data}
        missing_menus = [menu_id for menu_id in menu_ids if menu_id not in menus]
        if missing_menus:
            return Response({"error": f"Menu items with IDs {missing_menus} not found."}, status=400)
        
        # For In‑Store orders, fetch instore categories
        instore_orders = [order for order in order_details if order.get("instore_category")]
        if instore_orders:
            instore_category_ids = list(set(order["instore_category"] for order in instore_orders))
            instore_categories_response = supabase_anon.table("instore_category")\
                .select("id, name, base_amount")\
                .in_("id", instore_category_ids).execute()
            instore_categories = {cat["id"]: cat for cat in instore_categories_response.data}
            missing_categories = [cat_id for cat_id in instore_category_ids if cat_id not in instore_categories]
            if missing_categories:
                return Response({"error": f"In-Store Categories with IDs {missing_categories} not found."}, status=400)
        else:
            instore_categories = {}
        
        # Batch fetch discounts, if any
        discount_ids = list(set(order.get("discount_id") for order in order_details if order.get("discount_id")))
        if discount_ids:
            discounts_response = supabase_anon.table("discounts").select("id, percentage").in_("id", discount_ids).execute()
            discounts = {d["id"]: d["percentage"] for d in discounts_response.data}
            missing_discounts = [d_id for d_id in discount_ids if d_id not in discounts]
            if missing_discounts:
                return Response({"error": f"Discounts with IDs {missing_discounts} not found."}, status=400)
        else:
            discounts = {}
        
        # For Grab and FoodPanda orders, fetch menu type details (deduction_percentage)
        menu_type_ids_needed = [menu["type_id"] for menu in menus_response.data if menu["type_id"] in [2, 3]]
        if menu_type_ids_needed:
            menu_type_ids = list(set(menu_type_ids_needed))
            menu_types_response = supabase_anon.table("menu_type").select("id, deduction_percentage")\
                .in_("id", menu_type_ids).execute()
            menu_types = {mt["id"]: mt for mt in menu_types_response.data}
            missing_menu_types = [mt_id for mt_id in menu_type_ids if mt_id not in menu_types]
            if missing_menu_types:
                return Response({"error": f"Menu types with IDs {missing_menu_types} not found."}, status=400)
        else:
            menu_types = {}
        
        # Update the transaction record - removed reference_id and receipt_image
        transaction_data = {
            "payment_amount": payment_amount,
            "payment_method": payment_method,
            "employee_id": employee_id
        }
        transaction_update_response = supabase_anon.table("transaction")\
            .update(transaction_data).eq("id", transaction_id).execute()
        if hasattr(transaction_update_response, "error") and transaction_update_response.error:
            return Response({"error": "Failed to update transaction."}, status=500)
        
        # Update GCash reference if payment method is GCash
        # In edit_order view, when handling GCash reference:
        # In edit_order view, when handling GCash reference:
        if payment_method == 2 and reference_id:  # GCash payment
            try:
                # Instead of calculating the difference ourselves, we should get the 
                # additional_payment value directly from the request data
                # This ensures we use exactly what the frontend calculated as extra_payment_required
                additional_payment = data.get("additional_payment", 0)
                
                # If additional_payment is not provided, calculate it (as fallback)
                if additional_payment == 0:
                    # Get the original payment amount
                    original_transaction = supabase_anon.table("transaction").select("payment_amount").eq("id", transaction_id).execute()
                    original_payment_amount = original_transaction.data[0].get("payment_amount", 0) if original_transaction.data else 0
                    
                    # Calculate additional payment
                    additional_payment = payment_amount - original_payment_amount
                
                # Create a GCash reference record with the additional amount
                gcash_reference_data = {
                    "name": reference_id,
                    "attached_transaction": transaction_id,
                    "paid_amount": additional_payment  # Store the additional payment amount
                }
                
                print(f"Adding GCash reference with amount: {additional_payment}")
                supabase_anon.table("gcash_reference").insert(gcash_reference_data).execute()
            except Exception as e:
                print(f"Failed to save GCash reference for transaction {transaction_id}: {str(e)}")
        
        total_price = 0
        order_items = []
        calculation_breakdown = []
        
        # For grouping Unli Wings orders
        unli_wings_groups = {}
        current_unli_wings_group_counter = 1
        
        # Process each order detail
        for order in order_details:
            menu_id = order["menu_id"]
            quantity = order["quantity"]
            discount_id = order.get("discount_id")
            menu_item = menus[menu_id]
            menu_type_id = menu_item.get("type_id")
            
            if menu_type_id == 1:
                # In‑Store orders require an instore_category.
                instore_category_id = order.get("instore_category")
                if not instore_category_id:
                    return Response({"error": f"In-Store order detail for menu_id {menu_id} is missing instore_category."}, status=400)
                instore_category = instore_categories.get(instore_category_id)
                if not instore_category:
                    return Response({"error": f"In-Store Category with ID {instore_category_id} not found."}, status=400)
                
                if instore_category["name"] == "Ala Carte":
                    base_price = menu_item["price"] * quantity
                    price = base_price
                    discount_percentage = discounts.get(discount_id, 0) if discount_id else 0
                    if discount_percentage:
                        price = price - (price * discount_percentage)
                    base_price = round(base_price, 2)
                    price = round(price, 2)
                    total_price += price
                    calculation_breakdown.append({
                        "menu_id": menu_id,
                        "instore_category": "Ala Carte",
                        "quantity": quantity,
                        "base_price": base_price,
                        "discount_percentage": discount_percentage,
                        "final_price": price
                    })
                    order_items.append({
                        "transaction_id": transaction_id,
                        "menu_id": menu_id,
                        "quantity": quantity,
                        "discount_id": discount_id,
                        "instore_category": instore_category_id,
                        "unli_wings_group": None
                    })

                elif instore_category["name"] == "Unli Wings":
                    unli_wings_group = order.get("unli_wings_group")
                    if not unli_wings_group:
                        unli_wings_group = str(current_unli_wings_group_counter)
                        current_unli_wings_group_counter += 1
                    if unli_wings_group not in unli_wings_groups:
                        unli_wings_groups[unli_wings_group] = {
                            "total_quantity": 0,
                            "instore_category_id": instore_category_id,
                            "discount_id": discount_id
                        }
                    else:
                        if not unli_wings_groups[unli_wings_group]["discount_id"] and discount_id:
                            unli_wings_groups[unli_wings_group]["discount_id"] = discount_id
                    unli_wings_groups[unli_wings_group]["total_quantity"] += quantity
                    
                    # Check if we're editing an existing order with saved base_amount
                    existing_base_amount = None
                    if "base_amount" in order:
                        existing_base_amount = order.get("base_amount")
                    
                    # Use existing base_amount if available, otherwise use current category value
                    current_base_amount = existing_base_amount or instore_categories[instore_category_id]["base_amount"]
                    
                    order_items.append({
                        "transaction_id": transaction_id,
                        "menu_id": menu_id,
                        "quantity": quantity,
                        "discount_id": discount_id,
                        "instore_category": instore_category_id,
                        "unli_wings_group": unli_wings_group,
                        "base_amount": current_base_amount  # Use preserved base amount
                    })
                else:
                    return Response({"error": "Invalid In-Store Category."}, status=400)
            elif menu_type_id in [2, 3]:
                #For Grab (2) and FoodPanda (3) orders.
                base_price = menu_item["price"] * quantity
                deduction_percentage = menu_types.get(menu_type_id, {}).get("deduction_percentage", 0)
                price = base_price - (base_price * deduction_percentage)
                discount_percentage = discounts.get(discount_id, 0) if discount_id else 0
                if discount_percentage:
                    price = price - (price * discount_percentage)
                base_price = round(base_price, 2)
                price = round(price, 2)
                total_price += price
                calculation_breakdown.append({
                    "menu_id": menu_id,
                    "menu_type": "Grab" if menu_type_id == 2 else "FoodPanda",
                    "quantity": quantity,
                    "base_price": base_price,
                    "deduction_percentage": deduction_percentage,
                    "discount_percentage": discount_percentage,
                    "final_price": price
                })
                order_items.append({
                    "transaction_id": transaction_id,
                    "menu_id": menu_id,
                    "quantity": quantity,
                    "discount_id": discount_id,
                    "instore_category": None,
                    "unli_wings_group": None
                })
            else:
                return Response({"error": f"Unsupported menu type_id {menu_type_id} for menu_id {menu_id}."}, status=400)
        
        # Process Unli Wings groups pricing
        for group_key, group in unli_wings_groups.items():
            # Find the base_amount from the first order item in this group
            group_base_amount = None
            for item in order_items:
                if item.get("unli_wings_group") == group_key:
                    group_base_amount = item.get("base_amount")
                    break
            
            # If no stored base_amount found, fall back to the category base_amount
            base_price = group_base_amount or instore_categories[group["instore_category_id"]]["base_amount"]
            price = base_price
            discount_percentage = discounts.get(group["discount_id"], 0) if group["discount_id"] else 0
            if discount_percentage:
                price = price - (price * (discount_percentage / 100))
            base_price = round(base_price, 2)
            price = round(price, 2)
            total_price += price
            calculation_breakdown.append({
                "instore_category": "Unli Wings",
                "unli_wings_group": group_key,
                "aggregated_quantity": group["total_quantity"],
                "base_price": base_price,
                "discount_percentage": discount_percentage,
                "final_price": price
            })
        
        total_price = round(total_price, 2)
        change = round(payment_amount - total_price, 2)
        
        # Delete previous order details.
        delete_response = supabase_anon.table("order_details").delete().eq("transaction_id", transaction_id).execute()
        if (hasattr(delete_response, "error") and delete_response.error):
            return Response({"error": "Failed to delete previous order details."}, status=500)
        
        # Insert new order details.
        order_details_response = supabase_anon.table("order_details").insert(order_items).execute()
        if (hasattr(order_details_response, "error") and order_details_response.error):
            return Response({"error": "Failed to save updated order details."}, status=500)
        
        return Response({
            "message": "Order updated successfully.",
            "transaction_id": transaction_id,
            "total_price": total_price,
            "change": change,
            "calculation_details": calculation_breakdown
        }, status=200)
    
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['PUT'])
@authentication_classes([])
@permission_classes([AllowAny])
def update_order_status(request, transaction_id):
    debug_steps = []
    
    try:
        debug_steps.append(f"Starting update process for transaction {transaction_id}")
        
        status_id = request.data.get('status_id')
        if not status_id:
            return Response({"error": "Status ID is required"}, status=400)

        # Get current transaction
        transaction_response = supabase_anon.table("transaction").select("*").eq("id", transaction_id).execute()
        if not transaction_response.data:
            return Response({"error": f"Transaction {transaction_id} not found"}, status=404)
        
         # Extract employee_id from the transaction
        employee_id = transaction_response.data[0].get('employee_id')
        if not employee_id:
            return Response({"error": "Employee ID not found in transaction"}, status=400)
        
        # Update transaction status
        status_update = supabase_anon.table("transaction").update({
            "order_status": status_id
        }).eq("id", transaction_id).execute()

        # Only process ingredient deduction if changing to Completed or Complimentary status
        deducted_ingredients = []
        affected_menu_items = []
        
        if int(status_id) == 2 or int(status_id) == 4:  # Completed or Complimentary status
            status_name = "Completed" if int(status_id) == 2 else "Complimentary"
            debug_steps.append(f"Status is {status_name} ({status_id}), will process ingredient deduction")

            # Import the conversion utility
            from .utils.conversion import convert_value
            
            # Get order details for this transaction
            order_details = supabase_anon.table("order_details").select("*").eq("transaction_id", transaction_id).execute()
            
            if order_details.data:
                debug_steps.append(f"Found {len(order_details.data)} order details")
                
                # For each order item, get the menu item and its ingredients
                for order_item in order_details.data:
                    menu_id = order_item.get('menu_id')
                    quantity = order_item.get('quantity', 0)
                    
                    # Get ingredients for this menu item with their unit information
                    ingredients_response = supabase_anon.table("menu_ingredients").select(
                        "id, quantity, inventory_id, unit_id, menu_id"
                    ).eq("menu_id", menu_id).execute()
                    
                    if ingredients_response.data:
                        debug_steps.append(f"Processing {len(ingredients_response.data)} ingredients for menu item {menu_id}")
                        
                        # For each ingredient, deduct from inventory
                        for ingredient in ingredients_response.data:
                            inventory_id = ingredient.get('inventory_id')
                            required_quantity = ingredient.get('quantity', 0)
                            menu_ingredient_unit_id = ingredient.get('unit_id')
                            
                            # Skip if inventory_id is None
                            if inventory_id is None:
                                debug_steps.append(f"Skipping ingredient with null inventory_id for menu {menu_id}")
                                continue
                            
                            # Get current inventory record
                            inventory_response = supabase_anon.table("inventory").select("*").eq("id", inventory_id).execute()
                            
                            if inventory_response.data:
                                current_inventory = inventory_response.data[0]
                                current_quantity = current_inventory.get('quantity', 0)
                                item_id = current_inventory.get('item')  # This is the foreign key to items table
                                
                                # Get item details to find the unit information
                                item_response = supabase_anon.table("items").select("*, unit:unit_of_measurement(*)").eq("id", item_id).execute()
                                
                                if item_response.data:
                                    item = item_response.data[0]
                                    item_unit = item.get('unit', {})
                                    inventory_unit_id = item.get('unit_id')
                                    inventory_unit_symbol = item_unit.get('symbol') if item_unit else None
                                    
                                    # Get menu ingredient unit details
                                    if menu_ingredient_unit_id:
                                        menu_unit_response = supabase_anon.table("unit_of_measurement").select("*").eq("id", menu_ingredient_unit_id).execute()
                                        menu_unit = menu_unit_response.data[0] if menu_unit_response.data else None
                                        menu_unit_symbol = menu_unit.get('symbol') if menu_unit else None
                                        menu_unit_category = menu_unit.get('unit_category') if menu_unit else None
                                        
                                        # Get unit category information
                                        if menu_unit_category:
                                            category_response = supabase_anon.table("um_category").select("name").eq("id", menu_unit_category).execute()
                                            category_name = category_response.data[0].get('name') if category_response.data else None
                                        else:
                                            category_name = None
                                    else:
                                        menu_unit_symbol = inventory_unit_symbol
                                        category_name = None
                                    # Get the unit_id for the disposed_unit
                                    if inventory_unit_symbol:
                                        unit_response = supabase_anon.table("unit_of_measurement").select("id").eq("symbol", inventory_unit_symbol).execute()
                                        if unit_response.data:
                                            disposed_unit_id = unit_response.data[0].get('id')
                                        else:
                                            disposed_unit_id = None
                                    else:
                                        disposed_unit_id = None

                                    # Total quantity to deduct (menu item quantity * required quantity per item)
                                    total_deduction = quantity * required_quantity
                                    
                                    # Convert units if necessary and if we have the category information
                                    if (menu_unit_symbol and inventory_unit_symbol and 
                                        menu_unit_symbol != inventory_unit_symbol and 
                                        category_name in ["Weight", "Volume"]):
                                        try:
                                            original_deduction = total_deduction
                                            total_deduction = convert_value(
                                                total_deduction,
                                                menu_unit_symbol,
                                                inventory_unit_symbol,
                                                category_name
                                            )
                                            debug_steps.append(f"Converted {original_deduction} {menu_unit_symbol} to {total_deduction} {inventory_unit_symbol}")
                                        except Exception as e:
                                            debug_steps.append(f"Conversion error: {str(e)}")
                                    
                                    # Calculate new quantity
                                    new_quantity = max(0, current_quantity - total_deduction)
                                    
                                    # Update inventory
                                    inventory_update = supabase_anon.table("inventory").update({
                                        "quantity": new_quantity
                                    }).eq("id", inventory_id).execute()
                                    
                                    # Track deducted ingredients
                                    deducted_ingredients.append({
                                        "inventory_id": inventory_id,
                                        "item_id": item_id,
                                        "deducted_amount": total_deduction,
                                        "new_quantity": new_quantity
                                    })
                                    
                                     # Prepare disposal data
                                     # For Complimentary orders, use reason_id: 4 (Complimentary)
                                    reason_id = 5 if int(status_id) == 4 else 1

                                    disposal_data = {
                                        "disposed_quantity": total_deduction,
                                        "inventory_id": inventory_id,
                                        "reason_id": 1,
                                        "reason_id": reason_id,
                                        "disposal_datetime": datetime.now().isoformat(),
                                        "disposed_unit": disposed_unit_id,
                                        "disposer": employee_id
                                    }

                                    # Insert into disposed inventory
                                    try:
                                        disposal_response = supabase_anon.table("disposed_inventory").insert(disposal_data).execute()
                                        if not disposal_response.data:
                                            debug_steps.append(f"Failed to insert disposal record for inventory {inventory_id}")
                                        else:
                                            debug_steps.append(f"Successfully inserted disposal record for inventory {inventory_id}")
                                    except Exception as disposal_error:
                                        debug_steps.append(f"Error inserting disposal record: {str(disposal_error)}")

                                    debug_steps.append(f"Updated inventory {inventory_id} for item {item_id}: {current_quantity} -> {new_quantity}")
                                else:
                                    debug_steps.append(f"Item not found for inventory {inventory_id}")
                            else:
                                debug_steps.append(f"Inventory record not found for id {inventory_id}")
            
            # Now add the menu availability check after all deductions are complete
            if deducted_ingredients:
                try:
                    # Get unique inventory IDs that were affected
                    affected_inventory_ids = list(set([item.get('inventory_id') for item in deducted_ingredients if item.get('inventory_id')]))
                    
                    # Find menu items that use these ingredients
                    menu_ingredients_query = supabase_anon.table("menu_ingredients").select("menu_id").in_("inventory_id", affected_inventory_ids).execute()
                    
                    if menu_ingredients_query.data:
                        affected_menu_ids = list(set([item.get('menu_id') for item in menu_ingredients_query.data if item.get('menu_id')]))
                        
                        for menu_id in affected_menu_ids:
                            try:
                                # Get menu item details
                                menu_item_query = supabase_anon.table("menu_items").select("*").eq("id", menu_id).execute()
                                
                                if menu_item_query.data:
                                    menu_item = menu_item_query.data[0]
                                    menu_name = menu_item.get('name', 'Unknown')
                                    current_status = menu_item.get('status_id')
                                    
                                    # Check if any ingredient is insufficient
                                    has_insufficient_ingredients = False
                                    ingredients_query = supabase_anon.table("menu_ingredients").select("*").eq("menu_id", menu_id).execute()
                                    
                                    if ingredients_query.data:
                                        for ingredient in ingredients_query.data:
                                            inventory_id = ingredient.get('inventory_id')
                                            required_quantity = float(ingredient.get('quantity', 0))
                                            
                                            if not inventory_id:
                                                continue
                                            
                                            # Get current inventory
                                            inventory_query = supabase_anon.table("inventory").select("*").eq("id", inventory_id).execute()
                                            
                                            if not inventory_query.data:
                                                has_insufficient_ingredients = True
                                                break
                                            
                                            current_quantity = float(inventory_query.data[0].get('quantity', 0))
                                            
                                            if current_quantity < required_quantity:
                                                has_insufficient_ingredients = True
                                                break
                                    
                                    # Update status if needed
                                    new_status_id = 2 if has_insufficient_ingredients else 1  # 2=Unavailable, 1=Available
                                    
                                    if new_status_id != current_status:
                                        update_result = supabase_anon.table("menu_items").update({
                                            "status_id": new_status_id
                                        }).eq("id", menu_id).execute()
                                        
                                        status_text = "Unavailable" if new_status_id == 2 else "Available"
                                        affected_menu_items.append({
                                            "id": menu_id,
                                            "name": menu_name,
                                            "new_status": status_text
                                        })
                            except Exception as menu_error:
                                debug_steps.append(f"Error processing menu item {menu_id}: {str(menu_error)}")
                except Exception as availability_error:
                    debug_steps.append(f"Error updating menu availability: {str(availability_error)}")
         # For completed status only, display inventory details
                if int(status_id) == 2:
                    success_message = "Order status updated to Completed. Ingredients have been deducted from inventory."
                else:
                    success_message = "Order status updated to Complimentary. Ingredients have been deducted from inventory (no sales recorded)."
                
                # Add a specific message for Complimentary orders in the response
                if int(status_id) == 4:
                    debug_steps.append("Complimentary order: No sales will be recorded for this transaction")
                    
        elif int(status_id) == 3:  # Cancelled status
            debug_steps.append("Status is Cancelled (3), no ingredient deduction needed")
            # No ingredient deduction for cancelled orders

        return Response({
            "deducted_ingredients": deducted_ingredients,
            "affected_menu_items": affected_menu_items,
            "debug": debug_steps
        }, status=200)
        
    except Exception as e:
        return Response({
            "error": str(e),
            "debug": debug_steps
        }, status=500)

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def update_menu_availability(request):
    debug_steps = []
    updated_items = []
    conversion_errors = []
    
    try:
        debug_steps.append("Starting menu availability check")
        
        # 1. Fetch all menu items with their ingredients in a single query
        menu_items_response = supabase_anon.table("menu_items").select("*").execute()
        if not menu_items_response.data:
            return Response({"message": "No menu items found", "debug": debug_steps}, status=200)
        
        menu_items = menu_items_response.data
        debug_steps.append(f"Found {len(menu_items)} menu items to check")
        
        # 2. Fetch all menu ingredients in one query
        all_menu_ingredients = supabase_anon.table("menu_ingredients").select("*").execute().data
        
        # 3. Create a lookup dictionary for menu ingredients by menu_id
        menu_ingredient_map = {}
        menu_ids = []
        inventory_ids = []
        
        for ingredient in all_menu_ingredients:
            menu_id = ingredient.get('menu_id')
            inventory_id = ingredient.get('inventory_id')
            
            if menu_id and inventory_id:
                menu_ids.append(menu_id)
                inventory_ids.append(inventory_id)
                
                if menu_id not in menu_ingredient_map:
                    menu_ingredient_map[menu_id] = []
                    
                menu_ingredient_map[menu_id].append(ingredient)
        
        # 4. Prefetch all inventory records needed
        inventory_records = {}
        if inventory_ids:
            inventory_response = supabase_anon.table("inventory").select("*").in_("id", inventory_ids).execute()
            for inv in inventory_response.data:
                inventory_records[inv.get('id')] = inv
        
        # 5. Prefetch all item records
        item_ids = [inv.get('item') for inv in inventory_records.values() if inv.get('item')]
        items_response = supabase_anon.table("items").select("*").in_("id", item_ids).execute()
        item_records = {item.get('id'): item for item in items_response.data}
        
        # 6. Prefetch all unit measurements
        unit_ids = [item.get('measurement') for item in item_records.values() if item.get('measurement')]
        for ingredient in all_menu_ingredients:
            unit_id = ingredient.get('unit_id')
            if unit_id:
                unit_ids.append(unit_id)
                
        units_response = supabase_anon.table("unit_of_measurement").select("*").in_("id", unit_ids).execute()
        unit_records = {unit.get('id'): unit for unit in units_response.data}
        
        # 7. Get unit categories
        unit_category_ids = [unit.get('unit_category') for unit in unit_records.values() if unit.get('unit_category')]
        unit_categories_response = supabase_anon.table("um_category").select("*").in_("id", unit_category_ids).execute()
        unit_category_records = {cat.get('id'): cat for cat in unit_categories_response.data}
        
        # 8. Process each menu item
        for menu_item in menu_items:
            try:
                menu_id = menu_item.get('id')
                menu_name = menu_item.get('name', 'Unknown')
                current_status = menu_item.get('status_id')
                
                debug_steps.append(f"Checking menu item: {menu_id} - {menu_name}")
                
                # Skip if this menu has no ingredients
                if menu_id not in menu_ingredient_map:
                    debug_steps.append(f"No ingredients found for menu item {menu_id}")
                    continue
                
                ingredients = menu_ingredient_map[menu_id]
                debug_steps.append(f"Found {len(ingredients)} ingredients for menu item {menu_id}")
                
                # Check each ingredient
                has_insufficient_ingredients = False
                
                for ingredient in ingredients:
                    try:
                        inventory_id = ingredient.get('inventory_id')
                        required_quantity = ingredient.get('quantity', 0)
                        menu_ingredient_unit_id = ingredient.get('unit_id')
                        
                        # Skip if inventory_id is None
                        if inventory_id is None:
                            debug_steps.append(f"Skipping ingredient with null inventory_id for menu {menu_id}")
                            continue
                        
                        # Get inventory from prefetched data
                        if inventory_id not in inventory_records:
                            debug_steps.append(f"Inventory record not found for id {inventory_id}")
                            has_insufficient_ingredients = True
                            break
                        
                        current_inventory = inventory_records[inventory_id]
                        current_quantity = current_inventory.get('quantity', 0)
                        item_id = current_inventory.get('item')
                        
                        # Skip if item_id is None
                        if item_id is None or item_id not in item_records:
                            debug_steps.append(f"Item not found for inventory {inventory_id}")
                            has_insufficient_ingredients = True
                            break
                        
                        item = item_records[item_id]
                        measurement_id = item.get('measurement')
                        
                        if measurement_id not in unit_records:
                            debug_steps.append(f"Measurement unit not found for item {item_id}")
                            has_insufficient_ingredients = True
                            break
                            
                        inventory_unit = unit_records[measurement_id]
                        inventory_unit_symbol = inventory_unit.get('symbol')
                        
                        # Default to direct comparison
                        required_quantity_converted = float(required_quantity)
                        conversion_performed = False
                        
                        # Get unit information for menu ingredient if available
                        if menu_ingredient_unit_id is not None and menu_ingredient_unit_id in unit_records:
                            menu_unit = unit_records[menu_ingredient_unit_id]
                            menu_unit_symbol = menu_unit.get('symbol')
                            menu_unit_category_id = menu_unit.get('unit_category')
                            
                            # Try to convert units if necessary
                            if (menu_unit_symbol and inventory_unit_symbol and 
                                menu_unit_symbol != inventory_unit_symbol and 
                                menu_unit_category_id is not None and
                                menu_unit_category_id in unit_category_records):
                                
                                category = unit_category_records[menu_unit_category_id]
                                category_name = category.get('name')
                                
                                if category_name in ["Weight", "Volume"]:
                                    try:
                                        # Check if both units are in the conversion factors
                                        from_unit_supported = menu_unit_symbol in CONVERSION_FACTORS.get(category_name, {})
                                        to_unit_supported = inventory_unit_symbol in CONVERSION_FACTORS.get(category_name, {})
                                        
                                        if from_unit_supported and to_unit_supported:
                                            required_quantity_converted = convert_value(
                                                float(required_quantity),
                                                menu_unit_symbol,
                                                inventory_unit_symbol,
                                                category_name
                                            )
                                            conversion_performed = True
                                            debug_steps.append(
                                                f"Converted {required_quantity} {menu_unit_symbol} to {required_quantity_converted} {inventory_unit_symbol}"
                                            )
                                    except Exception as e:
                                        error_msg = f"Conversion error for {menu_name}: {str(e)}"
                                        debug_steps.append(error_msg)
                                        conversion_errors.append({
                                            "menu_id": menu_id,
                                            "menu_name": menu_name,
                                            "error": error_msg
                                        })
                        else:
                            # Log when using direct comparison due to missing unit information
                            debug_steps.append(f"Using direct comparison for {menu_name}, ingredient {inventory_id}: missing unit information")
                        
                        # Check if enough inventory
                        current_quantity = float(current_quantity)
                        if current_quantity < required_quantity_converted:
                            # Use your existing fix for inventory_name
                            inventory_name = current_inventory.get('name', item.get('name', 'Unknown'))
                            debug_steps.append(f"Insufficient inventory for {menu_name}: {inventory_name} has {current_quantity}, needs {required_quantity_converted}")
                            has_insufficient_ingredients = True
                            break
                        else:
                            # Also add this else clause to define inventory_name for successful cases as in your code
                            inventory_name = current_inventory.get('name', item.get('name', 'Unknown'))
                            debug_steps.append(f"Sufficient inventory for {menu_name}: {inventory_name} has {current_quantity}, needs {required_quantity_converted}")
                            
                    except Exception as ingredient_error:
                        error_msg = f"Error processing ingredient for {menu_name}: {str(ingredient_error)}"
                        debug_steps.append(error_msg)
                        has_insufficient_ingredients = True
                        break
                
                # Update menu item status if needed
                new_status_id = 2 if has_insufficient_ingredients else 1
                
                if new_status_id != current_status:
                    try:
                        # Update menu item status
                        update_result = supabase_anon.table("menu_items").update({
                            "status_id": new_status_id
                        }).eq("id", menu_id).execute()
                        
                        status_text = "Unavailable" if new_status_id == 2 else "Available"
                        debug_steps.append(f"Updated status of menu item {menu_name} to {status_text}")
                        
                        updated_items.append({
                            "id": menu_id,
                            "name": menu_name,
                            "new_status": status_text,
                            "new_status_id": new_status_id
                        })
                    except Exception as update_error:
                        debug_steps.append(f"Error updating menu status: {str(update_error)}")
                else:
                    debug_steps.append(f"No status change needed for menu item {menu_name}")
            except Exception as menu_error:
                debug_steps.append(f"Error processing menu item {menu_item.get('name', 'Unknown')}: {str(menu_error)}")
        
        return Response({
            "message": f"Updated availability status for {len(updated_items)} menu items",
            "updated_items": updated_items,
            "conversion_errors": conversion_errors,
            "debug": debug_steps
        }, status=200)
    
    except Exception as e:
        debug_steps.append(f"Error: {str(e)}")
        return Response({
            "error": str(e),
            "debug": debug_steps
        }, status=500)

@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def check_menu_inventory(request, menu_id):
    try:
        # Get requested quantity from query params, default to 1
        quantity = float(request.GET.get('quantity', 1))
        
        # Get menu item ingredients
        ingredients_response = supabase_anon.table("menu_ingredients").select(
            "id, quantity, inventory_id, unit_id, menu_id"
        ).eq("menu_id", menu_id).execute()
        
        if not ingredients_response.data:
            return Response({
                "has_sufficient_inventory": True,
                "message": "No ingredients found for this menu item"
            })
        
        # Import the conversion utility
        from .utils.conversion import convert_value
        
        warnings = []
        has_sufficient_inventory = True
        
        # Check each ingredient
        for ingredient in ingredients_response.data:
            inventory_id = ingredient.get('inventory_id')
            required_quantity = ingredient.get('quantity', 0)
            menu_ingredient_unit_id = ingredient.get('unit_id')
            
            # Skip if inventory_id is None
            if inventory_id is None:
                continue
            
            # Get current inventory record
            inventory_response = supabase_anon.table("inventory").select("*").eq("id", inventory_id).execute()
            
            if not inventory_response.data:
                continue
            
            current_inventory = inventory_response.data[0]
            current_quantity = current_inventory.get('quantity', 0)
            item_id = current_inventory.get('item')
            
            # Get item details to find the unit information
            item_response = supabase_anon.table("items").select("*, unit:unit_of_measurement(*)").eq("id", item_id).execute()
            
            if not item_response.data:
                continue
            
            item = item_response.data[0]
            item_unit = item.get('unit', {})
            inventory_unit_symbol = item_unit.get('symbol') if item_unit else None
            
            # Get menu ingredient unit details
            if menu_ingredient_unit_id:
                menu_unit_response = supabase_anon.table("unit_of_measurement").select("*").eq("id", menu_ingredient_unit_id).execute()
                menu_unit = menu_unit_response.data[0] if menu_unit_response.data else None
                menu_unit_symbol = menu_unit.get('symbol') if menu_unit else None
                menu_unit_category = menu_unit.get('unit_category') if menu_unit else None
                
                # Get unit category information
                if menu_unit_category:
                    category_response = supabase_anon.table("um_category").select("name").eq("id", menu_unit_category).execute()
                    category_name = category_response.data[0].get('name') if category_response.data else None
                else:
                    category_name = None
            else:
                menu_unit_symbol = inventory_unit_symbol
                category_name = None
            
            # Total quantity to deduct (menu item quantity * required quantity per item)
            total_required = quantity * required_quantity
            
            # Convert units if necessary and if we have the category information
            if (menu_unit_symbol and inventory_unit_symbol and 
                menu_unit_symbol != inventory_unit_symbol and 
                category_name in ["Weight", "Volume"]):
                try:
                    total_required = convert_value(
                        total_required,
                        menu_unit_symbol,
                        inventory_unit_symbol,
                        category_name
                    )
                except Exception as e:
                    pass
            
            # Check if enough inventory
            if current_quantity < total_required:
                has_sufficient_inventory = False
                
                # Get inventory name from item
                inventory_name = item.get('name', 'Unknown')
                
                # Add warning
                warnings.append({
                    "inventory_id": inventory_id,
                    "inventory_name": inventory_name,
                    "available_quantity": current_quantity,
                    "required_quantity": total_required,
                    "unit": inventory_unit_symbol or "units"
                })
        
        return Response({
            "has_sufficient_inventory": has_sufficient_inventory,
            "warnings": warnings,
            "menu_id": menu_id,
            "requested_quantity": quantity
        })
    
    except Exception as e:
        return Response({
            "error": str(e)
        }, status=500)

@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def fetch_sales_data(request):
    try:
        # First, fetch only the essential reference data that's needed across components
        essential_data = {}
        
        # Parallel fetch for reference data (to optimize loading time)
        menu_types_query = supabase_anon.table("menu_type").select("id, name, deduction_percentage")
        menu_categories_query = supabase_anon.table("menu_category").select("id, name")
        expenses_types_query = supabase_anon.table("expenses_type").select("id, name")
        instore_categories_query = supabase_anon.table("instore_category").select("id, name, base_amount")
        payment_methods_query = supabase_anon.table("payment_methods").select("id, name")
        discounts_query = supabase_anon.table("discounts").select("id, type, percentage")
        unit_measurements_query = supabase_anon.table("unit_of_measurement").select("id, symbol")
        suppliers_query = supabase_anon.table("supplier").select("id, name")
        
        # Execute queries in parallel
        menu_types_result = menu_types_query.execute()
        menu_categories_result = menu_categories_query.execute()
        expenses_types_result = expenses_types_query.execute()
        instore_categories_result = instore_categories_query.execute()
        payment_methods_result = payment_methods_query.execute()
        discounts_result = discounts_query.execute()
        unit_measurements_result = unit_measurements_query.execute()
        suppliers_result = suppliers_query.execute()
        
        # Store results
        essential_data['menu_types'] = menu_types_result.data or []
        essential_data['menu_categories'] = menu_categories_result.data or []
        essential_data['expenses_types'] = expenses_types_result.data or []
        essential_data['instore_categories'] = instore_categories_result.data or []
        essential_data['payment_methods'] = payment_methods_result.data or []
        essential_data['discounts'] = discounts_result.data or []
        essential_data['unit_measurements'] = unit_measurements_result.data or []
        essential_data['suppliers'] = suppliers_result.data or []
        
        # Fetch menu items (needed for order details and stock-in details)
        menus = supabase_anon.table("menu_items").select(
            "id, name, type_id, price, image, status_id, category_id"
        ).execute().data or []
        
        # Format menu images only once
        formatted_menus = [
            {
                "id": menu["id"],
                "name": menu["name"],
                "type_id": menu["type_id"],
                "category_id": menu["category_id"],
                "price": menu["price"],
                "image": supabase_anon.storage.from_("menu-images").get_public_url(menu["image"]) if menu["image"] else None,
                "status_id": menu["status_id"]
            }
            for menu in menus
        ]
        essential_data['menu_items'] = formatted_menus
        
        # Fetch items (needed for StockInExpense)
        items = supabase_anon.table('items').select("id, name, measurement, category").execute().data or []
        essential_data['items'] = items
        
        # Fetch GCash references
        gcash_references = supabase_anon.table("gcash_reference").select("id, name, attached_transaction").execute().data or []
        essential_data['gcash_references'] = gcash_references
        
        # Optimize transaction fetching - only get completed transactions (status = 2)
        # Removed reference_id and receipt_image
        transactions = supabase_anon.table('transaction').select("""
            id, 
            date,
            payment_amount, 
            order_status,
            payment_method,
            employee_id
        """).eq('order_status', 2).execute().data or []
        
        # Only fetch order details for these transactions
        if transactions:
            transaction_ids = [t['id'] for t in transactions]
            
            # Fetch order details for these transactions in a single query
            order_details = supabase_anon.table('order_details').select("""
                id,
                transaction_id,
                menu_id,
                quantity,
                discount_id,
                instore_category,
                unli_wings_group
            """).in_('transaction_id', transaction_ids).execute().data or []
            
            # Group order details by transaction_id to avoid multiple iterations
            order_details_by_transaction = {}
            for detail in order_details:
                transaction_id = detail['transaction_id']
                if transaction_id not in order_details_by_transaction:
                    order_details_by_transaction[transaction_id] = []
                
                # Add reference data directly to each detail
                enhanced_detail = {
                    **detail,
                    'menu_item': next((menu for menu in formatted_menus if menu['id'] == detail['menu_id']), None),
                    'discount': next((discount for discount in essential_data['discounts'] if discount['id'] == detail['discount_id']), None),
                    'instore_category': next((category for category in essential_data['instore_categories'] if category['id'] == detail['instore_category']), None)
                }
                order_details_by_transaction[transaction_id].append(enhanced_detail)
            
            # Add order details to each transaction
            processed_transactions = []
            for transaction in transactions:
                transaction_id = transaction['id']
                transaction_details = order_details_by_transaction.get(transaction_id, [])
                
                # Find GCash reference for this transaction (if any)
                gcash_reference = next((ref for ref in gcash_references if ref['attached_transaction'] == transaction_id), None)
                
                # Add formatted transaction with its details
                processed_transaction = {
                    **transaction,
                    'order_details': transaction_details,
                    'gcash_reference': gcash_reference
                }
                processed_transactions.append(processed_transaction)
        else:
            processed_transactions = []
        
        # Optimize expense fetching with proper nested structure
        expenses = supabase_anon.table('expenses').select("""
            id,
            date,
            cost,
            type_id,
            stockin_id,
            note
        """).execute().data or []
        
        # Process expenses with stockin_id to include receipt details
        stockin_expenses = [exp for exp in expenses if exp.get('stockin_id')]
        
        if stockin_expenses:
            # Get unique stockin_ids (receipt ids)
            receipt_ids = list(set(exp['stockin_id'] for exp in stockin_expenses if exp['stockin_id']))
            
            if receipt_ids:
                # Fetch all relevant receipts in a single query
                receipts = supabase_anon.table('receipts').select("""
                    id,
                    receipt_no,
                    date,
                    supplier
                """).in_('id', receipt_ids).execute().data or []
                
                # Create a lookup dictionary for receipts
                receipts_by_id = {receipt['id']: receipt for receipt in receipts}
                
                # Fetch all stock-in items in a single query
                stockin_items = supabase_anon.table('stockin').select("""
                    id,
                    receipt_id,
                    inventory_id,
                    item_id,
                    quantity_in,
                    price,
                    inventory:inventory (
                        id,
                        quantity,
                        item:items (
                            id,
                            name,
                            measurement
                        )
                    )
                """).in_('receipt_id', receipt_ids).execute().data or []
                
                # Group stock-in items by receipt_id
                stockin_by_receipt = {}
                for item in stockin_items:
                    receipt_id = item.get('receipt_id')
                    if receipt_id not in stockin_by_receipt:
                        stockin_by_receipt[receipt_id] = []
                    stockin_by_receipt[receipt_id].append(item)
                
                # Add receipt and stock-in details to each expense
                for expense in stockin_expenses:
                    stockin_id = expense.get('stockin_id')
                    receipt = receipts_by_id.get(stockin_id)
                    
                    if receipt:
                        # Add stock_ins array if available
                        if stockin_id in stockin_by_receipt:
                            receipt['stock_ins'] = stockin_by_receipt[stockin_id]
                        else:
                            receipt['stock_ins'] = []
                        
                        # Add the receipt to the expense
                        expense['receipt'] = receipt
                
        # Add expense types to each expense for easier access
        for expense in expenses:
            expense['expenses_type'] = next(
                (et for et in essential_data['expenses_types'] if et['id'] == expense['type_id']), 
                None
            )
        
        # Combine all data for the response
        response_data = {
            'transactions': processed_transactions,
            'expenses': expenses,
            **essential_data  # Include all essential reference data
        }
        
        return Response(response_data)
    
    except Exception as e:
        print(f"Error in fetch_sales_data: {str(e)}")
        return Response({'error': str(e)})

@api_view(['POST'])
@authentication_classes([SupabaseAuthentication])
@permission_classes([SupabaseIsAdmin])
def add_expense_type(request):
    """
    Add a new expense type
    """
    try:
        # Authenticate the user and get the authenticated user's id
        auth_data = authenticate_user(request)
        supabase_client = auth_data['client']

        # Get the data from the request
        data = json.loads(request.body)
        name = data.get('name')

        if not name:
            return Response({"error": "Name is required"}, status=400)
        
        insert_response = supabase_client.table('expenses_type').insert({
            'name': name
        }).execute()

        if insert_response.data:
            return Response({
                "message": "Expense type added successfully",
                "expense_type": insert_response.data[0]
            }, status=201)
        else:
            return Response({
                "error": "Failed to add expense type"
            }, status=500)
        
    except Exception as e:
        return Response({
            "error": "Failed to add expense type"
        }, status=500)
        
@api_view(['PUT'])
@authentication_classes([SupabaseAuthentication])
@permission_classes([SupabaseIsAdmin])
def edit_expense_type(request, expense_type_id):
    """
    Edit an existing expense type
    """
    try:
        # Authenticate the user and get the authenticated user's id
        auth_data = authenticate_user(request)
        supabase_client = auth_data['client']
        
        data = json.loads(request.body)
        new_name = data.get('name')

        if not new_name:
            return Response({"error": "Name is required"}, status=400)
        
        expense_response = supabase_client.table('expenses_type').select('*').eq('id', expense_type_id).execute()
        if not expense_response.data:
            return Response({
                "error": "Expense type not found"
            }, status=404)
        
        update_response = supabase_client.table('expenses_type').update({
            'name': new_name
        }).eq('id', expense_type_id).execute()

        if not update_response.data:
            return Response({
                "error": "Failed to update expense type"
            }, status=500)
        
        return Response({
            "message": "Expense type updated successfully",
            "expense_type": update_response.data[0]
        }, status=200)
        
    except Exception as e:
        return Response({
            "error": "Failed to update expense type"
        }, status=500)

@api_view(['DELETE'])
@authentication_classes([SupabaseAuthentication])
@permission_classes([SupabaseIsAdmin])
def delete_expense_type(request, expense_type_id):
    """
    Delete an existing expense type
    """
    try:
        # Authenticate the user and get the authenticated user's id
        auth_data = authenticate_user(request)
        supabase_client = auth_data['client']
        
        expense_response = supabase_client.table('expenses_type').select('*').eq('id', expense_type_id).execute()
        if not expense_response.data:
            return Response({
                "error": "Expense type not found"
            }, status=404)
        
        delete_response = supabase_client.table('expenses_type').delete().eq('id', expense_type_id).execute()
        if not delete_response.data:
            return Response({
                "error": "Failed to delete expense type"
            }, status=500)
        else:
            return Response({
                "message": "Expense type deleted successfully"
            }, status=200)
        
    except Exception as e:
        return Response({
            "error": "Failed to update expense type"
        }, status=500)

@api_view(['POST'])
@authentication_classes([SupabaseAuthentication])
@permission_classes([SupabaseIsAdmin])
def add_expense(request):
    """
    Add a new expense
    """
    try:
        # Authenticate the user and get the authenticated user's id
        auth_data = authenticate_user(request)
        supabase_client = auth_data['client']

        # Get the data from the request
        data = json.loads(request.body)
        date = data.get('date')
        cost = data.get('cost')
        expense_type_id = data.get('expense_type_id')
        note = data.get('note')

        # Validate required fields
        if not date:
            return Response({"error": "Date is required"}, status=400)
        if not cost:
            return Response({"error": "Amount is required"}, status=400)
        if not expense_type_id:
            return Response({"error": "Expense type is required"}, status=400)
        
        # Insert the expense record
        insert_response = supabase_client.table('expenses').insert({
            'date': date,
            'cost': cost,
            'type_id': expense_type_id,
            'note': note
        }).execute()

        if insert_response.data:
            return Response({
                "message": "Expense added successfully",
                "expense": insert_response.data[0]
            }, status=201)
        else:
            return Response({
                "error": "Failed to add expense"
            }, status=500)
        
    except Exception as e:
        return Response({
            "error": f"Failed to add expense: {str(e)}"
        }, status=500)

@api_view(['PUT'])
@authentication_classes([SupabaseAuthentication])
@permission_classes([SupabaseIsAdmin])
def edit_expense(request, expense_id):
    """
    Edit an existing expense
    """
    try:
        # Authenticate the user and get the authenticated user's id
        auth_data = authenticate_user(request)
        supabase_client = auth_data['client']
        
        data = json.loads(request.body)
        date = data.get('date')
        cost = data.get('cost')
        expense_type_id = data.get('expense_type_id')
        note = data.get('note')

        # Validate required fields
        if not date or not cost or not expense_type_id:
            return Response({"error": "Date, cost, and expense type are required"}, status=400)
        
        # Check if expense exists
        expense_response = supabase_client.table('expenses').select('*').eq('id', expense_id).execute()
        if not expense_response.data:
            return Response({"error": "Expense not found"}, status=404)
        
        # Update expense
        update_response = supabase_client.table('expenses').update({
            'date': date,
            'cost': cost,
            'type_id': expense_type_id,
            'note': note
        }).eq('id', expense_id).execute()

        if not update_response.data:
            return Response({"error": "Failed to update expense"}, status=500)
        
        return Response({
            "message": "Expense updated successfully",
            "expense": update_response.data[0]
        }, status=200)
        
    except Exception as e:
        return Response({
            "error": f"Failed to update expense: {str(e)}"
        }, status=500)

@api_view(['DELETE'])
@authentication_classes([SupabaseAuthentication])
@permission_classes([SupabaseIsAdmin])
def delete_expense(request, expense_id):
    """
    Delete an existing expense
    """
    try:
        # Authenticate the user and get the authenticated user's id
        auth_data = authenticate_user(request)
        supabase_client = auth_data['client']
        
        # Check if expense exists
        expense_response = supabase_client.table('expenses').select('*').eq('id', expense_id).execute()
        if not expense_response.data:
            return Response({"error": "Expense not found"}, status=404)
        
        # Delete expense
        delete_response = supabase_client.table('expenses').delete().eq('id', expense_id).execute()
        if not delete_response.data:
            return Response({"error": "Failed to delete expense"}, status=500)
        
        return Response({
            "message": "Expense deleted successfully"
        }, status=200)
        
    except Exception as e:
        return Response({
            "error": f"Failed to delete expense: {str(e)}"
        }, status=500)

@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def fetch_dashboard_data(request):
    try:
        # Get date parameter from request, default to today
        date_filter = request.GET.get('date', None)
        
        # If no date provided, use today (preserving exact variable names to avoid bugs)
        if not date_filter:
            today = datetime.now().strftime('%Y-%m-%d')
        else:
            today = date_filter
        
        # Initialize response data structure
        dashboard_data = {
            'orders': {
                'total': 0,
                'today': 0
            },
            'sales': {
                'total': 0,
                'today': 0
            },
            'expenses': {
                'total': 0,
                'today': 0
            },
            'inventory': {
                'low_stock': [],
                'recent_stockin': [],
                'recent_stockout': []
            },
            'sales_by_month': {
                'current_month': [0] * 31,  # Changed from current_year to current_month
                'previous_month': [0] * 31  # Changed from previous_year to previous_month
            }
        }
        
        # Use the filtered date from the request parameter instead of resetting to today
        filtered_date = today
        
        # OPTIMIZATION: Get only completed transactions directly
        completed_transactions = supabase_anon.table('transaction').select('*').eq('order_status', 2).execute().data or []
        
        # Count total orders
        dashboard_data['orders']['total'] = len(completed_transactions)
        
        # Prepare filtered transactions list - more efficient than filtering in every step
        filtered_transactions = [t for t in completed_transactions if t.get('date') and t['date'].startswith(filtered_date)]
        dashboard_data['orders']['today'] = len(filtered_transactions)
        
        # OPTIMIZATION: Only fetch necessary fields for order details
        order_details = supabase_anon.table('order_details').select(
            'transaction_id,menu_id,quantity,instore_category,discount_id,unli_wings_group'
        ).execute().data or []
        
        # Create lookup dict for order details by transaction_id
        order_details_by_transaction = {}
        for detail in order_details:
            transaction_id = detail.get('transaction_id')
            if transaction_id:
                if transaction_id not in order_details_by_transaction:
                    order_details_by_transaction[transaction_id] = []
                order_details_by_transaction[transaction_id].append(detail)
        
        # OPTIMIZATION: Fetch only needed fields for reference tables
        menu_items = supabase_anon.table('menu_items').select('id,price,type_id').execute().data or []
        menu_items_dict = {item['id']: item for item in menu_items}
        
        menu_types = supabase_anon.table('menu_type').select('id,deduction_percentage').execute().data or []
        menu_types_dict = {type_data['id']: type_data for type_data in menu_types}
        
        discounts = supabase_anon.table('discounts').select('id,percentage').execute().data or []
        discounts_dict = {discount['id']: discount for discount in discounts}
        
        instore_categories = supabase_anon.table('instore_category').select('id,base_amount').execute().data or []
        instore_categories_dict = {cat['id']: cat for cat in instore_categories}
        
        # Calculate total sales from completed transactions
        total_sales = 0
        filtered_date_sales = 0
        
        # Get current month and year for comparison
        current_date = datetime.now()
        current_month = current_date.month
        current_year = current_date.year
        
        # Calculate previous month and year
        if current_month == 1:
            previous_month = 12
            previous_year = current_year - 1
        else:
            previous_month = current_month - 1
            previous_year = current_year
        
        # OPTIMIZATION: Process transactions more efficiently but preserve original logic
        for transaction in completed_transactions:
            # Get transaction details
            transaction_id = transaction.get('id')
            transaction_date = transaction.get('date')
            
            if not transaction_id or not transaction_date:
                continue
                
            details = order_details_by_transaction.get(transaction_id, [])
            if not details:
                continue
            
            # Calculate transaction total using similar logic to the frontend
            transaction_total = 0
            type_id = None
            
            # Determine order type - preserve original logic exactly
            for detail in details:
                menu_id = detail.get('menu_id')
                if menu_id and menu_id in menu_items_dict:
                    type_id = menu_items_dict[menu_id].get('type_id')
                    break
            
            # CRITICAL: Keep exact logic pattern for sales computation to avoid issues
            if type_id == 1:  # In-store
                # Separate unli wings and ala carte
                unli_wings_orders = [d for d in details if d.get('instore_category') == 2]
                ala_carte_orders = [d for d in details if d.get('instore_category') != 2]
                
                # Unique unli wings groups
                unli_wings_groups = set(d.get('unli_wings_group') for d in unli_wings_orders if d.get('unli_wings_group'))
                unli_wings_base = instore_categories_dict.get(2, {}).get('base_amount', 0)
                unli_wings_total = len(unli_wings_groups) * unli_wings_base
                
                # Ala carte totals with discounts
                ala_carte_total = 0
                for detail in ala_carte_orders:
                    quantity = detail.get('quantity', 0)
                    menu_id = detail.get('menu_id')
                    discount_id = detail.get('discount_id')
                    
                    if menu_id and menu_id in menu_items_dict:
                        price = menu_items_dict[menu_id].get('price', 0)
                        discount_percentage = discounts_dict.get(discount_id, {}).get('percentage', 0) if discount_id else 0
                        ala_carte_total += quantity * price * (1 - discount_percentage)
                
                transaction_total = ala_carte_total + unli_wings_total
            else:  # Delivery orders
                subtotal = 0
                for detail in details:
                    quantity = detail.get('quantity', 0)
                    menu_id = detail.get('menu_id')
                    
                    if menu_id and menu_id in menu_items_dict:
                        price = menu_items_dict[menu_id].get('price', 0)
                        subtotal += quantity * price
                
                # Apply delivery app deduction
                deduction_percentage = menu_types_dict.get(type_id, {}).get('deduction_percentage', 0) if type_id else 0
                transaction_total = subtotal * (1 - deduction_percentage)
            
            # Add to total sales
            total_sales += transaction_total
            
            # Check if it's filtered date transaction
            if transaction_date.startswith(filtered_date):
                filtered_date_sales += transaction_total
            
            # Record for monthly sales chart - DAILY data for current and previous month
            try:
                transaction_date_obj = datetime.fromisoformat(transaction_date.replace('Z', '+00:00'))
                trans_year = transaction_date_obj.year
                trans_month = transaction_date_obj.month
                trans_day = transaction_date_obj.day - 1  # Zero-indexed for array
                
                # OPTIMIZATION: Avoid nested conditionals when possible
                if 0 <= trans_day < 31:  # Ensure it fits in our array
                    if trans_year == current_year and trans_month == current_month:
                        dashboard_data['sales_by_month']['current_month'][trans_day] += transaction_total
                    elif trans_year == previous_year and trans_month == previous_month:
                        dashboard_data['sales_by_month']['previous_month'][trans_day] += transaction_total
            except (ValueError, TypeError):
                pass
        
        # Update sales data
        dashboard_data['sales']['total'] = total_sales
        dashboard_data['sales']['today'] = filtered_date_sales
        
        # OPTIMIZATION: Fetch only needed expenses fields
        all_expenses = supabase_anon.table('expenses').select('cost,date').execute().data or []
        
        # OPTIMIZATION: Calculate expenses more efficiently
        dashboard_data['expenses']['total'] = sum(expense.get('cost', 0) for expense in all_expenses)
        dashboard_data['expenses']['today'] = sum(
            expense.get('cost', 0) 
            for expense in all_expenses 
            if expense.get('date') and expense['date'].startswith(filtered_date)
        )

        # OPTIMIZATION: Get inventory-related data in a more optimized way
        unit_measurements = supabase_anon.table('unit_of_measurement').select('id,symbol').execute().data or []
        unit_measurements_dict = {unit['id']: unit for unit in unit_measurements}

        items = supabase_anon.table('items').select('id,name,stock_trigger,measurement').execute().data or []
        items_dict = {item['id']: item for item in items}
        
        inventory = supabase_anon.table('inventory').select('id,quantity,item').execute().data or []
        inventory_dict = {inv['id']: inv for inv in inventory}
        
        # Find low stock items (less than stock trigger) - with early continues for efficiency
        for inv_item in inventory:
            quantity = inv_item.get('quantity', 0)
            item_id = inv_item.get('item')
            
            if not item_id or item_id not in items_dict:
                continue
                
            item_data = items_dict[item_id]
            stock_trigger = item_data.get('stock_trigger', 0)
            
            if quantity < stock_trigger:
                measurement_id = item_data.get('measurement')
                measurement = unit_measurements_dict.get(measurement_id, {}).get('symbol', 'Unknown')
            
                dashboard_data['inventory']['low_stock'].append({
                    'id': inv_item.get('id'),
                    'name': item_data.get('name', 'Unknown'),
                    'quantity': quantity,
                    'stock_trigger': stock_trigger,
                    'measurement': measurement
                })
        
        # OPTIMIZATION: Batch fetch related data for recent stock activities
        receipts = supabase_anon.table('receipts').select('id,receipt_no,date,supplier').order('id', desc=True).limit(5).execute().data or []
        
        # Process stock-in records more efficiently
        receipt_ids = [receipt.get('id') for receipt in receipts if receipt.get('id')]
        if receipt_ids:
            # Get all stock-ins for these receipts in a single query
            stock_ins_query = supabase_anon.table('stockin').select('id,receipt_id,item_id,quantity_in,price')
            
            # Use "in" filter if supported by your Supabase client
            if len(receipt_ids) == 1:
                stock_ins_query = stock_ins_query.eq('receipt_id', receipt_ids[0])
            else:
                # Some Supabase clients support in_() for multiple values
                try:
                    stock_ins_query = stock_ins_query.in_('receipt_id', receipt_ids)
                except AttributeError:
                    # Fallback if in_() is not supported
                    pass
                    
            all_stock_ins = stock_ins_query.execute().data or []
            
            # Organize by receipt_id for efficient lookup
            stock_ins_by_receipt = {}
            for stock_in in all_stock_ins:
                receipt_id = stock_in.get('receipt_id')
                if receipt_id not in stock_ins_by_receipt:
                    stock_ins_by_receipt[receipt_id] = []
                stock_ins_by_receipt[receipt_id].append(stock_in)
            
            # Create a receipt lookup dict for O(1) access
            receipts_dict = {r['id']: r for r in receipts if 'id' in r}
            
            # Process stock-ins
            for receipt_id, receipt_stock_ins in stock_ins_by_receipt.items():
                receipt = receipts_dict.get(receipt_id)
                if not receipt:
                    continue
                    
                for stock_in in receipt_stock_ins:
                    item_id = stock_in.get('item_id')
                    if not item_id or item_id not in items_dict:
                        continue
                        
                    item_data = items_dict[item_id]
                    measurement_id = item_data.get('measurement')
                    measurement = unit_measurements_dict.get(measurement_id, {}).get('symbol', 'Unknown')
                    
                    dashboard_data['inventory']['recent_stockin'].append({
                        'id': stock_in.get('id'),
                        'item_name': item_data.get('name', 'Unknown'),
                        'quantity_in': stock_in.get('quantity_in', 0),
                        'measurement': measurement,
                        'date': receipt.get('date'),
                        'receipt_no': receipt.get('receipt_no')
                    })
        else:
            # Fallback to original approach if batch fetching isn't supported
            for receipt in receipts:
                receipt_id = receipt.get('id')
                if receipt_id:
                    stock_ins = supabase_anon.table('stockin').select(
                        'id,receipt_id,item_id,quantity_in,price'
                    ).eq('receipt_id', receipt_id).execute().data or []
                    
                    for stock_in in stock_ins:
                        item_id = stock_in.get('item_id')
                        if item_id and item_id in items_dict:
                            item_data = items_dict[item_id]
                            measurement_id = item_data.get('measurement')
                            measurement = unit_measurements_dict.get(measurement_id, {}).get('symbol', 'Unknown')
                            
                            dashboard_data['inventory']['recent_stockin'].append({
                                'id': stock_in.get('id'),
                                'item_name': item_data.get('name', 'Unknown'),
                                'quantity_in': stock_in.get('quantity_in', 0),
                                'measurement': measurement,
                                'date': receipt.get('date'),
                                'receipt_no': receipt.get('receipt_no')
                            })
        
        # OPTIMIZATION: More efficient handling of disposal records
        disposals = supabase_anon.table('disposed_inventory').select('*').order('id', desc=True).limit(5).execute().data or []
        
        if disposals:
            # Fetch disposal reasons with only needed fields
            reasons = supabase_anon.table('reason_of_disposal').select('id,name').execute().data or []
            reasons_dict = {reason['id']: reason for reason in reasons}
            
            # Process disposals with efficient lookups
            for disposal in disposals:
                inventory_id = disposal.get('inventory_id')
                if not inventory_id or inventory_id not in inventory_dict:
                    continue
                    
                inv_item = inventory_dict[inventory_id]
                item_id = inv_item.get('item')
                
                if not item_id or item_id not in items_dict:
                    continue
                    
                item_data = items_dict[item_id]
                reason_id = disposal.get('reason_id')
                reason_text = reasons_dict.get(reason_id, {}).get('name', 'Unknown reason')
                
                # Use other_reason if reason_id indicates "Other"
                if reason_id == 3 and disposal.get('other_reason'):
                    reason_text = disposal.get('other_reason')
                
                # Get the disposed unit's symbol
                disposed_unit_id = disposal.get('disposed_unit')
                disposed_unit_symbol = unit_measurements_dict.get(disposed_unit_id, {}).get('symbol', '')
                
                dashboard_data['inventory']['recent_stockout'].append({
                    'id': disposal.get('id'),
                    'item_name': item_data.get('name', 'Unknown'),
                    'quantity_out': disposal.get('disposed_quantity', 0),
                    'measurement': disposed_unit_symbol,
                    'reason': reason_text,
                    'date': disposal.get('disposal_datetime'),
                    'disposer': disposal.get('disposer')
                })
        
        return Response(dashboard_data)
    
    except Exception as e:
        print(traceback.format_exc())
        return Response({'error': str(e)}, status=500)
