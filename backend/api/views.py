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
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.http import JsonResponse
from .serializers import *
from .models import *
from .supabase_client import supabase
from django.views.decorators.csrf import csrf_exempt
import json

# def fetch_data(request):
#     try:
#         response = supabase.table('api_employee').select('*').execute()
#         data = response.data  # Contains the fetched data
#         return JsonResponse(data, safe=False)
#     except Exception as e:
#         return JsonResponse({'error': str(e)}, status=500)

def fetch_data(request):
    try:
        # Fetch statuses
        status_response = supabase.table("employee_status").select("id, status_name").execute()
        statuses = status_response.data if status_response.data else []
        
        # Fetch roles
        roles_response = supabase.table("role").select("id, role_name").execute()
        roles = roles_response.data if roles_response.data else []
        
        # Fetch employees with roles
        response = supabase.table("employee").select(
        "*, employee_role(role_id, role(id, role_name)), employee_status!employee_status_id_fkey(id, status_name)").execute()
        employees = response.data if response.data else []
        
        # Restructure the employee response for better readability
        formatted_employees = []
        for employee in employees:
            employee_roles = [
                {
                    "id": role_data["role"]["id"],
                    "role_name": role_data["role"]["role_name"]
                }
                for role_data in employee.get("employee_role", [])
                if "role" in role_data
            ]
            formatted_employees.append({
                "id": employee["id"],
                "first_name": employee["first_name"],
                "last_name": employee["last_name"],
                # "email": employee["email"],
                # "username": employee["username"],
                "contact": employee["contact"],
                "base_salary": employee["base_salary"],
                "roles": employee_roles,  # List of role names
                "status": employee.get("status_id")
            })
        
        return JsonResponse({
            "statuses": statuses,
            "roles": roles,
            "employees": formatted_employees
        }, safe=False)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def login_view(request):
    try:
        data = json.loads(request.body.decode("utf-8"))
        email = data.get("email")
        passcode = data.get("passcode")

        # Validate input
        if not email or not passcode:
            return JsonResponse({"error": "Both email and passcode are required"}, status=400)

        # Step 1: Sign in using Supabase Auth with the new method name.
        auth_response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": passcode
        })

        # Check if the sign-in was successful.
        if not auth_response or not auth_response.user:
            return JsonResponse({"error": "Invalid credentials"}, status=401)
        user = auth_response.user
        user_id = user.id

        # Step 2: Fetch the employee record using the user_id from Supabase Auth.
        employee_response = supabase.table("employee")\
            .select("*")\
            .eq("user_id", user_id)\
            .execute()
        if not employee_response.data:
            return JsonResponse({"error": "Employee record not found"}, status=404)
        employee = employee_response.data[0]

        # Step 3: Fetch the employee's assigned roles.
        role_response = supabase.table("employee_role")\
            .select("role_id")\
            .eq("employee_id", employee["id"])\
            .execute()
        if not role_response.data:
            return JsonResponse({"error": "User has no roles assigned"}, status=403)

        # Step 4: Retrieve the Admin role's ID from the roles table.
        admin_role_response = supabase.table("role")\
            .select("id")\
            .eq("role_name", "Admin")\
            .execute()
        if not admin_role_response.data:
            return JsonResponse({"error": "Admin role not found"}, status=500)
        admin_role_id = admin_role_response.data[0]["id"]

        # Step 5: Ensure the employee has the Admin role.
        is_admin = any(role["role_id"] == admin_role_id for role in role_response.data)
        if not is_admin:
            return JsonResponse({"error": "Only admin users can log in"}, status=403)

        # Step 6: Retrieve tokens from the auth_response attributes.
        access_token = getattr(auth_response, "access_token", "your_access_token")
        refresh_token = getattr(auth_response, "refresh_token", "your_refresh_token")

        return JsonResponse({
            "message": "Login successful",
            "admin_id": employee["id"],
            "access_token": access_token,
            "refresh_token": refresh_token
        })

    except Exception as e:
        return JsonResponse({"error": f"Something went wrong: {str(e)}"}, status=500)
        
def test_connection(request):
    return JsonResponse({"message": "Backend and frontend are connected successfully!"})


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def add_employee(request):
    try:
        data = json.loads(request.body.decode("utf-8"))

        # Extract user details
        first_name = data.get("first_name")
        last_name = data.get("last_name")
        middle_initial = data.get("middle_initial", "")
        email = data.get("email")
        contact = data.get("contact")
        base_salary = data.get("base_salary")
        passcode = data.get("passcode")  # Password for authentication
        roles = data.get("roles", [])    # List of role IDs

        # Step 1: Check if a user with this email already exists
        existing_users_response = supabase.auth.admin.list_users()  # Returns a list of User objects
        user = None
        for user_data in existing_users_response:
            if user_data.email == email:
                user = user_data
                break

        # If user exists, reuse the user_id; otherwise, create a new user
        if user:
            user_id = user.id  # Use the existing user's id
        else:
            auth_response = supabase.auth.admin.create_user({
                "email": email,
                "password": passcode,
                "email_confirm": True  # Auto-confirm email
            })
            print("auth_response:", auth_response)
            if not auth_response or not hasattr(auth_response, 'user'):
                return JsonResponse({"error": "Failed to create user in Supabase Auth"}, status=500)
            user_id = auth_response.user.id

        # Step 2: Insert employee record linked to the Auth User
        insert_data = {
            "first_name": first_name,
            "last_name": last_name,
            "middle_initial": middle_initial,
            "contact": contact,
            "base_salary": base_salary,
            "user_id": user_id,    # Link to Supabase Auth User
            "status_id": 1         # Automatically assign Active status
        }
        response = supabase.table("employee").insert(insert_data).execute()
        if not response.data:
            return JsonResponse({"error": "Failed to create employee"}, status=500)

        employee_id = response.data[0]["id"]

        # Step 3: Assign roles (if any)
        if roles:
            role_entries = [{"employee_id": employee_id, "role_id": role} for role in roles]
            supabase.table("employee_role").insert(role_entries).execute()

        return JsonResponse({"message": "Employee added successfully"}, status=201)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@api_view(['DELETE'])
@authentication_classes([])
@permission_classes([AllowAny])
def delete_employee(request, employee_id):
    try:
        response = supabase.table("employee").select("id").eq("id", employee_id).execute()
        
        if not response.data:
            return JsonResponse({"error": "Employee not found"}, status=404)
            
        # Delete associated roles first
        supabase.table("employee_role").delete().eq("employee_id", employee_id).execute()
        
        # Delete employee record
        supabase.table("employee").delete().eq("id", employee_id).execute()
        
        return JsonResponse({"message": "Employee deleted successfully"}, status=200)
    
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@api_view(['PUT'])
@authentication_classes([])
@permission_classes([AllowAny])
def edit_employee(request, employee_id):
    try:
        data = json.loads(request.body.decode("utf-8"))
        
        # Extract employee details from the request
        first_name = data.get("first_name")
        last_name = data.get("last_name")
        middle_initial = data.get("middle_initial", "")
        email = data.get("email")
        contact = data.get("contact")
        base_salary = data.get("base_salary")
        passcode = data.get("passcode")  # Plain text passcode provided in the request
        roles = data.get("roles", [])     # List of role IDs
        status_id = data.get("status_id")
        
        # Build the update payload for the employee table.
        # Note: We no longer update the passcode in the employee table,
        # because authentication is managed by Supabase Auth.
        update_data = {
            "first_name": first_name,
            "last_name": last_name,
            "middle_initial": middle_initial,
            "contact": contact,
            "base_salary": base_salary,
            "status_id": status_id,
        }
        
        # Update the employee record in the "employee" table.
        supabase.table("employee").update(update_data).eq("id", employee_id).execute()
        
        # Retrieve the corresponding Supabase Auth user ID from the employee record.
        employee_record = supabase.table("employee").select("user_id").eq("id", employee_id).execute()
        if not employee_record.data:
            return JsonResponse({"error": "Employee record not found after update"}, status=404)
        auth_user_id = employee_record.data[0]["user_id"]
        
        # Prepare update payload for Supabase Auth.
        # Pass the plain text password (if updating) to the auth update,
        # as Supabase handles the hashing.
        auth_update_data = {}
        if email:
            auth_update_data["email"] = email
        if passcode:
            auth_update_data["password"] = passcode
        
        # Update the Supabase Auth user details if needed.
        if auth_update_data:
            auth_update_response = supabase.auth.admin.update_user_by_id(auth_user_id, auth_update_data)
            # Optionally, you can check auth_update_response for errors.
        
        # ----- Update Roles in the employee_roles table -----
        # new_roles: the set of role IDs provided in the request.
        new_roles = set(roles)
        # Fetch current roles for the employee.
        existing_roles_response = supabase.table("employee_role")\
            .select("role_id")\
            .eq("employee_id", employee_id)\
            .execute()
        existing_roles = {role["role_id"] for role in existing_roles_response.data} if existing_roles_response.data else set()
        
        # If the new roles differ from the existing ones, update them.
        if new_roles != existing_roles:
            # Delete current role associations.
            supabase.table("employee_role").delete().eq("employee_id", employee_id).execute()
            # Insert new role associations if provided.
            role_entries = [{"employee_id": employee_id, "role_id": role_id} for role_id in new_roles]
            if role_entries:
                supabase.table("employee_role").insert(role_entries).execute()
        
        return JsonResponse({"message": "Employee updated successfully", "employee_id": employee_id}, status=200)
    
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)