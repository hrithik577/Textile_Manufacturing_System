from typing import List, Union
from pydantic import AnyHttpUrl, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Everest Textile OS"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # JWT & Security
    SECRET_KEY: str = "everest_textile_secret_key_change_in_production_2026_super_secure"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database
    DATABASE_URL: str = "sqlite:///./everest_textile.db"

    # CORS Origins
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8080",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Demo Seeding & Administrative Bootstrap
    ALLOW_DEMO_SEED: bool = False
    ADMIN_BOOTSTRAP_EMAIL: str = "admin@everesttextiles.com"
    ADMIN_BOOTSTRAP_PASSWORD: str = ""

    # Simulator Shared Secret for integrations
    SIMULATOR_SHARED_SECRET: str = "simulator-dev-secret-key-2026"

    # Gemini AI — YarnIQ Procurement Copilot
    GEMINI_API_KEY: str = ""

    @model_validator(mode="after")
    def validate_production_configuration(self):
        is_prod = self.ENVIRONMENT.lower() in ("production", "prod")
        if is_prod:
            if self.DEBUG:
                raise ValueError("Security Violation: DEBUG mode must be False in production.")
            if self.ALLOW_DEMO_SEED:
                raise ValueError("Security Violation: ALLOW_DEMO_SEED must not be enabled in production environments.")
            if not self.SECRET_KEY or self.SECRET_KEY == "everest_textile_secret_key_change_in_production_2026_super_secure" or len(self.SECRET_KEY) < 32:
                raise ValueError("Security Violation: SECRET_KEY must be a non-default, strong key with at least 32 characters in production.")
            if not self.SIMULATOR_SHARED_SECRET or self.SIMULATOR_SHARED_SECRET == "simulator-dev-secret-key-2026" or len(self.SIMULATOR_SHARED_SECRET) < 16:
                raise ValueError("Security Violation: SIMULATOR_SHARED_SECRET must be an explicit, strong secret with at least 16 characters in production.")
            if "sqlite" in self.DATABASE_URL.lower():
                raise ValueError("Security Violation: SQLite is not supported in production. Configure a production PostgreSQL DATABASE_URL.")
            if "*" in self.BACKEND_CORS_ORIGINS:
                raise ValueError("Security Violation: Wildcard '*' CORS origin is not permitted in production.")
        return self

    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow",
    )


settings = Settings()
