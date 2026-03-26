import re

from sqlalchemy import inspect, select, text
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import hash_password
from app.db.base import Base
from app.db.session import get_engine, get_session_factory
from app.models import User  # noqa: F401
import app.models  # noqa: F401


def init_db() -> None:
    settings = get_settings()
    engine = get_engine(settings.database_url)
    Base.metadata.create_all(bind=engine)
    _ensure_soft_delete_columns(engine)
    _ensure_username_column(engine)

    session_factory = get_session_factory(settings.database_url)
    with session_factory() as db:
        _backfill_usernames(db)
        _ensure_admin(db)


def _ensure_admin(db: Session) -> None:
    settings = get_settings()
    existing = db.scalar(select(User).where(User.email == settings.admin_email))
    if existing:
        desired_username = _next_unique_username(db, settings.admin_username, exclude_user_id=existing.id)
        if existing.username != desired_username:
            existing.username = desired_username
            db.commit()
        return
    db.add(
        User(
            username=_next_unique_username(db, settings.admin_username),
            email=settings.admin_email,
            password_hash=hash_password(settings.admin_password),
            nickname=settings.admin_nickname,
            role='admin',
            is_active=True,
        )
    )
    db.commit()


def _ensure_soft_delete_columns(engine) -> None:
    inspector = inspect(engine)
    table_names = ['cats', 'banners', 'posts', 'comments']
    with engine.begin() as connection:
        for table_name in table_names:
            if table_name not in inspector.get_table_names():
                continue
            column_names = {column['name'] for column in inspector.get_columns(table_name)}
            if 'deleted_at' not in column_names:
                connection.execute(text(f'ALTER TABLE {table_name} ADD COLUMN deleted_at DATETIME'))
            connection.execute(text(f'CREATE INDEX IF NOT EXISTS ix_{table_name}_deleted_at ON {table_name} (deleted_at)'))


def _ensure_username_column(engine) -> None:
    inspector = inspect(engine)
    if 'users' not in inspector.get_table_names():
        return
    column_names = {column['name'] for column in inspector.get_columns('users')}
    with engine.begin() as connection:
        if 'username' not in column_names:
            connection.execute(text('ALTER TABLE users ADD COLUMN username VARCHAR(32)'))
        connection.execute(text('CREATE UNIQUE INDEX IF NOT EXISTS ix_users_username ON users (username)'))


def _backfill_usernames(db: Session) -> None:
    users = db.scalars(select(User).order_by(User.id.asc())).all()
    reserved_usernames = {user.username for user in users if user.username}
    dirty = False
    for user in users:
        if user.username:
            continue
        user.username = _next_available_username(_username_from_email(user.email), reserved_usernames)
        reserved_usernames.add(user.username)
        dirty = True
    if dirty:
        db.commit()


def _username_from_email(email: str) -> str:
    local_part = email.split('@', 1)[0].lower()
    normalized = re.sub(r'[^a-z0-9_]+', '_', local_part)
    normalized = re.sub(r'_+', '_', normalized).strip('_')
    if not normalized:
        normalized = 'user'
    if len(normalized) < 3:
        normalized = f'{normalized}_user'
    return normalized[:32]


def _next_unique_username(db: Session, base_username: str, exclude_user_id: int | None = None) -> str:
    base = _username_from_email(base_username) if '@' in base_username else _normalize_username(base_username)
    candidate = base
    suffix = 1
    while True:
        existing = db.scalar(select(User).where(User.username == candidate))
        if not existing or existing.id == exclude_user_id:
            return candidate
        suffix += 1
        candidate = _candidate_with_suffix(base, suffix)


def _next_available_username(base_username: str, reserved_usernames: set[str]) -> str:
    base = _normalize_username(base_username)
    suffix = 1
    candidate = base
    while True:
        if candidate not in reserved_usernames:
            return candidate
        suffix += 1
        candidate = _candidate_with_suffix(base, suffix)


def _candidate_with_suffix(base: str, suffix: int) -> str:
    suffix_token = f'_{suffix}'
    return f'{base[: 32 - len(suffix_token)]}{suffix_token}'


def _normalize_username(value: str) -> str:
    normalized = re.sub(r'[^a-z0-9_]+', '_', value.strip().lower())
    normalized = re.sub(r'_+', '_', normalized).strip('_')
    if not normalized:
        normalized = 'user'
    if len(normalized) < 3:
        normalized = f'{normalized}_user'
    return normalized[:32]
