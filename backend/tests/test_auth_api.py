def test_register_login_and_profile_flow(client) -> None:
    register = client.post(
        '/api/auth/register',
        json={
            'username': 'mimi_cat',
            'email': 'user@example.com',
            'password': 'Secret123!',
            'nickname': 'mimi',
        },
    )
    assert register.status_code == 201
    assert register.json()['username'] == 'mimi_cat'
    assert register.json()['email'] == 'user@example.com'

    login_by_username = client.post(
        '/api/auth/login',
        json={
            'account': 'mimi_cat',
            'password': 'Secret123!',
        },
    )
    assert login_by_username.status_code == 200

    login_by_email = client.post(
        '/api/auth/login',
        json={
            'account': 'user@example.com',
            'password': 'Secret123!',
        },
    )
    assert login_by_email.status_code == 200
    token = login_by_username.json()['access_token']

    profile = client.get('/api/auth/me', headers={'Authorization': f'Bearer {token}'})
    assert profile.status_code == 200
    assert profile.json()['username'] == 'mimi_cat'
    assert profile.json()['email'] == 'user@example.com'
    assert profile.json()['role'] == 'user'
