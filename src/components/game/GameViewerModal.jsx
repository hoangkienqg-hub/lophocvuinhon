import React, { useState, useEffect } from 'react'
import Modal from '../common/Modal'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Trophy, Clock, CheckCircle2, Loader2, Maximize2, ExternalLink } from 'lucide-react'

const GameViewerModal = ({ isOpen, onClose, material, assignmentId, onComplete }) => {
  const { user } = useAuth()
  const [seconds, setSeconds] = useState(0)
  const [score, setScore] = useState(100)
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let interval = null
    if (isOpen) {
      setSeconds(0)
      setCompleted(false)
      setMessage('')
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1)
      }, 1000)
    } else {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [isOpen])

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleFinish = async () => {
    if (!user) return

    setSubmitting(true)
    try {
      if (assignmentId) {
        // Upsert student progress for assignment
        const { error } = await supabase.from('student_progress').upsert(
          {
            assignment_id: assignmentId,
            student_id: user.id,
            status: 'completed',
            score: Number(score),
            completion_time_seconds: seconds,
            completed_at: new Date().toISOString(),
          },
          { onConflict: 'assignment_id,student_id' }
        )

        if (error) throw error
      }

      setCompleted(true)
      setMessage('🎉 Chúc mừng bạn đã hoàn thành bài học / trò chơi!')
      onComplete && onComplete({ score, time: seconds })
    } catch (err) {
      console.error('Error recording game progress:', err)
      setMessage('Có lỗi khi lưu kết quả. Thử lại sau.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!material) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={material.title} maxWidth="max-w-5xl">
      <div className="space-y-4">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-brand-600 dark:text-brand-400 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl shadow-xs">
              <Clock className="w-4 h-4" />
              <span>{formatTime(seconds)}</span>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded-lg uppercase">
              {material.type}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {material.file_url && (
              <a
                href={material.file_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-brand-600 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Mở Cửa Sổ Mới
              </a>
            )}

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Điểm số:</label>
              <input
                type="number"
                min="0"
                max="100"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="w-16 px-2 py-1 text-center font-bold text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <button
              onClick={handleFinish}
              disabled={submitting || completed}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition"
            >
              {submitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              {completed ? 'Đã Nộp' : 'Nộp Bài'}
            </button>
          </div>
        </div>

        {message && (
          <div className="p-3 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-xl text-sm font-semibold text-center border border-emerald-200 dark:border-emerald-800">
            {message}
          </div>
        )}

        {/* Main Content Viewer (Embed iFrame / Video / HTML5) */}
        <div className="w-full h-[65vh] bg-black rounded-2xl overflow-hidden shadow-inner border border-slate-800 flex items-center justify-center relative">
          {material.type === 'game_iframe' ? (
            <iframe
              src={material.file_url}
              title={material.title}
              className="w-full h-full border-0"
              allow="fullscreen; autoplay"
            />
          ) : material.type === 'video' ? (
            <video src={material.file_url} controls className="w-full h-full object-contain" />
          ) : material.type === 'game_html5' ? (
            <iframe
              src={material.file_url}
              title={material.title}
              className="w-full h-full border-0"
              allow="fullscreen; autoplay"
            />
          ) : material.file_url?.endsWith('.pdf') ? (
            <iframe src={material.file_url} title={material.title} className="w-full h-full border-0" />
          ) : (
            <div className="text-center p-8 text-white space-y-4">
              <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-3xl">
                📄
              </div>
              <h4 className="font-bold text-lg">{material.title}</h4>
              <p className="text-slate-400 text-sm max-w-md mx-auto">{material.description}</p>
              {material.file_url && (
                <a
                  href={material.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white rounded-xl font-bold text-sm"
                >
                  <Maximize2 className="w-4 h-4" />
                  Xem / Tải Tài Liệu
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default GameViewerModal
