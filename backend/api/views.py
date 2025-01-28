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

def fetch_data(request):
    try:
        response = supabase.table('api_employee').select('*').execute()
        data = response.data  # Contains the fetched data
        return JsonResponse(data, safe=False)
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
