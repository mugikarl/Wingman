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
from datetime import datetime

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

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def login_view(request):
    try:
        data = json.loads(request.body)
        email = data.get("email")
        passcode = data.get("passcode")

        if not email or not passcode:
            return JsonResponse({"error": "Both email and passcode are required"}, status=400)

        # Use Supabase Auth to authenticate the user
        auth_response = supabase_anon.auth.sign_in_with_password({
            "email": email,
            "password": passcode
        })
        if not auth_response or not auth_response.user:
            return JsonResponse({"error": "Invalid credentials"}, status=401)

        user = auth_response.user

        # Fetch the employee record from Supabase
        employee_response = supabase_anon.table("employee").select("*").eq("user_id", user.id).execute()
        if not employee_response.data:
            return JsonResponse({"error": "Employee record not found"}, status=404)
        employee = employee_response.data[0]

        # Fetch roles assigned to this employee
        role_response = supabase_anon.table("employee_role").select("role_id").eq("employee_id", employee["id"]).execute()
        if not role_response.data:
            return JsonResponse({"error": "User has no roles assigned"}, status=403)

        # Retrieve the Admin role's ID
        admin_role_response = supabase_anon.table("role").select("id").eq("role_name", "Admin").execute()
        if not admin_role_response.data:
            return JsonResponse({"error": "Admin role not found"}, status=500)
        admin_role_id = admin_role_response.data[0]["id"]

        # Check if the employee has the Admin role
        is_admin = any(role["role_id"] == admin_role_id for role in role_response.data)
        if not is_admin:
            return JsonResponse({"error": "Access denied: Only Admins can log in"}, status=403)

        # Extract the Supabase JWT token from the session
        supabase_token = auth_response.session.access_token

        return JsonResponse({"access_token": supabase_token, "is_admin": True})

    except Exception as e:
        print("Error in login_view:", str(e))
        return JsonResponse({"error": "Internal server error"}, status=500)

        
def test_connection(request):
    return JsonResponse({"message": "Backend and frontend are connected successfully!"})


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

        return JsonResponse({
            "statuses": statuses,
            "roles": roles,
            "employees": formatted_employees
        }, safe=False)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

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
            return JsonResponse({"error": "Forbidden. Only Admin users can add employees."}, status=403)

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
                return JsonResponse({"error": "Failed to create user in Supabase Auth"}, status=500)
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
            return JsonResponse({"error": "Failed to create employee"}, status=500)

        # Retrieve the new employee record's primary key (an integer).
        new_employee_pk = response.data[0]["id"]

        # Step 7: If roles are provided, assign them using the employee's primary key.
        if roles:
            role_entries = [{"employee_id": new_employee_pk, "role_id": role} for role in roles]
            supabase_client.table("employee_role").insert(role_entries).execute()

        return JsonResponse({"message": "Employee added successfully"}, status=201)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

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
            return JsonResponse({"error": "Admins cannot delete their own records."}, status=403)

        # Fetch the employee record to be deleted.
        response = supabase_client.table("employee").select("id, user_id").eq("id", employee_id).single().execute()

        if not response.data:
            return JsonResponse({"error": "Employee not found"}, status=404)

        target_employee_user_id = response.data["user_id"]

        # Delete the authentication record from Supabase Auth.
        # This call removes the user's auth details (email, password, etc.).
        supabase_client.auth.admin.delete_user(target_employee_user_id)
        # Optionally, inspect delete_auth_response for any errors.

        # Delete associated roles first.
        supabase_client.table("employee_role").delete().eq("employee_id", employee_id).execute()

        # Delete the employee record.
        supabase_client.table("employee").delete().eq("id", employee_id).execute()

        return JsonResponse({"message": "Employee deleted successfully"}, status=200)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@api_view(['PUT'])
@authentication_classes([SupabaseAuthentication])
@permission_classes([SupabaseIsAdmin])
def edit_employee(request, employee_id):
    try:
        # Step 1: Authenticate user
        auth_data = authenticate_user(request)
        supabase_client = auth_data["client"]
        employee_pk = auth_data["employee_pk"]  # Authenticated employee ID

        # Step 2: Check if the authenticated user is an Admin
        admin_role_check = supabase_client.table("employee_role") \
            .select("role_id") \
            .eq("employee_id", employee_pk) \
            .execute()

        user_roles = admin_role_check.data if admin_role_check.data else []
        role_ids = [role["role_id"] for role in user_roles]

        if not role_ids:
            return JsonResponse({"error": "Unauthorized. No roles assigned."}, status=403)

        # Fetch role names
        role_names_response = supabase_client.table("role") \
            .select("id, role_name") \
            .in_("id", role_ids) \
            .execute()

        role_names = [role["role_name"] for role in role_names_response.data] if role_names_response.data else []

        is_admin = "Admin" in role_names

        # Restrict access: Only Admins can edit
        if not is_admin:
            return JsonResponse({"error": "Forbidden. Only Admins can edit employee records."}, status=403)

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

        supabase_client.table("employee").update(update_data).eq("id", employee_id).execute()

        # Step 5: Update Supabase Auth if email or password is changed
        employee_record = supabase_client.table("employee").select("user_id").eq("id", employee_id).execute()
        if not employee_record.data:
            return JsonResponse({"error": "Employee record not found after update"}, status=404)

        auth_user_id = employee_record.data[0]["user_id"]
        auth_update_data = {}

        if email:
            auth_update_data["email"] = email
        if passcode:
            auth_update_data["password"] = passcode

        if auth_update_data:
            supabase_client.auth.admin.update_user_by_id(auth_user_id, auth_update_data)

        # Step 6: Update employee roles if needed
        new_roles = set(roles)
        existing_roles_response = supabase_client.table("employee_role") \
            .select("role_id") \
            .eq("employee_id", employee_id) \
            .execute()

        existing_roles = {role["role_id"] for role in existing_roles_response.data} if existing_roles_response.data else set()

        if new_roles != existing_roles:
            supabase_client.table("employee_role").delete().eq("employee_id", employee_id).execute()
            role_entries = [{"employee_id": employee_id, "role_id": role_id} for role_id in new_roles]
            if role_entries:
                supabase_client.table("employee_role").insert(role_entries).execute()

        return JsonResponse({"message": "Employee updated successfully", "employee_id": employee_id}, status=200)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    

@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def fetch_attendance_data(request):
    """
    Fetch employees along with:
      - Their own employee status (from employee_status table)
      - Attendance details including:
          • Attendance status (from attendance_status table)
          • Time in and time out (from attendance_time table)
    
    If an employee's attendance record is missing a time in, update that attendance record
    to have an attendance_status of Absent ("A", which is id: 2).
    
    This view is public and intended for admin usage.
    """
    try:
        # Query the employee table including nested employee_status and attendance details.
        response = supabase_anon.table("employee").select(
            "id, first_name, last_name, "
            "employee_status:employee_status(status_name), "
            "attendance:attendance_id(id, attendance_status:attendance_status(status_name), attendance_time:attendance_time(time_in,time_out))"
        ).execute()

        employees = response.data if response.data else []
        attendance_data = []

        for emp in employees:
            # Build full name
            full_name = f"{emp.get('first_name', '')} {emp.get('last_name', '')}".strip()

            # Retrieve employee status (e.g., "Active" or "Inactive")
            emp_status_obj = emp.get("employee_status")
            employee_status = emp_status_obj.get("status_name") if emp_status_obj else "N/A"

            # Process attendance details
            attendance = emp.get("attendance")
            current_attendance_status = "N/A"
            time_in = "-"
            time_out = "-"

            if attendance:
                attendance_id = attendance.get("id")
                time_obj = attendance.get("attendance_time")
                status_obj = attendance.get("attendance_status")

                time_in_val = time_obj.get("time_in") if time_obj else None
                time_out_val = time_obj.get("time_out") if time_obj else None

                # If there's no time in, update the attendance_status to "A" (Absent, id:2)
                if not time_in_val:
                    update_response = supabase_anon.table("attendance").update(
                        {"attendance_status": 2}  # 2 corresponds to "A" in attendance_status table
                    ).eq("id", attendance_id).execute()
                    current_attendance_status = "A"
                else:
                    current_attendance_status = status_obj.get("status_name") if status_obj else "N/A"

                time_in = time_in_val if time_in_val else "-"
                time_out = time_out_val if time_out_val else "-"

            # Build the final response object
            attendance_data.append({
                "id": emp.get("id"),
                "name": full_name,
                "employeeStatus": employee_status,      # e.g., "Active"
                "attendanceStatus": current_attendance_status,  # "P" or "A"
                "timeIn": time_in,
                "timeOut": time_out,
            })

        return JsonResponse(attendance_data, safe=False)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    
@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def verify_attendance(request):
    """
    Verifies an employee's passcode for time in.
    Expects a POST payload with:
      - employee_id: the selected employee's id (from the employee table)
      - passcode: the entered 6-digit passcode

    The employee record contains a user_id used to fetch authentication details.
    The passcode stored in the user's metadata (under "passcode") is compared with the entered passcode.
    If they match, the function updates the corresponding attendance record to record the current UTC time as time_in.
    """
    try:
        employee_id = request.data.get("employee_id")
        entered_passcode = request.data.get("passcode")

        if not employee_id or not entered_passcode:
            return JsonResponse({"error": "Missing required fields."}, status=400)

        # Query the employee record to get the linked user_id and attendance_id.
        employee_response = supabase_service.table("employee") \
            .select("id, user_id, first_name, last_name, attendance_id") \
            .eq("id", employee_id) \
            .single() \
            .execute()

        if not employee_response.data:
            return JsonResponse({"error": "Employee not found."}, status=404)

        employee = employee_response.data
        if not employee.get("user_id"):
            return JsonResponse({"error": "Employee not linked to an auth user."}, status=400)

        # Use the admin client (with service role key) to fetch user details.
        user_response = supabase_service.auth.admin.get_user_by_id(employee["user_id"])
        if not (user_response and user_response.user):
            return JsonResponse({"error": "Unable to fetch user authentication details."}, status=404)

        user = user_response.user

        # Retrieve the stored passcode from the user's metadata.
        # Here we use the same pattern as the snippet provided.
        stored_passcode = None
        if user.user_metadata and isinstance(user.user_metadata, dict):
            stored_passcode = user.user_metadata.get("passcode")
        
        if stored_passcode is None:
            return JsonResponse({"error": "No passcode set for this user."}, status=400)

        if stored_passcode != entered_passcode:
            return JsonResponse({"error": "Invalid passcode."}, status=401)

        # Passcode verified. Now update the attendance record with the current UTC time as time_in.
        attendance_id = employee.get("attendance_id")
        if not attendance_id:
            return JsonResponse({"error": "No attendance record linked to this employee."}, status=400)

        # Retrieve the attendance record to get the linked attendance_time id.
        attendance_record_response = supabase_service.table("attendance") \
            .select("attendance_time") \
            .eq("id", attendance_id) \
            .single() \
            .execute()
        if not attendance_record_response.data:
            return JsonResponse({"error": "Attendance record not found."}, status=404)

        attendance_record = attendance_record_response.data
        attendance_time_id = attendance_record.get("attendance_time")
        if not attendance_time_id:
            return JsonResponse({"error": "Attendance time record not linked."}, status=400)

        # Update the attendance_time record with the current UTC time as time_in.
        current_time = datetime.utcnow().isoformat()
        update_response = supabase_service.table("attendance_time") \
            .update({"time_in": current_time}) \
            .eq("id", attendance_time_id) \
            .execute()

        # Optionally, you can check update_response.data to confirm the update.
        return JsonResponse({
            "success": True,
            "message": "Passcode verified and time_in recorded.",
            "employee": {
                "id": employee.get("id"),
                "name": f"{employee.get('first_name', '')} {employee.get('last_name', '')}".strip()
            }
        })

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)