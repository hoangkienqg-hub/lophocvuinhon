import React from 'react'
import { Loader2 } from 'lucide-react'

const LoadingSpinner = ({ fullScreen = false, label = 'Đang tải dữ liệu...' }) => {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-3 border border-slate-100 dark:border-slate-700">
          <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
          <p className="text-slate-700 dark:text-slate-200 text-sm font-medium">{label}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 gap-3">
      <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      {label && <p className="text-slate-500 text-xs font-medium">{label}</p>}
    </div>
  )
}

export default LoadingSpinner
