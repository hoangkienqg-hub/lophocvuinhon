import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LogOut, User, ShieldAlert, GraduationCap, BookOpen } from 'lucide-react'

const Navbar = () => {
  const { user, profile, role, signOut } = useAuth()

  const getRoleBadge = () => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
            Quản Trị Viên
          </span>
        )
      case 'teacher':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            Giáo Viên
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
            Học Sinh
          </span>
        )
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl gradient-card-blue flex items-center justify-center text-white text-xl shadow-md group-hover:scale-105 transition-transform">
            🎓
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-slate-800 dark:text-white leading-tight flex items-center gap-2">
              Lớp Học Vui Nhộn
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 rounded-md">
                EdTech
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Hệ thống Quản lý & Game Giáo dục</p>
          </div>
        </Link>

        {/* User Info & Actions */}
        {user ? (
          <div className="flex items-center gap-3">
            {getRoleBadge()}

            <div className="hidden md:flex flex-col items-end text-right">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[180px]">
                {profile?.full_name || user.email}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                {user.email}
              </span>
            </div>

            <div className="w-9 h-9 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-brand-100 dark:ring-brand-900">
              {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
            </div>

            <button
              onClick={signOut}
              title="Đăng xuất"
              className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/auth"
              className="px-4 py-2 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700"
            >
              Đăng Nhập
            </Link>
            <Link
              to="/auth?tab=register"
              className="px-4 py-2 text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-md transition transform active:scale-95"
            >
              Đăng Ký
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}

export default Navbar
