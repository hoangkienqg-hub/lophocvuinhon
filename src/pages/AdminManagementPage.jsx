import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import LoadingSpinner from '../components/common/LoadingSpinner'
import EmptyState from '../components/common/EmptyState'
import {
  ShieldCheck,
  Users,
  Search,
  CheckCircle2,
  Trash2,
  Crown,
  BookOpen,
  GraduationCap,
  ShieldAlert,
} from 'lucide-react'

const AdminManagementPage = () => {
  const { user, role, refreshProfile } = useAuth()

  const [usersList, setUsersList] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsersList(data || [])
    } catch (err) {
      console.error('Error fetching users for admin:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (targetUserId, targetEmail, newRole) => {
    // Special rule: hoangkienqg@gmail.com must remain admin
    if (targetEmail === 'hoangkienqg@gmail.com' && newRole !== 'admin') {
      alert('Tài khoản Super Admin hoangkienqg@gmail.com không thể thay đổi vai trò!')
      return
    }

    setUpdatingId(targetUserId)
    setMessage('')

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', targetUserId)

      if (error) throw error

      setMessage(`Đã cập nhật vai trò của ${targetEmail} thành: ${newRole.toUpperCase()}`)
      await fetchUsers()
      if (targetUserId === user.id) {
        await refreshProfile()
      }
    } catch (err) {
      console.error('Error updating role:', err)
      alert(`Không thể đổi vai trò: ${err.message}`)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDeleteUser = async (targetUserId, targetEmail) => {
    if (targetEmail === 'hoangkienqg@gmail.com') {
      alert('Không thể xóa tài khoản Super Admin!')
      return
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản ${targetEmail}?`)) return

    try {
      const { error } = await supabase.from('profiles').delete().eq('id', targetUserId)
      if (error) throw error
      fetchUsers()
    } catch (err) {
      console.error('Error deleting profile:', err)
    }
  }

  const filteredUsers = usersList.filter(
    (u) =>
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.role?.toLowerCase().includes(search.toLowerCase())
  )

  const adminCount = usersList.filter((u) => u.role === 'admin').length
  const teacherCount = usersList.filter((u) => u.role === 'teacher').length
  const studentCount = usersList.filter((u) => u.role === 'student').length

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="gradient-card-purple rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-extrabold uppercase tracking-wider mb-2">
            <Crown className="w-3.5 h-3.5 text-amber-300" />
            Super Admin Portal
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-1">Bảng Quản Trị Hệ Thống</h2>
          <p className="text-purple-200 text-sm">
            Phân quyền người dùng, quản lý tài khoản và giám sát toàn bộ ứng dụng.
          </p>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Tổng Người Dùng</p>
          <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white">{usersList.length}</h3>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <p className="text-xs font-bold uppercase tracking-wider text-purple-600">Quản Trị Viên (Admin)</p>
          <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white">{adminCount}</h3>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Giáo Viên (Teacher)</p>
          <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white">{teacherCount}</h3>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Học Sinh (Student)</p>
          <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white">{studentCount}</h3>
        </div>
      </div>

      {message && (
        <div className="p-3.5 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-semibold border border-emerald-200">
          {message}
        </div>
      )}

      {/* Search & User List Table */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="font-extrabold text-lg text-slate-800 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Danh Sách Người Dùng & Phân Quyền (RBAC)
          </h3>

          <div className="relative max-w-xs">
            <input
              type="text"
              placeholder="Tìm email, tên, vai trò..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-purple-500 outline-none"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>

        {loading ? (
          <LoadingSpinner label="Đang tải danh sách người dùng..." />
        ) : filteredUsers.length === 0 ? (
          <EmptyState title="Không tìm thấy người dùng nào" description="Thử lại với từ khóa khác." />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Họ & Tên</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Vai Trò Hiện Tại</th>
                  <th className="px-6 py-3.5">Đổi Vai Trò</th>
                  <th className="px-6 py-3.5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((u) => {
                  const isSuperAdmin = u.email === 'hoangkienqg@gmail.com'
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        {isSuperAdmin && <Crown className="w-4 h-4 text-amber-500 shrink-0" />}
                        {u.full_name || 'Người dùng'}
                      </td>

                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-xs font-mono">
                        {u.email}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold capitalize ${
                            u.role === 'admin'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                              : u.role === 'teacher'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <select
                          disabled={updatingId === u.id || isSuperAdmin}
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, u.email, e.target.value)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                        >
                          <option value="student">Student (Học sinh)</option>
                          <option value="teacher">Teacher (Giáo viên)</option>
                          <option value="admin">Admin (Quản trị viên)</option>
                        </select>
                      </td>

                      <td className="px-6 py-4 text-right">
                        {!isSuperAdmin && (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.email)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition"
                            title="Xóa tài khoản"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminManagementPage
