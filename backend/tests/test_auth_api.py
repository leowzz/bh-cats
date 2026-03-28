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


def test_change_password_updates_credentials_and_invalidates_old_password(client) -> None:
    register = client.post(
        '/api/auth/register',
        json={
            'username': 'change_pwd_user',
            'email': 'change@example.com',
            'password': 'Secret123!',
            'nickname': '改密用户',
        },
    )
    assert register.status_code == 201

    login = client.post(
        '/api/auth/login',
        json={
            'account': 'change_pwd_user',
            'password': 'Secret123!',
        },
    )
    assert login.status_code == 200
    token = login.json()['access_token']

    change_password = client.post(
        '/api/auth/change-password',
        headers={'Authorization': f'Bearer {token}'},
        json={
            'current_password': 'Secret123!',
            'new_password': 'BrandNew123!',
        },
    )
    assert change_password.status_code == 204

    old_login = client.post(
        '/api/auth/login',
        json={
            'account': 'change_pwd_user',
            'password': 'Secret123!',
        },
    )
    assert old_login.status_code == 400

    new_login = client.post(
        '/api/auth/login',
        json={
            'account': 'change_pwd_user',
            'password': 'BrandNew123!',
        },
    )
    assert new_login.status_code == 200


def test_change_password_rejects_wrong_current_password_and_same_password(client) -> None:
    register = client.post(
        '/api/auth/register',
        json={
            'username': 'reject_pwd_user',
            'email': 'reject@example.com',
            'password': 'Secret123!',
            'nickname': '拒绝用户',
        },
    )
    assert register.status_code == 201

    login = client.post(
        '/api/auth/login',
        json={
            'account': 'reject_pwd_user',
            'password': 'Secret123!',
        },
    )
    assert login.status_code == 200
    token = login.json()['access_token']

    wrong_current = client.post(
        '/api/auth/change-password',
        headers={'Authorization': f'Bearer {token}'},
        json={
            'current_password': 'Wrong123!',
            'new_password': 'BrandNew123!',
        },
    )
    assert wrong_current.status_code == 400

    same_password = client.post(
        '/api/auth/change-password',
        headers={'Authorization': f'Bearer {token}'},
        json={
            'current_password': 'Secret123!',
            'new_password': 'Secret123!',
        },
    )
    assert same_password.status_code == 400
