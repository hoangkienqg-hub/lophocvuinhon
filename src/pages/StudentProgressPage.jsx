import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import LoadingSpinner from '../components/common/LoadingSpinner'
import EmptyState from '../components/common/EmptyState'
import { TrendingUp, Trophy, Clock, CheckCircle2, Award, BookOpen } from 'lucide-react'

const StudentProgressPage = () => {
  const { user, role, isTeacher, isStudent } = useAuth()
  const [progressList, setProgressList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProgress()
  }, [user, role])

  const fetchProgress = async () => {
    setLoading(true)
    try {
      if (isStudent) {
        // Fetch personal student progress
        const { data, error } = await supabase
          .from('student_progress')
          .select('*, assignments(*, materials(*), classes(*))')
          .eq('student_id', user.id)
          .order('completed_at', { ascending: false })

        if (error) throw error
        setProgressList(data || [])
      } else {
        // Fetch all student progress for teacher's classes
        const { data, error } = await supabase
          .from('student_progress')
          .select('*, profiles:student_id(full_name, email), assignments(*, materials(*), classes(*))')
          .order('completed_at', { ascending: false })

        if (error) throw error
        setProgressList(data || [])
      }
    } catch (err) {
      console.error('Error fetching progress:', err)
    } finally {
      setLoading(false)
    }
  }

  const completedCount = progressList.filter((p) => p.status === 'completed').length
  const avgScore =
    progressList.length > 0
      ? (
          progressList.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0) /
          progressList.length
        ).toFixed(1)
      : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-7 h-7 text-emerald-600" />
          {isStudent ? 'Bảng Thành Tích Cá Nhân' : 'Báo Cáo & Tiến Độ Học Sinh'}
        </h2>
        <p className="text-sm text-slate-500">
          {isStudent
            ? 'Theo dõi kết quả học tập và lịch sử hoàn thành bài chơi của bạn'
            : 'Tổng hợp điểm số và thời gian hoàn thành bài tập của học sinh'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold text-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Đã Hoàn Thành</p>
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

      {/* Progress Table */}
      {loading ? (
        <LoadingSpinner label="Đang tải dữ liệu tiến độ..." />
      ) : progressList.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="Chưa có dữ liệu tiến độ"
          description="Chưa có kết quả học tập nào được ghi nhận."
        />
      ) : (
        <div className="glass-panel rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  {!isStudent && <th className="px-6 py-3.5">Học Sinh</th>}
                  <th className="px-6 py-3.5">Tên Học Liệu / Game</th>
                  <th className="px-6 py-3.5">Lớp Học</th>
                  <th className="px-6 py-3.5">Điểm Số</th>
                  <th className="px-6 py-3.5">Thời Gian Chơi</th>
                  <th className="px-6 py-3.5">Trạng Thái</th>
                  <th className="px-6 py-3.5">Thời Gian Nộp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {progressList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                    {!isStudent && (
                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                        {item.profiles?.full_name || item.profiles?.email}
                      </td>
                    )}
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                      {item.assignments?.materials?.title || 'Game Tương Tác'}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                      {item.assignments?.classes?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400">
                      {item.score} điểm
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      {item.completion_time_seconds ? `${item.completion_time_seconds} giây` : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="w-3 h-3" />
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-400">
                      {item.completed_at ? new Date(item.completed_at).toLocaleString('vi-VN') : '—'}
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
