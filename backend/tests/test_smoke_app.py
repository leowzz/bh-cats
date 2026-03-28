def test_app_exposes_home_and_media_mount() -> None:
    from fastapi.testclient import TestClient

    from app.main import create_app

    with TestClient(create_app()) as client:
        response = client.get('/api/home')
    assert response.status_code == 200
    payload = response.json()
    assert 'stats' in payload
    assert 'hot_cats' in payload


def test_app_skips_media_mount_in_s3_mode(monkeypatch) -> None:
    from app.core.config import get_settings
    from app.main import create_app

    monkeypatch.setenv('STORAGE_BACKEND', 's3')
    monkeypatch.setenv('S3_ENDPOINT', 'http://rustfs:9000')
    monkeypatch.setenv('S3_BUCKET', 'bh-cats-media')
    monkeypatch.setenv('S3_ACCESS_KEY', 'rustfsadmin')
    monkeypatch.setenv('S3_SECRET_KEY', 'rustfsadmin')
    monkeypatch.setenv('S3_PUBLIC_BASE_URL', 'http://localhost:9000/bh-cats-media')
    get_settings.cache_clear()

    app = create_app()

    assert '/media' not in {route.path for route in app.routes}

    get_settings.cache_clear()
