# import jwt
# import requests
# from django.http import JsonResponse
# from django.utils.deprecation import MiddlewareMixin
# from .supabase_client import jwt_secret, supabase_anon, supabase_service, url  # Import JWT secret, client, and URL

# class SupabaseAuthMiddleware(MiddlewareMixin):
#     def process_request(self, request):
#         # List of paths that don't require authentication
#         public_paths = [
#             "/api/login/",
#             "/api/test/",
#             # Add other public endpoints here if needed
#         ]
        
#         # Skip authentication for public endpoints
#         if any(request.path.startswith(path) for path in public_paths):
#             return None

#         # Otherwise, process the token
#         auth_header = request.headers.get("Authorization")
        
#         if not auth_header or not auth_header.startswith("Bearer "):
#             print("No valid Authorization header found")
#             return JsonResponse({"error": "Unauthorized"}, status=401)

#         token = auth_header.split(" ")[1]

#         # Validate JWT using the secret
#         try:
#             decoded_token = jwt.decode(token, jwt_secret, algorithms=["HS256"])
#             print("Decoded Token:", decoded_token)
#         except jwt.ExpiredSignatureError:
#             return JsonResponse({"error": "Token expired"}, status=401)
#         except jwt.InvalidTokenError:
#             return JsonResponse({"error": "Invalid token"}, status=401)

#         # Fetch user details from Supabase if needed
#         headers = {"Authorization": f"Bearer {token}", "apikey": jwt_secret}
#         response = requests.get(f"{url}/auth/v1/user", headers=headers)
#         print("Supabase response status code:", response.status_code)
#         if response.status_code != 200:
#             return JsonResponse({"error": "Invalid token"}, status=401)

#         user_data = response.json()
#         print("User data received from Supabase:", user_data)
#         request.user = user_data  # Attach user data to request

#         return None
