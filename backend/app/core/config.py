from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = 'BH Cats API'
    api_prefix: str = '/api'
    secret_key: str = 'dev-secret-key-change-me'
    access_token_expire_minutes: int = 60 * 24 * 7
    sqlite_path: Path = Path('storage/app.db')
    storage_backend: Literal['local', 's3'] = 'local'
    media_root: Path = Path('storage/uploads')
    media_url: str = '/media'
    s3_endpoint: str = ''
    s3_region: str = 'us-east-1'
    s3_bucket: str = 'bh-cats-media'
    s3_access_key: str = ''
    s3_secret_key: str = ''
    s3_public_base_url: str = ''
    admin_username: str = 'admin'
    admin_email: str = 'admin@example.com'
    admin_password: str = 'Admin123!'
    admin_nickname: str = '管理员'
    image_max_bytes: int = Field(default=400 * 1024)

    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    @property
    def database_url(self) -> str:
        return f'sqlite:///{self.sqlite_path}'


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.sqlite_path.parent.mkdir(parents=True, exist_ok=True)
    if settings.storage_backend == 'local':
        settings.media_root.mkdir(parents=True, exist_ok=True)
    return settings
