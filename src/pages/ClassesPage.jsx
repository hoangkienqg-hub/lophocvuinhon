import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import LoadingSpinner from '../components/common/LoadingSpinner'
import EmptyState from '../components/common/EmptyState'
import CreateClassModal from '../components/class/CreateClassModal'
import JoinClassModal from '../components/class/JoinClassModal'
import { Users, Plus, KeyRound, Search, Copy, Check, ArrowRight, BookOpen } from 'lucide-react'

const ClassesPage = () => {
  const { user, role, isTeacher, isStudent, isAdmin } = useAuth()

  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [copiedCode, setCopiedCode] = useState(null)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)

  useEffect(() => {
    fetchClasses()
  }, [user, role])

  const fetchClasses = async () => {
    setLoading(true)
    try {
      if (isAdmin) {
        // Fetch all system classes
        const { data, error } = await supabase
          .from('classes')
          .select('*, profiles:teacher_id(full_name, email)')
          .order('created_at', { ascending: false })

        if (error) throw error
        setClasses(data || [])
      } else if (isTeacher) {
        // Fetch owned classes
        const { data, error } = await supabase
          .from('classes')
          .select('*, profiles:teacher_id(full_name, email)')
          .eq('teacher_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setClasses(data || [])
      } else {
        // Fetch joined classes for student
        const { data, error } = await supabase
          .from('class_members')
          .select('class_id, classes(*, profiles:teacher_id(full_name, email))')
          .eq('student_id', user.id)
          .order('joined_at', { ascending: false })

        if (error) throw error
        const joined = data?.map((m) => m.classes).filter(Boolean) || []
        setClasses(joined)
      }
    } catch (err) {
      console.error('Error fetching classes:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const filteredClasses = classes.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.subject?.toLowerCase().includes(search.toLowerCase()) ||
      c.code?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-brand-600" />
            Danh Sách Lớp Học
          </h2>
          <p className="text-sm text-slate-500">Quản lý và truy cập các lớp học của bạn</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {isStudent && (
            <button
              onClick={() => setShowJoinModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl shadow-md transition transform active:scale-95"
            >
              <KeyRound className="w-4 h-4" />
              Nhập Mã Tham Gia Lớp
            </button>
          )}

          {isTeacher && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-md transition transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Tạo Lớp Học Mới
            </button>
          )}
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative max-w-md">
        <input
          type="text"
          placeholder="Tìm theo tên lớp, môn học hoặc mã lớp..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 outline-none text-sm transition"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
      </div>

      {/* Class List Grid */}
      {loading ? (
        <LoadingSpinner label="Đang tải danh sách lớp học..." />
      ) : filteredClasses.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Chưa có lớp học nào"
          description={
            isTeacher
              ? 'Tạo lớp học đầu tiên của bạn để thêm học sinh và giao bài tập!'
              : 'Hãy sử dụng mã Join Code từ giáo viên để tham gia lớp học.'
          }
          actionLabel={isTeacher ? 'Tạo Lớp Mới' : 'Tham Gia Lớp'}
          onAction={() => (isTeacher ? setShowCreateModal(true) : setShowJoinModal(true))}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClasses.map((item) => (
            <div
              key={item.id}
              className="glass-panel rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 rounded-lg">
                    {item.subject}
                  </span>
                  
                  {/* Join Code Copy */}
                  <button
                    onClick={() => handleCopyCode(item.code)}
                    title="Sao chép Mã Lớp"
                    className="inline-flex items-center gap-1 text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg hover:bg-brand-100 dark:hover:bg-slate-700 transition"
                  >
                    <span>{item.code}</span>
                    {copiedCode === item.code ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>
                </div>

                <h3 className="font-extrabold text-lg text-slate-800 dark:text-white mb-2 group-hover:text-brand-600 transition">
                  {item.name}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs line-clamp-2 mb-4">
                  {item.description || 'Chưa có mô tả lớp học.'}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  <span className="block font-semibold text-slate-700 dark:text-slate-300">
                    GV: {item.profiles?.full_name || 'Giáo viên'}
                  </span>
                </div>

                <Link
                  to={`/classes/${item.id}`}
                  className="inline-flex items-center gap-1 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition transform active:scale-95"
                >
                  Vào Lớp <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateClassModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={fetchClasses}
      />

      <JoinClassModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onJoined={fetchClasses}
      />
    </div>
  )
}

export default ClassesPage
