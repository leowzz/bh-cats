from pydantic import BaseModel


class LikeToggleRequest(BaseModel):
    target_type: str
    target_id: int
    device_id: str | None = None


class LikeToggleResponse(BaseModel):
    liked: bool
    like_count: int
