from fastapi.testclient import TestClient

from app.main import create_app


def test_app_exposes_home_and_media_mount() -> None:
    with TestClient(create_app()) as client:
        response = client.get('/api/home')
    assert response.status_code == 200
    payload = response.json()
    assert 'stats' in payload
    assert 'hot_cats' in payload
