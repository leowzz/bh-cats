from io import BytesIO
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from PIL import Image
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import create_access_token, hash_password
from app.db.init_db import init_db
from app.db.session import get_session_factory, reset_session_state
from app.models.user import User


@pytest.fixture()
def settings(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv('SQLITE_PATH', str(tmp_path / 'test.db'))
    monkeypatch.setenv('MEDIA_ROOT', str(tmp_path / 'uploads'))
    monkeypatch.setenv('ADMIN_USERNAME', 'test_admin')
    monkeypatch.setenv('ADMIN_EMAIL', 'admin@test.local')
    monkeypatch.setenv('ADMIN_PASSWORD', 'Admin123!')
    monkeypatch.setenv('ADMIN_NICKNAME', '测试管理员')
    get_settings.cache_clear()
    reset_session_state()
    settings = get_settings()
    yield settings
    get_settings.cache_clear()
    reset_session_state()


@pytest.fixture()
def session_factory(settings):
    return get_session_factory(settings.database_url)


@pytest.fixture()
def db_session(session_factory, settings) -> Session:
    init_db()
    with session_factory() as session:
        yield session


@pytest.fixture()
def client(settings):
    from app.main import create_app

    app = create_app()
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture()
def sample_image_bytes() -> bytes:
    image = Image.new('RGB', (3200, 2400), color=(240, 160, 90))
    buffer = BytesIO()
    image.save(buffer, format='PNG')
    return buffer.getvalue()


@pytest.fixture()
def normal_user(db_session: Session) -> User:
    user = User(
        username='user_test',
        email='user@test.local',
        password_hash=hash_password('Secret123!'),
        nickname='普通用户',
        role='user',
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture()
def admin_user(db_session: Session, settings) -> User:
    admin = db_session.query(User).filter_by(email=settings.admin_email).one()
    return admin


@pytest.fixture()
def user_headers(normal_user: User) -> dict[str, str]:
    token = create_access_token(str(normal_user.id), extra_claims={'role': normal_user.role})
    return {'Authorization': f'Bearer {token}'}


@pytest.fixture()
def admin_headers(admin_user: User) -> dict[str, str]:
    token = create_access_token(str(admin_user.id), extra_claims={'role': admin_user.role})
    return {'Authorization': f'Bearer {token}'}


@pytest.fixture()
def other_user(db_session: Session) -> User:
    user = User(
        username='other_test',
        email='other@test.local',
        password_hash=hash_password('Secret123!'),
        nickname='其他用户',
        role='user',
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture()
def other_user_headers(other_user: User) -> dict[str, str]:
    token = create_access_token(str(other_user.id), extra_claims={'role': other_user.role})
    return {'Authorization': f'Bearer {token}'}
