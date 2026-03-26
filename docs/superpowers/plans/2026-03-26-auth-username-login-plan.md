# Auth Username Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a unique `username` field for users and support login with either username or email plus password.

**Architecture:** Extend the user model and auth schemas so registration persists both unique email and unique username, then update login to accept a generic account identifier that resolves to either email or username. Backfill existing rows and config-initialized admin accounts through `init_db` migration-style helpers so already-initialized databases keep working.

**Tech Stack:** FastAPI, SQLAlchemy, Pydantic, React, Vitest, pytest, SQLite

---

### Task 1: Add backend failing tests for username registration, dual login, and DB backfill

**Files:**
- Modify: `backend/tests/test_auth_api.py`
- Modify: `backend/tests/test_db_init.py`
- Modify: `backend/tests/conftest.py`

- [ ] **Step 1: Write a failing auth API test for registering with `username`, logging in by username, logging in by email, and reading `username` from `/auth/me`**
- [ ] **Step 2: Write a failing init-db test proving existing user rows without `username` get unique usernames backfilled and the admin account is initialized with configured username**
- [ ] **Step 3: Run `cd backend && pytest tests/test_auth_api.py tests/test_db_init.py -v` and verify red state**

### Task 2: Implement backend username model, schema, login logic, and init-db backfill

**Files:**
- Modify: `backend/app/models/user.py`
- Modify: `backend/app/schemas/auth.py`
- Modify: `backend/app/services/auth_service.py`
- Modify: `backend/app/db/init_db.py`
- Modify: `backend/app/core/config.py`
- Modify: `backend/tests/conftest.py`

- [ ] **Step 1: Add `username` to the user model and expose it in auth responses**
- [ ] **Step 2: Validate username format and uniqueness during registration**
- [ ] **Step 3: Update login to accept `account` and resolve by email or username**
- [ ] **Step 4: Extend `init_db` to add/backfill the `username` column and initialize admin username from config**
- [ ] **Step 5: Re-run `cd backend && pytest tests/test_auth_api.py tests/test_db_init.py -v` and verify green**

### Task 3: Add frontend failing tests for username-aware auth forms

**Files:**
- Modify: `frontend/src/test/public-pages.test.tsx`

- [ ] **Step 1: Add a failing register-page test expecting a username field and request payload**
- [ ] **Step 2: Update the login-page test to expect `account` with placeholder `用户名或邮箱` and verify the request payload**
- [ ] **Step 3: Run `cd frontend && npm test -- public-pages.test.tsx` and verify red state**

### Task 4: Implement frontend username auth UX

**Files:**
- Modify: `frontend/src/features/auth/RegisterPage.tsx`
- Modify: `frontend/src/features/auth/LoginPage.tsx`
- Modify: `frontend/src/features/profile/ProfilePage.tsx`

- [ ] **Step 1: Add username input to registration and submit it to the backend**
- [ ] **Step 2: Change login to use a single `account` field for username or email**
- [ ] **Step 3: Show `username` in the profile page**
- [ ] **Step 4: Re-run `cd frontend && npm test -- public-pages.test.tsx` and verify green**

### Task 5: Final verification

**Files:**
- Modify: `backend/tests/test_auth_api.py`
- Modify: `backend/tests/test_db_init.py`
- Modify: `frontend/src/test/public-pages.test.tsx`

- [ ] **Step 1: Run `cd backend && pytest -v`**
- [ ] **Step 2: Run `cd frontend && npm test`**
- [ ] **Step 3: Run `cd frontend && npm run build`**
- [ ] **Step 4: Fix only confirmed regressions and re-run until green**
