from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, UploadFile, status

from app.api.deps import DbSession, get_admin_user
from app.schemas.banner import BannerResponse
from app.services.banner_service import banner_service

router = APIRouter(prefix='/banners', tags=['banners'])
admin_router = APIRouter(prefix='/admin/banners', tags=['admin-banners'])


@router.get('', response_model=list[BannerResponse])
def list_banners(db: DbSession) -> list[BannerResponse]:
    return banner_service.list_public_banners(db)


@admin_router.post('', response_model=BannerResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(get_admin_user)])
def create_banner(
    db: DbSession,
    title: Annotated[str, Form()],
    subtitle: Annotated[str, Form()],
    link_url: Annotated[str, Form()],
    sort_order: Annotated[int, Form()],
    is_active: Annotated[bool, Form()],
    files: Annotated[list[UploadFile], File()] = [],
) -> BannerResponse:
    return banner_service.create_banner(
        db,
        title=title,
        subtitle=subtitle,
        link_url=link_url,
        sort_order=sort_order,
        is_active=is_active,
        files=files,
    )
