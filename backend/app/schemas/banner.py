from datetime import datetime

from pydantic import BaseModel


class BannerImageResponse(BaseModel):
    id: int | None = None
    file_path: str
    thumb_path: str
    sort_order: int = 0
    width: int = 0
    height: int = 0

    model_config = {'from_attributes': True}


class BannerResponse(BaseModel):
    id: int
    title: str
    subtitle: str
    link_url: str
    sort_order: int
    is_active: bool
    created_at: datetime
    updated_at: datetime | None = None
    images: list[BannerImageResponse]
