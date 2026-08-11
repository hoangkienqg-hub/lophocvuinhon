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

const DEFAULT_SUBJECTS = [
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

const MaterialsPage = () => {
  const { user, role, isTeacher, isAdmin } = useAuth()

  const [materials, setMaterials] = useState([])
  const [subjectsList, setSubjectsList] = useState(DEFAULT_SUBJECTS)
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
      console.warn('Fallback to default subjects:', e)
    }
  }

  const fetchMaterials = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*, profiles:author_id(full_name, email)')
        .order('created_at', { ascending: false })

      if (error) throw error
      setMaterials(data || [])
    } catch (err) {
      console.error('Error fetching materials:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMaterial = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa học liệu/game này?')) return

    try {
      const { error } = await supabase.from('materials').delete().eq('id', id)
      if (error) throw error
      fetchMaterials()
    } catch (err) {
      console.error('Error deleting material:', err)
    }
  }

  const handleOpenAssign = (mat) => {
    setSelectedMaterial(mat)
    setShowAssignModal(true)
  }

  const handleOpenViewer = (mat) => {
    setSelectedMaterial(mat)
    setShowGameViewer(true)
  }

  const filteredMaterials = materials.filter((m) => {
    const matchSearch =
      m.title?.toLowerCase().includes(search.toLowerCase()) ||
      m.description?.toLowerCase().includes(search.toLowerCase()) ||
      m.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()))

    const matchSubject = selectedSubject === 'Tất cả' || m.subject === selectedSubject
    const matchType = selectedType === 'Tất cả' || m.type === selectedType

    return matchSearch && matchSubject && matchType
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            <Gamepad2 className="w-7 h-7 text-purple-600" />
            Kho Học Liệu & Trò Chơi Tương Tác
          </h2>
          <p className="text-sm text-slate-500">Khám phá bài giảng, tài liệu và các trò chơi trắc nghiệm hấp dẫn dành cho Tiểu học</p>
        </div>

        {isTeacher && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-xl shadow-md transition transform active:scale-95 shrink-0"
          >
            <Upload className="w-4 h-4" />
            Tải Lên Học Liệu / Game
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Tìm theo tên học liệu, từ khóa, tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-purple-500 outline-none text-sm transition"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        </div>

        {/* Subject Filter */}
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
        >
          <option value="Tất cả">Tất cả Môn Học</option>
          {subjectsList.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Type Filter */}
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
        >
          <option value="Tất cả">Tất cả Định Dạng</option>
          <option value="document">Tài liệu (PDF/Word)</option>
          <option value="video">Video Bài Giảng</option>
          <option value="game_iframe">Embed Game (Quiz/Wordwall)</option>
          <option value="game_html5">Game HTML5 Custom</option>
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <LoadingSpinner label="Đang tải kho học liệu..." />
      ) : filteredMaterials.length === 0 ? (
        <EmptyState
          icon={Gamepad2}
          title="Không tìm thấy học liệu phù hợp"
          description="Thử tìm kiếm với từ khóa khác hoặc tải lên học liệu mới!"
          actionLabel={isTeacher ? 'Tải Lên Học Liệu' : undefined}
          onAction={() => setShowUploadModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMaterials.map((mat) => {
            const isOwner = mat.author_id === user?.id || isAdmin
            return (
              <div
                key={mat.id}
                className="glass-panel rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded-md">
                      {mat.type}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">{mat.subject}</span>
                  </div>

                  <h3 className="font-extrabold text-base text-slate-800 dark:text-white mb-2 group-hover:text-purple-600 transition">
                    {mat.title}
                  </h3>
                  <p className="text-slate-500 text-xs line-clamp-2 mb-4">
                    {mat.description || 'Chưa có hướng dẫn mô tả.'}
                  </p>

                  {/* Tags */}
                  {mat.tags && mat.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {mat.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-md font-mono"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Tác giả: {mat.profiles?.full_name || 'Giáo viên'}</span>
                    {isOwner && (
                      <button
                        onClick={() => handleDeleteMaterial(mat.id)}
                        className="text-slate-400 hover:text-red-600 transition"
                        title="Xóa học liệu"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => handleOpenViewer(mat)}
                      className="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Chơi / Xem
                    </button>

                    {isTeacher && (
                      <button
                        onClick={() => handleOpenAssign(mat)}
                        className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Giao Cho Lớp
                      </button>
                    )}
                  </div>
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
