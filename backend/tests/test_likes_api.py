from app.models.cat import Cat


def test_guest_and_user_like_toggle(client, db_session, user_headers, admin_headers) -> None:
    cat = Cat(name='煤球', campus='north', breed='黑猫', gender='unknown', sterilized=False, location='宿舍', personality_tags='[]', description='黑色小猫', status='visible')
    db_session.add(cat)
    db_session.commit()
    db_session.refresh(cat)

    guest_like = client.post('/api/likes/toggle', json={'target_type': 'cat', 'target_id': cat.id, 'device_id': 'device-1'})
    assert guest_like.status_code == 200
    assert guest_like.json()['liked'] is True
    assert guest_like.json()['like_count'] == 1

    guest_unlike = client.post('/api/likes/toggle', json={'target_type': 'cat', 'target_id': cat.id, 'device_id': 'device-1'})
    assert guest_unlike.status_code == 200
    assert guest_unlike.json()['liked'] is False
    assert guest_unlike.json()['like_count'] == 0

    user_like = client.post('/api/likes/toggle', headers=user_headers, json={'target_type': 'cat', 'target_id': cat.id})
    assert user_like.status_code == 200
    assert user_like.json()['liked'] is True
    assert user_like.json()['like_count'] == 1

    delete_response = client.delete(f'/api/admin/cats/{cat.id}', headers=admin_headers)
    assert delete_response.status_code == 204

    like_deleted_target = client.post('/api/likes/toggle', json={'target_type': 'cat', 'target_id': cat.id, 'device_id': 'device-2'})
    assert like_deleted_target.status_code == 404
