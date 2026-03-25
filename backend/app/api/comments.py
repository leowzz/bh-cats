from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import DbSession, get_current_user
from app.schemas.comment import CommentCreateRequest, CommentUpdateRequest
from app.schemas.post import CommentResponse
from app.services.comment_service import comment_service

router = APIRouter(prefix='/comments', tags=['comments'])


@router.post('', response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(payload: CommentCreateRequest, db: DbSession, current_user=Depends(get_current_user)) -> CommentResponse:
    try:
        return comment_service.create_comment(db, current_user, payload)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.put('/{comment_id}', response_model=CommentResponse)
def update_comment(comment_id: int, payload: CommentUpdateRequest, db: DbSession, current_user=Depends(get_current_user)) -> CommentResponse:
    try:
        comment = comment_service.update_comment(db, comment_id, current_user, payload)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='评论不存在')
    return comment


@router.delete('/{comment_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(comment_id: int, db: DbSession, current_user=Depends(get_current_user)) -> None:
    try:
        deleted = comment_service.delete_comment(db, comment_id, current_user)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='评论不存在')
