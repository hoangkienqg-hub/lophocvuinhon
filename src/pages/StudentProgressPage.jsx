import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import LoadingSpinner from '../components/common/LoadingSpinner'
import EmptyState from '../components/common/EmptyState'
import { TrendingUp, Trophy, Clock, CheckCircle2, Award, BookOpen, MessageSquare, Eye } from 'lucide-react'

const StudentProgressPage = ({ defaultTab = 'progress' }) => {
  const { user, role, isTeacher, isStudent } = useAuth()
  const [submissionsList, setSubmissionsList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubmissions()
  }, [user, role])

  const fetchSubmissions = async () => {
    setLoading(true)
    try {
      if (isStudent) {
        // Fetch personal student interactive submissions
        const { data, error } = await supabase
          .from('submissions')
          .select('*, assignments(*, materials(*), classes(*))')
          .eq('student_id', user.id)
          .order('updated_at', { ascending: false })

        if (error && error.code !== '42P01') throw error
        setSubmissionsList(data || [])
      } else {
        // Fetch all student submissions for teacher
        const { data, error } = await supabase
          .from('submissions')
          .select('*, profiles:student_id(full_name, email), assignments(*, materials(*), classes(*))')
          .order('updated_at', { ascending: false })

        if (error && error.code !== '42P01') throw error
        setSubmissionsList(data || [])
      }
    } catch (err) {
      console.error('Error fetching submissions:', err)
    } finally {
      setLoading(false)
    }
  }

  const completedCount = submissionsList.filter((p) => p.status === 'submitted' || p.status === 'graded').length
  const gradedList = submissionsList.filter((p) => p.score !== null && p.score !== undefined)
  const avgScore =
    gradedList.length > 0
      ? (
          gradedList.reduce((acc, curr) => acc + Number(curr.score), 0) /
          gradedList.length
        ).toFixed(1)
      : 0

  const isGradesTab = defaultTab === 'grades'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800">
        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
          {isGradesTab ? (
            <>
              <Trophy className="w-7 h-7 text-amber-500 animate-bounce" />
              Bảng Điểm & Bảng Xếp Hạng Lớp Học
            </>
          ) : (
            <>
              <TrendingUp className="w-7 h-7 text-emerald-600" />
              {isStudent ? 'Tiến Độ Học Tập Cá Nhân' : 'Theo Dõi Tiến Độ Học Sinh'}
            </>
          )}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          {isGradesTab
            ? 'Tổng hợp điểm số chi tiết, bảng xếp hạng thi đua và nhận xét từ giáo viên.'
            : 'Thống kê tỷ lệ nộp bài, thời gian làm bài và mức độ hoàn thành bài tập.'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold text-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Đã Hoàn Thành / Nộp Bài</p>
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white">{completedCount} bài</h3>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center font-bold text-xl">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Điểm Trung Bình</p>
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white">{avgScore} / 100</h3>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center font-bold text-xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Danh Hiệu</p>
            <h3 className="text-lg font-extrabold text-slate-800 dark:text-white">
              {completedCount >= 5 ? 'Học Sinh Chăm Chỉ 🌟' : 'Đang Cố Gắng 💪'}
            </h3>
          </div>
        </div>
      </div>

      {/* Progress / Grades Table */}
      {loading ? (
        <LoadingSpinner label="Đang tải dữ liệu tiến độ & điểm số..." />
      ) : submissionsList.length === 0 ? (
        <EmptyState
          icon={isGradesTab ? Trophy : TrendingUp}
          title={isGradesTab ? 'Chưa Có Điểm Số' : 'Chưa Có Bài Nộp'}
          description="Hiện tại chưa có bài tập nào được học sinh nộp hoặc được giáo viên chấm điểm."
        />
      ) : (
        <div className="glass-panel rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  {!isStudent && <th className="px-6 py-3.5">Học Sinh</th>}
                  <th className="px-6 py-3.5">Tên Bài Tập</th>
                  <th className="px-6 py-3.5">Lớp Học</th>
                  <th className="px-6 py-3.5">Trạng Thái</th>
                  <th className="px-6 py-3.5">Điểm Số</th>
                  <th className="px-6 py-3.5">Nhận Xét Của Giáo Viên</th>
                  <th className="px-6 py-3.5">Ngày Nộp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {submissionsList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                    {!isStudent && (
                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                        {item.profiles?.full_name || item.profiles?.email}
                      </td>
                    )}
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                      {item.assignments?.materials?.title || 'Bài Tập Trực Tiếp'}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                      {item.assignments?.classes?.name || 'Lớp Học'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                          item.status === 'graded'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : item.status === 'submitted'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {item.status === 'graded' ? 'Đã Chấm' : item.status === 'submitted' ? 'Đã Nộp' : 'Đang Làm'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-extrabold text-base text-emerald-600 dark:text-emerald-400">
                      {item.score !== null && item.score !== undefined ? `${item.score} / 100đ` : 'Chưa chấm'}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300 italic max-w-xs">
                      {item.teacher_feedback ? `"${item.teacher_feedback}"` : '—'}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-400">
                      {item.submitted_at ? new Date(item.submitted_at).toLocaleString('vi-VN') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentProgressPage
