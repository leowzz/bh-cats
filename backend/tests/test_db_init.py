from sqlalchemy import inspect

from app.db.init_db import init_db
from app.models.user import User


def test_init_db_creates_tables_and_admin(session_factory, settings) -> None:
    init_db()
    inspector = inspect(session_factory.kw['bind'])
    assert 'users' in inspector.get_table_names()
    admin = session_factory().query(User).filter_by(email=settings.admin_email).one()
    assert admin.role == 'admin'
