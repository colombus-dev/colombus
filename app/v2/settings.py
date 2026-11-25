import functools

import pydantic_settings


class Settings(pydantic_settings.BaseSettings):
    model_config = pydantic_settings.SettingsConfigDict(env_file=".env", extra="ignore")

    db_url_v2: str


@functools.lru_cache
def get_settings() -> Settings:
    return Settings()  # pyright: ignore[reportCallIssue]
