from sqlalchemy import select
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

    session_factory = get_session_factory(settings.database_url)
    with session_factory() as db:
        _ensure_admin(db)


def _ensure_admin(db: Session) -> None:
    settings = get_settings()
    existing = db.scalar(select(User).where(User.email == settings.admin_email))
    if existing:
        return
    db.add(
        User(
            email=settings.admin_email,
            password_hash=hash_password(settings.admin_password),
            nickname=settings.admin_nickname,
            role='admin',
            is_active=True,
        )
    )
    db.commit()
