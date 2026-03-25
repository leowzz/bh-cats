from typing import Annotated

from fastapi import APIRouter, Header, HTTPException, status
from sqlalchemy import select

from app.api.deps import DbSession
from app.core.security import decode_token
from app.models.user import User
from app.schemas.like import LikeToggleRequest, LikeToggleResponse
from app.services.like_service import like_service

router = APIRouter(prefix='/likes', tags=['likes'])


@router.post('/toggle', response_model=LikeToggleResponse)
def toggle_like(payload: LikeToggleRequest, db: DbSession, authorization: Annotated[str | None, Header()] = None) -> LikeToggleResponse:
    user = None
    if authorization and authorization.startswith('Bearer '):
        token = authorization.split(' ', 1)[1]
        try:
            data = decode_token(token)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='令牌无效') from exc
        user = db.scalar(select(User).where(User.id == int(data['sub'])))
    try:
        liked, like_count = like_service.toggle_like(db, target_type=payload.target_type, target_id=payload.target_id, user=user, device_id=payload.device_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return LikeToggleResponse(liked=liked, like_count=like_count)
