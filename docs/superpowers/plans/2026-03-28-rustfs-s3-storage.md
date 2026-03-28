# RustFS S3 Storage Integration Plan

## Scope

Replace the backend's local image file storage with S3-compatible object storage backed by `rustfs/rustfs` in Docker Compose, while preserving the existing image compression pipeline and keeping frontend changes minimal by returning absolute image URLs.

## File Map

- `docker-compose.yml`: add RustFS service, persistent data volume, and a one-shot bucket initialization service.
- `.env`: document/define compose-time defaults for RustFS credentials and public URL.
- `backend/pyproject.toml`: add the S3 client dependency used by the backend.
- `backend/app/core/config.py`: add storage backend and S3 settings while preserving local filesystem compatibility.
- `backend/app/services/media_service.py`: switch from direct local file writes to a backend-aware storage implementation and add delete support.
- `backend/app/services/cat_service.py`: replace direct filesystem deletion with storage-backed deletion.
- `backend/app/services/post_service.py`: replace directory removal logic with storage-backed deletion for post images.
- `backend/app/services/banner_service.py`: replace directory removal logic with storage-backed deletion for banner images.
- `backend/app/main.py`: mount `/media` only for local filesystem storage mode.
- `backend/tests/conftest.py`: add S3-related test fixtures and env defaults.
- `backend/tests/test_media_service.py`: add failing tests for S3 upload URL generation and delete behavior.
- `backend/tests/test_smoke_app.py` or a new backend app test file: assert static files are only mounted for local mode.
- `README.md`: update deployment and storage documentation for RustFS.

## Execution Steps

### Step 1: Write failing tests

- Add a fake S3 client fixture so tests can verify object keys, payload uploads, and deletions without external services.
- Add tests that assert:
  - `MediaService.process_upload()` uploads both original and thumbnail objects and returns absolute public URLs in S3 mode.
  - `MediaService.delete()` removes S3-backed objects.
  - `create_app()` mounts `/media` only when storage backend is `local`.

Verification:

```bash
cd backend && pytest tests/test_media_service.py tests/test_smoke_app.py -v
```

Expected: FAIL before implementation because S3 settings and behavior do not exist yet.

### Step 2: Implement backend storage support

- Add S3 config fields with sane defaults and a helper for deriving object public URLs.
- Add an S3 client-backed code path in `MediaService` while keeping local writes working.
- Expose a storage-aware delete API and update cat/post/banner services to use it instead of direct filesystem operations.
- Ensure replacement flows delete previous image objects before writing new ones.

Verification:

```bash
cd backend && pytest tests/test_media_service.py tests/test_cats_api.py tests/test_posts_api.py tests/test_banners_api.py tests/test_smoke_app.py -v
```

Expected: PASS.

### Step 3: Wire Docker Compose and docs

- Add `rustfs` and `rustfs-init` services to `docker-compose.yml`.
- Set backend environment defaults to use S3 mode and point to RustFS inside the compose network.
- Document the service URLs, credentials, and bucket behavior in `README.md`.

Verification:

```bash
docker compose config
```

Expected: valid compose output with resolved RustFS service definitions.

## Notes

- RustFS quota support is not wired into this plan because the currently available public docs do not clearly document a compose-level storage size limit setting. Leave quota enforcement for manual configuration unless a verified setting surfaces during implementation.
