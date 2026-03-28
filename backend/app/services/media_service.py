from io import BytesIO
from pathlib import Path
from typing import Any, Literal, Protocol
from urllib.parse import urlsplit
from uuid import uuid4

from PIL import Image

from app.core.config import Settings
from app.schemas.media import StoredMedia


class S3ClientProtocol(Protocol):
    def put_object(self, **kwargs: Any) -> Any: ...

    def delete_object(self, **kwargs: Any) -> Any: ...


def build_s3_client(*, endpoint: str, region: str, access_key: str, secret_key: str) -> S3ClientProtocol:
    try:
        import boto3
        from botocore.config import Config
    except ImportError as exc:
        raise RuntimeError('boto3 is required when STORAGE_BACKEND=s3') from exc

    return boto3.client(
        's3',
        endpoint_url=endpoint,
        region_name=region,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        config=Config(signature_version='s3v4', s3={'addressing_style': 'path'}),
    )


class MediaService:
    def __init__(
        self,
        media_root: Path,
        max_bytes: int = 400 * 1024,
        *,
        storage_backend: Literal['local', 's3'] = 'local',
        s3_endpoint: str = '',
        s3_region: str = 'us-east-1',
        s3_bucket: str = '',
        s3_access_key: str = '',
        s3_secret_key: str = '',
        s3_public_base_url: str = '',
        s3_client: S3ClientProtocol | None = None,
    ) -> None:
        self.media_root = Path(media_root)
        self.max_bytes = max_bytes
        self.storage_backend = storage_backend
        self.s3_endpoint = s3_endpoint
        self.s3_region = s3_region
        self.s3_bucket = s3_bucket
        self.s3_access_key = s3_access_key
        self.s3_secret_key = s3_secret_key
        self.s3_public_base_url = s3_public_base_url
        self._s3_client = s3_client

    @classmethod
    def from_settings(cls, settings: Settings) -> 'MediaService':
        return cls(
            media_root=settings.media_root,
            max_bytes=settings.image_max_bytes,
            storage_backend=settings.storage_backend,
            s3_endpoint=settings.s3_endpoint,
            s3_region=settings.s3_region,
            s3_bucket=settings.s3_bucket,
            s3_access_key=settings.s3_access_key,
            s3_secret_key=settings.s3_secret_key,
            s3_public_base_url=settings.s3_public_base_url,
        )

    def process_upload(self, file_bytes: bytes, owner_type: str, owner_id: int) -> StoredMedia:
        if self.storage_backend == 'local':
            owner_dir = self.media_root / owner_type / str(owner_id)
            owner_dir.mkdir(parents=True, exist_ok=True)

        image = Image.open(BytesIO(file_bytes))
        image = self._normalize_image(image)
        main_bytes, width, height = self._encode_under_limit(image)
        thumb_bytes, _, _ = self._encode_under_limit(image.copy(), max_dimension=480)

        token = uuid4().hex
        main_key = f'{owner_type}/{owner_id}/{token}.webp'
        thumb_key = f'{owner_type}/{owner_id}/{token}_thumb.webp'

        if self.storage_backend == 's3':
            self._put_s3_object(main_key, main_bytes)
            self._put_s3_object(thumb_key, thumb_bytes)
            main_path = self._public_url(main_key)
            thumb_path = self._public_url(thumb_key)
        else:
            (self.media_root / main_key).write_bytes(main_bytes)
            (self.media_root / thumb_key).write_bytes(thumb_bytes)
            main_path = main_key
            thumb_path = thumb_key

        return StoredMedia(
            file_path=main_path,
            thumb_path=thumb_path,
            byte_size=len(main_bytes),
            thumb_byte_size=len(thumb_bytes),
            width=width,
            height=height,
        )

    def delete(self, path_or_url: str) -> None:
        if not path_or_url:
            return
        if self.storage_backend == 's3':
            self._s3_client_or_raise().delete_object(Bucket=self._bucket_or_raise(), Key=self._object_key(path_or_url))
            return

        file_path = self.media_root / path_or_url.lstrip('/')
        if file_path.exists():
            file_path.unlink()

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

    def _put_s3_object(self, key: str, body: bytes) -> None:
        self._s3_client_or_raise().put_object(
            Bucket=self._bucket_or_raise(),
            Key=key,
            Body=body,
            ContentType='image/webp',
        )

    def _public_url(self, key: str) -> str:
        base = self.s3_public_base_url.strip() or f'{self.s3_endpoint.rstrip("/")}/{self._bucket_or_raise()}'
        return f'{base.rstrip("/")}/{key.lstrip("/")}'

    def _object_key(self, path_or_url: str) -> str:
        if path_or_url.startswith(('http://', 'https://')):
            path = urlsplit(path_or_url).path
            base_path = urlsplit(self._public_url('')).path.rstrip('/')
            if base_path and path.startswith(f'{base_path}/'):
                return path[len(base_path) + 1 :]
            return path.lstrip('/')
        return path_or_url.lstrip('/')

    def _bucket_or_raise(self) -> str:
        if not self.s3_bucket:
            raise ValueError('S3 bucket is not configured')
        return self.s3_bucket

    def _s3_client_or_raise(self) -> S3ClientProtocol:
        if self.storage_backend != 's3':
            raise RuntimeError('S3 client requested while storage backend is not s3')
        if self._s3_client is None:
            if not self.s3_endpoint or not self.s3_access_key or not self.s3_secret_key:
                raise ValueError('S3 endpoint and credentials must be configured when STORAGE_BACKEND=s3')
            self._s3_client = build_s3_client(
                endpoint=self.s3_endpoint,
                region=self.s3_region,
                access_key=self.s3_access_key,
                secret_key=self.s3_secret_key,
            )
        return self._s3_client
