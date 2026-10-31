import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PreferencesProvider } from './context/PreferencesContext';
import { TaskProvider } from './context/TaskContext';
import { GoogleAuthProvider } from './context/GoogleAuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { DashboardPage } from './pages/DashboardPage';
import { TodosPage } from './pages/TodosPage';
import { GooglePhotosPage } from './pages/GooglePhotosPage';
import { GoogleDrivePage } from './pages/GoogleDrivePage';
import { LoginPage } from './pages/LoginPage';
import { ProfilePage } from './pages/ProfilePage';
import { LockerPage } from './pages/LockerPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <PreferencesProvider>
        <GoogleAuthProvider>
          <TaskProvider>
            <BrowserRouter>
            <Routes>
              {/* Public Authentication Route */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected Application Routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/todos" element={<TodosPage />} />
                  <Route path="/photos" element={<GooglePhotosPage />} />
                  <Route path="/drive" element={<GoogleDrivePage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/locker" element={<LockerPage />} />
                </Route>
              </Route>

              {/* Catch-all redirect to Dashboard */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </TaskProvider>
      </GoogleAuthProvider>
    </PreferencesProvider>
  </AuthProvider>
  );
};

export default App;
