from app.services.media_service import MediaService


def test_convert_image_to_webp_under_limit(tmp_path, sample_image_bytes) -> None:
    service = MediaService(media_root=tmp_path, max_bytes=400 * 1024)
    saved = service.process_upload(sample_image_bytes, owner_type='cats', owner_id=1)
    assert saved.file_path.endswith('.webp')
    assert saved.byte_size < 400 * 1024
    assert saved.thumb_byte_size < 400 * 1024
