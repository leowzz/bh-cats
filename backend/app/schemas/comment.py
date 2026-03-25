from pydantic import BaseModel, Field


class CommentCreateRequest(BaseModel):
    post_id: int
    parent_id: int | None = None
    content: str = Field(min_length=1, max_length=1000)


class CommentUpdateRequest(BaseModel):
    content: str = Field(min_length=1, max_length=1000)
