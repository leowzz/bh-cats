import json
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.api.deps import DbSession, get_admin_user
from app.api.upload_utils import normalize_uploads
from app.schemas.cat import CatListResponse, CatResponse
from app.services.cat_service import cat_service

router = APIRouter(tags=['cats'])
admin_router = APIRouter(prefix='/admin/cats', tags=['admin-cats'])


def parse_image_id_list(raw_value: str | None) -> list[int]:
    if not raw_value:
        return []
    try:
        value = json.loads(raw_value)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail='remove_image_ids 格式错误') from exc
    if not isinstance(value, list) or not all(isinstance(item, int) for item in value):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail='remove_image_ids 必须是数字数组')
    return value


@router.get('/cats', response_model=CatListResponse)
def list_cats(db: DbSession, campus: str | None = None, keyword: str | None = None, sort: str = 'hot') -> CatListResponse:
    return cat_service.list_public_cats(db, campus=campus, keyword=keyword, sort=sort)


@router.get('/cats/{cat_id}', response_model=CatResponse)
def get_cat(cat_id: int, db: DbSession) -> CatResponse:
    cat = cat_service.get_public_cat(db, cat_id)
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='猫猫不存在')
    return cat


@admin_router.get('', response_model=CatListResponse, dependencies=[Depends(get_admin_user)])
def list_admin_cats(db: DbSession) -> CatListResponse:
    return cat_service.list_admin_cats(db)


@admin_router.get('/{cat_id}', response_model=CatResponse, dependencies=[Depends(get_admin_user)])
def get_admin_cat(cat_id: int, db: DbSession) -> CatResponse:
    cat = cat_service.get_admin_cat(db, cat_id)
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='猫猫不存在')
    return cat


@admin_router.post('', response_model=CatResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(get_admin_user)])
def create_cat(
    db: DbSession,
    name: Annotated[str, Form()],
    campus: Annotated[str, Form()],
    breed: Annotated[str, Form()],
    gender: Annotated[str, Form()],
    sterilized: Annotated[bool, Form()],
    location: Annotated[str, Form()],
    personality_tags: Annotated[str, Form()],
    description: Annotated[str, Form()],
    files: Annotated[UploadFile | list[UploadFile] | None, File()] = None,
) -> CatResponse:
    return cat_service.create_cat(
        db,
        name=name,
        campus=campus,
        breed=breed,
        gender=gender,
        sterilized=sterilized,
        location=location,
        personality_tags=personality_tags,
        description=description,
        files=normalize_uploads(files),
    )


@admin_router.put('/{cat_id}', response_model=CatResponse, dependencies=[Depends(get_admin_user)])
def update_cat(
    cat_id: int,
    db: DbSession,
    name: Annotated[str, Form()],
    campus: Annotated[str, Form()],
    breed: Annotated[str, Form()],
    gender: Annotated[str, Form()],
    sterilized: Annotated[bool, Form()],
    location: Annotated[str, Form()],
    personality_tags: Annotated[str, Form()],
    description: Annotated[str, Form()],
    status_value: Annotated[str, Form(alias='status')],
    remove_image_ids: Annotated[str | None, Form()] = None,
    cover_image_id: Annotated[int | None, Form()] = None,
    files: Annotated[UploadFile | list[UploadFile] | None, File()] = None,
) -> CatResponse:
    cat = cat_service.update_cat(
        db,
        cat_id,
        name=name,
        campus=campus,
        breed=breed,
        gender=gender,
        sterilized=sterilized,
        location=location,
        personality_tags=personality_tags,
        description=description,
        status=status_value,
        remove_image_ids=parse_image_id_list(remove_image_ids),
        cover_image_id=cover_image_id,
        files=normalize_uploads(files),
    )
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='猫猫不存在')
    return cat


@admin_router.delete('/{cat_id}', status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(get_admin_user)])
def delete_cat(cat_id: int, db: DbSession) -> None:
    deleted = cat_service.delete_cat(db, cat_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='猫猫不存在')
