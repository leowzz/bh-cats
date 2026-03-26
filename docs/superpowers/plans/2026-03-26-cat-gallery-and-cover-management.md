# Cat Gallery And Cover Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add cat cover thumbnails, like actions, full-image preview, and admin image management without destructive upload replacement.

**Architecture:** Extend the cat image/domain layer so cover ordering and incremental image mutations are handled on the backend, then add small shared frontend components for image preview and cat-like actions that can be reused across the home page, cat archive, detail page, and admin tooling. Card covers remain non-clickable while detail/admin image collections open a minimal modal preview.

**Tech Stack:** FastAPI, SQLAlchemy, React, TanStack Query, Tailwind CSS, Vitest

---

### Task 1: Extend cat backend for image management and cover ordering

**Files:**
- Modify: `backend/app/api/cats.py`
- Modify: `backend/app/models/cat.py`
- Modify: `backend/app/schemas/cat.py`
- Modify: `backend/app/services/cat_service.py`
- Modify: `backend/app/api/home.py`
- Modify: `backend/app/services/home_service.py`
- Test: `backend/tests/test_cats_api.py`

- [ ] **Step 1: Write failing tests for incremental image management, cover selection, and home hot-cat thumbnail payloads**
- [ ] **Step 2: Run focused backend tests and verify red state**
- [ ] **Step 3: Implement image ordering, remove-image handling, set-cover handling, and hot-cat image payloads**
- [ ] **Step 4: Re-run focused backend tests and verify green**
- [ ] **Step 5: Commit backend cat image-management changes**

### Task 2: Add reusable frontend image preview and cat-like UI

**Files:**
- Create: `frontend/src/features/cats/CatImageLightbox.tsx`
- Create: `frontend/src/features/cats/CatLikeButton.tsx`
- Modify: `frontend/src/test/public-pages.test.tsx`

- [ ] **Step 1: Add failing frontend tests for cat like action and image preview modal behavior**
- [ ] **Step 2: Run `cd frontend && npm test -- public-pages.test.tsx` and verify failures**
- [ ] **Step 3: Implement minimal reusable lightbox and like button components**
- [ ] **Step 4: Re-run focused frontend tests and verify green**
- [ ] **Step 5: Commit shared frontend cat interaction components**

### Task 3: Upgrade public cat pages and hot-cat cards

**Files:**
- Modify: `frontend/src/features/home/HomePage.tsx`
- Modify: `frontend/src/features/cats/CatsPage.tsx`
- Modify: `frontend/src/features/cats/CatDetailPage.tsx`
- Test: `frontend/src/test/public-pages.test.tsx`

- [ ] **Step 1: Extend tests to require hot-cat thumbnails, archive like buttons, and detail-page image previews**
- [ ] **Step 2: Run focused frontend tests and verify red state**
- [ ] **Step 3: Implement UI updates using the shared lightbox/like components**
- [ ] **Step 4: Re-run focused frontend tests and verify green**
- [ ] **Step 5: Commit public cat-page UI changes**

### Task 4: Upgrade admin cat list and edit image management

**Files:**
- Modify: `frontend/src/features/admin/AdminCatsPage.tsx`
- Modify: `frontend/src/features/admin/AdminCatFormPage.tsx`
- Modify: `frontend/src/test/admin-pages.test.tsx`

- [ ] **Step 1: Extend admin tests for cover thumbnails, image preview modal, remove-image multi-select, and set-cover behavior**
- [ ] **Step 2: Run `cd frontend && npm test -- admin-pages.test.tsx` and verify red state**
- [ ] **Step 3: Implement admin list thumbnails and non-destructive image-management UI in the edit form**
- [ ] **Step 4: Re-run focused admin tests and verify green**
- [ ] **Step 5: Commit admin cat image-management UI changes**

### Task 5: Final verification

**Files:**
- Modify: `backend/tests/test_cats_api.py`
- Modify: `frontend/src/test/public-pages.test.tsx`
- Modify: `frontend/src/test/admin-pages.test.tsx`

- [ ] **Step 1: Run `cd backend && pytest -v`**
- [ ] **Step 2: Run `cd frontend && npm test`**
- [ ] **Step 3: Run `cd frontend && npm run build`**
- [ ] **Step 4: Fix only verified regressions and re-run until green**
