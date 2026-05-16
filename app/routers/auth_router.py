from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Security
from fastapi.security import APIKeyHeader
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from jose import JWTError, jwt
from pydantic import BaseModel

from app.constants import GOOGLE_CLIENT_ID, HEADER_FIELD_X_API_KEY, JWT_SECRET
from app.exceptions import InvalidTokenException

JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 1

router = APIRouter(prefix="/api/auth", tags=["auth"])

api_key_header = APIKeyHeader(name=HEADER_FIELD_X_API_KEY)


class GoogleAuthRequest(BaseModel):
    credential: str


@router.post("/google")
def auth_google(body: GoogleAuthRequest):
    try:
        info = id_token.verify_oauth2_token(
            body.credential,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
        )
    except ValueError:
        raise InvalidTokenException(name="Google")

    token = jwt.encode(
        {
            "sub": info["email"],
            "email": info["email"],
            "name": info.get("name", ""),
            "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS),
        },
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )
    return {"api_key": token}


def check_api_key(api_key_header_value: str = Security(api_key_header)) -> dict:
    try:
        payload = jwt.decode(
            api_key_header_value, JWT_SECRET, algorithms=[JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        raise InvalidTokenException(name="Api")
