# 北华大学猫猫网站 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack campus cat archive and community system with FastAPI, React, Tailwind CSS, SQLite, Docker, local image storage, and automatic WebP conversion under 400KB.

**Architecture:** Use a single FastAPI backend for REST APIs, auth, SQLite persistence, media handling, and admin operations. Use a single React + Tailwind frontend for both public and admin experiences, sharing a common data layer and route tree while keeping UI responsibilities separated by feature modules.

**Tech Stack:** Python 3.12, FastAPI, SQLAlchemy, Pydantic, Pillow, pytest, React, Vite, TypeScript, Tailwind CSS, React Router, TanStack Query, Docker Compose, SQLite

---

## File Structure

- `backend/pyproject.toml` - Python dependencies and pytest config
- `backend/app/main.py` - FastAPI app bootstrap, router wiring, static media mounting
- `backend/app/core/config.py` - settings, env loading, image limits, admin bootstrap config
- `backend/app/core/security.py` - password hashing and JWT helpers
- `backend/app/db/session.py` - SQLAlchemy engine/session setup
- `backend/app/db/base.py` - model metadata registry
- `backend/app/db/init_db.py` - schema creation and admin initialization
- `backend/app/models/*.py` - SQLAlchemy models for users, cats, posts, comments, banners, likes, images
- `backend/app/schemas/*.py` - request/response schemas
- `backend/app/services/*.py` - business logic for auth, media, likes, homepage scoring, cats, posts, comments, banners
- `backend/app/api/*.py` - REST routers
- `backend/tests/**/*.py` - unit and API tests
- `backend/storage/.gitkeep` - media root placeholder
- `frontend/package.json` - frontend scripts and dependencies
- `frontend/vite.config.ts` - Vite config and dev proxy
- `frontend/tailwind.config.ts` - design tokens and Tailwind theme
- `frontend/src/main.tsx` - React bootstrap
- `frontend/src/app/router.tsx` - route definitions for public and admin pages
- `frontend/src/app/providers.tsx` - query/auth providers
- `frontend/src/lib/api.ts` - API client
- `frontend/src/lib/auth.ts` - token and device ID persistence
- `frontend/src/features/**` - feature-based pages, hooks, forms, and components
- `frontend/src/styles.css` - Tailwind layers and base tokens
- `frontend/src/test/**` - frontend tests for core flows
- `docker-compose.yml` - local orchestration
- `backend/Dockerfile` - backend container
- `frontend/Dockerfile` - frontend container
- `.env.example` - runtime config template
- `README.md` - setup and usage docs

### Task 1: Scaffold backend project and app bootstrapping

**Files:**
- Create: `backend/pyproject.toml`
- Create: `backend/app/main.py`
- Create: `backend/app/core/config.py`
- Create: `backend/app/db/session.py`
- Create: `backend/app/db/base.py`
- Create: `backend/app/db/init_db.py`
- Create: `backend/tests/test_health.py`

- [ ] **Step 1: Write the failing backend bootstrap tests**

```python
from fastapi.testclient import TestClient

from app.main import create_app


def test_health_check_returns_ok():
    client = TestClient(create_app())
    response = client.get('/api/health')
    assert response.status_code == 200
    assert response.json() == {'status': 'ok'}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && pytest tests/test_health.py -v`
Expected: FAIL because `app.main` and app factory do not exist yet.

- [ ] **Step 3: Write minimal backend scaffold**

Implement app factory, settings, SQLite session wiring placeholder, and health endpoint.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && pytest tests/test_health.py -v`
Expected: PASS

### Task 2: Implement database models and initialization

**Files:**
- Create: `backend/app/models/user.py`
- Create: `backend/app/models/cat.py`
- Create: `backend/app/models/post.py`
- Create: `backend/app/models/comment.py`
- Create: `backend/app/models/banner.py`
- Create: `backend/app/models/like.py`
- Create: `backend/app/models/__init__.py`
- Create: `backend/tests/test_db_init.py`
- Modify: `backend/app/db/base.py`
- Modify: `backend/app/db/init_db.py`

- [ ] **Step 1: Write failing tests for schema creation and admin bootstrap**

```python
def test_init_db_creates_tables_and_admin(session_factory, settings):
    init_db()
    inspector = inspect(settings.database_engine)
    assert 'users' in inspector.get_table_names()
    admin = session_factory().query(User).filter_by(email=settings.admin_email).one()
    assert admin.role == 'admin'
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && pytest tests/test_db_init.py -v`
Expected: FAIL because models and init logic do not exist yet.

- [ ] **Step 3: Implement SQLAlchemy models, enums, relationships, and init_db**

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && pytest tests/test_db_init.py -v`
Expected: PASS

### Task 3: Implement authentication and current-user dependencies

**Files:**
- Create: `backend/app/schemas/auth.py`
- Create: `backend/app/services/auth_service.py`
- Create: `backend/app/api/auth.py`
- Create: `backend/app/api/deps.py`
- Create: `backend/tests/test_auth_api.py`
- Modify: `backend/app/core/security.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Write failing API tests for register/login/profile access**

```python
def test_register_login_and_profile_flow(client):
    register = client.post('/api/auth/register', json={
        'email': 'user@example.com',
        'password': 'Secret123!',
        'nickname': 'mimi',
    })
    assert register.status_code == 201

    login = client.post('/api/auth/login', json={
        'email': 'user@example.com',
        'password': 'Secret123!',
    })
    token = login.json()['access_token']

    profile = client.get('/api/auth/me', headers={'Authorization': f'Bearer {token}'})
    assert profile.status_code == 200
    assert profile.json()['email'] == 'user@example.com'
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && pytest tests/test_auth_api.py -v`
Expected: FAIL because auth schemas/routes/services are missing.

- [ ] **Step 3: Implement password hashing, JWT, auth routes, and auth dependencies**

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && pytest tests/test_auth_api.py -v`
Expected: PASS

### Task 4: Implement image processing under 400KB

**Files:**
- Create: `backend/app/schemas/media.py`
- Create: `backend/app/services/media_service.py`
- Create: `backend/tests/test_media_service.py`
- Modify: `backend/app/core/config.py`

- [ ] **Step 1: Write failing tests for WebP conversion and size enforcement**

```python
def test_convert_image_to_webp_under_limit(tmp_path, sample_image_bytes):
    service = MediaService(media_root=tmp_path, max_bytes=400 * 1024)
    saved = service.process_upload(sample_image_bytes, owner_type='cats', owner_id=1)
    assert saved.file_path.endswith('.webp')
    assert saved.byte_size < 400 * 1024
    assert saved.thumb_byte_size < 400 * 1024
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && pytest tests/test_media_service.py -v`
Expected: FAIL because media service does not exist.

- [ ] **Step 3: Implement Pillow-based conversion, compression loop, thumbnail generation, and disk save**

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && pytest tests/test_media_service.py -v`
Expected: PASS

### Task 5: Implement cat archive APIs and homepage scoring

**Files:**
- Create: `backend/app/schemas/cat.py`
- Create: `backend/app/services/cat_service.py`
- Create: `backend/app/services/home_service.py`
- Create: `backend/app/api/cats.py`
- Create: `backend/app/api/home.py`
- Create: `backend/tests/test_cats_api.py`
- Create: `backend/tests/test_home_service.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Write failing tests for admin cat CRUD, list filtering, and best cat scoring**
- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && pytest tests/test_cats_api.py tests/test_home_service.py -v`
Expected: FAIL because routes and services are missing.

- [ ] **Step 3: Implement cat services, admin-only CRUD, public list/detail, view count increment, homepage summary, and today-best scoring**
- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && pytest tests/test_cats_api.py tests/test_home_service.py -v`
Expected: PASS

### Task 6: Implement banners management and public banner delivery

**Files:**
- Create: `backend/app/schemas/banner.py`
- Create: `backend/app/services/banner_service.py`
- Create: `backend/app/api/banners.py`
- Create: `backend/tests/test_banners_api.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Write failing tests for admin banner CRUD and sorted public banners**
- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && pytest tests/test_banners_api.py -v`
Expected: FAIL because banner logic is missing.

- [ ] **Step 3: Implement banner CRUD, image association, sorting, and active filtering**
- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && pytest tests/test_banners_api.py -v`
Expected: PASS

### Task 7: Implement posts, comments, and author permissions

**Files:**
- Create: `backend/app/schemas/post.py`
- Create: `backend/app/schemas/comment.py`
- Create: `backend/app/services/post_service.py`
- Create: `backend/app/services/comment_service.py`
- Create: `backend/app/api/posts.py`
- Create: `backend/app/api/comments.py`
- Create: `backend/tests/test_posts_api.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Write failing tests for post CRUD, comment replies, and owner-only edits/deletes**
- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && pytest tests/test_posts_api.py -v`
Expected: FAIL because post/comment routes and services are missing.

- [ ] **Step 3: Implement posts, nested comment responses, and permission enforcement**
- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && pytest tests/test_posts_api.py -v`
Expected: PASS

### Task 8: Implement like toggling for users and guests

**Files:**
- Create: `backend/app/schemas/like.py`
- Create: `backend/app/services/like_service.py`
- Create: `backend/app/api/likes.py`
- Create: `backend/tests/test_likes_api.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Write failing tests for guest/device likes and user likes toggle behavior**
- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && pytest tests/test_likes_api.py -v`
Expected: FAIL because like toggle logic is missing.

- [ ] **Step 3: Implement unified like toggling and counter synchronization**
- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && pytest tests/test_likes_api.py -v`
Expected: PASS

### Task 9: Scaffold frontend app shell and shared infrastructure

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/index.html`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/app/router.tsx`
- Create: `frontend/src/app/providers.tsx`
- Create: `frontend/src/styles.css`
- Create: `frontend/src/lib/api.ts`
- Create: `frontend/src/lib/auth.ts`
- Create: `frontend/src/test/app-shell.test.tsx`

- [ ] **Step 1: Write failing frontend test for app shell routing**
- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- app-shell.test.tsx`
Expected: FAIL because frontend app does not exist.

- [ ] **Step 3: Implement Vite React scaffold, router, providers, API client, auth store, and Tailwind setup**
- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- app-shell.test.tsx`
Expected: PASS

### Task 10: Implement public frontend pages

**Files:**
- Create: `frontend/src/features/home/HomePage.tsx`
- Create: `frontend/src/features/cats/CatsPage.tsx`
- Create: `frontend/src/features/cats/CatDetailPage.tsx`
- Create: `frontend/src/features/community/CommunityPage.tsx`
- Create: `frontend/src/features/community/PostDetailPage.tsx`
- Create: `frontend/src/features/auth/LoginPage.tsx`
- Create: `frontend/src/features/auth/RegisterPage.tsx`
- Create: `frontend/src/features/profile/ProfilePage.tsx`
- Create: `frontend/src/test/public-pages.test.tsx`

- [ ] **Step 1: Write failing tests for public navigation and key page renders**
- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- public-pages.test.tsx`
Expected: FAIL because public pages are missing.

- [ ] **Step 3: Implement homepage, cat list/detail, community feed/detail, auth pages, and profile page**
- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- public-pages.test.tsx`
Expected: PASS

### Task 11: Implement admin frontend pages and guarded routes

**Files:**
- Create: `frontend/src/features/admin/AdminDashboardPage.tsx`
- Create: `frontend/src/features/admin/AdminCatsPage.tsx`
- Create: `frontend/src/features/admin/AdminCatFormPage.tsx`
- Create: `frontend/src/features/admin/AdminBannersPage.tsx`
- Create: `frontend/src/features/admin/AdminRoute.tsx`
- Create: `frontend/src/test/admin-pages.test.tsx`
- Modify: `frontend/src/app/router.tsx`

- [ ] **Step 1: Write failing tests for admin route protection and admin page rendering**
- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- admin-pages.test.tsx`
Expected: FAIL because admin routes are missing.

- [ ] **Step 3: Implement admin pages, route guard, cat management forms, and banner management UI**
- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- admin-pages.test.tsx`
Expected: PASS

### Task 12: Add Docker, environment docs, and end-to-end wiring

**Files:**
- Create: `backend/Dockerfile`
- Create: `frontend/Dockerfile`
- Create: `docker-compose.yml`
- Create: `.env.example`
- Create: `README.md`
- Create: `backend/tests/test_smoke_app.py`

- [ ] **Step 1: Write failing smoke test for mounted media path and app startup config**
- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && pytest tests/test_smoke_app.py -v`
Expected: FAIL because deployment wiring is incomplete.

- [ ] **Step 3: Implement Dockerfiles, compose wiring, env docs, and final startup adjustments**
- [ ] **Step 4: Run backend and frontend test suites plus builds**

Run: `cd backend && pytest -v`
Expected: PASS

Run: `cd frontend && npm test -- --runInBand`
Expected: PASS

Run: `cd frontend && npm run build`
Expected: PASS

Run: `docker compose config`
Expected: PASS

## Execution Notes

- This workspace is not currently a git repository, so any plan step that says "commit" is intentionally omitted.
- Because subagent dispatch is not in scope for this request, execute inline in the current session.
- Follow TDD strictly for each backend and frontend feature: write the test first, run it to see the expected failure, then implement the minimum code to pass.
