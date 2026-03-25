from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.api.deps import DbSession, get_current_user
from app.api.upload_utils import normalize_uploads
from app.schemas.post import PostListResponse, PostResponse
from app.services.post_service import post_service

router = APIRouter(prefix='/posts', tags=['posts'])


@router.get('', response_model=PostListResponse)
def list_posts(db: DbSession) -> PostListResponse:
    return post_service.list_posts(db)


@router.get('/{post_id}', response_model=PostResponse)
def get_post(post_id: int, db: DbSession) -> PostResponse:
    post = post_service.get_post(db, post_id)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='帖子不存在')
    return post


@router.post('', response_model=PostResponse, status_code=status.HTTP_201_CREATED)
def create_post(
    db: DbSession,
    current_user=Depends(get_current_user),
    title: Annotated[str, Form()] = '',
    content: Annotated[str, Form()] = '',
    related_cat_id: Annotated[int | None, Form()] = None,
    files: Annotated[UploadFile | list[UploadFile] | None, File()] = None,
) -> PostResponse:
    return post_service.create_post(
        db,
        current_user,
        title=title,
        content=content,
        related_cat_id=related_cat_id,
        files=normalize_uploads(files),
    )


@router.put('/{post_id}', response_model=PostResponse)
def update_post(
    post_id: int,
    db: DbSession,
    current_user=Depends(get_current_user),
    title: Annotated[str, Form()] = '',
    content: Annotated[str, Form()] = '',
    related_cat_id: Annotated[int | None, Form()] = None,
    files: Annotated[UploadFile | list[UploadFile] | None, File()] = None,
) -> PostResponse:
    try:
        post = post_service.update_post(
            db,
            post_id,
            current_user,
            title=title,
            content=content,
            related_cat_id=related_cat_id,
            files=normalize_uploads(files),
        )
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='帖子不存在')
    return post


@router.delete('/{post_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_post(post_id: int, db: DbSession, current_user=Depends(get_current_user)) -> None:
    try:
        deleted = post_service.delete_post(db, post_id, current_user)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='帖子不存在')
