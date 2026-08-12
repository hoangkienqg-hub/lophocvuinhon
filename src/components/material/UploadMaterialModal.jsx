import React, { useState, useEffect } from 'react'
import Modal from '../common/Modal'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Upload, Link as LinkIcon, Gamepad2, FileText, Video, Loader2, Calendar, Award, BookOpen, X } from 'lucide-react'

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
  'Khác',
]

const UploadMaterialModal = ({ isOpen, onClose, onUploaded }) => {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('document') // document, video, game_iframe, game_html5
  const [category, setCategory] = useState('weekly') // weekly, monthly, test, practice, game
  const [fileUrl, setFileUrl] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [subject, setSubject] = useState('Toán Học')
  const [subjectsList, setSubjectsList] = useState(DEFAULT_SUBJECTS)
  const [gradeLevel, setGradeLevel] = useState('Lớp 1')
  const [tags, setTags] = useState('ôn tập, trắc nghiệm')
  const [isPublic, setIsPublic] = useState(true)
  
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchSubjects()
    }
  }, [isOpen])

  const fetchSubjects = async () => {
    try {
      const { data } = await supabase.from('subjects').select('name').order('name', { ascending: true })
      if (data && data.length > 0) {
        const names = data.map((s) => s.name)
        setSubjectsList(names)
        if (!names.includes(subject)) {
          setSubject(names[0])
        }
      }
    } catch (e) {
      console.warn('Fallback to default subjects list:', e)
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
      setFileUrl('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Vui lòng nhập tên tiêu đề học liệu / game')
      return
    }

    setUploading(true)
    setError('')

    try {
      let finalUrl = fileUrl.trim()

      if (selectedFile) {
        const bucket = type === 'game_html5' ? 'games' : 'materials'
        const fileExt = selectedFile.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, selectedFile, { cacheControl: '3600', upsert: true })

        if (uploadError) {
          throw new Error(`Upload file lên Storage thất bại: ${uploadError.message}`)
        }

        const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(filePath)
        finalUrl = publicUrlData.publicUrl
      }

      if (!finalUrl && (type === 'game_iframe' || type === 'video')) {
        setError('Vui lòng chọn file tải lên hoặc nhập đường dẫn liên kết!')
        setUploading(false)
        return
      }

      const tagsArray = tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)

      const { data, error: insertError } = await supabase
        .from('materials')
        .insert({
          title: title.trim(),
          description: description.trim(),
          type,
          category,
          file_url: finalUrl,
          author_id: user.id,
          subject,
          grade_level: gradeLevel,
          tags: tagsArray,
          is_public: isPublic,
        })
        .select()
        .single()

      if (insertError) throw insertError

      setTitle('')
      setDescription('')
      setFileUrl('')
      setSelectedFile(null)
      onUploaded && onUploaded(data)
      onClose()
    } catch (err) {
      console.error('Upload material error:', err)
      setError(err.message || 'Có lỗi xảy ra khi tạo học liệu.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tải Học Liệu / Game Tương Tác Mới" maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-200">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
            Loại Học Liệu / Nội Dung *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setType('document')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition ${
                type === 'document'
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/60'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <FileText className="w-5 h-5" />
              Tài liệu (PDF/Word)
            </button>

            <button
              type="button"
              onClick={() => setType('video')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition ${
                type === 'video'
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/60'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Video className="w-5 h-5" />
              Bài giảng Video
            </button>

            <button
              type="button"
              onClick={() => setType('game_iframe')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition ${
                type === 'game_iframe'
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/60'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Gamepad2 className="w-5 h-5 text-purple-600" />
              Embed Game (Quiz/Wordwall)
            </button>

            <button
              type="button"
              onClick={() => setType('game_html5')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition ${
                type === 'game_html5'
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/60'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Upload className="w-5 h-5 text-emerald-600" />
              Game HTML5 (.zip/URL)
            </button>
          </div>
        </div>

        {/* Category Selector */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
            Mục Đích / Phân Loại Bài Tập *
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-500 outline-none transition font-medium"
          >
            <option value="weekly">📅 Bài Tập Tuần</option>
            <option value="monthly">🗓️ Bài Tập Tháng</option>
            <option value="test">📝 Bài Kiểm Tra / Đề Thi</option>
            <option value="practice">📖 Bài Ôn Tập & Bài Giảng</option>
            <option value="game">🎮 Trò Chơi Giáo Dục</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
            Tiêu Đề Bài Học / Game *
          </label>
          <input
            type="text"
            required
            placeholder="VD: Bài tập Tuần 1 - Phép cộng trừ trong phạm vi 100"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-500 outline-none transition"
          />
        </div>

        {type === 'game_iframe' ? (
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Nhập iFrame Embed URL (Wordwall, Quizizz, Kahoot...) *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="https://wordwall.net/embed/..."
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-500 outline-none transition"
              />
              <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              {fileUrl && (
                <button
                  type="button"
                  onClick={() => setFileUrl('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-red-600 transition"
                  title="Xóa URL"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Chọn File Từ Máy Tính Hoặc Nhập Link Trực Tiếp
            </label>
            
            <div className="flex flex-wrap items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900 text-brand-700 dark:text-brand-300 font-semibold text-sm rounded-xl border border-brand-200 dark:border-brand-800 transition shadow-xs">
                <Upload className="w-4 h-4" />
                <span>Chọn tệp từ máy</span>
                <input type="file" onChange={handleFileChange} className="hidden" />
              </label>
              
              {selectedFile ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate max-w-xs">
                    📄 {selectedFile.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-full transition"
                    title="Xóa / Hủy chọn tệp này"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <span className="text-xs text-slate-400">Chưa chọn tệp nào</span>
              )}
            </div>

            {!selectedFile && (
              <>
                <div className="text-center text-xs text-slate-400 font-semibold uppercase">Hoặc dán đường dẫn web (Link Google Drive / Web)</div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="https://example.com/file.pdf (không bắt buộc nếu đã chọn tệp ở trên)"
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-500 outline-none transition text-sm"
                  />
                  {fileUrl && (
                    <button
                      type="button"
                      onClick={() => setFileUrl('')}
                      className="absolute right-3 top-3 text-slate-400 hover:text-red-600 transition"
                      title="Xóa link"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Môn Học
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-500 outline-none transition"
            >
              {subjectsList.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Khối Lớp
            </label>
            <select
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-500 outline-none transition"
            >
              <option value="Lớp 1">Lớp 1</option>
              <option value="Lớp 2">Lớp 2</option>
              <option value="Lớp 3">Lớp 3</option>
              <option value="Lớp 4">Lớp 4</option>
              <option value="Lớp 5">Lớp 5</option>
              <option value="Tất cả các khối">Tất cả các khối</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
            Thẻ Tag (Phân cách bởi dấu phẩy)
          </label>
          <input
            type="text"
            placeholder="ôntập, trắcnghiệm, gamevui"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-500 outline-none transition text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
            Mô Tả Chi Tiết / Hướng Dẫn Chơi
          </label>
          <textarea
            rows={2}
            placeholder="Hướng dẫn cho học sinh khi xem bài hoặc chơi game... (VD: Đọc kĩ đề và luyện tập nhiều lần cho nhớ)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-500 outline-none transition text-sm"
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="isPublic"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
          />
          <label htmlFor="isPublic" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Công khai học liệu (Cho phép giáo viên khác và toàn hệ thống tham khảo)
          </label>
        </div>

        <div className="pt-3 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
          >
            Hủy Bỏ
          </button>
          <button
            type="submit"
            disabled={uploading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-md transition"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Lưu & Đăng Học Liệu
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default UploadMaterialModal
    
   
