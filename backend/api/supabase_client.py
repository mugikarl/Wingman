import os
from supabase import create_client, Client

# Load environment variables
url: str = os.environ.get("SUPABASE_URL")
service_key: str = os.environ.get("SUPABASE_SERVICE_KEY")
anon_key: str = os.environ.get("SUPABASE_ANON_KEY")
jwt_secret: str = os.environ.get("SUPABASE_JWT_SECRET")

if not url or not service_key or not anon_key or not jwt_secret:
    raise ValueError("SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY, and SUPABASE_JWT_SECRET must be set in environment variables.")

# Create two Supabase clients:
supabase_service: Client = create_client(url, service_key)
supabase_anon: Client = create_client(url, anon_key)

# Function to validate JWT using the provided jwt_secret.
def validate_jwt(token: str) -> bool:
    import jwt
    try:
        decoded = jwt.decode(token, jwt_secret, algorithms=["HS256"])
        return True
    except jwt.ExpiredSignatureError:
        print("JWT expired")
    except jwt.InvalidTokenError:
        print("Invalid JWT")
    return False
