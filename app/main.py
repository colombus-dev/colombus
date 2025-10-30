from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.exceptions import InvalidApiKeyException
from app.models.sql_model import create_db_and_tables

from app.constants import notebooks_storage_path, API_KEY

from app.routers import (
    project_router,
    profile_router,
    pattern_router,
    statistics_router,
    utils_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    notebooks_storage_path.mkdir(parents=True, exist_ok=True)
    create_db_and_tables()
    yield
    # TODO: close database session?


app = FastAPI(lifespan=lifespan)

origins = [
    "http://localhost",
    "http://localhost:5173",
    "http://erebe-vm9.i3s.unice.fr",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# TODO: add security dependency
app.include_router(project_router.router, tags=["project"])
app.include_router(profile_router.router, tags=["profile"])
app.include_router(pattern_router.router, tags=["pattern"])
app.include_router(statistics_router.router, tags=["statistics"])
app.include_router(utils_router.router, tags=["utils"])


class CheckApiKeyPayload(BaseModel):
    api_key: str


@app.post("/api/key")
async def check_api_key(
    payload: CheckApiKeyPayload,
) -> str:
    # TODO: replace with fastapi security
    if payload.api_key != API_KEY:
        raise InvalidApiKeyException()
    return "ok"


@app.get(
    "/health",
    tags=["healthcheck"],
    summary="Perform a Health Check",
    response_description="Return HTTP Status Code 200 (ok)",
    status_code=status.HTTP_200_OK,
)
def get_health():
    return "ok"
