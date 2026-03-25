from datetime import datetime

from pydantic import BaseModel


class CatImageResponse(BaseModel):
    id: int | None = None
    file_path: str
    thumb_path: str
    is_cover: bool = False
    sort_order: int = 0
    width: int = 0
    height: int = 0

    model_config = {'from_attributes': True}


class CatResponse(BaseModel):
    id: int
    name: str
    campus: str
    breed: str
    gender: str
    sterilized: bool
    location: str
    personality_tags: list[str]
    description: str
    status: str
    view_count: int
    like_count: int
    created_at: datetime
    updated_at: datetime | None = None
    images: list[CatImageResponse]


class CatListResponse(BaseModel):
    items: list[CatResponse]
    total: int
