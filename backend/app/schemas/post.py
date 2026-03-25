from datetime import datetime

from pydantic import BaseModel


class PostImageResponse(BaseModel):
    id: int | None = None
    file_path: str
    thumb_path: str
    sort_order: int = 0
    width: int = 0
    height: int = 0

    model_config = {'from_attributes': True}


class PostAuthorResponse(BaseModel):
    id: int
    nickname: str

    model_config = {'from_attributes': True}


class CommentAuthorResponse(BaseModel):
    id: int
    nickname: str

    model_config = {'from_attributes': True}


class CommentResponse(BaseModel):
    id: int
    post_id: int
    parent_id: int | None
    content: str
    like_count: int
    created_at: datetime
    updated_at: datetime | None = None
    author: CommentAuthorResponse
    replies: list['CommentResponse'] = []

    model_config = {'from_attributes': True}


class PostResponse(BaseModel):
    id: int
    title: str
    content: str
    status: str
    related_cat_id: int | None
    like_count: int
    comment_count: int
    created_at: datetime
    updated_at: datetime | None = None
    author: PostAuthorResponse
    images: list[PostImageResponse]
    comments: list[CommentResponse] = []


class PostListResponse(BaseModel):
    items: list[PostResponse]
    total: int
