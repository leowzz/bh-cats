from pathlib import Path

from app.services.media_service import MediaService


def test_convert_image_to_webp_under_limit(tmp_path, sample_image_bytes) -> None:
    service = MediaService(media_root=tmp_path, max_bytes=400 * 1024)
    saved = service.process_upload(sample_image_bytes, owner_type='cats', owner_id=1)
    assert saved.file_path.endswith('.webp')
    assert saved.byte_size < 400 * 1024
    assert saved.thumb_byte_size < 400 * 1024


class FakeS3Client:
    def __init__(self) -> None:
        self.put_calls: list[dict] = []
        self.delete_calls: list[dict] = []

    def put_object(self, **kwargs) -> None:
        self.put_calls.append(kwargs)

    def delete_object(self, **kwargs) -> None:
        self.delete_calls.append(kwargs)


def test_s3_storage_returns_public_urls_and_uploads_objects(sample_image_bytes) -> None:
    client = FakeS3Client()
    service = MediaService(
        media_root=Path('unused'),
        max_bytes=400 * 1024,
        storage_backend='s3',
        s3_bucket='bh-cats-media',
        s3_public_base_url='http://localhost:9000/bh-cats-media',
        s3_client=client,
    )

    saved = service.process_upload(sample_image_bytes, owner_type='cats', owner_id=1)

    assert saved.file_path.startswith('http://localhost:9000/bh-cats-media/cats/1/')
    assert saved.thumb_path.startswith('http://localhost:9000/bh-cats-media/cats/1/')
    assert len(client.put_calls) == 2
    assert client.put_calls[0]['Bucket'] == 'bh-cats-media'
    assert client.put_calls[0]['Key'].startswith('cats/1/')
    assert client.put_calls[0]['ContentType'] == 'image/webp'


def test_s3_storage_delete_uses_object_key_from_public_url() -> None:
    client = FakeS3Client()
    service = MediaService(
        media_root=Path('unused'),
        storage_backend='s3',
        s3_bucket='bh-cats-media',
        s3_public_base_url='http://localhost:9000/bh-cats-media',
        s3_client=client,
    )

    service.delete('http://localhost:9000/bh-cats-media/cats/1/example.webp')

    assert client.delete_calls == [{'Bucket': 'bh-cats-media', 'Key': 'cats/1/example.webp'}]
