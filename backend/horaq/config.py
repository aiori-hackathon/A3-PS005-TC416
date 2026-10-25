"""Configuration settings for HORA-Q.

All settings read from environment variables with safe defaults.
Provenances and operational settings are kept explicit and validated.
"""

import os
from typing import List


class Settings:
    def __init__(self) -> None:
        self.database_path: str = os.getenv("HORAQ_DATABASE", "horaq.db")
        self.live_collector_enabled: bool = (
            os.getenv("HORAQ_LIVE_COLLECTOR", "false").lower() in ("true", "1", "yes")
        )
        self.ris_url: str = os.getenv(
            "HORAQ_RIS_URL", "wss://ris-live.ripe.net/v1/ws/?client=horaq-tc416"
        )
        try:
            self.rpki_timeout: float = float(os.getenv("HORAQ_RPKI_TIMEOUT", "5.0"))
        except ValueError:
            self.rpki_timeout = 5.0

        self.demo_mode: bool = os.getenv("HORAQ_DEMO_MODE", "false").lower() in ("true", "1", "yes")
        self.admin_token: str = os.getenv("HORAQ_ADMIN_TOKEN", "")

        cors_env = os.getenv("HORAQ_CORS_ORIGINS", "")
        if cors_env.strip():
            self.cors_origins: List[str] = [orig.strip() for orig in cors_env.split(",") if orig.strip()]
        else:
            self.cors_origins = [
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "*",
            ]

    def get_dict(self) -> dict:
        return {
            "database_path": self.database_path,
            "live_collector_enabled": self.live_collector_enabled,
            "ris_url": self.ris_url,
            "rpki_timeout": self.rpki_timeout,
            "demo_mode": self.demo_mode,
            "cors_origins": self.cors_origins,
        }



settings = Settings()
