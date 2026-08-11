import React from 'react'
import { Link } from 'react-router-dom'

const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="text-7xl font-extrabold text-brand-600 mb-4 animate-bounce">404</div>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Trang Không Tồn Tại</h2>
      <p className="text-slate-500 max-w-sm mb-6 text-sm">
        Đường dẫn bạn truy cập có thể đã bị đổi hoặc không còn tồn tại trên hệ thống.
      </p>
      <Link
        to="/"
        className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-md transition"
      >
        Quay Về Trang Chủ
      </Link>
    </div>
  )
}

export default NotFoundPage
