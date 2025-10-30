from typing import Annotated

from fastapi import Depends
from sqlmodel import Session

from app.auth import get_api_key
from app.models.sql_model import engine


def get_session():
    with Session(engine) as session:
        yield session


DatabaseSession = Annotated[Session, Depends(get_session)]
APIKeyDeps = Depends(get_api_key)
