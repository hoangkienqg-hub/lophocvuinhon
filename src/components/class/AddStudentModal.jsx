import React, { useState } from 'react'
import Modal from '../common/Modal'
import { supabase } from '../../lib/supabase'
import { UserPlus, Loader2, FileSpreadsheet } from 'lucide-react'

const AddStudentModal = ({ isOpen, onClose, classId, onStudentsAdded }) => {
  const [emailsText, setEmailsText] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultMessage, setResultMessage] = useState(null)

  const handleAddStudents = async (e) => {
    e.preventDefault()
    if (!emailsText.trim()) return

    setLoading(true)
    setResultMessage(null)

    // Split emails by newline, comma, or space
    const emailsList = emailsText
      .split(/[\n,\s]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 3 && e.includes('@'))

    if (emailsList.length === 0) {
      setResultMessage({ type: 'error', message: 'Không tìm thấy địa chỉ email hợp lệ nào!' })
      setLoading(false)
      return
    }

    try {
      // 1. Find existing profiles matching emails
      const { data: matchedProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('email', emailsList)

      if (profileError) throw profileError

      if (!matchedProfiles || matchedProfiles.length === 0) {
        setResultMessage({
          type: 'warning',
          message: 'Không tìm thấy tài khoản học sinh nào đăng ký với các email đã nhập. Yêu cầu học sinh tạo tài khoản trước!',
        })
        setLoading(false)
        return
      }

      // 2. Prepare class_members records
      const newMembers = matchedProfiles.map((p) => ({
        class_id: classId,
        student_id: p.id,
      }))

      // 3. Upsert / Insert ignore
      const { error: insertError } = await supabase
        .from('class_members')
        .upsert(newMembers, { onConflict: 'class_id,student_id', ignoreDuplicates: true })

      if (insertError) throw insertError

      setResultMessage({
        type: 'success',
        message: `Đã thêm thành công ${matchedProfiles.length} học sinh vào lớp học!`,
      })
      setEmailsText('')
      onStudentsAdded && onStudentsAdded()
    } catch (err) {
      console.error('Error adding students:', err)
      setResultMessage({ type: 'error', message: err.message || 'Có lỗi xảy ra khi thêm học sinh.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Thêm Học Sinh Vào Lớp">
      <form onSubmit={handleAddStudents} className="space-y-4">
        {resultMessage && (
          <div
            className={`p-3.5 rounded-xl text-sm border font-medium ${
              resultMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : resultMessage.type === 'warning'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-red-50 text-red-600 border-red-200'
            }`}
          >
            {resultMessage.message}
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
            Nhập danh sách Email học sinh (Mỗi email một dòng hoặc phân cách bởi dấu phẩy)
          </label>
          <textarea
            rows={5}
            placeholder="hocsinh1@gmail.com&#10;hocsinh2@gmail.com&#10;hocsinh3@gmail.com"
            value={emailsText}
            onChange={(e) => setEmailsText(e.target.value)}
            className="w-full px-4 py-2.5 font-mono text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-500 outline-none transition"
          />
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Mẹo: Bạn có thể copy cột Email từ file Excel / CSV dán trực tiếp vào đây.
          </p>
        </div>

        <div className="pt-3 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
          >
            Đóng
          </button>
          <button
            type="submit"
            disabled={loading || !emailsText.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-md transition"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Thêm Vào Lớp
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default AddStudentModal
