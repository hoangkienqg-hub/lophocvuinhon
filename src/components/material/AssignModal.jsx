import React, { useState, useEffect } from 'react'
import Modal from '../common/Modal'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Send, Loader2, Calendar } from 'lucide-react'

const AssignModal = ({ isOpen, onClose, material, preselectedClassId, onAssigned }) => {
  const { user } = useAuth()
  const [classes, setClasses] = useState([])
  const [selectedClassId, setSelectedClassId] = useState(preselectedClassId || '')
  const [dueDate, setDueDate] = useState('')
  const [instructions, setInstructions] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchingClasses, setFetchingClasses] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchTeacherClasses()
    }
  }, [isOpen])

  const fetchTeacherClasses = async () => {
    setFetchingClasses(true)
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setClasses(data || [])
      if (data && data.length > 0 && !selectedClassId) {
        setSelectedClassId(data[0].id)
      }
    } catch (err) {
      console.error('Error fetching classes for assignment:', err)
    } finally {
      setFetchingClasses(false)
    }
  }

  const handleAssign = async (e) => {
    e.preventDefault()
    if (!selectedClassId) {
      setError('Vui lòng chọn lớp học để giao bài!')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data, error: assignError } = await supabase
        .from('assignments')
        .insert({
          material_id: material.id,
          class_id: selectedClassId,
          due_date: dueDate ? new Date(dueDate).toISOString() : null,
          instructions: instructions.trim(),
        })
        .select()
        .single()

      if (assignError) throw assignError

      onAssigned && onAssigned(data)
      onClose()
    } catch (err) {
      console.error('Error assigning material:', err)
      setError(err.message || 'Không thể giao bài tập này. Thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Giao Học Liệu / Game Cho Lớp`}>
      <form onSubmit={handleAssign} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-200">
            {error}
          </div>
        )}

        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Học liệu đã chọn:</p>
          <p className="text-base font-bold text-slate-800 dark:text-white">{material?.title}</p>
          <span className="inline-block mt-1 text-xs px-2.5 py-0.5 bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-semibold rounded-md uppercase">
            {material?.type}
          </span>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
            Chọn Lớp Học Nhận Bài *
          </label>
          {fetchingClasses ? (
            <div className="p-3 text-center text-xs text-slate-400">Đang tải danh sách lớp...</div>
          ) : classes.length === 0 ? (
            <div className="p-3 bg-amber-50 text-amber-700 rounded-xl text-sm">
              Bạn chưa tạo lớp học nào. Hãy tạo lớp học trước khi giao bài!
            </div>
          ) : (
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-500 outline-none transition"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.subject})
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
            Hạn Chót Hoàn Thành (Deadline)
          </label>
          <div className="relative">
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-500 outline-none transition text-sm"
            />
            <Calendar className="w-4 h-4 text-slate-400 absolute right-4 top-3.5 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
            Lời Nhắc / Hướng Dẫn Giáo Viên
          </label>
          <textarea
            rows={3}
            placeholder="Yêu cầu học sinh làm bài trước giờ lên lớp..."
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-500 outline-none transition text-sm"
          />
        </div>

        <div className="pt-3 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading || classes.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-md transition"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Xác Nhận Giao Bài
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default AssignModal
