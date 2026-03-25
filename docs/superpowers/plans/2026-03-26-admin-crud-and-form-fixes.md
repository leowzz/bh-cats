# 后台 CRUD 与档案表单修复 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add complete admin CRUD for cats and banners, and fix the admin cat form's required description, comma-separated tags, and minimal custom file picker UI.

**Architecture:** Extend the FastAPI admin surface with dedicated list/detail/delete endpoints so the admin UI no longer depends on public data APIs. Update the React admin screens to load current records, support edit/delete flows, and normalize form values between user-friendly inputs and the backend contract.

**Tech Stack:** FastAPI, SQLAlchemy, pytest, React, TypeScript, TanStack Query, Tailwind CSS, Vitest

---

### Task 1: Add backend admin CRUD tests for cats and banners
- [ ] Write failing tests for admin cat list/detail/delete and banner list/detail/update/delete
- [ ] Run `cd backend && pytest tests/test_cats_api.py tests/test_banners_api.py -v` and confirm failure
- [ ] Implement the minimum backend changes to satisfy the tests
- [ ] Re-run the same backend tests and confirm pass

### Task 2: Fix admin cat form UX and validation
- [ ] Write failing frontend tests for required description, tag string input, and custom file picker display
- [ ] Run `cd frontend && npm test -- admin-pages.test.tsx public-pages.test.tsx` and confirm failure
- [ ] Implement the minimum form changes in `frontend/src/features/admin/AdminCatFormPage.tsx`
- [ ] Re-run the frontend tests and confirm pass

### Task 3: Complete admin management flows in the UI
- [ ] Write failing frontend tests for cat edit/delete and banner edit/delete flows
- [ ] Run the targeted frontend tests and confirm failure
- [ ] Implement admin cats and banners list/detail/edit/delete logic
- [ ] Re-run the targeted frontend tests and confirm pass

### Task 4: Final verification
- [ ] Run `cd backend && pytest -v`
- [ ] Run `cd frontend && npm test`
- [ ] Run `cd frontend && npm run build`
