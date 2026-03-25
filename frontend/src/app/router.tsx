import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { AppShell } from '../components/AppShell';
import { AdminCatFormPage } from '../features/admin/AdminCatFormPage';
import { AdminCatsPage } from '../features/admin/AdminCatsPage';
import { AdminDashboardPage } from '../features/admin/AdminDashboardPage';
import { AdminBannersPage } from '../features/admin/AdminBannersPage';
import { AdminRoute } from '../features/admin/AdminRoute';
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { CatDetailPage } from '../features/cats/CatDetailPage';
import { CatsPage } from '../features/cats/CatsPage';
import { CommunityPage } from '../features/community/CommunityPage';
import { PostDetailPage } from '../features/community/PostDetailPage';
import { HomePage } from '../features/home/HomePage';
import { ProfilePage } from '../features/profile/ProfilePage';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/cats" element={<CatsPage />} />
        <Route path="/cats/:id" element={<CatDetailPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/posts/:id" element={<PostDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/cats"
          element={
            <AdminRoute>
              <AdminCatsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/cats/new"
          element={
            <AdminRoute>
              <AdminCatFormPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/cats/:id/edit"
          element={
            <AdminRoute>
              <AdminCatFormPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/banners"
          element={
            <AdminRoute>
              <AdminBannersPage />
            </AdminRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
