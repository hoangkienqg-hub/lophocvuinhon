import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import LoadingSpinner from '../components/common/LoadingSpinner'
import CreateClassModal from '../components/class/CreateClassModal'
import JoinClassModal from '../components/class/JoinClassModal'
import UploadMaterialModal from '../components/material/UploadMaterialModal'
import {
  Users,
  Gamepad2,
  BookOpen,
  Plus,
  KeyRound,
  Upload,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
  Clock,
  Sparkles,
  Trophy,
  Star,
  Play,
  RotateCcw,
  Zap,
  Check,
  X,
} from 'lucide-react'

// Fun Mini-Games Metadata
const FUN_GAMES = [
  {
    id: 'math_fast',
    title: '🧮 Nhanh Như Chớp - Phép Tính Nhanh',
    description: 'Thử thách tính nhẩm 5 câu cộng trừ nhân chia siêu tốc!',
    category: 'Toán Học',
    color: 'from-amber-500 to-orange-600',
    icon: '⚡',
  },
  {
    id: 'vietnamese_quiz',
    title: '📖 Đố Vui Tiếng Việt & Ca Dao',
    description: 'Giải mã các câu đố ca dao, tục ngữ và chính tả Tiếng Việt Tiểu học!',
    category: 'Tiếng Việt',
    color: 'from-emerald-500 to-teal-600',
    icon: '🌟',
  },
  {
    id: 'science_explore',
    title: '🔬 Khám Phá Thế Giới Tự Nhiên',
    description: 'Tìm hiểu về động thực vật, vũ trụ và môi trường sống xung quanh!',
    category: 'Khoa Học',
    color: 'from-blue-500 to-indigo-600',
    icon: '🌍',
  },
  {
    id: 'english_fun',
    title: '🇬🇧 English Vocabulary Fun',
    description: 'Thử thách vốn từ vựng Tiếng Anh Tiểu học siêu sinh động!',
    category: 'Tiếng Anh',
    color: 'from-purple-500 to-pink-600',
    icon: '🎮',
  },
]

// Distinct Question Bank for Each Game
const GAME_QUESTION_BANK = {
  math_fast: [
    { question: '25 + 15 = ?', options: ['30', '40', '50', '35'], answer: '40' },
    { question: '50 - 18 = ?', options: ['32', '28', '38', '42'], answer: '32' },
    { question: '9 x 6 = ?', options: ['45', '54', '63', '48'], answer: '54' },
    { question: '100 : 25 = ?', options: ['2', '5', '4', '10'], answer: '4' },
    { question: '45 + 35 = ?', options: ['70', '80', '90', '75'], answer: '80' },
  ],
  vietnamese_quiz: [
    {
      question: 'Nhiễu điều phủ lấy giá gương / Người trong một nước phải ... nhau cùng.',
      options: ['thương', 'yêu', 'giúp', 'nhớ'],
      answer: 'thương',
    },
    {
      question: 'Từ nào dưới đây viết ĐÚNG chính tả?',
      options: ['Chong chóng', 'Trong chóng', 'Chong chón', 'Trong chón'],
      answer: 'Chong chóng',
    },
    {
      question: 'Điền từ thích hợp: "Con có cha như nhà có ..."',
      options: ['nóc', 'cột', 'mái', 'tường'],
      answer: 'nóc',
    },
    {
      question: 'Từ nào đồng nghĩa với "chăm chỉ"?',
      options: ['Cần cù', 'Lười biếng', 'Nhanh nhẹn', 'Thật thà'],
      answer: 'Cần cù',
    },
    {
      question: 'Điền từ vào thành ngữ: "Ăn quả nhớ kẻ ... cây."',
      options: ['trồng', 'hái', 'tưới', 'bảo vệ'],
      answer: 'trồng',
    },
  ],
  science_explore: [
    {
      question: 'Cây xanh hấp thụ khí gì trong quá trình quang hợp dưới ánh nắng?',
      options: ['Khí Cacbonic', 'Khí Ôxy', 'Khí Nitơ', 'Khí Hydro'],
      answer: 'Khí Cacbonic',
    },
    {
      question: 'Động vật nào sau đây đẻ trứng?',
      options: ['Con Gà', 'Con Bò', 'Con Chó', 'Con Mèo'],
      answer: 'Con Gà',
    },
    {
      question: 'Nước hoa quả tươi cung cấp nhiều chất gì cho cơ thể?',
      options: ['Vitamin', 'Chất béo', 'Đường hóa học', 'Muối biển'],
      answer: 'Vitamin',
    },
    {
      question: 'Trái Đất quay quanh vật thể nào trong Hệ Mặt Trời?',
      options: ['Mặt Trời', 'Mặt Trăng', 'Sao Hỏa', 'Sao Kim'],
      answer: 'Mặt Trời',
    },
    {
      question: 'Loài vật nào được mệnh danh là "Chúa sơn lâm"?',
      options: ['Con Hổ (Hùm)', 'Sư Tử', 'Voi', 'Gấu'],
      answer: 'Con Hổ (Hùm)',
    },
  ],
  english_fun: [
    {
      question: 'Từ "Apple" trong Tiếng Việt nghĩa là quả gì?',
      options: ['Quả Táo', 'Quả Cam', 'Quả Chuối', 'Quả Dưa hấu'],
      answer: 'Quả Táo',
    },
    {
      question: 'Từ Tiếng Anh chỉ "Con Mèo" là gì?',
      options: ['Cat', 'Dog', 'Bird', 'Fish'],
      answer: 'Cat',
    },
    {
      question: 'Số "10" trong Tiếng Anh đọc là gì?',
      options: ['Ten', 'Five', 'Eight', 'Seven'],
      answer: 'Ten',
    },
    {
      question: 'Từ Tiếng Anh chỉ "Mặt Trời" là gì?',
      options: ['Sun', 'Moon', 'Star', 'Cloud'],
      answer: 'Sun',
    },
    {
      question: 'Từ "Teacher" có nghĩa là gì?',
      options: ['Giáo viên', 'Học sinh', 'Bác sĩ', 'Kỹ sư'],
      answer: 'Giáo viên',
    },
  ],
}

const DashboardPage = () => {
  const { user, profile, role, isAdmin, isTeacher } = useAuth()

  const [stats, setStats] = useState({
    classesCount: 0,
    materialsCount: 0,
    studentsCount: 0,
    assignmentsCount: 0,
  })

  const [recentClasses, setRecentClasses] = useState([])
  const [recentMaterials, setRecentMaterials] = useState([])
  const [loading, setLoading] = useState(true)

  const [showCreateClass, setShowCreateClass] = useState(false)
  const [showJoinClass, setShowJoinClass] = useState(false)
  const [showUploadMaterial, setShowUploadMaterial] = useState(false)

  // Mini-Game Interactive State
  const [activeMiniGame, setActiveMiniGame] = useState(null)
  const [currentQuestions, setCurrentQuestions] = useState([])
  const [gameScore, setGameScore] = useState(0)
  const [gameQuestionIndex, setGameQuestionIndex] = useState(0)
  const [gameTimer, setGameTimer] = useState(30)
  const [gameActive, setGameActive] = useState(false)
  const [gameFeedback, setGameFeedback] = useState('')
  const [selectedOption, setSelectedOption] = useState(null)

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user, role])

  // Mini-game timer countdown
  useEffect(() => {
    let interval = null
    if (gameActive && gameTimer > 0) {
      interval = setInterval(() => {
        setGameTimer((prev) => prev - 1)
      }, 1000)
    } else if (gameTimer === 0) {
      setGameActive(false)
      setGameFeedback('⏰ Đã hết thời gian! Kết quả của bạn đã được ghi nhận.')
    }
    return () => clearInterval(interval)
  }, [gameActive, gameTimer])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      if (isAdmin) {
        const [clsRes, matRes, usrRes] = await Promise.all([
          supabase.from('classes').select('id, name, subject, code, created_at', { count: 'exact' }).limit(4),
          supabase.from('materials').select('id, title, type, subject, created_at', { count: 'exact' }).limit(4),
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
        ])

        setStats({
          classesCount: clsRes.count || 0,
          materialsCount: matRes.count || 0,
          studentsCount: usrRes.count || 0,
          assignmentsCount: 0,
        })
        setRecentClasses(clsRes.data || [])
        setRecentMaterials(matRes.data || [])
      } else if (isTeacher) {
        const { data: tClasses, count: cCount } = await supabase
          .from('classes')
          .select('id, name, subject, code, created_at', { count: 'exact' })
          .eq('teacher_id', user.id)
          .limit(4)

        const { data: tMaterials, count: mCount } = await supabase
          .from('materials')
          .select('id, title, type, subject, created_at', { count: 'exact' })
          .eq('author_id', user.id)
          .limit(4)

        setStats({
          classesCount: cCount || 0,
          materialsCount: mCount || 0,
          studentsCount: 0,
          assignmentsCount: 0,
        })
        setRecentClasses(tClasses || [])
        setRecentMaterials(tMaterials || [])
      } else {
        const { data: sMemberships } = await supabase
          .from('class_members')
          .select('class_id, classes(id, name, subject, code)')
          .eq('student_id', user.id)

        const joinedClasses = sMemberships?.map((m) => m.classes).filter(Boolean) || []

        const { data: pMaterials } = await supabase
          .from('materials')
          .select('id, title, type, subject, created_at')
          .eq('is_public', true)
          .limit(4)

        setStats({
          classesCount: joinedClasses.length,
          materialsCount: pMaterials?.length || 0,
          studentsCount: 1,
          assignmentsCount: 0,
        })
        setRecentClasses(joinedClasses.slice(0, 4))
        setRecentMaterials(pMaterials || [])
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err)
    } fontally {
      setLoading(false)
    }
  }

  const startMiniGame = (game) => {
    setActiveMiniGame(game)
    const questions = GAME_QUESTION_BANK[game.id] || GAME_QUESTION_BANK['math_fast']
    setCurrentQuestions(questions)
    setGameScore(0)
    setGameQuestionIndex(0)
    setGameTimer(30)
    setGameActive(true)
    setGameFeedback('')
    setSelectedOption(null)
  }

  const handleSelectOption = (opt) => {
    if (!gameActive || selectedOption !== null) return
    setSelectedOption(opt)

    const currentQ = currentQuestions[gameQuestionIndex]
    if (opt === currentQ.answer) {
      setGameScore((s) => s + 20)
      setGameFeedback('🎉 Chính xác! +20 Điểm ⭐')
    } else {
      setGameFeedback(`❌ Rất tiếc! Đáp án đúng là: ${currentQ.answer}`)
    }

    setTimeout(() => {
      setSelectedOption(null)
      setGameFeedback('')
      if (gameQuestionIndex < currentQuestions.length - 1) {
        setGameQuestionIndex((i) => i + 1)
      } else {
        setGameActive(false)
        setGameFeedback('🏆 Tuyệt vời! Bạn đã hoàn thành xuất sắc thử thách!')
      }
    }, 1200)
  }

  if (loading) {
    return <LoadingSpinner label="Đang tải thông tin tổng quan..." />
  }

  return (
    <div className="space-y-8">
      {/* Hero Welcome Banner */}
      <div className="gradient-card-blue rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-extrabold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Xin Chào, {profile?.full_name || user.email}!
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-2 leading-tight">
            Chào mừng bạn đến với Lớp Học Vui Nhộn 🎓
          </h2>
          <p className="text-brand-100 text-sm mb-6 leading-relaxed">
            {role === 'admin'
              ? 'Bảng điều khiển Quản trị viên tối cao: Quản lý người dùng, phân quyền, xem báo cáo toàn bộ lớp học và kho học liệu.'
              : role === 'teacher'
              ? 'Tạo lớp học mới, chia sẻ tài liệu, tải game HTML5/Embed và theo dõi bảng điểm học sinh dễ dàng.'
              : 'Tham gia các lớp học sôi động, làm bài tập trắc nghiệm và thử sức với những trò chơi tương tác bổ ích!'}
          </p>

          <div className="flex flex-wrap gap-3">
            {isTeacher && (
              <button
                onClick={() => setShowCreateClass(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-brand-800 hover:bg-brand-50 rounded-xl font-extrabold text-sm shadow-md transition transform active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Tạo Lớp Mới
              </button>
            )}

            {role === 'student' && (
              <button
                onClick={() => setShowJoinClass(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-extrabold text-sm shadow-md transition transform active:scale-95"
              >
                <KeyRound className="w-4 h-4" />
                Nhập Mã Vào Lớp
              </button>
            )}

            {isTeacher && (
              <button
                onClick={() => setShowUploadMaterial(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-xl font-extrabold text-sm border border-white/30 transition"
              >
                <Upload className="w-4 h-4" />
                Đăng Học Liệu / Game
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Lớp Học</p>
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white">{stats.classesCount}</h3>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xl">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Học Liệu & Game</p>
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white">{stats.materialsCount}</h3>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Tiến Độ Học</p>
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white">100%</h3>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Vai Trò</p>
            <h3 className="text-lg font-extrabold text-slate-800 dark:text-white capitalize">{role}</h3>
          </div>
        </div>
      </div>

      {/* 🎮 SECTION MỚI: GÓC TRÒ CHƠI VUI NHỘN (HỌC MÀ CHƠI - CHƠI MÀ HỌC) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-purple-600 animate-pulse" />
            🎮 Góc Trò Chơi Vui Nhộn (Học Mà Chơi - Chơi Mà Học)
          </h3>
          <Link
            to="/materials"
            className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
          >
            Kho Game Đầy Đủ <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FUN_GAMES.map((game) => (
            <div
              key={game.id}
              className={`p-5 rounded-3xl bg-gradient-to-br ${game.color} text-white shadow-lg relative overflow-hidden flex flex-col justify-between group hover:scale-[1.02] transition-all duration-200`}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{game.icon}</span>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-lg">
                    {game.category}
                  </span>
                </div>
                <h4 className="font-extrabold text-base mb-1 leading-snug">{game.title}</h4>
                <p className="text-xs text-white/80 line-clamp-2 mb-4 font-medium">{game.description}</p>
              </div>

              <button
                onClick={() => startMiniGame(game)}
                className="w-full py-2.5 bg-white text-slate-900 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md hover:bg-slate-100 transition"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Chơi Ngay
              </button>
            </div>
          ))}
        </div>

        {/* ACTIVE MINI-GAME INTERACTIVE CARD WITH SUBJECT MATCHING QUESTIONS */}
        {activeMiniGame && currentQuestions.length > 0 && (
          <div className="p-6 bg-slate-900 text-white rounded-3xl border border-purple-500/50 shadow-2xl space-y-4 animate-fade-in relative">
            <button
              onClick={() => setActiveMiniGame(null)}
              className="absolute top-4 right-4 text-xs font-bold px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
            >
              ✖ Đóng
            </button>

            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{activeMiniGame.icon}</span>
                <div>
                  <h4 className="font-extrabold text-lg text-purple-400">{activeMiniGame.title}</h4>
                  <p className="text-xs text-slate-400">Bấm chọn đáp án đúng để tích lũy Sao Thưởng!</p>
                </div>
              </div>

              <div className="flex items-center gap-4 font-mono text-sm font-extrabold">
                <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-xl text-amber-400 border border-slate-700">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span>Điểm: {gameScore} ⭐</span>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-xl text-brand-400 border border-slate-700">
                  <Clock className="w-4 h-4" />
                  <span>Thời gian: {gameTimer}s</span>
                </div>
              </div>
            </div>

            {gameActive ? (
              <div className="space-y-4 max-w-xl mx-auto text-center py-2">
                <div className="text-xs font-bold uppercase text-purple-300">
                  Câu hỏi {gameQuestionIndex + 1} / {currentQuestions.length} ({activeMiniGame.category})
                </div>

                <div className="p-5 bg-slate-800/90 rounded-2xl border border-slate-700 text-lg sm:text-xl font-bold leading-relaxed shadow-inner">
                  {currentQuestions[gameQuestionIndex].question}
                </div>

                {/* 4 Multi Choice Answer Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {currentQuestions[gameQuestionIndex].options.map((opt, idx) => {
                    const isSelected = selectedOption === opt
                    const isCorrect = opt === currentQuestions[gameQuestionIndex].answer
                    let btnColor = 'bg-slate-800 hover:bg-purple-600/80 border-slate-700 text-white'

                    if (selectedOption !== null) {
                      if (isCorrect) btnColor = 'bg-emerald-600 border-emerald-500 text-white font-black scale-105'
                      else if (isSelected) btnColor = 'bg-rose-600 border-rose-500 text-white'
                    }

                    return (
                      <button
                        key={idx}
                        disabled={selectedOption !== null}
                        onClick={() => handleSelectOption(opt)}
                        className={`p-3.5 rounded-xl border text-sm font-bold transition flex items-center justify-between shadow-md ${btnColor}`}
                      >
                        <span className="text-left">{opt}</span>
                        {selectedOption !== null && isCorrect && <Check className="w-4 h-4 text-white" />}
                        {selectedOption !== null && isSelected && !isCorrect && <X className="w-4 h-4 text-white" />}
                      </button>
                    )
                  })}
                </div>

                {gameFeedback && (
                  <div className="p-3 bg-purple-950 text-purple-200 rounded-xl text-sm font-bold animate-bounce mt-2">
                    {gameFeedback}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 space-y-4">
                <Trophy className="w-14 h-14 text-amber-400 mx-auto" />
                <h4 className="text-2xl font-extrabold text-emerald-400">
                  {gameFeedback || 'Kết thúc trò chơi!'}
                </h4>
                <p className="text-sm text-slate-300">Tổng điểm Sao bạn đạt được: <strong>{gameScore} ⭐</strong></p>
                <button
                  onClick={() => startMiniGame(activeMiniGame)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-extrabold rounded-xl shadow-lg transition"
                >
                  <RotateCcw className="w-4 h-4" /> Chơi Lại Từ Đầu
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Classes */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-lg text-slate-800 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-600" />
              Lớp Học Gần Đây
            </h3>
            <Link
              to="/classes"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              Xem Tất Cả <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentClasses.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
              <p className="text-sm text-slate-500 mb-3">Chưa có lớp học nào.</p>
              {isTeacher && (
                <button
                  onClick={() => setShowCreateClass(true)}
                  className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold"
                >
                  + Tạo Lớp Đầu Tiên
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recentClasses.map((c) => (
                <Link
                  key={c.id}
                  to={`/classes/${c.id}`}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 hover:border-brand-500 hover:shadow-md transition group"
                >
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 rounded-md">
                    {c.subject}
                  </span>
                  <h4 className="font-bold text-slate-800 dark:text-white mt-2 group-hover:text-brand-600 transition">
                    {c.name}
                  </h4>
                  <div className="flex items-center justify-between mt-3 text-xs text-slate-500 font-mono">
                    <span>Mã Lớp: {c.code}</span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Materials & Games */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-lg text-slate-800 dark:text-white flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-purple-600" />
              Học Liệu & Game Nổi Bật
            </h3>
            <Link
              to="/materials"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              Xem Tất Cả <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentMaterials.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
              <p className="text-sm text-slate-500 mb-3">Chưa có học liệu/game nào.</p>
              {isTeacher && (
                <button
                  onClick={() => setShowUploadMaterial(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold"
                >
                  + Tải Lên Học Liệu
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {recentMaterials.map((m) => (
                <Link
                  key={m.id}
                  to="/materials"
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 hover:border-purple-500 hover:shadow-md transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center text-lg font-bold">
                      {m.type === 'game_iframe' || m.type === 'game_html5' ? '🎮' : '📄'}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white text-sm group-hover:text-purple-600 transition">
                        {m.title}
                      </h4>
                      <p className="text-xs text-slate-500">{m.subject}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 uppercase">
                    {m.type}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateClassModal
        isOpen={showCreateClass}
        onClose={() => setShowCreateClass(false)}
        onCreated={loadDashboardData}
      />

      <JoinClassModal
        isOpen={showJoinClass}
        onClose={() => setShowJoinClass(false)}
        onJoined={loadDashboardData}
      />

      <UploadMaterialModal
        isOpen={showUploadMaterial}
        onClose={() => setShowUploadMaterial(false)}
        onUploaded={loadDashboardData}
      />
    </div>
  )
}

export default DashboardPage
