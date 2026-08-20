import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  Gamepad2,
  TrendingUp,
  Award,
  ShieldCheck,
} from 'lucide-react'

const Sidebar = () => {
  const { role, user, isTeacher, isAdmin } = useAuth()

  const navItems = [
    {
      to: '/',
      label: 'Tổng Quan',
      icon: LayoutDashboard,
    },
    {
      to: '/classes',
      label: 'Quản Lý Lớp Học',
      icon: Users,
    },
  ]

  if (isTeacher || isAdmin) {
    navItems.push({
      to: '/subjects',
      label: 'Quản Lý Môn Học',
      icon: BookOpen,
    })
  }

  // CẬP NHẬT MENU ĐIỀU HƯỚNG: KHO BÀI TẬP & KHO GAME GIÁO DỤC
  navItems.push(
    {
      to: '/materials',
      label: 'Kho Bài Tập',
      icon: FileText,
    },
    {
      to: '/games',
      label: 'Kho Game Giáo Dục',
      icon: Gamepad2,
    },
    {
      to: '/progress',
      label: 'Tiến Độ Học Tập',
      icon: TrendingUp,
    },
    {
      to: '/grades',
      label: 'Bảng Điểm Lớp Học',
      icon: Award,
    }
  )

  if (isAdmin) {
    navItems.push({
      to: '/admin',
      label: 'Quản Trị Hệ Thống',
      icon: ShieldCheck,
    })
  }

  return (
    <aside className="w-64 shrink-0 hidden md:block">
      <div className="sticky top-20 glass-panel rounded-2xl p-4 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Menu Điều Hướng
        </div>
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </div>
    </aside>
  )
}

export default Sidebar
