import json


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


def test_admin_can_create_update_hide_list_detail_and_delete_cat(client, admin_headers, sample_image_bytes) -> None:
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

    deleted_detail = client.get(f'/api/admin/cats/{cat_id}', headers=admin_headers)
    assert deleted_detail.status_code == 404
