import sqlite3

from sqlalchemy import inspect

from app.db.init_db import init_db
from app.models.user import User


def test_init_db_creates_tables_and_admin(session_factory, settings) -> None:
    init_db()
    inspector = inspect(session_factory.kw['bind'])
    assert 'users' in inspector.get_table_names()
    admin = session_factory().query(User).filter_by(email=settings.admin_email).one()
    assert admin.role == 'admin'


def test_init_db_backfills_deleted_at_columns_for_existing_tables(session_factory, settings) -> None:
    connection = sqlite3.connect(settings.sqlite_path)
    try:
        connection.executescript(
            '''
            CREATE TABLE cats (
                id INTEGER PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                campus VARCHAR(20) NOT NULL,
                breed VARCHAR(100) NOT NULL DEFAULT '',
                gender VARCHAR(20) NOT NULL DEFAULT 'unknown',
                sterilized BOOLEAN NOT NULL DEFAULT 0,
                location VARCHAR(255) NOT NULL DEFAULT '',
                personality_tags TEXT NOT NULL DEFAULT '[]',
                description TEXT NOT NULL DEFAULT '',
                status VARCHAR(20) NOT NULL DEFAULT 'visible',
                view_count INTEGER NOT NULL DEFAULT 0,
                like_count INTEGER NOT NULL DEFAULT 0,
                created_at DATETIME,
                updated_at DATETIME
            );
            CREATE TABLE banners (
                id INTEGER PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                subtitle VARCHAR(255) NOT NULL DEFAULT '',
                link_url VARCHAR(255) NOT NULL DEFAULT '',
                sort_order INTEGER NOT NULL DEFAULT 0,
                is_active BOOLEAN NOT NULL DEFAULT 1,
                created_at DATETIME,
                updated_at DATETIME
            );
            CREATE TABLE posts (
                id INTEGER PRIMARY KEY,
                author_id INTEGER NOT NULL,
                related_cat_id INTEGER,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                status VARCHAR(20) NOT NULL DEFAULT 'visible',
                like_count INTEGER NOT NULL DEFAULT 0,
                comment_count INTEGER NOT NULL DEFAULT 0,
                created_at DATETIME,
                updated_at DATETIME
            );
            CREATE TABLE comments (
                id INTEGER PRIMARY KEY,
                post_id INTEGER NOT NULL,
                author_id INTEGER NOT NULL,
                parent_id INTEGER,
                content TEXT NOT NULL,
                like_count INTEGER NOT NULL DEFAULT 0,
                created_at DATETIME,
                updated_at DATETIME
            );
            '''
        )
        connection.commit()
    finally:
        connection.close()

    init_db()

    inspector = inspect(session_factory.kw['bind'])
    for table_name in ['cats', 'banners', 'posts', 'comments']:
        column_names = {column['name'] for column in inspector.get_columns(table_name)}
        assert 'deleted_at' in column_names
