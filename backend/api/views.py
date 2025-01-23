from django.shortcuts import render
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.http import JsonResponse
from .serializers import *
from .models import *
from .supabase_client import supabase

def fetch_data(request):
    try:
        response = supabase.table('api_employee').select('*').execute()
        data = response.data  # Contains the fetched data
        return JsonResponse(data, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    
class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']
            user = authenticate(request, username=username, password=password)
            if user is not None:
                # Query Supabase for the Employee record
                employee_data = supabase.table("api_employee").select("*").eq("username", username).execute()
                if employee_data.data:
                    employee = employee_data.data[0]
                    # Query Supabase for the EmployeeRole records using the join table
                    role_data = supabase.table("api_employee_role").select(
                        "api_employeerole (role_name)"
                    ).eq("employee_id", employee["id"]).execute()
                    roles = [role["api_employeerole"]["role_name"] for role in role_data.data]
                    # Check if the user has the admin role
                    if "admin" in roles:
                        login(request, user)
                        return Response({"message": "Login successful"}, status=status.HTTP_200_OK)
                    else:
                        return Response({"error": "You do not have admin privileges"}, status=status.HTTP_403_FORBIDDEN)
                else:
                    return Response({"error": "Employee not found"}, status=status.HTTP_404_NOT_FOUND)
            else:
                return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# class DashboardView(APIView):
#     def get(self, request):
#         # Return data for the dashboard (e.g., list of employees)
#         employees = Employee.objects.all()
#         serializer = EmployeeSerializer(employees, many=True)
#         return Response(serializer.data)
