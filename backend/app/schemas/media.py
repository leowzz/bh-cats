from pydantic import BaseModel


class StoredMedia(BaseModel):
    file_path: str
    thumb_path: str
    byte_size: int
    thumb_byte_size: int
    width: int
    height: int
