import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../common/LoadingSpinner'

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <LoadingSpinner fullScreen label="Đang kiểm tra quyền truy cập..." />
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-md w-full glass-panel p-8 rounded-2xl text-center shadow-xl border border-red-200 dark:border-red-900">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            🚫
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Quyền Truy Cập Bị Từ Chối</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
            Bạn không có quyền truy cập trang này. Trang này yêu cầu vai trò: <strong className="capitalize">{allowedRoles.join(', ')}</strong>.
          </p>
          <a
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-xl transition"
          >
            Quay Về Trang Chủ
          </a>
        </div>
      </div>
    )
  }

  return children
}

export default ProtectedRoute
