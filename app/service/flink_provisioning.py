from sqlalchemy import Engine, text

from app.settings import get_settings

settings = get_settings()


def ensure_flink_reader(engine: Engine) -> None:
    if settings.flink_db_username is None or settings.flink_db_password is None:
        return

    with engine.begin() as connection:
        connection.execute(
            text(f"""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT FROM pg_roles WHERE rolname = '{settings.flink_db_username}'
                    ) THEN
                        CREATE ROLE {settings.flink_db_username} LOGIN PASSWORD :password;
                    ELSE
                        ALTER ROLE {settings.flink_db_username} WITH PASSWORD :password;
                    END IF;
                END
                $$;
            """).bindparams(password=settings.flink_db_password)
        )
        connection.execute(
            text(
                f"GRANT CONNECT ON DATABASE {settings.db_name} TO {settings.flink_db_username}"
            )
        )
        connection.execute(
            text(f"GRANT USAGE ON SCHEMA public TO {settings.flink_db_username}")
        )
        connection.execute(
            text(f"GRANT SELECT ON step TO {settings.flink_db_username}")
        )
        connection.execute(
            text(f"GRANT SELECT ON metainstruction TO {settings.flink_db_username}")
        )
