import React, { useState, useEffect, useCallback } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Wallet,
  Settings,
  LogOut,
  Plus,
  Bell,
  Menu,
  Clock,
  Video,
  Layers,
  User,
  ShieldCheck,
} from 'lucide-react'
import { ConsultationModal } from '@/components/ConsultationModal'
import { appointmentsService } from '@/services/appointments'
import { patientsService } from '@/services/patients'
import { AppointmentRecord, PatientRecord } from '@/types/clinical'
import { useRealtime } from '@/hooks/use-realtime'
import { format } from 'date-fns'

const navItems = [
  { path: '/', label: 'Início', icon: LayoutDashboard },
  { path: '/pacientes', label: 'Pacientes', icon: Users },
  { path: '/agenda', label: 'Agenda', icon: CalendarDays },
  { path: '/financeiro', label: 'Financeiro', icon: Wallet },
  { path: '/configuracoes', label: 'Configurações', icon: Settings },
]

export default function Layout() {
  const { user, getUserAvatarUrl, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false)
  const [todayAppointments, setTodayAppointments] = useState<AppointmentRecord[]>([])
  const [patients, setPatients] = useState<PatientRecord[]>([])

  const todayIso = new Date().toISOString().slice(0, 10)

  const loadHeaderData = useCallback(async () => {
    try {
      const [appts, pts] = await Promise.all([
        appointmentsService.list(`date ~ "${todayIso}"`, 'start_time'),
        patientsService.list('', 'full_name'),
      ])
      setTodayAppointments(appts)
      setPatients(pts)
    } catch {
      // safe fallback
    }
  }, [todayIso])

  useEffect(() => {
    loadHeaderData()
  }, [loadHeaderData])

  // Realtime updates on appointments & patients
  useRealtime<AppointmentRecord>('appointments', () => {
    loadHeaderData()
  })
  useRealtime<PatientRecord>('patients', () => {
    loadHeaderData()
  })

  // Get current page title
  const getPageTitle = () => {
    const current = location.pathname
    if (current === '/') return 'Início'
    if (current.startsWith('/pacientes/') && current !== '/pacientes')
      return 'Prontuário do Paciente'
    if (current.startsWith('/pacientes')) return 'Gestão de Pacientes'
    if (current.startsWith('/agenda')) return 'Agenda de Atendimentos'
    if (current.startsWith('/financeiro')) return 'Controle Financeiro'
    if (current.startsWith('/configuracoes')) return 'Configurações da Clínica'
    return 'Beatriz Souza Bittar'
  }

  const userDisplayName = user?.name || 'Beatriz Souza Bittar'
  const userAvatarUrl = getUserAvatarUrl(user)
  const userInitials =
    userDisplayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('') || 'BS'

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-[#E2E8F0]">
      {/* Brand / Logo com Monograma B em degradê Verde-sálvia (#5F8D7A) e Terracota (#C97B5A) */}
      <div className="p-6 pb-5 flex items-center gap-3.5 border-b border-[#E2E8F0]/80">
        <div className="relative w-11 h-11 rounded-2xl bg-[#5F8D7A] shadow-sm flex items-center justify-center text-white font-serif text-2xl font-bold tracking-tight select-none">
          <span>B</span>
          <span
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#C97B5A] ring-2 ring-white"
            title="Acento Terracota"
          />
          <span
            className="absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 rounded-full bg-[#4E7263] ring-2 ring-white"
            title="Acento Sálvia"
          />
        </div>
        <div>
          <h1 className="font-serif text-base font-bold text-[#1E293B] leading-tight">
            Beatriz Souza Bittar
          </h1>
          <p className="text-xs text-[#64748B] font-medium mt-0.5">Psicóloga</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-[#64748B] uppercase">
          Menu Principal
        </div>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-[#E8F0EC] text-[#5F8D7A] shadow-xs font-semibold'
                  : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-colors ${
                  isActive ? 'text-[#5F8D7A]' : 'text-[#64748B] group-hover:text-[#1E293B]'
                }`}
              />
              <span>{item.label}</span>
              {isActive && <div className="ml-auto w-1.5 h-4 rounded-full bg-[#5F8D7A]" />}
            </NavLink>
          )
        })}
      </nav>

      {/* Bottom User Card */}
      <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] m-3 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#5F8D7A]/10 text-[#5F8D7A] flex items-center justify-center font-semibold text-sm border border-[#5F8D7A]/20 overflow-hidden shrink-0">
            {userAvatarUrl ? (
              <img
                src={userAvatarUrl}
                alt={userDisplayName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  ;(e.target as HTMLElement).style.display = 'none'
                }}
              />
            ) : (
              <span>{userInitials}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#1E293B] truncate">{userDisplayName}</p>
            <p className="text-[11px] text-[#64748B] truncate flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#5F8D7A]" />
              Psicóloga Clínica
            </p>
          </div>
          <button
            onClick={logout}
            title="Sair da conta"
            className="p-2 text-[#64748B] hover:text-[#DC2626] hover:bg-red-50 rounded-lg transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-[#1E293B]">
      {/* Desktop Sidebar (fixed 260px) */}
      <aside className="hidden md:flex md:w-[260px] md:flex-col md:fixed md:inset-y-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Sheet) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-[270px] border-r border-[#E2E8F0]">
          {sidebarContent}
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="md:pl-[260px] flex flex-col flex-1 min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-20 h-16 bg-white/90 backdrop-blur-md border-b border-[#E2E8F0] px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 text-[#1E293B] hover:bg-black/5 rounded-lg"
              aria-label="Abrir menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1E293B]">
              {getPageTitle()}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Action: New Consultation */}
            <Button
              onClick={() => setIsConsultationModalOpen(true)}
              className="bg-[#5F8D7A] hover:bg-[#4E7263] text-white rounded-xl text-xs sm:text-sm font-medium h-9 sm:h-10 px-3 sm:px-4 shadow-xs"
            >
              <Plus className="w-4 h-4 mr-1 sm:mr-1.5" />
              <span>Nova consulta</span>
            </Button>

            {/* Notifications (Consultas de hoje) */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-xl border-[#E2E8F0] bg-white text-[#1E293B] hover:bg-[#F8FAFC]"
                  aria-label="Notificações de hoje"
                >
                  <Bell className="w-4 h-4" />
                  {todayAppointments.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#C97B5A] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {todayAppointments.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-80 p-0 border-[#E2E8F0] rounded-2xl shadow-lg"
                align="end"
              >
                <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC] rounded-t-2xl">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#5F8D7A]" />
                    <span className="font-serif text-sm font-bold text-[#1E293B]">
                      Consultas de Hoje
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-[#64748B]">
                    {format(new Date(), 'dd/MM')}
                  </span>
                </div>

                <div className="p-3 max-h-80 overflow-y-auto divide-y divide-[#E2E8F0]/60">
                  {todayAppointments.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#64748B]">
                      Nenhuma consulta agendada para hoje.
                    </div>
                  ) : (
                    todayAppointments.map((appt) => {
                      const patientName = appt.expand?.patient?.full_name || 'Paciente'
                      return (
                        <div
                          key={appt.id}
                          onClick={() => {
                            if (appt.patient) navigate(`/pacientes/${appt.patient}`)
                          }}
                          className="py-2.5 px-2 hover:bg-[#F8FAFC] rounded-lg cursor-pointer transition-colors"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[#1E293B] flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-[#5F8D7A]" />
                              {patientName}
                            </span>
                            <span className="font-mono font-medium text-[#5F8D7A]">
                              {appt.start_time}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-[11px] text-[#64748B]">
                            {appt.type === 'online' ? (
                              <span className="inline-flex items-center gap-1 text-sky-600">
                                <Video className="w-3 h-3" /> Online
                              </span>
                            ) : appt.type === 'mixed' ? (
                              <span className="inline-flex items-center gap-1 text-[#5F8D7A] font-medium">
                                <Layers className="w-3 h-3 text-[#5F8D7A]" /> Mista
                              </span>
                            ) : (
                              <span>Presencial</span>
                            )}
                            <span>•</span>
                            <span>{appt.duration_minutes || 50} min</span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                <div className="p-2 border-t border-[#E2E8F0] bg-[#F8FAFC]/50 text-center rounded-b-2xl">
                  <NavLink
                    to="/agenda"
                    className="text-xs font-semibold text-[#5F8D7A] hover:text-[#4E7263]"
                  >
                    Ver agenda completa →
                  </NavLink>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        {/* Page View Body */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Global New Consultation Modal */}
      <ConsultationModal
        isOpen={isConsultationModalOpen}
        onClose={() => setIsConsultationModalOpen(false)}
        onSuccess={() => {
          loadHeaderData()
        }}
        patientsList={patients}
      />
    </div>
  )
}
