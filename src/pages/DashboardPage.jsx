import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import LoadingSpinner from '../components/common/LoadingSpinner'
import CreateClassModal from '../components/class/CreateClassModal'
import JoinClassModal from '../components/class/JoinClassModal'
import UploadMaterialModal from '../components/material/UploadMaterialModal'
import {
  Users,
  Gamepad2,
  BookOpen,
  Plus,
  KeyRound,
  Upload,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react'

const DashboardPage = () => {
  const { user, profile, role, isAdmin, isTeacher } = useAuth()
  
  const [stats, setStats] = useState({
    classesCount: 0,
    materialsCount: 0,
    studentsCount: 0,
    assignmentsCount: 0,
  })

  const [recentClasses, setRecentClasses] = useState([])
  const [recentMaterials, setRecentMaterials] = useState([])
  const [loading, setLoading] = useState(true)

  const [showCreateClass, setShowCreateClass] = useState(false)
  const [showJoinClass, setShowJoinClass] = useState(false)
  const [showUploadMaterial, setShowUploadMaterial] = useState(false)

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user, role])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      if (isAdmin) {
        // Admin overview
        const [clsRes, matRes, usrRes] = await Promise.all([
          supabase.from('classes').select('id, name, subject, code, created_at', { count: 'exact' }).limit(4),
          supabase.from('materials').select('id, title, type, subject, created_at', { count: 'exact' }).limit(4),
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
        ])

        setStats({
          classesCount: clsRes.count || 0,
          materialsCount: matRes.count || 0,
          studentsCount: usrRes.count || 0,
          assignmentsCount: 0,
        })
        setRecentClasses(clsRes.data || [])
        setRecentMaterials(matRes.data || [])
      } else if (isTeacher) {
        // Teacher overview
        const { data: tClasses, count: cCount } = await supabase
          .from('classes')
          .select('id, name, subject, code, created_at', { count: 'exact' })
          .eq('teacher_id', user.id)
          .limit(4)

        const { data: tMaterials, count: mCount } = await supabase
          .from('materials')
          .select('id, title, type, subject, created_at', { count: 'exact' })
          .eq('author_id', user.id)
          .limit(4)

        setStats({
          classesCount: cCount || 0,
          materialsCount: mCount || 0,
          studentsCount: 0,
          assignmentsCount: 0,
        })
        setRecentClasses(tClasses || [])
        setRecentMaterials(tMaterials || [])
      } else {
        // Student overview
        const { data: sMemberships } = await supabase
          .from('class_members')
          .select('class_id, classes(id, name, subject, code)')
          .eq('student_id', user.id)

        const joinedClasses = sMemberships?.map((m) => m.classes).filter(Boolean) || []

        const { data: pMaterials } = await supabase
          .from('materials')
          .select('id, title, type, subject, created_at')
          .eq('is_public', true)
          .limit(4)

        setStats({
          classesCount: joinedClasses.length,
          materialsCount: pMaterials?.length || 0,
          studentsCount: 1,
          assignmentsCount: 0,
        })
        setRecentClasses(joinedClasses.slice(0, 4))
        setRecentMaterials(pMaterials || [])
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner label="Đang tải thông tin tổng quan..." />
  }

  return (
    <div className="space-y-8">
      {/* Hero Welcome Banner */}
      <div className="gradient-card-blue rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-extrabold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Xin Chào, {profile?.full_name || user.email}!
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-2 leading-tight">
            Chào mừng bạn đến với Lớp Học Vui Nhộn 🎓
          </h2>
          <p className="text-brand-100 text-sm mb-6 leading-relaxed">
            {role === 'admin'
              ? 'Bảng điều khiển Quản trị viên tối cao: Quản lý người dùng, phân quyền, xem báo cáo toàn bộ lớp học và kho học liệu.'
              : role === 'teacher'
              ? 'Tạo lớp học mới, chia sẻ tài liệu, tải game HTML5/Embed và theo dõi bảng điểm học sinh dễ dàng.'
              : 'Tham gia các lớp học sôi động, làm bài tập trắc nghiệm và thử sức với những trò chơi tương tác bổ ích!'}
          </p>

          <div className="flex flex-wrap gap-3">
            {isTeacher && (
              <button
                onClick={() => setShowCreateClass(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-brand-800 hover:bg-brand-50 rounded-xl font-extrabold text-sm shadow-md transition transform active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Tạo Lớp Mới
              </button>
            )}

            {role === 'student' && (
              <button
                onClick={() => setShowJoinClass(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-extrabold text-sm shadow-md transition transform active:scale-95"
              >
                <KeyRound className="w-4 h-4" />
                Nhập Mã Vào Lớp
              </button>
            )}

            {isTeacher && (
              <button
                onClick={() => setShowUploadMaterial(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-xl font-extrabold text-sm border border-white/30 transition"
              >
                <Upload className="w-4 h-4" />
                Đăng Học Liệu / Game
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Lớp Học</p>
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white">{stats.classesCount}</h3>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xl">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Học Liệu & Game</p>
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white">{stats.materialsCount}</h3>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Tiến Độ Học</p>
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white">100%</h3>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Vai Trò</p>
            <h3 className="text-lg font-extrabold text-slate-800 dark:text-white capitalize">{role}</h3>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Classes */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-lg text-slate-800 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-600" />
              Lớp Học Gần Đây
            </h3>
            <Link
              to="/classes"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              Xem Tất Cả <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentClasses.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
              <p className="text-sm text-slate-500 mb-3">Chưa có lớp học nào.</p>
              {isTeacher && (
                <button
                  onClick={() => setShowCreateClass(true)}
                  className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold"
                >
                  + Tạo Lớp Đầu Tiên
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recentClasses.map((c) => (
                <Link
                  key={c.id}
                  to={`/classes/${c.id}`}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 hover:border-brand-500 hover:shadow-md transition group"
                >
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 rounded-md">
                    {c.subject}
                  </span>
                  <h4 className="font-bold text-slate-800 dark:text-white mt-2 group-hover:text-brand-600 transition">
                    {c.name}
                  </h4>
                  <div className="flex items-center justify-between mt-3 text-xs text-slate-500 font-mono">
                    <span>Mã Lớp: {c.code}</span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Materials & Games */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-lg text-slate-800 dark:text-white flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-purple-600" />
              Học Liệu & Game Nổi Bật
            </h3>
            <Link
              to="/materials"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              Xem Tất Cả <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentMaterials.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
              <p className="text-sm text-slate-500 mb-3">Chưa có học liệu/game nào.</p>
              {isTeacher && (
                <button
                  onClick={() => setShowUploadMaterial(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold"
                >
                  + Tải Lên Học Liệu
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {recentMaterials.map((m) => (
                <Link
                  key={m.id}
                  to="/materials"
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 hover:border-purple-500 hover:shadow-md transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center text-lg font-bold">
                      {m.type === 'game_iframe' || m.type === 'game_html5' ? '🎮' : '📄'}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white text-sm group-hover:text-purple-600 transition">
                        {m.title}
                      </h4>
                      <p className="text-xs text-slate-500">{m.subject}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 uppercase">
                    {m.type}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateClassModal
        isOpen={showCreateClass}
        onClose={() => setShowCreateClass(false)}
        onCreated={loadDashboardData}
      />

      <JoinClassModal
        isOpen={showJoinClass}
        onClose={() => setShowJoinClass(false)}
        onJoined={loadDashboardData}
      />

      <UploadMaterialModal
        isOpen={showUploadMaterial}
        onClose={() => setShowUploadMaterial(false)}
        onUploaded={loadDashboardData}
      />
    </div>
  )
}

export default DashboardPage
