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
} from 'lucide-react'

const ClassDetailPage = () => {
  const { id: classId } = useParams()
  const navigate = useNavigate()
  const { user, isTeacher, isAdmin } = useAuth()

  const [classInfo, setClassInfo] = useState(null)
  const [students, setStudents] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('assignments') // 'assignments' or 'students'

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
              {classInfo.subject}
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
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
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

      {/* Tab 1: Assignments & Games */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          {assignments.length === 0 ? (
            <EmptyState
              icon={Gamepad2}
              title="Chưa có bài tập hay game nào"
              description="Giáo viên chưa giao bài tập cho lớp học này."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignments.map((item) => {
                const mat = item.materials
                return (
                  <div
                    key={item.id}
                    className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded-md">
                          {mat?.type}
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
                      Mở Bài Học / Chơi Game
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
