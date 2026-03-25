from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.api.deps import DbSession, get_admin_user
from app.schemas.cat import CatListResponse, CatResponse
from app.services.cat_service import cat_service

router = APIRouter(tags=['cats'])
admin_router = APIRouter(prefix='/admin/cats', tags=['admin-cats'])


@router.get('/cats', response_model=CatListResponse)
def list_cats(db: DbSession, campus: str | None = None, keyword: str | None = None, sort: str = 'hot') -> CatListResponse:
    return cat_service.list_public_cats(db, campus=campus, keyword=keyword, sort=sort)


@router.get('/cats/{cat_id}', response_model=CatResponse)
def get_cat(cat_id: int, db: DbSession) -> CatResponse:
    cat = cat_service.get_public_cat(db, cat_id)
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
    files: Annotated[list[UploadFile], File()] = [],
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
        files=files,
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
    files: Annotated[list[UploadFile], File()] | None = None,
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
        files=files,
    )
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='猫猫不存在')
    return cat
