import json

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://postgres:postgres@db:5432/widgets"

    # Читается из env CORS_ORIGINS. Держим как СТРОКУ (не list!) — иначе
    # pydantic-settings пытается распарсить значение как JSON ещё при чтении
    # окружения, и "*" падает с JSONDecodeError, уводя контейнер в
    # рестарт-петлю. Разбираем строку сами в cors_origin_list. Принимаем:
    #   *                                   → ["*"]
    #   https://a.com,https://b.com         → список через запятую
    #   ["https://a.com","https://b.com"]   → JSON-массив
    cors_origins: str = "*"

    # Optional: protect /admin/* endpoints with a shared secret
    # Set ADMIN_SECRET in .env; leave empty to disable auth (rely on network-level protection)
    admin_secret: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        s = self.cors_origins.strip()
        if s == "" or s == "*":
            return ["*"]
        if s.startswith("["):
            return json.loads(s)
        return [o.strip() for o in s.split(",") if o.strip()]

    @property
    def async_database_url(self) -> str:
        # Dokploy gives postgresql://, we need postgresql+asyncpg://
        return self.database_url.replace(
            "postgresql://", "postgresql+asyncpg://", 1
        )

    class Config:
        env_file = ".env"


settings = Settings()
