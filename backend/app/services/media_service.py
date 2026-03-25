from io import BytesIO
from pathlib import Path
from uuid import uuid4

from PIL import Image

from app.schemas.media import StoredMedia


class MediaService:
    def __init__(self, media_root: Path, max_bytes: int = 400 * 1024) -> None:
        self.media_root = Path(media_root)
        self.max_bytes = max_bytes

    def process_upload(self, file_bytes: bytes, owner_type: str, owner_id: int) -> StoredMedia:
        owner_dir = self.media_root / owner_type / str(owner_id)
        owner_dir.mkdir(parents=True, exist_ok=True)

        image = Image.open(BytesIO(file_bytes))
        image = self._normalize_image(image)
        main_bytes, width, height = self._encode_under_limit(image)
        thumb_bytes, _, _ = self._encode_under_limit(image.copy(), max_dimension=480)

        token = uuid4().hex
        main_relative = f'{owner_type}/{owner_id}/{token}.webp'
        thumb_relative = f'{owner_type}/{owner_id}/{token}_thumb.webp'
        (self.media_root / main_relative).write_bytes(main_bytes)
        (self.media_root / thumb_relative).write_bytes(thumb_bytes)

        return StoredMedia(
            file_path=main_relative,
            thumb_path=thumb_relative,
            byte_size=len(main_bytes),
            thumb_byte_size=len(thumb_bytes),
            width=width,
            height=height,
        )

    def _normalize_image(self, image: Image.Image) -> Image.Image:
        if image.mode not in ('RGB', 'RGBA'):
            image = image.convert('RGBA' if 'A' in image.getbands() else 'RGB')
        if image.mode == 'RGBA':
            background = Image.new('RGB', image.size, (255, 255, 255))
            background.paste(image, mask=image.getchannel('A'))
            return background
        return image.convert('RGB')

    def _encode_under_limit(self, image: Image.Image, max_dimension: int = 2560) -> tuple[bytes, int, int]:
        working = image.copy()
        working.thumbnail((max_dimension, max_dimension))
        for dimension_factor in (1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4):
            candidate = working.copy()
            if dimension_factor < 1.0:
                new_size = (
                    max(1, int(candidate.width * dimension_factor)),
                    max(1, int(candidate.height * dimension_factor)),
                )
                candidate = candidate.resize(new_size, Image.Resampling.LANCZOS)
            for quality in range(90, 25, -5):
                buffer = BytesIO()
                candidate.save(buffer, format='WEBP', quality=quality, method=6)
                data = buffer.getvalue()
                if len(data) < self.max_bytes:
                    return data, candidate.width, candidate.height
        raise ValueError('图片无法压缩到限制大小以内')
