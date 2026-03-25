import json


def test_admin_can_create_update_and_hide_cat(client, admin_headers, sample_image_bytes) -> None:
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

    list_response = client.get('/api/cats', params={'campus': 'east'})
    assert list_response.status_code == 200
    assert list_response.json()['items'][0]['name'] == '小白'

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
