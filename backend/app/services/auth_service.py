from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest


class AuthService:
    def register_user(self, db: Session, payload: RegisterRequest) -> User:
        existing = db.scalar(select(User).where(User.email == payload.email))
        if existing:
            raise ValueError('邮箱已注册')
        user = User(
            email=str(payload.email),
            password_hash=hash_password(payload.password),
            nickname=payload.nickname,
            role='user',
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def login_user(self, db: Session, payload: LoginRequest) -> tuple[str, User]:
        user = db.scalar(select(User).where(User.email == payload.email))
        if not user or not verify_password(payload.password, user.password_hash):
            raise ValueError('邮箱或密码错误')
        token = create_access_token(str(user.id), extra_claims={'role': user.role})
        return token, user


auth_service = AuthService()
