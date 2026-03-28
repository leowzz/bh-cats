from collections.abc import Sequence
from datetime import UTC, datetime

from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.config import get_settings
from app.models.banner import Banner, BannerImage
from app.schemas.banner import BannerImageResponse, BannerResponse
from app.services.media_service import MediaService


class BannerService:
    def _media_service(self) -> MediaService:
        return MediaService.from_settings(get_settings())

    def list_public_banners(self, db: Session) -> list[BannerResponse]:
        banners = db.scalars(
            select(Banner)
            .where(Banner.is_active.is_(True), Banner.deleted_at.is_(None))
            .options(selectinload(Banner.images))
            .order_by(Banner.sort_order.asc(), Banner.id.desc())
        ).all()
        return [self._to_response(item) for item in banners]

    def list_admin_banners(self, db: Session) -> list[BannerResponse]:
        banners = db.scalars(
            select(Banner).where(Banner.deleted_at.is_(None)).options(selectinload(Banner.images)).order_by(Banner.sort_order.asc(), Banner.id.desc())
        ).all()
        return [self._to_response(item) for item in banners]

    def get_banner(self, db: Session, banner_id: int) -> BannerResponse | None:
        banner = db.scalar(select(Banner).where(Banner.id == banner_id, Banner.deleted_at.is_(None)).options(selectinload(Banner.images)))
        if not banner:
            return None
        return self._to_response(banner)

    def create_banner(
        self,
        db: Session,
        *,
        title: str,
        subtitle: str,
        link_url: str,
        sort_order: int,
        is_active: bool,
        files: Sequence[UploadFile],
    ) -> BannerResponse:
        banner = Banner(title=title, subtitle=subtitle, link_url=link_url, sort_order=sort_order, is_active=is_active)
        db.add(banner)
        db.commit()
        db.refresh(banner)
        self._attach_files(db, banner, files)
        db.refresh(banner)
        return self._to_response(banner)

    def update_banner(
        self,
        db: Session,
        banner_id: int,
        *,
        title: str,
        subtitle: str,
        link_url: str,
        sort_order: int,
        is_active: bool,
        files: Sequence[UploadFile] | None = None,
    ) -> BannerResponse | None:
        banner = db.scalar(select(Banner).where(Banner.id == banner_id, Banner.deleted_at.is_(None)).options(selectinload(Banner.images)))
        if not banner:
            return None
        banner.title = title
        banner.subtitle = subtitle
        banner.link_url = link_url
        banner.sort_order = sort_order
        banner.is_active = is_active
        db.commit()
        if files:
            self._replace_files(db, banner, files)
        db.refresh(banner)
        return self._to_response(banner)

    def delete_banner(self, db: Session, banner_id: int) -> bool:
        banner = db.scalar(select(Banner).where(Banner.id == banner_id, Banner.deleted_at.is_(None)).options(selectinload(Banner.images)))
        if not banner:
            return False
        banner.deleted_at = datetime.now(UTC)
        db.commit()
        return True

    def _attach_files(self, db: Session, banner: Banner, files: Sequence[UploadFile]) -> None:
        media_service = self._media_service()
        for idx, upload in enumerate(files):
            saved = media_service.process_upload(upload.file.read(), owner_type='banners', owner_id=banner.id)
            db.add(
                BannerImage(
                    banner_id=banner.id,
                    file_path=saved.file_path,
                    thumb_path=saved.thumb_path,
                    sort_order=idx,
                    width=saved.width,
                    height=saved.height,
                )
            )
        db.commit()

    def _replace_files(self, db: Session, banner: Banner, files: Sequence[UploadFile]) -> None:
        media_service = self._media_service()
        for image in list(banner.images):
            media_service.delete(image.file_path)
            media_service.delete(image.thumb_path)
            db.delete(image)
        db.commit()
        self._attach_files(db, banner, files)

    def _to_response(self, banner: Banner) -> BannerResponse:
        return BannerResponse(
            id=banner.id,
            title=banner.title,
            subtitle=banner.subtitle,
            link_url=banner.link_url,
            sort_order=banner.sort_order,
            is_active=banner.is_active,
            created_at=banner.created_at,
            updated_at=banner.updated_at,
            images=[BannerImageResponse.model_validate(image) for image in banner.images],
        )


banner_service = BannerService()
