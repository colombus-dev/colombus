from functools import lru_cache
from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    app_name: str = "Colombus API"
    app_version: str = "0.1.0"

    app_host: str = "localhost"
    app_port: int = 8000
    ui_host: str = "localhost"
    ui_port: int = 5173
    environment: Literal["development", "staging", "production"] = "development"
    root_path: str = ""

    allowed_origins: list[str] = []

    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 8
    jwt_header_field: str = "x-jwt-token"
    jwt_secret: str = Field(min_length=16)

    db_host: str = Field()
    db_port: int = 5432
    db_username: str = Field()
    db_password: str = Field()
    db_name: str = Field()

    ml_profiler_api_url_prefix: str = Field()
    google_client_id: str = Field()

    allowed_google_emails: str = Field()

    kaggle_username: str | None = None
    kaggle_key: str | None = None

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+psycopg://{self.db_username}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )

    @property
    def allowed_google_emails_list(self) -> list[str]:
        return [e.strip() for e in self.allowed_google_emails.split(",") if e.strip()]

    def is_environment_production(self) -> bool:
        return self.environment == "production"

    @property
    def is_kaggle_token_set(self) -> bool:
        return bool(self.kaggle_username and self.kaggle_key)

    @model_validator(mode="after")
    def set_allowed_origins(self) -> "Settings":
        if self.is_environment_production():
            self.allowed_origins = [self.ui_host]
        else:
            self.allowed_origins = ["*"]
        return self


@lru_cache()
def get_settings() -> Settings:
    return Settings()
