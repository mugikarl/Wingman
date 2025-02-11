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

def is_valid_supabase_token(token: str) -> bool:
    """Verify Supabase JWT using Supabase authentication API."""
    try:
        response = supabase_service.auth.get_user(token)
        return response.user is not None  # If user exists, token is valid
    except Exception:
        return False