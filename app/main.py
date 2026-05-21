from contextlib import asynccontextmanager

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware

from app.constants import notebooks_storage_path
from app.dependencies import APIKeyDeps
from app.models.sql_model import create_db_and_tables
from app.routers import (
    auth_router,
    pattern_router,
    profile_router,
    project_router,
    statistics_router,
    utils_router,
)
from app.settings import get_settings

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    notebooks_storage_path.mkdir(parents=True, exist_ok=True)
    create_db_and_tables()
    yield
    # TODO: close database session?


def create_app() -> FastAPI:
    application = FastAPI(
        title=settings.app_name,
        description="API for the Colombus exploration platform",
        version=settings.app_version,
        lifespan=lifespan,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "DELETE"],
        allow_headers=[settings.jwt_header_field],
    )
    # TODO: add security dependency
    application.include_router(auth_router.router)
    application.include_router(
        project_router.router, tags=["project"], dependencies=[APIKeyDeps]
    )
    application.include_router(
        profile_router.router, tags=["profile"], dependencies=[APIKeyDeps]
    )
    application.include_router(
        pattern_router.router, tags=["pattern"], dependencies=[APIKeyDeps]
    )
    application.include_router(
        statistics_router.router, tags=["statistics"], dependencies=[APIKeyDeps]
    )
    application.include_router(
        utils_router.router, tags=["utils"], dependencies=[APIKeyDeps]
    )
    return application


app = create_app()


@app.get(
    "/health",
    tags=["healthcheck"],
    summary="Perform a Health Check",
    response_description="Return HTTP Status Code 200 (ok)",
    status_code=status.HTTP_200_OK,
)
def get_health():
    return "ok"
