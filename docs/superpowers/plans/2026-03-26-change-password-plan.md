# Change Password Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let logged-in users change their password by providing the current password and a new password from the profile page.

**Architecture:** Add a small authenticated auth endpoint that validates the current password before updating the stored password hash, then expose a compact profile-page form with client-side confirmation checks and success/error feedback. Reuse the existing auth/session model so password changes take effect on the next login without introducing new account flows.

**Tech Stack:** FastAPI, SQLAlchemy, Pydantic, React, TanStack Query, pytest, Vitest

---

### Task 1: Add backend failing tests for password change flow

**Files:**
- Modify: `backend/tests/test_auth_api.py`

- [ ] **Step 1: Write a failing test for changing password with the current password and verifying old login fails while new login succeeds**
- [ ] **Step 2: Write a failing test for rejecting an incorrect current password or unchanged password**
- [ ] **Step 3: Run `cd backend && pytest tests/test_auth_api.py -v` and verify red state**

### Task 2: Implement backend password change endpoint and service logic

**Files:**
- Modify: `backend/app/schemas/auth.py`
- Modify: `backend/app/services/auth_service.py`
- Modify: `backend/app/api/auth.py`

- [ ] **Step 1: Add a change-password request schema with current/new password fields**
- [ ] **Step 2: Implement auth service logic to verify current password, reject same-password updates, and persist the new hash**
- [ ] **Step 3: Add an authenticated `/auth/change-password` endpoint**
- [ ] **Step 4: Re-run `cd backend && pytest tests/test_auth_api.py -v` and verify green**

### Task 3: Add frontend failing tests for the profile password form

**Files:**
- Modify: `frontend/src/test/public-pages.test.tsx`

- [ ] **Step 1: Add a failing test for the logged-in profile page showing a change-password form and submitting it**
- [ ] **Step 2: Add a failing test for client-side mismatch validation between new password and confirm password**
- [ ] **Step 3: Run `cd frontend && npm test -- public-pages.test.tsx` and verify red state**

### Task 4: Implement profile password change UX

**Files:**
- Modify: `frontend/src/features/profile/ProfilePage.tsx`

- [ ] **Step 1: Add local form state for current password, new password, and confirm password**
- [ ] **Step 2: Add mutation wiring to `/auth/change-password` with inline error/success feedback**
- [ ] **Step 3: Clear fields after success and keep mismatch validation on the client**
- [ ] **Step 4: Re-run `cd frontend && npm test -- public-pages.test.tsx` and verify green**

### Task 5: Final verification

**Files:**
- Modify: `backend/tests/test_auth_api.py`
- Modify: `frontend/src/test/public-pages.test.tsx`
- Modify: `frontend/src/features/profile/ProfilePage.tsx`

- [ ] **Step 1: Run `cd backend && pytest -v`**
- [ ] **Step 2: Run `cd frontend && npm test`**
- [ ] **Step 3: Run `cd frontend && npm run build`**
- [ ] **Step 4: Fix only confirmed regressions and re-run until green**
