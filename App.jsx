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

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 font-sans">
        <Navbar />

        <Routes>
          {/* Public Auth Route */}
          <Route path="/auth" element={<AuthPage />} />

          {/* Protected Application Routes */}
          <Route
            path="/*"
            element={
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex gap-6 flex-1">
                <Sidebar />
                <main className="flex-1 min-w-0">
                  <Routes>
                    <Route
                      path="/"
                      element={
                        <ProtectedRoute>
                          <DashboardPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/classes"
                      element={
                        <ProtectedRoute>
                          <ClassesPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/classes/:id"
                      element={
                        <ProtectedRoute>
                          <ClassDetailPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/subjects"
                      element={
                        <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                          <SubjectsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/materials"
                      element={
                        <ProtectedRoute>
                          <MaterialsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/progress"
                      element={
                        <ProtectedRoute>
                          <StudentProgressPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute allowedRoles={['admin']}>
                          <AdminManagementPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </main>
              </div>
            }
          />
        </Routes>
      </div>
    </AuthProvider>
  )
}

export default App
