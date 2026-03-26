from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest


class AuthService:
    def register_user(self, db: Session, payload: RegisterRequest) -> User:
        normalized_email = str(payload.email).lower()
        normalized_username = payload.username.strip().lower()
        existing = db.scalar(select(User).where(or_(User.email == normalized_email, User.username == normalized_username)))
        if existing and existing.email == normalized_email:
            raise ValueError('邮箱已注册')
        if existing and existing.username == normalized_username:
            raise ValueError('用户名已存在')
        user = User(
            username=normalized_username,
            email=normalized_email,
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
        normalized_account = payload.account.strip().lower()
        if '@' in normalized_account:
            user = db.scalar(select(User).where(User.email == normalized_account))
        else:
            user = db.scalar(select(User).where(User.username == normalized_account))
        if not user or not verify_password(payload.password, user.password_hash):
            raise ValueError('用户名/邮箱或密码错误')
        token = create_access_token(str(user.id), extra_claims={'role': user.role})
        return token, user


auth_service = AuthService()
