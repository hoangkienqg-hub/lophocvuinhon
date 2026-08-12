import React, { useState, useEffect } from 'react'
import Modal from '../common/Modal'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Trophy, Clock, CheckCircle2, Loader2, Maximize2, ExternalLink, RefreshCw, FileText } from 'lucide-react'

const isOfficeFile = (url) => {
  if (!url) return false
  const lower = url.toLowerCase().split('?')[0]
  return (
    lower.endsWith('.doc') ||
    lower.endsWith('.docx') ||
    lower.endsWith('.ppt') ||
    lower.endsWith('.pptx') ||
    lower.endsWith('.xls') ||
    lower.endsWith('.xlsx')
  )
}

const isImageFile = (url) => {
  if (!url) return false
  const lower = url.toLowerCase().split('?')[0]
  return (
    lower.endsWith('.png') ||
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.gif') ||
    lower.endsWith('.webp')
  )
}

const isPdfFile = (url) => {
  if (!url) return false
  const lower = url.toLowerCase().split('?')[0]
  return lower.endsWith('.pdf')
}

const GameViewerModal = ({ isOpen, onClose, material, assignmentId, onComplete }) => {
  const { user } = useAuth()
  const [seconds, setSeconds] = useState(0)
  const [score, setScore] = useState(100)
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [message, setMessage] = useState('')
  const [viewerEngine, setViewerEngine] = useState('office') // 'office' or 'google'

  useEffect(() => {
    let interval = null
    if (isOpen) {
      setSeconds(0)
      setCompleted(false)
      setMessage('')
      setViewerEngine('office')
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

  const fileUrl = material.file_url || ''
  const isOffice = isOfficeFile(fileUrl)

  const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`
  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={material.title} maxWidth="max-w-5xl">
      <div className="space-y-3">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-brand-600 dark:text-brand-400 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl shadow-xs">
              <Clock className="w-4 h-4" />
              <span>{formatTime(seconds)}</span>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded-lg uppercase">
              {material.type}
            </span>

            {isOffice && (
              <div className="hidden sm:flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <button
                  onClick={() => setViewerEngine('office')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    viewerEngine === 'office'
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                  }`}
                >
                  Trình Xem MS Office
                </button>
                <button
                  onClick={() => setViewerEngine('google')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    viewerEngine === 'google'
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                  }`}
                >
                  Trình Xem Google
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {fileUrl && (
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-brand-600 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition"
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

        {/* Main Content Viewer (Embed iFrame / Video / HTML5 / Word / PDF / Image) */}
        <div className="w-full h-[68vh] bg-slate-900 rounded-2xl overflow-hidden shadow-inner border border-slate-800 flex items-center justify-center relative">
          {material.type === 'game_iframe' || material.type === 'game_html5' ? (
            <iframe
              src={fileUrl}
              title={material.title}
              className="w-full h-full border-0 bg-white"
              allow="fullscreen; autoplay"
            />
          ) : material.type === 'video' ? (
            <video src={fileUrl} controls className="w-full h-full object-contain bg-black" />
          ) : isPdfFile(fileUrl) ? (
            <iframe src={fileUrl} title={material.title} className="w-full h-full border-0 bg-white" />
          ) : isOffice ? (
            <iframe
              src={viewerEngine === 'office' ? officeViewerUrl : googleViewerUrl}
              title={material.title}
              className="w-full h-full border-0 bg-white"
            />
          ) : isImageFile(fileUrl) ? (
            <img src={fileUrl} alt={material.title} className="max-w-full max-h-full object-contain" />
          ) : fileUrl ? (
            <iframe
              src={googleViewerUrl}
              title={material.title}
              className="w-full h-full border-0 bg-white"
            />
          ) : (
            <div className="text-center p-8 text-white space-y-4">
              <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-3xl">
                📄
              </div>
              <h4 className="font-bold text-lg">{material.title}</h4>
              <p className="text-slate-400 text-sm max-w-md mx-auto">{material.description || 'Chưa có file nào được đính kèm.'}</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default GameViewerModal
 
