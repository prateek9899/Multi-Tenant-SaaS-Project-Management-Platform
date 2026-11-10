import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ProjectListPage from './pages/projects/ProjectListPage';
import BoardPage from './pages/board/BoardPage';
import SprintListPage from './pages/sprints/SprintListPage';
import MembersPage from './pages/members/MembersPage';
import BillingPage from './pages/billing/BillingPage';
import AuditLogPage from './pages/audit/AuditLogPage';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected SaaS workspace routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="projects" element={<ProjectListPage />} />
        <Route path="board" element={<BoardPage />} />
        <Route path="sprints" element={<SprintListPage />} />
        <Route path="members" element={<MembersPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="audit" element={<AuditLogPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;

