from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.api.deps import DbSession, get_admin_user
from app.api.upload_utils import normalize_uploads
from app.schemas.banner import BannerResponse
from app.services.banner_service import banner_service

router = APIRouter(prefix='/banners', tags=['banners'])
admin_router = APIRouter(prefix='/admin/banners', tags=['admin-banners'])


@router.get('', response_model=list[BannerResponse])
def list_banners(db: DbSession) -> list[BannerResponse]:
    return banner_service.list_public_banners(db)


@admin_router.get('', response_model=list[BannerResponse], dependencies=[Depends(get_admin_user)])
def list_admin_banners(db: DbSession) -> list[BannerResponse]:
    return banner_service.list_admin_banners(db)


@admin_router.get('/{banner_id}', response_model=BannerResponse, dependencies=[Depends(get_admin_user)])
def get_banner(banner_id: int, db: DbSession) -> BannerResponse:
    banner = banner_service.get_banner(db, banner_id)
    if not banner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='轮播不存在')
    return banner


@admin_router.post('', response_model=BannerResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(get_admin_user)])
def create_banner(
    db: DbSession,
    title: Annotated[str, Form()],
    subtitle: Annotated[str, Form()],
    link_url: Annotated[str, Form()],
    sort_order: Annotated[int, Form()],
    is_active: Annotated[bool, Form()],
    files: Annotated[UploadFile | list[UploadFile] | None, File()] = None,
) -> BannerResponse:
    return banner_service.create_banner(
        db,
        title=title,
        subtitle=subtitle,
        link_url=link_url,
        sort_order=sort_order,
        is_active=is_active,
        files=normalize_uploads(files),
    )


@admin_router.put('/{banner_id}', response_model=BannerResponse, dependencies=[Depends(get_admin_user)])
def update_banner(
    banner_id: int,
    db: DbSession,
    title: Annotated[str, Form()],
    subtitle: Annotated[str, Form()],
    link_url: Annotated[str, Form()],
    sort_order: Annotated[int, Form()],
    is_active: Annotated[bool, Form()],
    files: Annotated[UploadFile | list[UploadFile] | None, File()] = None,
) -> BannerResponse:
    banner = banner_service.update_banner(
        db,
        banner_id,
        title=title,
        subtitle=subtitle,
        link_url=link_url,
        sort_order=sort_order,
        is_active=is_active,
        files=normalize_uploads(files),
    )
    if not banner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='轮播不存在')
    return banner


@admin_router.delete('/{banner_id}', status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(get_admin_user)])
def delete_banner(banner_id: int, db: DbSession) -> None:
    deleted = banner_service.delete_banner(db, banner_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='轮播不存在')
