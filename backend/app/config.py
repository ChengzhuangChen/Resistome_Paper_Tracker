import os
from datetime import date
from pathlib import Path
from pydantic_settings import BaseSettings

ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"

class Settings(BaseSettings):
    # DeepSeek
    deepseek_api_key: str
    deepseek_base_url: str = "https://api.deepseek.com/v1"
    deepseek_model: str = "deepseek-chat"

    # NCBI
    ncbi_email: str
    ncbi_api_key: str | None = None

    # SMTP (optional)
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_user: str | None = None
    smtp_password: str | None = None
    smtp_from: str | None = None
    notify_email_list: str | None = None  # comma-separated

    # App
    app_secret_token: str
    database_url: str = "sqlite:///./data/arg_tracker.db"
    fetch_start_date: date = date(2024, 1, 1)
    fetch_days: int = 7
    max_papers_per_batch: int = 50
    llm_max_concurrent: int = 5
    llm_retry_attempts: int = 5
    llm_base_delay: float = 3.0  # seconds, base backoff for 429
    llm_batch_interval: float = 1.5  # seconds between batches

    class Config:
        env_file = str(ENV_PATH) if ENV_PATH.exists() else None
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
