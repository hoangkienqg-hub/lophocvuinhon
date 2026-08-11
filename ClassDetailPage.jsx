import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import LoadingSpinner from '../components/common/LoadingSpinner'
import EmptyState from '../components/common/EmptyState'
import AddStudentModal from '../components/class/AddStudentModal'
import GameViewerModal from '../components/game/GameViewerModal'
import AssignModal from '../components/material/AssignModal'
import {
  Users,
  UserPlus,
  BookOpen,
  Send,
  Copy,
  Check,
  Trash2,
  Play,
  Clock,
  Calendar,
  Gamepad2,
  ArrowLeft,
  Filter,
} from 'lucide-react'

const CATEGORY_MAP = {
  weekly: { label: '📅 Bài Tập Tuần', bg: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  monthly: { label: '🗓️ Bài Tập Tháng', bg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' },
  test: { label: '📝 Bài Kiểm Tra', bg: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' },
  practice: { label: '📖 Bài Ôn Tập', bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
  game: { label: '🎮 Trò Chơi Giáo Dục', bg: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' },
}

const ClassDetailPage = () => {
  const { id: classId } = useParams()
  const navigate = useNavigate()
  const { user, isTeacher, isAdmin } = useAuth()

  const [classInfo, setClassInfo] = useState(null)
  const [students, setStudents] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('assignments') // 'assignments' or 'students'
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all')

  const [copied, setCopied] = useState(false)
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [activeMaterial, setActiveMaterial] = useState(null)
  const [activeAssignmentId, setActiveAssignmentId] = useState(null)
  const [showGameViewer, setShowGameViewer] = useState(false)

  useEffect(() => {
    if (classId) {
      fetchClassDetails()
    }
  }, [classId])

  const fetchClassDetails = async () => {
    setLoading(true)
    try {
      // 1. Fetch Class Info
      const { data: cData, error: cErr } = await supabase
        .from('classes')
        .select('*, profiles:teacher_id(full_name, email)')
        .eq('id', classId)
        .single()

      if (cErr) throw cErr
      setClassInfo(cData)

      // 2. Fetch Enrolled Students
      const { data: sData, error: sErr } = await supabase
        .from('class_members')
        .select('id, joined_at, profiles:student_id(id, full_name, email, avatar_url)')
        .eq('class_id', classId)
        .order('joined_at', { ascending: false })

      if (sErr) throw sErr
      setStudents(sData || [])

      // 3. Fetch Assigned Materials
      const { data: aData, error: aErr } = await supabase
        .from('assignments')
        .select('*, materials(*)')
        .eq('class_id', classId)
        .order('created_at', { ascending: false })

      if (aErr) throw aErr
      setAssignments(aData || [])
    } catch (err) {
      console.error('Error loading class details:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCode = () => {
    if (classInfo?.code) {
      navigator.clipboard.writeText(classInfo.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleRemoveStudent = async (memberId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa học sinh này khỏi lớp?')) return

    try {
      const { error } = await supabase.from('class_members').delete().eq('id', memberId)
      if (error) throw error
      fetchClassDetails()
    } catch (err) {
      console.error('Error removing student:', err)
    }
  }

  const handlePlayMaterial = (assignment) => {
    setActiveMaterial(assignment.materials)
    setActiveAssignmentId(assignment.id)
    setShowGameViewer(true)
  }

  const filteredAssignments = assignments.filter((a) => {
    if (selectedCategoryFilter === 'all') return true
    const cat = a.materials?.category || 'weekly'
    return cat === selectedCategoryFilter
  })

  if (loading) {
    return <LoadingSpinner label="Đang tải thông tin chi tiết lớp học..." />
  }

  if (!classInfo) {
    return (
      <EmptyState
        title="Lớp học không tồn tại"
        description="Không tìm thấy thông tin lớp học này."
        actionLabel="Quay lại danh sách lớp"
        onAction={() => navigate('/classes')}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/classes')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-600 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách lớp
      </button>

      {/* Class Banner Header */}
      <div className="gradient-card-blue rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg">
              Môn {classInfo.subject}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-3 mb-1">{classInfo.name}</h2>
            <p className="text-brand-100 text-sm">{classInfo.description || 'Chưa có mô tả lớp học.'}</p>
            <p className="text-xs text-brand-200 mt-2 font-medium">
              Giáo viên đảm nhận: <strong>{classInfo.profiles?.full_name || classInfo.profiles?.email}</strong>
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center sm:text-right space-y-2">
            <span className="text-xs font-bold text-brand-200 uppercase tracking-wider block">
              Mã Lớp Học (Join Code)
            </span>
            <div className="flex items-center justify-center sm:justify-end gap-2 font-mono text-2xl font-extrabold">
              <span>{classInfo.code}</span>
              <button
                onClick={handleCopyCode}
                className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition"
                title="Sao chép Mã Lớp"
              >
                {copied ? <Check className="w-5 h-5 text-amber-300" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('assignments')}
            className={`pb-3 px-4 font-bold text-sm border-b-2 transition ${
              activeTab === 'assignments'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Bài Tập & Game ({assignments.length})
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`pb-3 px-4 font-bold text-sm border-b-2 transition ${
              activeTab === 'students'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Danh Sách Học Sinh ({students.length})
          </button>
        </div>

        {/* Actions */}
        {isTeacher && activeTab === 'students' && (
          <button
            onClick={() => setShowAddStudent(true)}
            className="mb-2 inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            <UserPlus className="w-4 h-4" /> Thêm Học Sinh
          </button>
        )}
      </div>

      {/* Category Sub-Filters when in Assignments Tab */}
      {activeTab === 'assignments' && (
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() => setSelectedCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedCategoryFilter === 'all'
                ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            Tất Cả Bài Tập ({assignments.length})
          </button>
          <button
            onClick={() => setSelectedCategoryFilter('weekly')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedCategoryFilter === 'weekly'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 hover:bg-blue-100'
            }`}
          >
            📅 Bài Tập Tuần
          </button>
          <button
            onClick={() => setSelectedCategoryFilter('monthly')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedCategoryFilter === 'monthly'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 hover:bg-indigo-100'
            }`}
          >
            🗓️ Bài Tập Tháng
          </button>
          <button
            onClick={() => setSelectedCategoryFilter('test')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedCategoryFilter === 'test'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            📝 Bài Kiểm Tra / Đề Thi
          </button>
          <button
            onClick={() => setSelectedCategoryFilter('practice')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedCategoryFilter === 'practice'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            📖 Bài Ôn Tập & Bài Giảng
          </button>
          <button
            onClick={() => setSelectedCategoryFilter('game')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedCategoryFilter === 'game'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 hover:bg-purple-100'
            }`}
          >
            🎮 Trò Chơi Giáo Dục
          </button>
        </div>
      )}

      {/* Tab 1: Assignments & Games */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          {filteredAssignments.length === 0 ? (
            <EmptyState
              icon={Gamepad2}
              title="Chưa có bài tập trong mục này"
              description="Giáo viên chưa giao bài tập cho mục được chọn."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAssignments.map((item) => {
                const mat = item.materials
                const catObj = CATEGORY_MAP[mat?.category] || CATEGORY_MAP.weekly
                return (
                  <div
                    key={item.id}
                    className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${catObj.bg}`}>
                          {catObj.label}
                        </span>
                        {item.due_date && (
                          <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-amber-500" />
                            Hạn: {new Date(item.due_date).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </div>

                      <h4 className="font-extrabold text-base text-slate-800 dark:text-white mb-1">
                        {mat?.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                        {item.instructions || mat?.description || 'Không có hướng dẫn thêm.'}
                      </p>
                    </div>

                    <button
                      onClick={() => handlePlayMaterial(item)}
                      className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      Mở Làm Bài / Chơi Game
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Students Roster */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          {students.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Chưa có học sinh nào"
              description="Lớp học chưa có học sinh gia nhập. Hãy chia sẻ Mã Join Code hoặc thêm học sinh ngay!"
              actionLabel={isTeacher ? 'Thêm Học Sinh' : undefined}
              onAction={() => setShowAddStudent(true)}
            />
          ) : (
            <div className="glass-panel rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">Họ và Tên</th>
                      <th className="px-6 py-3.5">Email</th>
                      <th className="px-6 py-3.5">Ngày Tham Gia</th>
                      {isTeacher && <th className="px-6 py-3.5 text-right">Thao Tác</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {students.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-white flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
                            {st.profiles?.full_name?.charAt(0).toUpperCase() || 'S'}
                          </div>
                          {st.profiles?.full_name || 'Học sinh'}
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs">{st.profiles?.email}</td>
                        <td className="px-6 py-4 text-slate-500 text-xs font-mono">
                          {new Date(st.joined_at).toLocaleDateString('vi-VN')}
                        </td>
                        {isTeacher && (
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleRemoveStudent(st.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                              title="Xóa học sinh khỏi lớp"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <AddStudentModal
        isOpen={showAddStudent}
        onClose={() => setShowAddStudent(false)}
        classId={classId}
        onStudentsAdded={fetchClassDetails}
      />

      <GameViewerModal
        isOpen={showGameViewer}
        onClose={() => setShowGameViewer(false)}
        material={activeMaterial}
        assignmentId={activeAssignmentId}
      />
    </div>
  )
}

export default ClassDetailPage
