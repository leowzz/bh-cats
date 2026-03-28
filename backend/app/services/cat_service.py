import json
from collections.abc import Sequence
from datetime import UTC, datetime

from fastapi import UploadFile
from sqlalchemy import Select, select
from sqlalchemy.orm import Session, selectinload

from app.core.config import get_settings
from app.models.cat import Cat, CatImage
from app.schemas.cat import CatImageResponse, CatListResponse, CatResponse
from app.services.media_service import MediaService


class CatService:
    def _media_service(self) -> MediaService:
        return MediaService.from_settings(get_settings())

    def list_public_cats(self, db: Session, campus: str | None = None, keyword: str | None = None, sort: str = 'hot') -> CatListResponse:
        query: Select[tuple[Cat]] = select(Cat).where(Cat.status == 'visible', Cat.deleted_at.is_(None)).options(selectinload(Cat.images))
        if campus:
            query = query.where(Cat.campus == campus)
        if keyword:
            like_value = f'%{keyword}%'
            query = query.where(Cat.name.ilike(like_value) | Cat.location.ilike(like_value) | Cat.breed.ilike(like_value))
        if sort == 'latest':
            query = query.order_by(Cat.created_at.desc())
        else:
            query = query.order_by(Cat.like_count.desc(), Cat.view_count.desc(), Cat.created_at.desc())
        cats = list(db.scalars(query).unique())
        return CatListResponse(items=[self._to_response(cat) for cat in cats], total=len(cats))

    def list_admin_cats(self, db: Session) -> CatListResponse:
        cats = list(
            db.scalars(select(Cat).where(Cat.deleted_at.is_(None)).options(selectinload(Cat.images)).order_by(Cat.created_at.desc())).unique()
        )
        return CatListResponse(items=[self._to_response(cat) for cat in cats], total=len(cats))

    def get_public_cat(self, db: Session, cat_id: int) -> CatResponse | None:
        cat = db.scalar(select(Cat).where(Cat.id == cat_id, Cat.status == 'visible', Cat.deleted_at.is_(None)).options(selectinload(Cat.images)))
        if not cat:
            return None
        cat.view_count += 1
        db.commit()
        db.refresh(cat)
        return self._to_response(cat)

    def get_admin_cat(self, db: Session, cat_id: int) -> CatResponse | None:
        cat = db.scalar(select(Cat).where(Cat.id == cat_id, Cat.deleted_at.is_(None)).options(selectinload(Cat.images)))
        if not cat:
            return None
        return self._to_response(cat)

    def create_cat(
        self,
        db: Session,
        *,
        name: str,
        campus: str,
        breed: str,
        gender: str,
        sterilized: bool,
        location: str,
        personality_tags: str,
        description: str,
        files: Sequence[UploadFile],
    ) -> CatResponse:
        cat = Cat(
            name=name,
            campus=campus,
            breed=breed,
            gender=gender,
            sterilized=sterilized,
            location=location,
            personality_tags=personality_tags,
            description=description,
            status='visible',
        )
        db.add(cat)
        db.commit()
        db.refresh(cat)
        self._attach_files(db, cat, files)
        db.refresh(cat)
        return self._to_response(cat)

    def update_cat(
        self,
        db: Session,
        cat_id: int,
        *,
        name: str,
        campus: str,
        breed: str,
        gender: str,
        sterilized: bool,
        location: str,
        personality_tags: str,
        description: str,
        status: str,
        remove_image_ids: Sequence[int] | None = None,
        cover_image_id: int | None = None,
        files: Sequence[UploadFile] | None = None,
    ) -> CatResponse | None:
        cat = db.scalar(select(Cat).where(Cat.id == cat_id, Cat.deleted_at.is_(None)).options(selectinload(Cat.images)))
        if not cat:
            return None
        cat.name = name
        cat.campus = campus
        cat.breed = breed
        cat.gender = gender
        cat.sterilized = sterilized
        cat.location = location
        cat.personality_tags = personality_tags
        cat.description = description
        cat.status = status
        self._sync_images(
            db,
            cat,
            files=files or [],
            remove_image_ids=remove_image_ids or [],
            cover_image_id=cover_image_id,
        )
        db.add(cat)
        db.commit()
        db.refresh(cat)
        return self._to_response(cat)

    def delete_cat(self, db: Session, cat_id: int) -> bool:
        cat = db.scalar(select(Cat).where(Cat.id == cat_id, Cat.deleted_at.is_(None)).options(selectinload(Cat.images)))
        if not cat:
            return False
        cat.deleted_at = datetime.now(UTC)
        db.commit()
        return True

    def serialize_images(self, images: Sequence[CatImage]) -> list[dict]:
        return [CatImageResponse.model_validate(image).model_dump(mode='json') for image in self._ordered_images(images)]

    def _attach_files(self, db: Session, cat: Cat, files: Sequence[UploadFile]) -> None:
        self._append_files(db, cat, files)
        self._normalize_cover(cat)
        db.commit()

    def _sync_images(
        self,
        db: Session,
        cat: Cat,
        *,
        files: Sequence[UploadFile],
        remove_image_ids: Sequence[int],
        cover_image_id: int | None,
    ) -> None:
        self._remove_images(db, cat, remove_image_ids)
        self._append_files(db, cat, files)
        self._normalize_cover(cat, preferred_cover_id=cover_image_id)

    def _append_files(self, db: Session, cat: Cat, files: Sequence[UploadFile]) -> None:
        next_sort = len(cat.images)
        media_service = self._media_service()
        for upload in files:
            saved = media_service.process_upload(upload.file.read(), owner_type='cats', owner_id=cat.id)
            image = CatImage(
                cat_id=cat.id,
                file_path=saved.file_path,
                thumb_path=saved.thumb_path,
                sort_order=next_sort,
                is_cover=False,
                width=saved.width,
                height=saved.height,
            )
            cat.images.append(image)
            db.add(image)
            next_sort += 1

    def _remove_images(self, db: Session, cat: Cat, remove_image_ids: Sequence[int]) -> None:
        if not remove_image_ids:
            return
        remove_set = set(remove_image_ids)
        remaining_images: list[CatImage] = []
        media_service = self._media_service()
        for image in list(cat.images):
            if image.id in remove_set:
                media_service.delete(image.file_path)
                media_service.delete(image.thumb_path)
                db.delete(image)
                continue
            remaining_images.append(image)
        cat.images[:] = remaining_images

    def _normalize_cover(self, cat: Cat, preferred_cover_id: int | None = None) -> None:
        ordered_images = self._ordered_images(cat.images)
        if not ordered_images:
            return

        cover_image = None
        if preferred_cover_id is not None:
            cover_image = next((image for image in ordered_images if image.id == preferred_cover_id), None)
        if cover_image is None:
            cover_image = next((image for image in ordered_images if image.is_cover), ordered_images[0])

        reordered_images = [cover_image, *[image for image in ordered_images if image is not cover_image]]
        for index, image in enumerate(reordered_images):
            image.sort_order = index
            image.is_cover = image is cover_image

    def _ordered_images(self, images: Sequence[CatImage]) -> list[CatImage]:
        return sorted(images, key=lambda image: (0 if image.is_cover else 1, image.sort_order, image.id or 0))

    def _to_response(self, cat: Cat) -> CatResponse:
        tags = json.loads(cat.personality_tags or '[]')
        return CatResponse(
            id=cat.id,
            name=cat.name,
            campus=cat.campus,
            breed=cat.breed,
            gender=cat.gender,
            sterilized=cat.sterilized,
            location=cat.location,
            personality_tags=tags,
            description=cat.description,
            status=cat.status,
            view_count=cat.view_count,
            like_count=cat.like_count,
            created_at=cat.created_at,
            updated_at=cat.updated_at,
            images=[CatImageResponse.model_validate(image) for image in self._ordered_images(cat.images)],
        )


cat_service = CatService()
