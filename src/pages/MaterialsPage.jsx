import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import LoadingSpinner from '../components/common/LoadingSpinner'
import EmptyState from '../components/common/EmptyState'
import UploadMaterialModal from '../components/material/UploadMaterialModal'
import AssignModal from '../components/material/AssignModal'
import GameViewerModal from '../components/game/GameViewerModal'
import {
  Gamepad2,
  Upload,
  Search,
  Filter,
  FileText,
  Video,
  Send,
  Play,
  Share2,
  Trash2,
  Sparkles,
} from 'lucide-react'

const PRIMARY_SUBJECTS = [
  'Toán Học',
  'Tiếng Việt',
  'Tiếng Anh',
  'Tự Nhiên & Xã Hội',
  'Khoa Học',
  'Lịch Sử & Địa Lý',
  'Tin Học & Công Nghệ',
  'Đạo Đức',
  'Mỹ Thuật & Âm Nhạc',
  'Hoạt Động Trải Nghiệm',
]

const MaterialsPage = ({ defaultTab = 'materials' }) => {
  const { user, role, isTeacher, isAdmin } = useAuth()

  const [materials, setMaterials] = useState([])
  const [subjectsList, setSubjectsList] = useState(PRIMARY_SUBJECTS)
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [search, setSearch] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('Tất cả')
  const [selectedType, setSelectedType] = useState('Tất cả')

  // Modals state
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showGameViewer, setShowGameViewer] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState(null)

  useEffect(() => {
    setSelectedType('Tất cả')
  }, [defaultTab])

  useEffect(() => {
    fetchMaterials()
    fetchSubjects()
  }, [])

  const fetchSubjects = async () => {
    try {
      const { data } = await supabase.from('subjects').select('name').order('name', { ascending: true })
      if (data && data.length > 0) {
        setSubjectsList(data.map((s) => s.name))
      }
    } catch (e) {
      console.warn('Using default primary subjects')
    }
  }

  const fetchMaterials = async () => {
    setLoading(true)
    try {
      let query = supabase.from('materials').select('*').order('created_at', { ascending: false })

      if (!isAdmin) {
        query = query.or(`is_public.eq.true,author_id.eq.${user?.id}`)
      }

      const { data, error } = await query
      if (error) throw error
      setMaterials(data || [])
    } catch (err) {
      console.error('Error fetching materials:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài tập này không?')) return

    try {
      const { error } = await supabase.from('materials').delete().eq('id', id)
      if (error) throw error
      setMaterials((prev) => prev.filter((m) => m.id !== id))
    } catch (err) {
      console.error('Error deleting material:', err)
      alert('Không thể xóa bài tập. Thử lại sau.')
    }
  }

  const handleOpenAssign = (mat) => {
    setSelectedMaterial(mat)
    setShowAssignModal(true)
  }

  const handleOpenPlay = (mat) => {
    setSelectedMaterial(mat)
    setShowGameViewer(true)
  }

  // Filtered materials
  const filteredMaterials = materials.filter((m) => {
    const matchSearch =
      m.title?.toLowerCase().includes(search.toLowerCase()) ||
      m.description?.toLowerCase().includes(search.toLowerCase())
    const matchSubject = selectedSubject === 'Tất cả' || m.subject === selectedSubject
    
    let matchType = true
    if (defaultTab === 'games') {
      // Strictly show ONLY games in Kho Game Giáo Dục
      matchType = m.type === 'game_iframe' || m.type === 'game_html5'
    } else {
      // Strictly show ONLY pure learning materials/assignments in Kho Bài Tập (EXCLUDE GAMES!)
      matchType = m.type !== 'game_iframe' && m.type !== 'game_html5'
      if (selectedType !== 'Tất cả') {
        matchType = matchType && m.type === selectedType
      }
    }

    return matchSearch && matchSubject && matchType
  })

  const isGameTab = defaultTab === 'games'

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            {isGameTab ? (
              <>
                <Gamepad2 className="w-7 h-7 text-purple-600 animate-bounce" />
                Kho Game Giáo Dục Tương Tác
              </>
            ) : (
              <>
                <FileText className="w-7 h-7 text-brand-600" />
                Kho Bài Tập & Đề Thi Giảng Dạy
              </>
            )}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {isGameTab
              ? 'Tổng hợp các trò chơi giáo dục, game HTML5 và trắc nghiệm tương tác siêu thú vị.'
              : 'Tổng hợp phiếu bài tập, đề kiểm tra, bài giảng điện tử PDF/Word dành cho học sinh.'}
          </p>
        </div>

        {isTeacher && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-sm rounded-2xl shadow-lg transition transform active:scale-95 shrink-0"
          >
            <Upload className="w-4 h-4" />
            {isGameTab ? 'Thêm Game Mới' : 'Tải Lên Bài Tập Mới'}
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 min-w-[240px] bg-slate-100 dark:bg-slate-800 px-3.5 py-2 rounded-xl">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={isGameTab ? 'Tìm kiếm game giáo dục...' : 'Tìm kiếm bài tập, đề thi, phiếu học tập...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm w-full outline-none text-slate-800 dark:text-white font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Môn Học:</span>
          </div>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-700 dark:text-slate-200"
          >
            <option value="Tất cả">Tất Cả Môn</option>
            {subjectsList.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {!isGameTab && (
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-700 dark:text-slate-200"
            >
              <option value="Tất cả">Tất Cả Định Dạng</option>
              <option value="document">📄 Phiếu Bài Tập / PDF / Word</option>
              <option value="video">🎥 Video Bài Giảng</option>
            </select>
          )}
        </div>
      </div>

      {/* Materials / Games List Grid */}
      {loading ? (
        <LoadingSpinner label={isGameTab ? 'Đang tải danh sách Game...' : 'Đang tải danh sách Bài tập...'} />
      ) : filteredMaterials.length === 0 ? (
        <EmptyState
          title={isGameTab ? 'Chưa Có Game Nào' : 'Chưa Có Bài Tập Nào'}
          description={
            isGameTab
              ? 'Hiện tại chưa có trò chơi giáo dục nào được tải lên.'
              : 'Chưa có phiếu bài tập/đề thi nào phù hợp với bộ lọc.'
          }
          actionLabel={isTeacher ? (isGameTab ? '+ Thêm Game Mới' : '+ Tải Lên Bài Tập Mới') : null}
          onAction={isTeacher ? () => setShowUploadModal(true) : null}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((m) => {
            const isGame = m.type === 'game_iframe' || m.type === 'game_html5'
            const isOwner = user && (m.author_id === user.id || isAdmin)

            return (
              <div
                key={m.id}
                className="glass-panel p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between hover:shadow-xl hover:border-brand-400 transition-all duration-200 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 rounded-lg">
                      {m.subject || 'Tổng hợp'}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-md">
                      {isGame ? '🎮 GAME' : '📄 PHIẾU BÀI TẬP'}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-slate-800 dark:text-white group-hover:text-brand-600 transition leading-snug mb-2">
                    {m.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 font-medium mb-4">
                    {m.description || 'Phiếu bài tập / tài liệu giảng dạy chuẩn Tiểu học.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenPlay(m)}
                    className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md transition"
                  >
                    {isGame ? <Play className="w-3.5 h-3.5 fill-current" /> : <FileText className="w-3.5 h-3.5" />}
                    <span>{isGame ? 'Chơi Game' : '📜 Mở Làm Bài / Xem'}</span>
                  </button>

                  {isTeacher && (
                    <button
                      onClick={() => handleOpenAssign(m)}
                      className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950 text-slate-600 dark:text-slate-300 rounded-xl transition"
                      title="Giao Bài Tập Cho Lớp"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}

                  {isOwner && (
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950 text-slate-400 rounded-xl transition"
                      title="Xóa bài tập"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modals */}
      <UploadMaterialModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploaded={fetchMaterials}
      />

      <AssignModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        material={selectedMaterial}
      />

      <GameViewerModal
        isOpen={showGameViewer}
        onClose={() => setShowGameViewer(false)}
        material={selectedMaterial}
      />
    </div>
  )
}

export default MaterialsPage
