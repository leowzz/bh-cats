# Admin Cat Image Live Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make admin cat image uploads and deletions apply immediately in the edit page instead of waiting for the full form submit.

**Architecture:** Keep the existing edit form for profile fields, but split image management into dedicated instant actions on the same page. Upload and delete each call the existing admin cat update endpoint, then hydrate the local image list from the returned cat payload so the UI updates immediately and consistently.

**Tech Stack:** React, TanStack Query, Vitest, FastAPI admin cat update API

---

### Task 1: Cover instant image upload and delete with failing tests

**Files:**
- Modify: `frontend/src/test/admin-pages.test.tsx`

- [ ] **Step 1: Write a failing test for instant upload updating the image list without leaving the page**
- [ ] **Step 2: Write a failing test for delete-selected-images removing images immediately from the list**
- [ ] **Step 3: Run `cd frontend && npm test -- admin-pages.test.tsx` and verify the new expectations fail for the right reason**

### Task 2: Implement live image-management state and actions in the admin cat form

**Files:**
- Modify: `frontend/src/features/admin/AdminCatFormPage.tsx`
- Modify: `frontend/src/features/admin/ImagePickerField.tsx`

- [ ] **Step 1: Add focused local image-list state derived from fetched cat detail so mutations can update in-place**
- [ ] **Step 2: Implement an instant upload action that sends only selected files and refreshes local image state from the response**
- [ ] **Step 3: Implement a delete-selected action that sends only `remove_image_ids` and removes images immediately from the list after success**
- [ ] **Step 4: Keep existing full-form save behavior for non-image fields and cover selection, but make it use the current local image state**
- [ ] **Step 5: Re-run `cd frontend && npm test -- admin-pages.test.tsx` and verify green**

### Task 3: Final verification

**Files:**
- Modify: `frontend/src/features/admin/AdminCatFormPage.tsx`
- Modify: `frontend/src/test/admin-pages.test.tsx`

- [ ] **Step 1: Run `cd frontend && npm test`**
- [ ] **Step 2: Run `cd frontend && npm run build`**
- [ ] **Step 3: Fix only confirmed regressions and re-run until green**
