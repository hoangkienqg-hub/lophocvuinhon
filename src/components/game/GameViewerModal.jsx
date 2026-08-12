import React, { useState, useEffect, useRef } from 'react'
import Modal from '../common/Modal'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import {
  Pencil,
  Circle,
  Highlighter,
  Square,
  Minus,
  Type,
  Eraser,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Save,
  Send,
  CheckCircle2,
  Clock,
  Sparkles,
  HelpCircle,
  Maximize2,
  ExternalLink,
} from 'lucide-react'

const COLOR_OPTIONS = [
  { name: 'Đỏ (Khoanh đáp án)', value: '#ef4444' },
  { name: 'Xanh Dương', value: '#2563eb' },
  { name: 'Xanh Lá', value: '#16a34a' },
  { name: 'Vàng Dạ Quang', value: '#facc15' },
  { name: 'Đen', value: '#09090b' },
]

const GameViewerModal = ({ isOpen, onClose, material, assignmentId, onComplete }) => {
  const { user } = useAuth()

  // State
  const [zoom, setZoom] = useState(1)

  // Tools
  const [tool, setTool] = useState('circle') // 'circle', 'pen', 'highlighter', 'rectangle', 'line', 'text', 'eraser'
  const [color, setColor] = useState('#ef4444') // Red default
  const [strokeWidth, setStrokeWidth] = useState(4)

  // Single continuous annotations array for full document
  const [annotations, setAnnotations] = useState([])
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Timer & Submission
  const [seconds, setSeconds] = useState(0)
  const [submissionId, setSubmissionId] = useState(null)
  const [submissionStatus, setSubmissionStatus] = useState('in_progress')
  const [saveStatus, setSaveStatus] = useState('idle')
  const [lastSavedTime, setLastSavedTime] = useState(null)

  // Modals & Text Input
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [textInputPos, setTextInputPos] = useState(null)
  const [textInputValue, setTextInputValue] = useState('')

  // Canvas Refs & Container Scroll
  const canvasRef = useRef(null)
  const scrollContainerRef = useRef(null)
  const isDrawing = useRef(false)
  const currentShape = useRef(null)

  useEffect(() => {
    let interval = null
    if (isOpen) {
      setSeconds(0)
      
      // Auto-scroll to top so Header ("Họ và tên...") is always visible
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0
      }

      interval = setInterval(() => {
        setSeconds((prev) => prev + 1)
      }, 1000)

      if (assignmentId && user) {
        loadSubmission()
      }
    } else {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [isOpen, assignmentId, user])

  const loadSubmission = async () => {
    try {
      const { data } = await supabase
        .from('submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .eq('student_id', user.id)
        .maybeSingle()

      if (data) {
        setSubmissionId(data.id)
        setSubmissionStatus(data.status || 'in_progress')
        // Load annotations data (supports array or legacy object)
        const annData = data.annotations_data
        if (Array.isArray(annData)) {
          setAnnotations(annData)
        } else if (annData && typeof annData === 'object') {
          // Merge page_1, page_2 into continuous list
          const combined = []
          Object.values(annData).forEach((pageShapes) => {
            if (Array.isArray(pageShapes)) combined.push(...pageShapes)
          })
          setAnnotations(combined)
        }
        if (data.saved_at) {
          setLastSavedTime(new Date(data.saved_at).toLocaleTimeString('vi-VN'))
        }
      }
    } catch (err) {
      console.error('Error loading submission:', err)
    }
  }

  useEffect(() => {
    redrawCanvas()
  }, [annotations, zoom, isOpen])

  const redrawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    annotations.forEach((shape) => drawShapeOnContext(ctx, shape, canvas.width, canvas.height))
  }

  const drawShapeOnContext = (ctx, shape, w, h) => {
    ctx.save()
    ctx.strokeStyle = shape.color || '#ef4444'
    ctx.fillStyle = shape.color || '#ef4444'
    ctx.lineWidth = (shape.strokeWidth || 4) * zoom

    if (shape.tool === 'highlighter') {
      ctx.globalAlpha = 0.4
      ctx.lineWidth = (shape.strokeWidth || 12) * 2 * zoom
    } else {
      ctx.globalAlpha = 1.0
    }

    if (shape.tool === 'pen' || shape.tool === 'highlighter') {
      if (shape.points && shape.points.length > 0) {
        ctx.beginPath()
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.moveTo(shape.points[0].x * w, shape.points[0].y * h)
        for (let i = 1; i < shape.points.length; i++) {
          ctx.lineTo(shape.points[i].x * w, shape.points[i].y * h)
        }
        ctx.stroke()
      }
    } else if (shape.tool === 'circle') {
      const rx = (shape.w * w) / 2
      const ry = (shape.h * h) / 2
      const cx = shape.x * w + rx
      const cy = shape.y * h + ry
      ctx.beginPath()
      ctx.ellipse(cx, cy, Math.abs(rx), Math.abs(ry), 0, 0, 2 * Math.PI)
      ctx.stroke()
    } else if (shape.tool === 'rectangle') {
      ctx.beginPath()
      ctx.strokeRect(shape.x * w, shape.y * h, shape.w * w, shape.h * h)
    } else if (shape.tool === 'line') {
      ctx.beginPath()
      ctx.moveTo(shape.x * w, shape.y * h)
      ctx.lineTo((shape.x + shape.w) * w, (shape.y + shape.h) * h)
      ctx.stroke()
    } else if (shape.tool === 'text') {
      ctx.font = `bold ${16 * zoom}px sans-serif`
      ctx.fillText(shape.text, shape.x * w, shape.y * h)
    }

    ctx.restore()
  }

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    let clientX = e.clientX
    let clientY = e.clientY

    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    }

    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    }
  }

  const handlePointerDown = (e) => {
    if (submissionStatus === 'submitted' || submissionStatus === 'graded') return
    const pos = getCanvasCoords(e)

    if (tool === 'text') {
      setTextInputPos(pos)
      setTextInputValue('')
      return
    }

    if (tool === 'eraser') {
      eraseAtPoint(pos)
      return
    }

    isDrawing.current = true
    if (tool === 'pen' || tool === 'highlighter') {
      currentShape.current = { tool, color, strokeWidth, points: [pos] }
    } else {
      currentShape.current = { tool, color, strokeWidth, x: pos.x, y: pos.y, w: 0, h: 0 }
    }
  }

  const handlePointerMove = (e) => {
    if (!isDrawing.current || !currentShape.current) return
    const pos = getCanvasCoords(e)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    if (tool === 'pen' || tool === 'highlighter') {
      currentShape.current.points.push(pos)
    } else {
      currentShape.current.w = pos.x - currentShape.current.x
      currentShape.current.h = pos.y - currentShape.current.y
    }

    redrawCanvas()
    drawShapeOnContext(ctx, currentShape.current, canvas.width, canvas.height)
  }

  const handlePointerUp = () => {
    if (!isDrawing.current || !currentShape.current) return
    isDrawing.current = false

    const updatedShapes = [...annotations, currentShape.current]

    setAnnotations(updatedShapes)
    saveHistory(updatedShapes)
    autoSave(updatedShapes)
    currentShape.current = null
  }

  const eraseAtPoint = (pos) => {
    const filtered = annotations.filter((shape) => {
      if (shape.tool === 'circle' || shape.tool === 'rectangle') {
        const cx = shape.x + shape.w / 2
        const cy = shape.y + shape.h / 2
        return Math.hypot(pos.x - cx, pos.y - cy) > 0.05
      }
      return true
    })

    setAnnotations(filtered)
    saveHistory(filtered)
    autoSave(filtered)
  }

  const handleAddText = () => {
    if (!textInputPos || !textInputValue.trim()) {
      setTextInputPos(null)
      return
    }

    const textShape = {
      tool: 'text',
      color,
      strokeWidth,
      x: textInputPos.x,
      y: textInputPos.y,
      text: textInputValue.trim(),
    }

    const updated = [...annotations, textShape]
    setAnnotations(updated)
    saveHistory(updated)
    autoSave(updated)
    setTextInputPos(null)
    setTextInputValue('')
  }

  const saveHistory = (newAnnotations) => {
    const nextHistory = history.slice(0, historyIndex + 1)
    nextHistory.push(newAnnotations)
    setHistory(nextHistory)
    setHistoryIndex(nextHistory.length - 1)
  }

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1
      setHistoryIndex(prevIndex)
      setAnnotations(history[prevIndex])
      autoSave(history[prevIndex])
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1
      setHistoryIndex(nextIndex)
      setAnnotations(history[nextIndex])
      autoSave(history[nextIndex])
    }
  }

  const autoSave = async (dataToSave = annotations) => {
    if (!user || !assignmentId) return
    setSaveStatus('saving')

    try {
      const payload = {
        assignment_id: assignmentId,
        material_id: material.id,
        student_id: user.id,
        status: submissionStatus === 'submitted' ? 'submitted' : 'in_progress',
        annotations_data: dataToSave,
        saved_at: new Date().toISOString(),
      }
      if (submissionId) payload.id = submissionId

      const { data, error } = await supabase
        .from('submissions')
        .upsert(payload, { onConflict: 'assignment_id,student_id' })
        .select()
        .single()

      if (error) throw error
      if (data) setSubmissionId(data.id)

      setSaveStatus('saved')
      setLastSavedTime(new Date().toLocaleTimeString('vi-VN'))
    } catch (err) {
      console.error('Auto save error:', err)
      setSaveStatus('error')
    }
  }

  const handleFinalSubmit = async () => {
    if (!user || !assignmentId) return
    setSaveStatus('saving')

    try {
      const { data, error } = await supabase
        .from('submissions')
        .upsert(
          {
            assignment_id: assignmentId,
            material_id: material.id,
            student_id: user.id,
            status: 'submitted',
            annotations_data: annotations,
            submitted_at: new Date().toISOString(),
            saved_at: new Date().toISOString(),
          },
          { onConflict: 'assignment_id,student_id' }
        )
        .select()
        .single()

      if (error) throw error

      setSubmissionStatus('submitted')
      setShowConfirmModal(false)
      setShowSuccessModal(true)
      onComplete && onComplete(data)
    } catch (err) {
      console.error('Submit error:', err)
      alert('⚠️ Chưa thể nộp bài. Vui lòng kiểm tra kết nối internet và thử lại!')
    } finally {
      setSaveStatus('idle')
    }
  }

  if (!material) return null

  const fileUrl = material.file_url || ''
  const formatTime = (sec) => `${Math.floor(sec / 60).toString().padStart(2, '0')}:${(sec % 60).toString().padStart(2, '0')}`

  const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={material.title} maxWidth="max-w-6xl">
      <div className="flex flex-col h-[84vh] bg-slate-900 rounded-2xl overflow-hidden text-slate-100 select-none shadow-2xl relative border border-slate-800">
        {/* TOOLBAR TOP BAR */}
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Tools */}
          {submissionStatus !== 'submitted' && submissionStatus !== 'graded' && (
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
              <button
                onClick={() => setTool('circle')}
                className={`p-2 rounded-xl flex items-center gap-1 text-xs font-bold transition ${
                  tool === 'circle' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
                title="Khoanh tròn đáp án trắc nghiệm A, B, C, D"
              >
                <Circle className="w-4 h-4" />
                <span>Khoanh B</span>
              </button>

              <button
                onClick={() => setTool('pen')}
                className={`p-2 rounded-xl flex items-center gap-1 text-xs font-bold transition ${
                  tool === 'pen' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
                title="Bút viết tự do"
              >
                <Pencil className="w-4 h-4" />
                <span>Bút Viết</span>
              </button>

              <button
                onClick={() => setTool('highlighter')}
                className={`p-2 rounded-xl flex items-center gap-1 text-xs font-bold transition ${
                  tool === 'highlighter' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
                title="Đánh dấu dạ quang"
              >
                <Highlighter className="w-4 h-4" />
                <span>Highlight</span>
              </button>

              <button
                onClick={() => setTool('rectangle')}
                className={`p-2 rounded-xl flex items-center gap-1 text-xs font-bold transition ${
                  tool === 'rectangle' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
                title="Khung chữ nhật"
              >
                <Square className="w-4 h-4" />
              </button>

              <button
                onClick={() => setTool('line')}
                className={`p-2 rounded-xl flex items-center gap-1 text-xs font-bold transition ${
                  tool === 'line' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
                title="Gạch chân"
              >
                <Minus className="w-4 h-4" />
              </button>

              <button
                onClick={() => setTool('text')}
                className={`p-2 rounded-xl flex items-center gap-1 text-xs font-bold transition ${
                  tool === 'text' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
                title="Nhập văn bản"
              >
                <Type className="w-4 h-4" />
                <span>Gõ Chữ</span>
              </button>

              <button
                onClick={() => setTool('eraser')}
                className={`p-2 rounded-xl flex items-center gap-1 text-xs font-bold transition ${
                  tool === 'eraser' ? 'bg-rose-700 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
                title="Tẩy xóa nét"
              >
                <Eraser className="w-4 h-4" />
              </button>

              <div className="w-px h-6 bg-slate-800 mx-1" />

              {/* Colors */}
              <div className="flex items-center gap-1 px-1">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setColor(c.value)}
                    className={`w-6 h-6 rounded-full border-2 transition ${
                      color === c.value ? 'border-white scale-110 shadow-sm' : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-brand-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTime(seconds)}</span>
            </div>

            {/* Save & Submit */}
            <div className="flex items-center gap-2">
              {saveStatus === 'saved' && (
                <span className="text-xs text-emerald-400 font-bold hidden sm:inline">
                  ✓ Đã lưu {lastSavedTime}
                </span>
              )}

              {submissionStatus !== 'submitted' && submissionStatus !== 'graded' ? (
                <>
                  <button
                    onClick={() => autoSave()}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Save className="w-4 h-4" /> Lưu Bài
                  </button>
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition"
                  >
                    <Send className="w-4 h-4" /> NỘP BÀI
                  </button>
                </>
              ) : (
                <span className="px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-xl text-xs font-extrabold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> ĐÃ NỘP BÀI
                </span>
              )}
            </div>
          </div>
        </div>

        {/* FULL CONTINUOUS DOCUMENT CANVAS CONTAINER */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto bg-slate-950 flex flex-col items-center justify-start p-4 relative"
        >
          <div
            className="relative bg-white shadow-2xl rounded-xl overflow-hidden my-2"
            style={{
              width: `${860 * zoom}px`,
              minHeight: `${2800 * zoom}px`, // Full length for 9 MCQs + Free Response Essay
            }}
          >
            {/* Background Full Document View */}
            {fileUrl ? (
              <iframe
                src={viewerUrl}
                title={material.title}
                className="w-full h-full min-h-[2800px] border-0 pointer-events-none"
              />
            ) : (
              <div className="p-8 text-slate-800 font-sans text-center">
                <h2 className="text-2xl font-bold">{material.title}</h2>
                <p className="text-slate-500 text-sm mt-2">{material.description}</p>
              </div>
            )}

            {/* Full Length Interactive Canvas Overlay */}
            <canvas
              ref={canvasRef}
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerUp}
              className="absolute inset-0 w-full h-full cursor-crosshair z-10"
              style={{ touchAction: 'none' }}
            />

            {/* Text Input Box */}
            {textInputPos && (
              <div
                className="absolute z-20 bg-slate-900 p-2 rounded-xl border border-brand-500 shadow-2xl flex gap-2"
                style={{ left: `${textInputPos.x * 100}%`, top: `${textInputPos.y * 100}%` }}
              >
                <input
                  type="text"
                  autoFocus
                  placeholder="Gõ lời giải hoặc ghi chú..."
                  value={textInputValue}
                  onChange={(e) => setTextInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddText()}
                  className="px-3 py-1.5 text-xs text-white bg-slate-800 rounded-lg outline-none border border-slate-700 w-52 font-bold"
                />
                <button
                  onClick={handleAddText}
                  className="px-3 py-1.5 bg-brand-600 text-white font-bold text-xs rounded-lg hover:bg-brand-700"
                >
                  OK
                </button>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER BAR */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2 font-bold text-slate-300">
            <span>📜 Chế độ: <strong>Xem Cuộn Trọn Bộ Phiếu Bài Tập (Từ Đầu Đến Cuối)</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom((z) => Math.max(0.7, z - 0.1))}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg border border-slate-800 font-bold"
            >
              - Zoom
            </button>
            <span className="font-mono text-xs font-bold text-slate-200">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(1.8, z + 0.1))}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg border border-slate-800 font-bold"
            >
              + Zoom
            </button>
          </div>
        </div>

        {/* CONFIRMATION MODAL */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 max-w-md w-full text-center space-y-4">
              <h3 className="text-xl font-extrabold">Xác Nhận Nộp Bài?</h3>
              <p className="text-sm text-slate-300">Em có chắc chắn muốn nộp bài làm này không?</p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="w-full py-2.5 bg-slate-800 font-bold text-xs rounded-xl"
                >
                  Quay lại làm bài
                </button>
                <button
                  onClick={handleFinalSubmit}
                  className="w-full py-2.5 bg-emerald-600 font-bold text-xs text-white rounded-xl shadow-md"
                >
                  Xác nhận nộp bài
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUCCESS MODAL */}
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-emerald-500/40 text-white rounded-3xl p-6 max-w-md w-full text-center space-y-4">
              <Sparkles className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
              <h3 className="text-2xl font-extrabold text-emerald-400">🎉 NỘP BÀI THÀNH CÔNG!</h3>
              <p className="text-sm text-slate-300">Bài làm của em đã được tự động lưu và gửi đến giáo viên.</p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-3 bg-emerald-600 font-bold text-xs text-white rounded-xl"
              >
                Xem Bài Làm Của Em
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default GameViewerModal

