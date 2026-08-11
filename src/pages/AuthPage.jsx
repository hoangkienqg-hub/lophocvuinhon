import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { GraduationCap, BookOpen, ShieldCheck, Sparkles, Loader2, ArrowRight } from 'lucide-react'

const AuthPage = () => {
  const { user, signUp, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const [isRegister, setIsRegister] = useState(searchParams.get('tab') === 'register')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('student') // teacher or student
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const from = location.state?.from?.pathname || '/'

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true })
    }
  }, [user, navigate, from])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isRegister) {
        await signUp({ email, password, fullName, role })
      } else {
        await signIn({ email, password })
      }
      navigate(from, { replace: true })
    } catch (err) {
      console.error('Auth error:', err)
      setError(err.message || 'Xác thực thất bại. Vui lòng kiểm tra lại thông tin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-mesh-pattern flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 rounded-3xl overflow-hidden glass-panel shadow-2xl border border-slate-200/80 dark:border-slate-800">
        
        {/* Left Side: Branding & Features */}
        <div className="gradient-card-blue p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl mb-6 shadow-inner">
              🎓
            </div>
            <h2 className="text-3xl font-extrabold mb-3 leading-tight">
              Hệ Thống Giáo Dục & Game Tương Tác
            </h2>
            <p className="text-brand-100 text-sm leading-relaxed">
              Trải nghiệm học tập hiện đại dành cho Giáo viên & Học sinh với kho học liệu phong phú và trò chơi giáo dục hấp dẫn.
            </p>
          </div>

          <div className="space-y-4 my-8">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15">
              <BookOpen className="w-5 h-5 text-amber-300 shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-white">Quản Lý Lớp Học Thông Minh</p>
                <p className="text-brand-100">Tham gia lớp với Mã Join Code nhanh chóng</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15">
              <Sparkles className="w-5 h-5 text-purple-300 shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-white">Kho Game HTML5 & Embed</p>
                <p className="text-brand-100">Wordwall, Quizizz, Kahoot & Trắc nghiệm</p>
              </div>
            </div>
          </div>

          <div className="text-xs text-brand-200">
            © 2026 Lớp Học Vui Nhộn. Đồng bộ dữ liệu bởi Supabase.
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="p-8 sm:p-10 bg-white/90 dark:bg-slate-900/90 flex flex-col justify-center">
          {/* Header Tab Switcher */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl mb-6">
            <button
              onClick={() => {
                setIsRegister(false)
                setError('')
              }}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition ${
                !isRegister
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Đăng Nhập
            </button>
            <button
              onClick={() => {
                setIsRegister(true)
                setError('')
              }}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition ${
                isRegister
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Đăng Ký
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Họ và Tên *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 outline-none transition text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                placeholder="name@school.edu.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 outline-none transition text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Mật Khẩu *
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 outline-none transition text-sm"
              />
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Tôi muốn đăng ký làm:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                      role === 'student'
                        ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/60 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="student"
                      checked={role === 'student'}
                      onChange={() => setRole('student')}
                      className="hidden"
                    />
                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs">Học Sinh</span>
                  </label>

                  <label
                    className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                      role === 'teacher'
                        ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/60 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="teacher"
                      checked={role === 'teacher'}
                      onChange={() => setRole('teacher')}
                      className="hidden"
                    />
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span className="text-xs">Giáo Viên</span>
                  </label>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Lưu ý: Email <strong>hoangkienqg@gmail.com</strong> sẽ tự động nhận quyền Quản Trị Viên (Admin).
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>{isRegister ? 'Tạo Tài Khoản Ngay' : 'Đăng Nhập Vào Hệ Thống'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AuthPage
