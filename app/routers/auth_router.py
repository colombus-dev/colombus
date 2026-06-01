from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Security
from fastapi.security import APIKeyHeader
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from jose import JWTError, jwt
from pydantic import BaseModel

from app.exceptions import AuthException
from app.settings import get_settings

router = APIRouter(prefix="/api/auth", tags=["auth"])
settings = get_settings()


class AuthConfig(BaseModel):
    google_client_id: str


@router.get("/config")
def get_auth_config() -> AuthConfig:
    return AuthConfig(google_client_id=settings.google_client_id)


class GoogleAuthRequest(BaseModel):
    credential: str


@router.post("/google")
def auth_google(body: GoogleAuthRequest):
    try:
        info = id_token.verify_oauth2_token(
            body.credential,
            google_requests.Request(),
            settings.google_client_id,
        )
    except ValueError:
        raise AuthException(name="Google")

    if info["email"] not in settings.allowed_google_emails_list:
        raise AuthException(name="Google")

    token = jwt.encode(
        {
            "sub": info["email"],
            "email": info["email"],
            "name": info.get("name", ""),
            "exp": datetime.now(timezone.utc)
            + timedelta(hours=settings.jwt_expire_hours),
        },
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )
    return {"api_key": token}


api_key_header = APIKeyHeader(name=settings.jwt_header_field)


def check_api_key(api_key_header_value: str = Security(api_key_header)) -> dict:
    try:
        payload = jwt.decode(
            api_key_header_value,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
        return payload
    except JWTError:
        raise AuthException(name="Api")
