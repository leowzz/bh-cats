import sqlite3

from sqlalchemy import inspect
from app.core.security import hash_password

from app.db.init_db import init_db
from app.models.user import User


def test_init_db_creates_tables_and_admin(session_factory, settings) -> None:
    init_db()
    inspector = inspect(session_factory.kw['bind'])
    assert 'users' in inspector.get_table_names()
    admin = session_factory().query(User).filter_by(email=settings.admin_email).one()
    assert admin.username == settings.admin_username
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


def test_init_db_backfills_unique_usernames_for_existing_users(session_factory, settings) -> None:
    connection = sqlite3.connect(settings.sqlite_path)
    try:
        connection.executescript(
            f"""
            CREATE TABLE users (
                id INTEGER PRIMARY KEY,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                nickname VARCHAR(80) NOT NULL,
                role VARCHAR(20) NOT NULL DEFAULT 'user',
                is_active BOOLEAN NOT NULL DEFAULT 1,
                created_at DATETIME
            );
            INSERT INTO users (email, password_hash, nickname, role, is_active) VALUES
                ('kitty@example.com', '{hash_password("Secret123!")}', '小咪', 'user', 1),
                ('kitty@other.com', '{hash_password("Secret123!")}', '小咪二号', 'user', 1);
            """
        )
        connection.commit()
    finally:
        connection.close()

    init_db()

    session = session_factory()
    try:
        users = session.query(User).order_by(User.id.asc()).all()
        assert users[0].username == 'kitty'
        assert users[1].username == 'kitty_2'
        admin = session.query(User).filter_by(email=settings.admin_email).one()
        assert admin.username == settings.admin_username
    finally:
        session.close()
