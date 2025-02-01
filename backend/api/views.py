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
        response = supabase.table("api_employee").select("*, api_employee_role(employeerole_id, api_employeerole(role_name))").execute()
        employees = response.data  # Contains employees with nested role data

        # Restructure the response for better readability
        formatted_employees = []
        for employee in employees:
            roles = [
                role_data["api_employeerole"]["role_name"]
                for role_data in employee.get("api_employee_role", [])
                if "api_employeerole" in role_data
            ]
            formatted_employees.append({
                "id": employee["id"],
                "first_name": employee["first_name"],
                "last_name": employee["last_name"],
                "email": employee["email"],
                "username": employee["username"],
                "contact": employee["contact"],
                "base_salary": employee["base_salary"],
                "roles": roles  # List of role names
            })

        return JsonResponse(formatted_employees, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# def csrf_view(request):
#     return JsonResponse({"csrfToken": get_token(request)})

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def login_view(request):
    if request.method == "POST":
        data = json.loads(request.body.decode("utf-8"))
        username = data.get("username")
        passcode = data.get("passcode")

        try:
            # Fetch employee data
            employee_response = supabase.table("api_employee").select("*").eq("username", username).execute()
            if not employee_response.data:
                return JsonResponse({"error": "User does not exist"}, status=404)

            employee = employee_response.data[0]

            # Verify the hashed passcode
            if not check_password(passcode, employee["passcode"]):
                return JsonResponse({"error": "Invalid credentials"}, status=401)

            # Fetch the employee's role
            employee_id = employee["id"]
            role_response = supabase.table("api_employee_role").select("employeerole_id").eq("employee_id", employee_id).execute()
            
            if not role_response.data:
                return JsonResponse({"error": "User has no roles assigned"}, status=403)

            # Check if the user has the "admin" role
            admin_role_id = supabase.table("api_employeerole").select("id").eq("role_name", "Admin").execute()
            if not admin_role_id.data:
                return JsonResponse({"error": "Admin role not found"}, status=500)

            admin_role_id = admin_role_id.data[0]["id"]
            is_admin = any(role["employeerole_id"] == admin_role_id for role in role_response.data)

            if not is_admin:
                return JsonResponse({"error": "Only admin users can log in"}, status=403)

            # Return the employee ID in the response
            return JsonResponse({
                "message": "Login successful",
                "admin_id": employee_id,  # Include the employee ID here
                "access_token": "your_access_token",  # Replace with actual token
                "refresh_token": "your_refresh_token"  # Replace with actual token
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
        
        # Extract employee details
        first_name = data.get("first_name")
        last_name = data.get("last_name")
        middle_initial = data.get("middle_initial", "")
        username = data.get("username")
        email = data.get("email")
        contact = data.get("contact")
        base_salary = data.get("base_salary")
        passcode = data.get("passcode")
        roles = data.get("roles", [])  # List of role IDs

        # Hash the password before storing
        hashed_password = make_password(passcode)

        # Insert employee record
        response = supabase.table("api_employee").insert({
            "first_name": first_name,
            "last_name": last_name,
            "middle_initial": middle_initial,
            "username": username,
            "email": email,
            "contact": contact,
            "base_salary": base_salary,
            "passcode": hashed_password,
        }).execute()

        if not response.data:
            return JsonResponse({"error": "Failed to create employee"}, status=500)

        employee_id = response.data[0]["id"]

        # Assign roles
        role_entries = [{"employee_id": employee_id, "employeerole_id": role_id} for role_id in roles]
        if role_entries:
            supabase.table("api_employee_role").insert(role_entries).execute()

        return JsonResponse({"message": "Employee added successfully", "employee_id": employee_id}, status=201)
    
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


def get_roles(request, employee_id=None):
    if request.method == "GET":
        try:
            if employee_id:
                # Fetch roles assigned to the employee
                role_response = supabase.table("api_employee_role").select("employeerole_id").eq("employee_id", employee_id).execute()

                if not role_response.data:
                    return JsonResponse({"error": "No roles assigned to the employee"}, status=404)

                # Get the role names based on role ids
                roles = []
                for role in role_response.data:
                    role_name_response = supabase.table("api_employeerole").select("role_name").eq("id", role["employeerole_id"]).execute()

                    if role_name_response.data:
                        roles.append(role_name_response.data[0]["role_name"])

                return JsonResponse({"roles": roles}, safe=False)
            else:
                # Fetch all available roles
                roles_response = supabase.table("api_employeerole").select("id, role_name").execute()
                return JsonResponse(roles_response.data, safe=False)

        except Exception as e:
            return JsonResponse({"error": f"Something went wrong: {str(e)}"}, status=500)


def get_statuses(request, employee_id=None):
    if request.method == "GET":
        try:
            if employee_id:
                # Fetch status assigned to the employee
                status_response = supabase.table("api_employee").select("status").eq("id", employee_id).execute()

                if not status_response.data:
                    return JsonResponse({"error": "No status found for the employee"}, status=404)

                # Get the status name from api_employeestatus
                status_id = status_response.data[0]["status"]
                status_name_response = supabase.table("api_employeestatus").select("status_name").eq("id", status_id).execute()

                if not status_name_response.data:
                    return JsonResponse({"error": "Status name not found"}, status=404)

                return JsonResponse({"status": status_name_response.data[0]["status_name"]})

            else:
                # Fetch all available statuses
                statuses_response = supabase.table("api_employeestatus").select("id, status_name").execute()
                return JsonResponse(statuses_response.data, safe=False)

        except Exception as e:
            return JsonResponse({"error": f"Something went wrong: {str(e)}"}, status=500)


@api_view(['PUT'])
@authentication_classes([])
@permission_classes([AllowAny])
def edit_employee(request, employee_id):
    try:
        data = json.loads(request.body.decode("utf-8"))

        # Extract updated employee details
        update_data = {
            "first_name": data.get("first_name"),
            "last_name": data.get("last_name"),
            "middle_initial": data.get("middle_initial", ""),
            "username": data.get("username"),
            "email": data.get("email"),
            "contact": data.get("contact"),
            "base_salary": data.get("base_salary"),
            "status": data.get("status")
        }

        # Update password if provided
        if "passcode" in data and data["passcode"]:
            update_data["passcode"] = make_password(data["passcode"])

        # Update employee details
        supabase.table("api_employee").update(update_data).eq("id", employee_id).execute()

        # Update roles if changed
        new_roles = set(data.get("roles", []))
        existing_roles_response = supabase.table("api_employee_role").select("employeerole_id").eq("employee_id", employee_id).execute()
        existing_roles = {role["employeerole_id"] for role in existing_roles_response.data} if existing_roles_response.data else set()

        if new_roles != existing_roles:
            supabase.table("api_employee_role").delete().eq("employee_id", employee_id).execute()
            role_entries = [{"employee_id": employee_id, "employeerole_id": role_id} for role_id in new_roles]
            if role_entries:
                supabase.table("api_employee_role").insert(role_entries).execute()

        return JsonResponse({"message": "Employee updated successfully", "employee_id": employee_id}, status=200)
    
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
