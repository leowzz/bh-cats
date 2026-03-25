import json
import shutil
from collections.abc import Sequence
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy import Select, select
from sqlalchemy.orm import Session, selectinload

from app.core.config import get_settings
from app.models.cat import Cat, CatImage
from app.schemas.cat import CatImageResponse, CatListResponse, CatResponse
from app.services.media_service import MediaService


class CatService:
    def __init__(self) -> None:
        settings = get_settings()
        self.media_service = MediaService(settings.media_root, settings.image_max_bytes)

    def list_public_cats(self, db: Session, campus: str | None = None, keyword: str | None = None, sort: str = 'hot') -> CatListResponse:
        query: Select[tuple[Cat]] = select(Cat).where(Cat.status == 'visible').options(selectinload(Cat.images))
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
        cats = list(db.scalars(select(Cat).options(selectinload(Cat.images)).order_by(Cat.created_at.desc())).unique())
        return CatListResponse(items=[self._to_response(cat) for cat in cats], total=len(cats))

    def get_public_cat(self, db: Session, cat_id: int) -> CatResponse | None:
        cat = db.scalar(select(Cat).where(Cat.id == cat_id, Cat.status == 'visible').options(selectinload(Cat.images)))
        if not cat:
            return None
        cat.view_count += 1
        db.commit()
        db.refresh(cat)
        return self._to_response(cat)

    def get_admin_cat(self, db: Session, cat_id: int) -> CatResponse | None:
        cat = db.scalar(select(Cat).where(Cat.id == cat_id).options(selectinload(Cat.images)))
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
        files: Sequence[UploadFile] | None = None,
    ) -> CatResponse | None:
        cat = db.scalar(select(Cat).where(Cat.id == cat_id).options(selectinload(Cat.images)))
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
        db.commit()
        if files:
            self._replace_files(db, cat, files)
        db.refresh(cat)
        return self._to_response(cat)

    def delete_cat(self, db: Session, cat_id: int) -> bool:
        cat = db.scalar(select(Cat).where(Cat.id == cat_id).options(selectinload(Cat.images)))
        if not cat:
            return False
        cat_dir = Path(get_settings().media_root) / 'cats' / str(cat.id)
        if cat_dir.exists():
            shutil.rmtree(cat_dir)
        db.delete(cat)
        db.commit()
        return True

    def _attach_files(self, db: Session, cat: Cat, files: Sequence[UploadFile]) -> None:
        for idx, upload in enumerate(files):
            saved = self.media_service.process_upload(upload.file.read(), owner_type='cats', owner_id=cat.id)
            db.add(
                CatImage(
                    cat_id=cat.id,
                    file_path=saved.file_path,
                    thumb_path=saved.thumb_path,
                    sort_order=idx,
                    is_cover=idx == 0,
                    width=saved.width,
                    height=saved.height,
                )
            )
        db.commit()

    def _replace_files(self, db: Session, cat: Cat, files: Sequence[UploadFile]) -> None:
        cat_dir = Path(get_settings().media_root) / 'cats' / str(cat.id)
        if cat_dir.exists():
            shutil.rmtree(cat_dir)
        for image in list(cat.images):
            db.delete(image)
        db.commit()
        self._attach_files(db, cat, files)

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
            images=[CatImageResponse.model_validate(image) for image in cat.images],
        )


cat_service = CatService()
