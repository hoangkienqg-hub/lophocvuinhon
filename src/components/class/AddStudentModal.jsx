import React, { useState } from 'react'
import Modal from '../common/Modal'
import { supabase } from '../../lib/supabase'
import { UserPlus, Loader2, FileSpreadsheet, CheckCircle2 } from 'lucide-react'

// Helper to remove accents for auto-generating student email/username
const removeAccents = (str) => {
  if (!str) return ''
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
}

const AddStudentModal = ({ isOpen, onClose, classId, onStudentsAdded }) => {
  const [studentsText, setStudentsText] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultMessage, setResultMessage] = useState(null)

  const handleAddStudents = async (e) => {
    e.preventDefault()
    if (!studentsText.trim()) return

    setLoading(true)
    setResultMessage(null)

    // Parse names / emails line by line
    const rawLines = studentsText
      .split(/\n+/)
      .map((line) => line.trim())
      .filter((line) => line.length >= 2)

    if (rawLines.length === 0) {
      setResultMessage({ type: 'error', message: 'Vui lòng nhập tên hoặc email học sinh!' })
      setLoading(false)
      return
    }

    try {
      let addedCount = 0
      const newMembers = []

      for (const item of rawLines) {
        const isEmail = item.includes('@')
        let studentId = null

        if (isEmail) {
          // Find by email
          const { data: matchedProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', item.toLowerCase())
            .maybeSingle()

          if (matchedProfile) {
            studentId = matchedProfile.id
          }
        } else {
          // Find by exact or partial name
          const { data: matchedNameProfile } = await supabase
            .from('profiles')
            .select('id')
            .ilike('full_name', item)
            .maybeSingle()

          if (matchedNameProfile) {
            studentId = matchedNameProfile.id
          }
        }

        // If no existing profile, auto-create a student profile entry so teacher is never blocked!
        if (!studentId) {
          const generatedId = crypto.randomUUID()
          const nameSlug = removeAccents(item).toLowerCase().replace(/\s+/g, '') || 'hocsinh'
          const randomDigits = Math.floor(100 + Math.random() * 900)
          const autoEmail = isEmail ? item : `${nameSlug}${randomDigits}@lophocvuinhon.edu.vn`

          const newProfile = {
            id: generatedId,
            full_name: isEmail ? item.split('@')[0] : item,
            email: autoEmail,
            role: 'student',
          }

          const { data: createdProfile, error: profileErr } = await supabase
            .from('profiles')
            .upsert(newProfile, { onConflict: 'email' })
            .select()
            .maybeSingle()

          if (createdProfile) {
            studentId = createdProfile.id
          } else {
            studentId = generatedId
          }
        }

        if (studentId) {
          newMembers.push({
            class_id: classId,
            student_id: studentId,
          })
          addedCount++
        }
      }

      if (newMembers.length > 0) {
        // Upsert into class_members
        const { error: memberErr } = await supabase
          .from('class_members')
          .upsert(newMembers, { onConflict: 'class_id,student_id', ignoreDuplicates: true })

        if (memberErr) throw memberErr

        setResultMessage({
          type: 'success',
          message: `🎉 Đã thêm thành công ${newMembers.length} học sinh vào danh sách lớp!`,
        })
        setStudentsText('')
        onStudentsAdded && onStudentsAdded()
      } else {
        setResultMessage({
          type: 'warning',
          message: 'Không thể thêm học sinh. Vui lòng kiểm tra lại danh sách nhập.',
        })
      }
    } catch (err) {
      console.error('Error adding students:', err)
      setResultMessage({
        type: 'error',
        message: err.message || 'Có lỗi xảy ra khi thêm học sinh vào lớp.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Thêm Danh Sách Học Sinh Vào Lớp">
      <form onSubmit={handleAddStudents} className="space-y-4">
        {resultMessage && (
          <div
            className={`p-3.5 rounded-xl text-sm border font-bold ${
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
            Dán danh sách Họ và Tên học sinh (Mỗi học sinh 1 dòng)
          </label>
          <textarea
            rows={6}
            placeholder={`Ngô Thanh Toàn\nChu Văn Trung\nNgụ Minh Tuấn\nLê Xuân Tùng\nTrần Thị Hà Vy`}
            value={studentsText}
            onChange={(e) => setStudentsText(e.target.value)}
            className="w-full px-4 py-2.5 font-sans text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-500 outline-none transition leading-relaxed"
          />
          <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5 font-medium">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Mẹo: Bạn có thể copy trực tiếp cột Họ và Tên từ file Excel danh sách lớp dán vào đây.</span>
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
            disabled={loading || !studentsText.trim()}
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
