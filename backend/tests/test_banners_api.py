
def test_admin_banner_crud_and_public_order(client, admin_headers, sample_image_bytes) -> None:
    first = client.post(
        '/api/admin/banners',
        headers=admin_headers,
        data={'title': '春日喂猫', 'subtitle': '一起关注校园猫', 'link_url': '/cats', 'sort_order': '2', 'is_active': 'true'},
        files=[('files', ('banner1.png', sample_image_bytes, 'image/png'))],
    )
    assert first.status_code == 201

    second = client.post(
        '/api/admin/banners',
        headers=admin_headers,
        data={'title': '校园社区', 'subtitle': '分享猫猫见闻', 'link_url': '/community', 'sort_order': '1', 'is_active': 'true'},
        files=[('files', ('banner2.png', sample_image_bytes, 'image/png'))],
    )
    assert second.status_code == 201

    public_list = client.get('/api/banners')
    assert public_list.status_code == 200
    assert [item['title'] for item in public_list.json()] == ['校园社区', '春日喂猫']
