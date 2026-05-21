from typing import Annotated

from fastapi import Depends
from sqlmodel import Session

from app.models.sql_model import engine
from app.routers.auth_router import check_api_key


def get_session():
    with Session(engine) as session:
        yield session


DatabaseSession = Annotated[Session, Depends(get_session)]
APIKeyDeps = Depends(check_api_key)
