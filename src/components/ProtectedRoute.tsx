import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] text-[#1E293B]">
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-12 h-12 rounded-2xl bg-[#2F4858] text-white flex items-center justify-center font-serif text-2xl shadow-sm animate-pulse select-none">
            <span>B</span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#C97B5A] ring-2 ring-white" />
            <span className="absolute -bottom-0.5 -left-0.5 w-2 h-2 rounded-full bg-[#5F8D7A] ring-2 ring-white" />
          </div>
          <div className="flex items-center gap-2 text-sm text-[#64748B]">
            <Loader2 className="w-4 h-4 animate-spin text-[#2F4858]" />
            <span>Carregando sua clínica...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
