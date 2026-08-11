import React, { useState } from 'react'
import Modal from '../common/Modal'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { KeyRound, Loader2 } from 'lucide-react'

const JoinClassModal = ({ isOpen, onClose, onJoined }) => {
  const { user } = useAuth()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const cleanCode = code.trim().toUpperCase()
    if (!cleanCode) {
      setError('Vui lòng nhập Mã Lớp Học')
      return
    }

    setLoading(true)
    setError('')

    try {
      // 1. Find class by code
      const { data: classData, error: findError } = await supabase
        .from('classes')
        .select('*')
        .eq('code', cleanCode)
        .maybeSingle()

      if (findError) throw findError

      if (!classData) {
        setError('Mã lớp học không tồn tại. Vui lòng kiểm tra lại!')
        setLoading(false)
        return
      }

      // 2. Check if already joined
      const { data: memberData } = await supabase
        .from('class_members')
        .select('id')
        .eq('class_id', classData.id)
        .eq('student_id', user.id)
        .maybeSingle()

      if (memberData) {
        setError('Bạn đã là thành viên của lớp học này!')
        setLoading(false)
        return
      }

      // 3. Join class
      const { error: joinError } = await supabase
        .from('class_members')
        .insert({
          class_id: classData.id,
          student_id: user.id,
        })

      if (joinError) throw joinError

      setCode('')
      onJoined && onJoined(classData)
      onClose()
    } catch (err) {
      console.error('Error joining class:', err)
      setError(err.message || 'Không thể tham gia lớp. Thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tham Gia Lớp Học">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-200">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
            Mã Lớp Học (Join Code) *
          </label>
          <div className="relative">
            <input
              type="text"
              required
              maxLength={6}
              placeholder="VD: X7K9P2"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest font-bold uppercase rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-500 outline-none transition"
            />
            <KeyRound className="w-5 h-5 text-slate-400 absolute right-4 top-4" />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Hỏi giáo viên của bạn mã lớp gồm 6 ký tự để bắt đầu tham gia bài học.
          </p>
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
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-md transition"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Vào Lớp Ngay'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default JoinClassModal
