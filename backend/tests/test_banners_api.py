def test_admin_can_create_banner_with_single_file_field(client, admin_headers, sample_image_bytes) -> None:
    response = client.post(
        '/api/admin/banners',
        headers=admin_headers,
        data={'title': '单图轮播', 'subtitle': '只有一张图', 'link_url': '/cats', 'sort_order': '1', 'is_active': 'true'},
        files={'files': ('banner.png', sample_image_bytes, 'image/png')},
    )
    assert response.status_code == 201
    assert response.json()['images'][0]['file_path'].endswith('.webp')


from app.models.banner import Banner


def test_admin_banner_full_crud_and_public_order(client, admin_headers, sample_image_bytes, db_session) -> None:
    first = client.post(
        '/api/admin/banners',
        headers=admin_headers,
        data={'title': '春日喂猫', 'subtitle': '一起关注校园猫', 'link_url': '/cats', 'sort_order': '2', 'is_active': 'true'},
        files=[('files', ('banner1.png', sample_image_bytes, 'image/png'))],
    )
    assert first.status_code == 201
    first_id = first.json()['id']

    second = client.post(
        '/api/admin/banners',
        headers=admin_headers,
        data={'title': '校园社区', 'subtitle': '分享猫猫见闻', 'link_url': '/community', 'sort_order': '1', 'is_active': 'true'},
        files=[('files', ('banner2.png', sample_image_bytes, 'image/png'))],
    )
    assert second.status_code == 201
    second_id = second.json()['id']

    admin_list = client.get('/api/admin/banners', headers=admin_headers)
    assert admin_list.status_code == 200
    assert [item['id'] for item in admin_list.json()] == [second_id, first_id]

    admin_detail = client.get(f'/api/admin/banners/{first_id}', headers=admin_headers)
    assert admin_detail.status_code == 200
    assert admin_detail.json()['title'] == '春日喂猫'

    update = client.put(
        f'/api/admin/banners/{first_id}',
        headers=admin_headers,
        data={'title': '春季喂猫指南', 'subtitle': '一起照顾校园猫', 'link_url': '/cats', 'sort_order': '3', 'is_active': 'false'},
    )
    assert update.status_code == 200
    assert update.json()['title'] == '春季喂猫指南'
    assert update.json()['is_active'] is False

    public_list = client.get('/api/banners')
    assert public_list.status_code == 200
    assert [item['title'] for item in public_list.json()] == ['校园社区']

    delete = client.delete(f'/api/admin/banners/{second_id}', headers=admin_headers)
    assert delete.status_code == 204

    db_session.expire_all()
    deleted_banner = db_session.get(Banner, second_id)
    assert deleted_banner is not None
    assert deleted_banner.deleted_at is not None

    admin_list_after_delete = client.get('/api/admin/banners', headers=admin_headers)
    assert admin_list_after_delete.status_code == 200
    assert [item['id'] for item in admin_list_after_delete.json()] == [first_id]

    deleted_detail = client.get(f'/api/admin/banners/{second_id}', headers=admin_headers)
    assert deleted_detail.status_code == 404
