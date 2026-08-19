import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Navbar from './components/common/Navbar'
import Sidebar from './components/common/Sidebar'

// Pages
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import ClassesPage from './pages/ClassesPage'
import ClassDetailPage from './pages/ClassDetailPage'
import SubjectsPage from './pages/SubjectsPage'
import MaterialsPage from './pages/MaterialsPage'
import StudentProgressPage from './pages/StudentProgressPage'
import AdminManagementPage from './pages/AdminManagementPage'
import NotFoundPage from './pages/NotFoundPage'

// Main Layout Container
const MainLayout = ({ children }) => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex gap-6 flex-1">
    <Sidebar />
    <main className="flex-1 min-w-0">{children}</main>
  </div>
)

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 font-sans">
        <Navbar />

        <Routes>
          {/* Public Auth Route */}
          <Route path="/auth" element={<AuthPage />} />

          {/* Top-Level Flat Application Routes (Prevents 404 Routing Bugs) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <DashboardPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/classes"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ClassesPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/classes/:id"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ClassDetailPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/subjects"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <SubjectsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/materials"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <MaterialsPage defaultTab="materials" />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/games"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <MaterialsPage defaultTab="games" />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/progress"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <StudentProgressPage defaultTab="progress" />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/grades"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <StudentProgressPage defaultTab="grades" />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <MainLayout>
                  <AdminManagementPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* 404 Catch-All Route */}
          <Route
            path="*"
            element={
              <MainLayout>
                <NotFoundPage />
              </MainLayout>
            }
          />
        </Routes>
      </div>
    </AuthProvider>
  )
}

export default App
