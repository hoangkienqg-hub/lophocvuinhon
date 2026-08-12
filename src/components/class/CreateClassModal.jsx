import React, { useState } from 'react'
import Modal from '../common/Modal'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Sparkles, Loader2 } from 'lucide-react'

// DANH SÁCH MÔN HỌC CHUẨN DÀNH RIÊNG CHO KHỐI TIỂU HỌC (LỚP 1 - LỚP 5)
const PRIMARY_SCHOOL_SUBJECTS = [
  'Toán Học',
  'Tiếng Việt',
  'Tiếng Anh',
  'Tự Nhiên & Xã Hội (Lớp 1, 2, 3)',
  'Khoa Học (Lớp 4, 5)',
  'Lịch Sử & Địa Lý (Lớp 4, 5)',
  'Tin Học & Công Nghệ',
  'Đạo Đức',
  'Mỹ Thuật & Âm Nhạc',
  'Hoạt Động Trải Nghiệm',
  'Tổng Hợp',
]

const CreateClassModal = ({ isOpen, onClose, onCreated }) => {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('Toán Học')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Generate random 6-character join code
  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Vui lòng nhập tên lớp học')
      return
    }

    setLoading(true)
    setError('')

    try {
      const code = generateCode()
      const { data, error: insertError } = await supabase
        .from('classes')
        .insert({
          name: name.trim(),
          subject,
          description: description.trim(),
          code,
          teacher_id: user.id,
        })
        .select()
        .single()

      if (insertError) throw insertError

      setName('')
      setDescription('')
      onCreated && onCreated(data)
      onClose()
    } catch (err) {
      console.error('Error creating class:', err)
      setError(err.message || 'Không thể tạo lớp học. Thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tạo Lớp Học Mới (Khối Tiểu Học Lớp 1 - 5)">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-200">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
            Tên Lớp Học *
          </label>
          <input
            type="text"
            required
            placeholder="Ví dụ: LỚP 5B"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-500 outline-none transition font-medium"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
            Môn Học Chương Trình Tiểu Học *
          </label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-500 outline-none transition font-medium text-slate-800 dark:text-slate-100"
          >
            {PRIMARY_SCHOOL_SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
            Mô Tả Lớp Học
          </label>
          <textarea
            rows={3}
            placeholder="Nội dung, mục tiêu hoặc ghi chú của lớp học tiểu học..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-500 outline-none transition text-sm"
          />
        </div>

        <div className="pt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-md transition"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Tạo Lớp Học
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default CreateClassModal
