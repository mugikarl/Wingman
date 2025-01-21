from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import generics
from .serializers import UserSerialzer
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.http import JsonResponse
from .supabase_client import supabase

def fetch_data(request):
    try:
        response = supabase.table('api_employee').select('*').execute()
        data = response.data  # Contains the fetched data
        return JsonResponse(data, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    
# Create your views here.
# class CreateUserView(generics.CreateAPIView):
#     queryset = User.objects.all()
#     serializer_class = UserSerialzer
#     permission_classes = [AllowAny]