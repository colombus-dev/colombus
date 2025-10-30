from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware

from app.constants import SECURITY_API_KEY_HEADER, notebooks_storage_path, origins
from app.dependencies import APIKeyDeps
from app.models.sql_model import create_db_and_tables

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


app = FastAPI(
    title="Colombus API",
    description="API for the Colombus exploration platform",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=[SECURITY_API_KEY_HEADER],
)
# TODO: add security dependency
app.include_router(project_router.router, tags=["project"], dependencies=[APIKeyDeps])
app.include_router(profile_router.router, tags=["profile"], dependencies=[APIKeyDeps])
app.include_router(pattern_router.router, tags=["pattern"], dependencies=[APIKeyDeps])
app.include_router(
    statistics_router.router, tags=["statistics"], dependencies=[APIKeyDeps]
)
app.include_router(utils_router.router, tags=["utils"], dependencies=[APIKeyDeps])


@app.post(
    "/api/key",
    tags=["auth"],
    summary="Convenient endpoint for checking the API key validity",
    response_description="Return HTTP Status Code 200 (ok)",
    status_code=status.HTTP_200_OK,
    dependencies=[APIKeyDeps],
)
async def check_api_key() -> str:
    # the API key validation is done using the APIKeyDeps dependency
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
