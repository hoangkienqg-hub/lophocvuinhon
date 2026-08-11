import React, { useState } from 'react'
import Modal from '../common/Modal'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Upload, Link as LinkIcon, Gamepad2, FileText, Video, Loader2 } from 'lucide-react'

const UploadMaterialModal = ({ isOpen, onClose, onUploaded }) => {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('document') // document, video, game_iframe, game_html5
  const [fileUrl, setFileUrl] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [subject, setSubject] = useState('Toán Học')
  const [gradeLevel, setGradeLevel] = useState('Lớp 10')
  const [tags, setTags] = useState('ôn tập, trắc nghiệm')
  const [isPublic, setIsPublic] = useState(true)
  
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
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

      // Handle file upload to Supabase Storage if file selected
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
        setError('Vui lòng nhập đường dẫn URL hoặc chọn file tải lên!')
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

      // Reset form
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

        {/* Type Selector */}
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

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
            Tiêu Đề Bài Học / Game *
          </label>
          <input
            type="text"
            required
            placeholder="VD: Trò chơi Đuổi Hình Bắt Chữ - Đại Số 10"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-500 outline-none transition"
          />
        </div>

        {/* Dynamic File / Link Input */}
        {type === 'game_iframe' ? (
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Nhập iFrame Embed URL (Wordwall, Quizizz, Kahoot...) *
            </label>
            <div className="relative">
              <input
                type="url"
                required
                placeholder="https://wordwall.net/embed/..."
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-500 outline-none transition"
              />
              <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Chọn File Từ Máy Tính Hoặc Nhập Link Trực Tiếp
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-slate-700 dark:file:text-white"
            />
            <div className="text-center text-xs text-slate-400 font-semibold uppercase">Hoặc</div>
            <input
              type="url"
              placeholder="https://example.com/file.pdf"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-500 outline-none transition text-sm"
            />
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
              <option value="Toán Học">Toán Học</option>
              <option value="Vật Lý">Vật Lý</option>
              <option value="Hóa Học">Hóa Học</option>
              <option value="Ngoại Ngữ (Tiếng Anh)">Ngoại Ngữ (Tiếng Anh)</option>
              <option value="Ngữ Văn">Ngữ Văn</option>
              <option value="Sinh Học">Sinh Học</option>
              <option value="Lịch Sử & Địa Lý">Lịch Sử & Địa Lý</option>
              <option value="Tin Học">Tin Học</option>
              <option value="Khác">Khác</option>
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
              <option value="Khối THCS">Khối THCS (Lớp 6-9)</option>
              <option value="Lớp 10">Lớp 10</option>
              <option value="Lớp 11">Lớp 11</option>
              <option value="Lớp 12">Lớp 12</option>
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
            placeholder="Hướng dẫn cho học sinh khi xem bài hoặc chơi game..."
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
