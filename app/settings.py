from functools import lru_cache
from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Colombus API"
    app_version: str = "0.1.0"

    app_host: str = Field()
    app_port: int = Field()
    ui_host: str = Field()
    ui_port: int = Field()
    environment: Literal["development", "staging", "production"] = "development"

    allowed_origins: list[str] = []

    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 1
    jwt_header_field: str = "x-api-key"
    jwt_secret: str = Field(
        min_length=16,
        description="Used to generate a JWT token.",
    )

    database_url: str = Field()
    ml_profiler_api_url_prefix: str = Field()
    google_client_id: str = Field()
    allowed_google_emails: list[str] = Field(
        default=[],
        description="Allowlist of Google email addresses permitted to log in. Empty means everyone is allowed.",
    )

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @model_validator(mode="after")
    def set_allowed_origins(self) -> "Settings":
        if self.is_production:
            self.allowed_origins = [self.ui_host]
        else:
            self.allowed_origins = ["*"]
        return self


@lru_cache()
def get_settings() -> Settings:
    return Settings()
