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
      question: 'Loài động vật nào được gọi là "Chúa tể sơn lâm"?',
      options: ['Hổ', 'Sư tử', 'Voi', 'Báo'],
      answer: 'Hổ',
    },
    {
      question: 'Cây cối cần chất khí nào trong không khí để thực hiện quang hợp?',
      options: ['Khí Ô-xi', 'Khí Các-bô-nhiên (CO2)', 'Khí Ni-tơ', 'Khí Hi-đrô'],
      answer: 'Khí Các-bô-nhiên (CO2)',
    },
    {
      question: 'Hành tinh nào gần Mặt Trời nhất trong Hệ Mặt Trời?',
      options: ['Trái Đất', 'Sao Thủy', 'Sao Hỏa', 'Sao Kim'],
      answer: 'Sao Thủy',
    },
    {
      question: 'Nước đóng băng ở nhiệt độ bao nhiêu độ C?',
      options: ['100°C', '50°C', '0°C', '-10°C'],
      answer: '0°C',
    },
    {
      question: 'Bộ phận nào của cây giúp hút nước và chất dinh dưỡng từ đất?',
      options: ['Lá cây', 'Rễ cây', 'Thân cây', 'Hoa'],
      answer: 'Rễ cây',
    },
  ],
  english_fun: [
    { question: 'Từ nào nghĩa là "Quả Táo" trong Tiếng Anh?', options: ['Banana', 'Apple', 'Orange', 'Grape'], answer: 'Apple' },
    { question: '"School" có nghĩa là gì?', options: ['Bệnh viện', 'Trường học', 'Công viên', 'Nhà sách'], answer: 'Trường học' },
    { question: 'Con vật nào có tên Tiếng Anh là "Cat"?', options: ['Con chó', 'Con mèo', 'Con thỏ', 'Con chuột'], answer: 'Con mèo' },
    { question: 'Màu "Xanh Dương" trong Tiếng Anh là gì?', options: ['Red', 'Green', 'Blue', 'Yellow'], answer: 'Blue' },
    { question: 'Số 10 trong Tiếng Anh đọc là gì?', options: ['Five', 'Seven', 'Nine', 'Ten'], answer: 'Ten' },
  ],
}

const DashboardPage = () => {
  const { user, profile, role, isTeacher, isAdmin } = useAuth()

  // State
  const [stats, setStats] = useState({
    classesCount: 0,
    materialsCount: 0,
    studentsCount: 0,
    assignmentsCount: 0,
  })
  const [recentClasses, setRecentClasses] = useState([])
  const [recentMaterials, setRecentMaterials] = useState([])
  const [loading, setLoading] = useState(true)

  // Modals
  const [showCreateClass, setShowCreateClass] = useState(false)
  const [showJoinClass, setShowJoinClass] = useState(false)
  const [showUploadMaterial, setShowUploadMaterial] = useState(false)

  // Interactive Mini Game State
  const [selectedGame, setSelectedGame] = useState(null)
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

        const studentClasses = (sMemberships || []).map((m) => m.classes).filter(Boolean)

        const { data: pMaterials, count: pmCount } = await supabase
          .from('materials')
          .select('id, title, type, subject, created_at', { count: 'exact' })
          .eq('is_public', true)
          .limit(4)

        setStats({
          classesCount: studentClasses.length,
          materialsCount: pmCount || 0,
          studentsCount: 0,
          assignmentsCount: 0,
        })
        setRecentClasses(studentClasses.slice(0, 4))
        setRecentMaterials(pMaterials || [])
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStartGame = (game) => {
    setSelectedGame(game)
    const questions = GAME_QUESTION_BANK[game.id] || GAME_QUESTION_BANK.math_fast
    setCurrentQuestions(questions)
    setGameQuestionIndex(0)
    setGameScore(0)
    setGameTimer(30)
    setGameActive(true)
    setGameFeedback('')
    setSelectedOption(null)
  }

  const handleAnswerClick = (opt) => {
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
            Cô giáo Hoàng Thị Kiên
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-2 leading-tight">
            Xin chào các bạn đến với Lớp Học Vui Nhộn 🎓
          </h2>
          <p className="text-brand-100 text-sm mb-6 leading-relaxed">
            Hệ thống quản lý lớp học, kho bài tập và góc trò chơi giáo dục tương tác dành cho học sinh Tiểu học.
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
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-brand-800 hover:bg-brand-50 rounded-xl font-extrabold text-sm shadow-md transition transform active:scale-95"
              >
                <KeyRound className="w-4 h-4" />
                Nhập Mã Vào Lớp
              </button>
            )}

            {isTeacher && (
              <button
                onClick={() => setShowUploadMaterial(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-700/50 hover:bg-brand-700 text-white rounded-xl font-extrabold text-sm border border-white/20 transition"
              >
                <Upload className="w-4 h-4" />
                Đăng Bài Tập / Game
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Overview Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-extrabold text-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Lớp Học</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white">{stats.classesCount}</h3>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center font-extrabold text-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Kho Bài Tập</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white">{stats.materialsCount}</h3>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-extrabold text-xl">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Game Giáo Dục</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white">4 Trò Chơi</h3>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-extrabold text-xl">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Điểm Đổi Quà</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white">{gameScore} ⭐</h3>
          </div>
        </div>
      </div>

      {/* FUN EDUCATIONAL GAMES CORNER */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
              <Gamepad2 className="w-6 h-6 text-purple-600 animate-bounce" />
              Góc Trò Chơi Vui Nhộn (Học Mà Chơi - Chơi Mà Học)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Thử sức các câu đố vui Toán, Tiếng Việt, Khoa Học & Tiếng Anh để tích lũy Sao ⭐ đổi quà!
            </p>
          </div>
          <Link
            to="/games"
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-purple-600 hover:text-purple-700 dark:text-purple-400 transition"
          >
            <span>Vào Kho Game Đầy Đủ</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Mini Game Playground Display */}
        {selectedGame && (
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-2xl relative overflow-hidden border border-purple-500/30">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedGame.icon}</span>
                <h4 className="font-extrabold text-lg text-amber-300">{selectedGame.title}</h4>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 bg-amber-500/20 px-3 py-1 rounded-full text-xs font-extrabold text-amber-300">
                  <Star className="w-4 h-4 fill-amber-300" />
                  <span>{gameScore} ⭐</span>
                </div>
                <div className="flex items-center gap-1 bg-red-500/20 px-3 py-1 rounded-full text-xs font-extrabold text-red-300">
                  <Clock className="w-4 h-4" />
                  <span>{gameTimer}s</span>
                </div>
                <button
                  onClick={() => setSelectedGame(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {gameActive && currentQuestions.length > 0 ? (
              <div className="space-y-4">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Câu hỏi {gameQuestionIndex + 1} / {currentQuestions.length}
                </div>
                <h5 className="text-xl font-bold text-white bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
                  {currentQuestions[gameQuestionIndex]?.question}
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {currentQuestions[gameQuestionIndex]?.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleAnswerClick(opt)}
                      disabled={selectedOption !== null}
                      className={`p-3.5 rounded-xl font-bold text-sm text-left transition transform active:scale-95 flex items-center justify-between ${
                        selectedOption === opt
                          ? opt === currentQuestions[gameQuestionIndex].answer
                            ? 'bg-emerald-600 text-white'
                            : 'bg-rose-600 text-white'
                          : 'bg-slate-800 hover:bg-purple-600 text-slate-100 border border-slate-700'
                      }`}
                    >
                      <span>{opt}</span>
                      {selectedOption === opt && (
                        <span>
                          {opt === currentQuestions[gameQuestionIndex].answer ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {gameFeedback && (
                  <div className="p-3 rounded-xl bg-purple-950/80 text-purple-200 border border-purple-800 text-sm font-bold text-center animate-fade-in">
                    {gameFeedback}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 space-y-4">
                <Trophy className="w-16 h-16 text-amber-400 mx-auto animate-bounce" />
                <h5 className="text-2xl font-extrabold text-amber-300">
                  {gameFeedback || 'Đã Hoàn Thành Thử Thách!'}
                </h5>
                <p className="text-sm text-slate-300">
                  Tổng điểm bạn tích lũy được: <strong className="text-amber-400 text-lg">{gameScore} ⭐</strong>
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => handleStartGame(selectedGame)}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Chơi Lại Trò Này
                  </button>
                  <button
                    onClick={() => setSelectedGame(null)}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl transition"
                  >
                    Chọn Trò Chơi Khác
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Game List Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FUN_GAMES.map((game) => (
            <div
              key={game.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between hover:shadow-xl hover:border-purple-400 transition group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                    {game.category}
                  </span>
                  <span className="text-xl">{game.icon}</span>
                </div>
                <h4 className="font-extrabold text-sm text-slate-800 dark:text-white group-hover:text-purple-600 transition mb-1 leading-snug">
                  {game.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-2 mb-4">
                  {game.description}
                </p>
              </div>

              <button
                onClick={() => handleStartGame(game)}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition transform active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Chơi Ngay (30s)</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Classes & Recent Materials Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Classes */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-extrabold text-lg text-slate-800 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-600" />
              Lớp Học Của Bạn
            </h3>
            <Link
              to="/classes"
              className="text-xs font-extrabold text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentClasses.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs font-semibold">
              Chưa có lớp học nào. {isTeacher ? 'Hãy bấm "Tạo Lớp Mới".' : 'Hãy bấm "Nhập Mã Vào Lớp".'}
            </div>
          ) : (
            <div className="space-y-3">
              {recentClasses.map((cls) => (
                <Link
                  key={cls.id}
                  to={`/classes/${cls.id}`}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between hover:border-brand-400 hover:shadow-md transition group"
                >
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-white group-hover:text-brand-600 transition">
                      {cls.name}
                    </h4>
                    <p className="text-xs text-slate-400 font-medium">Môn: {cls.subject || 'Tổng hợp'}</p>
                  </div>
                  <span className="font-mono text-xs font-extrabold px-3 py-1 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 rounded-xl border border-brand-200/50">
                    Mã: {cls.code}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Materials */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-extrabold text-lg text-slate-800 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-600" />
              Bài Tập Mới Tải Lên
            </h3>
            <Link
              to="/materials"
              className="text-xs font-extrabold text-purple-600 hover:text-purple-700 dark:text-purple-400 flex items-center gap-1"
            >
              <span>Vào Kho Bài Tập</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentMaterials.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs font-semibold">
              Chưa có bài tập nào. Hãy tải bài tập đầu tiên lên!
            </div>
          ) : (
            <div className="space-y-3">
              {recentMaterials.map((mat) => (
                <div
                  key={mat.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between hover:border-purple-400 transition"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-white truncate">
                      {mat.title}
                    </h4>
                    <p className="text-xs text-slate-400 font-medium">Môn: {mat.subject || 'Tổng hợp'}</p>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 rounded-lg shrink-0">
                    {mat.type === 'game_iframe' ? '🎮 GAME' : '📄 BÀI TẬP'}
                  </span>
                </div>
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
