import json

from app.models.cat import Cat


def test_admin_can_create_cat_with_single_file_field(client, admin_headers, sample_image_bytes) -> None:
    response = client.post(
        '/api/admin/cats',
        headers=admin_headers,
        data={
            'name': '单图猫',
            'campus': 'east',
            'breed': '中华田园猫',
            'gender': 'female',
            'sterilized': 'true',
            'location': '教学楼',
            'personality_tags': json.dumps(['亲人']),
            'description': '只上传了一张图',
        },
        files={'files': ('cat.png', sample_image_bytes, 'image/png')},
    )
    assert response.status_code == 201
    assert response.json()['images'][0]['file_path'].endswith('.webp')


def test_admin_can_manage_cat_images_incrementally_and_home_returns_cover(client, admin_headers, sample_image_bytes) -> None:
    create_response = client.post(
        '/api/admin/cats',
        headers=admin_headers,
        data={
            'name': '图集猫',
            'campus': 'east',
            'breed': '中华田园猫',
            'gender': 'female',
            'sterilized': 'true',
            'location': '实验楼',
            'personality_tags': json.dumps(['亲人', '爱拍照']),
            'description': '有多张图片的猫咪',
        },
        files=[
            ('files', ('cat-1.png', sample_image_bytes, 'image/png')),
            ('files', ('cat-2.png', sample_image_bytes, 'image/png')),
        ],
    )
    assert create_response.status_code == 201
    created_images = create_response.json()['images']
    assert len(created_images) == 2
    assert created_images[0]['is_cover'] is True

    update_response = client.put(
        f"/api/admin/cats/{create_response.json()['id']}",
        headers=admin_headers,
        data={
            'name': '图集猫',
            'campus': 'east',
            'breed': '中华田园猫',
            'gender': 'female',
            'sterilized': 'true',
            'location': '实验楼',
            'personality_tags': json.dumps(['亲人', '爱拍照']),
            'description': '有多张图片的猫咪',
            'status': 'visible',
            'remove_image_ids': json.dumps([created_images[0]['id']]),
            'cover_image_id': str(created_images[1]['id']),
        },
        files=[('files', ('cat-3.png', sample_image_bytes, 'image/png'))],
    )
    assert update_response.status_code == 200
    updated_images = update_response.json()['images']
    assert len(updated_images) == 2
    assert updated_images[0]['id'] == created_images[1]['id']
    assert updated_images[0]['is_cover'] is True
    assert updated_images[1]['is_cover'] is False

    home_response = client.get('/api/home')
    assert home_response.status_code == 200
    hot_cat = next(item for item in home_response.json()['hot_cats'] if item['id'] == create_response.json()['id'])
    assert hot_cat['images'][0]['id'] == created_images[1]['id']
    assert hot_cat['images'][0]['is_cover'] is True


def test_admin_can_create_update_hide_list_detail_and_delete_cat(client, admin_headers, sample_image_bytes, db_session) -> None:
    create_response = client.post(
        '/api/admin/cats',
        headers=admin_headers,
        data={
            'name': '小白',
            'campus': 'east',
            'breed': '中华田园猫',
            'gender': 'female',
            'sterilized': 'true',
            'location': '图书馆附近',
            'personality_tags': json.dumps(['亲人', '贪吃']),
            'description': '经常在图书馆附近出没',
        },
        files=[('files', ('cat.png', sample_image_bytes, 'image/png'))],
    )
    assert create_response.status_code == 201
    cat_id = create_response.json()['id']
    assert create_response.json()['images'][0]['file_path'].endswith('.webp')

    admin_list_response = client.get('/api/admin/cats', headers=admin_headers)
    assert admin_list_response.status_code == 200
    assert admin_list_response.json()['items'][0]['id'] == cat_id

    admin_detail_response = client.get(f'/api/admin/cats/{cat_id}', headers=admin_headers)
    assert admin_detail_response.status_code == 200
    assert admin_detail_response.json()['description'] == '经常在图书馆附近出没'

    public_list_response = client.get('/api/cats', params={'campus': 'east'})
    assert public_list_response.status_code == 200
    assert public_list_response.json()['items'][0]['name'] == '小白'

    detail_response = client.get(f'/api/cats/{cat_id}')
    assert detail_response.status_code == 200
    assert detail_response.json()['view_count'] == 1

    update_response = client.put(
        f'/api/admin/cats/{cat_id}',
        headers=admin_headers,
        data={
            'name': '小白白',
            'campus': 'south',
            'breed': '中华田园猫',
            'gender': 'female',
            'sterilized': 'false',
            'location': '操场',
            'personality_tags': json.dumps(['胆小']),
            'description': '更新后的简介',
            'status': 'hidden',
        },
    )
    assert update_response.status_code == 200
    assert update_response.json()['name'] == '小白白'
    assert update_response.json()['status'] == 'hidden'

    hidden_list = client.get('/api/cats', params={'campus': 'south'})
    assert hidden_list.status_code == 200
    assert hidden_list.json()['items'] == []

    delete_response = client.delete(f'/api/admin/cats/{cat_id}', headers=admin_headers)
    assert delete_response.status_code == 204

    db_session.expire_all()
    deleted_cat = db_session.get(Cat, cat_id)
    assert deleted_cat is not None
    assert deleted_cat.deleted_at is not None

    admin_list_after_delete = client.get('/api/admin/cats', headers=admin_headers)
    assert admin_list_after_delete.status_code == 200
    assert admin_list_after_delete.json()['items'] == []

    public_detail_after_delete = client.get(f'/api/cats/{cat_id}')
    assert public_detail_after_delete.status_code == 404

    deleted_detail = client.get(f'/api/admin/cats/{cat_id}', headers=admin_headers)
    assert deleted_detail.status_code == 404
