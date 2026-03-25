from app.models.cat import Cat


def test_create_post_accepts_single_file_field(client, db_session, user_headers, sample_image_bytes) -> None:
    cat = Cat(name='阿橘', campus='east', breed='田园', gender='male', sterilized=False, location='教学楼', personality_tags='[]', description='常驻教学楼', status='visible')
    db_session.add(cat)
    db_session.commit()
    db_session.refresh(cat)

    response = client.post(
        '/api/posts',
        headers=user_headers,
        data={'title': '单图帖子', 'content': '只带一张图片', 'related_cat_id': str(cat.id)},
        files={'files': ('post.png', sample_image_bytes, 'image/png')},
    )
    assert response.status_code == 201
    assert response.json()['images'][0]['file_path'].endswith('.webp')


def test_post_comment_and_owner_permissions(client, db_session, user_headers, other_user_headers, normal_user, sample_image_bytes) -> None:
    cat = Cat(name='团子', campus='east', breed='田园', gender='male', sterilized=False, location='食堂', personality_tags='[]', description='常驻食堂', status='visible')
    db_session.add(cat)
    db_session.commit()
    db_session.refresh(cat)

    create_post = client.post(
        '/api/posts',
        headers=user_headers,
        data={'title': '今天喂到团子', 'content': '它今天状态很好', 'related_cat_id': str(cat.id)},
        files=[('files', ('post.png', sample_image_bytes, 'image/png'))],
    )
    assert create_post.status_code == 201
    post_id = create_post.json()['id']
    assert create_post.json()['author']['id'] == normal_user.id

    comment = client.post('/api/comments', headers=user_headers, json={'post_id': post_id, 'content': '太可爱了'})
    assert comment.status_code == 201
    comment_id = comment.json()['id']

    reply = client.post('/api/comments', headers=user_headers, json={'post_id': post_id, 'parent_id': comment_id, 'content': '下次一起喂'})
    assert reply.status_code == 201

    detail = client.get(f'/api/posts/{post_id}')
    assert detail.status_code == 200
    assert detail.json()['comments'][0]['replies'][0]['content'] == '下次一起喂'

    forbidden = client.put(
        f'/api/posts/{post_id}',
        headers=other_user_headers,
        data={'title': '改标题', 'content': '改内容', 'related_cat_id': str(cat.id)},
    )
    assert forbidden.status_code == 403

    update_own = client.put(
        f'/api/posts/{post_id}',
        headers=user_headers,
        data={'title': '更新标题', 'content': '更新内容', 'related_cat_id': str(cat.id)},
    )
    assert update_own.status_code == 200
    assert update_own.json()['title'] == '更新标题'

    delete_comment = client.delete(f'/api/comments/{comment_id}', headers=user_headers)
    assert delete_comment.status_code == 204
