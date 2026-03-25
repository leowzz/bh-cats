def test_register_login_and_profile_flow(client) -> None:
    register = client.post(
        '/api/auth/register',
        json={
            'email': 'user@example.com',
            'password': 'Secret123!',
            'nickname': 'mimi',
        },
    )
    assert register.status_code == 201
    assert register.json()['email'] == 'user@example.com'

    login = client.post(
        '/api/auth/login',
        json={
            'email': 'user@example.com',
            'password': 'Secret123!',
        },
    )
    assert login.status_code == 200
    token = login.json()['access_token']

    profile = client.get('/api/auth/me', headers={'Authorization': f'Bearer {token}'})
    assert profile.status_code == 200
    assert profile.json()['email'] == 'user@example.com'
    assert profile.json()['role'] == 'user'
