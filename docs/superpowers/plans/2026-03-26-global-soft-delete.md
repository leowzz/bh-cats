# Global Soft Delete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert all destructive deletes in the system to soft deletes so records and local media stay on disk while deleted content disappears from normal product flows.

**Architecture:** Add a shared `deleted_at` tombstone field to cats, banners, posts, and comments; migrate existing SQLite databases at startup; and centralize service-layer filtering so public/admin/user-owned reads exclude soft-deleted rows by default. Keep existing `status` and `is_active` fields for visibility/publishing only, and update count/ownership logic to ignore deleted descendants.

**Tech Stack:** FastAPI, SQLAlchemy ORM, SQLite, pytest

---

### Task 1: Add persistence support for soft deletes

**Files:**
- Modify: `backend/app/models/cat.py`
- Modify: `backend/app/models/banner.py`
- Modify: `backend/app/models/post.py`
- Modify: `backend/app/models/comment.py`
- Modify: `backend/app/db/init_db.py`
- Test: `backend/tests/test_db_init.py`

- [ ] **Step 1: Write failing migration coverage**
- [ ] **Step 2: Run `pytest backend/tests/test_db_init.py -v` and confirm it fails**
- [ ] **Step 3: Add `deleted_at` columns and SQLite startup backfill/ALTER logic**
- [ ] **Step 4: Re-run `pytest backend/tests/test_db_init.py -v` and confirm it passes**
- [ ] **Step 5: Commit migration support**

### Task 2: Convert cats and banners delete flows to soft delete

**Files:**
- Modify: `backend/app/services/cat_service.py`
- Modify: `backend/app/services/banner_service.py`
- Modify: `backend/app/services/home_service.py`
- Modify: `backend/tests/test_cats_api.py`
- Modify: `backend/tests/test_banners_api.py`

- [ ] **Step 1: Add failing tests asserting deleted cats/banners stay in DB but disappear from reads**
- [ ] **Step 2: Run focused pytest commands and confirm failures**
- [ ] **Step 3: Implement soft delete service logic and read filters**
- [ ] **Step 4: Re-run focused tests and confirm passes**
- [ ] **Step 5: Commit cat/banner soft delete changes**

### Task 3: Convert posts and comments delete flows to soft delete

**Files:**
- Modify: `backend/app/services/post_service.py`
- Modify: `backend/app/services/comment_service.py`
- Modify: `backend/app/services/home_service.py`
- Modify: `backend/app/services/like_service.py`
- Modify: `backend/tests/test_posts_api.py`
- Modify: `backend/tests/test_likes_api.py`

- [ ] **Step 1: Add failing tests for soft-deleted posts/comments, hidden comment trees, and deleted-like targets**
- [ ] **Step 2: Run focused pytest commands and confirm failures**
- [ ] **Step 3: Implement tombstone-aware reads, counts, ownership checks, and delete behavior**
- [ ] **Step 4: Re-run focused tests and confirm passes**
- [ ] **Step 5: Commit post/comment soft delete changes**

### Task 4: Full verification and regression pass

**Files:**
- Modify: `backend/tests/test_db_init.py`
- Modify: `backend/tests/test_cats_api.py`
- Modify: `backend/tests/test_banners_api.py`
- Modify: `backend/tests/test_posts_api.py`
- Modify: `backend/tests/test_likes_api.py`
- Modify: `backend/tests/test_home_service.py`

- [ ] **Step 1: Run full backend test suite with `cd backend && pytest -v`**
- [ ] **Step 2: If anything fails, fix only the proven regression**
- [ ] **Step 3: Re-run `cd backend && pytest -v` until green**
- [ ] **Step 4: Commit final verification pass**
