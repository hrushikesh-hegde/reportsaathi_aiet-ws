from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ReportSaathi"
    debug: bool = False
    frontend_url: str = "http://localhost:5173"
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-3.8-flash"
    gemini_timeout_seconds: int = 45
    rate_limit_per_minute: int = 20

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
