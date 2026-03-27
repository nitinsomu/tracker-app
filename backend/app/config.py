from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    GMAIL_ADDRESS: str = ""
    GMAIL_APP_PASSWORD: str = ""
    REMINDER_EMAIL: str = ""
    REMINDER_HOUR: int = 21  # 9 PM local time

    class Config:
        env_file = ".env"


settings = Settings()
