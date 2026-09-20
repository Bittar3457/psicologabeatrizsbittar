import { useEffect, useState, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { patientsService } from '@/services/patients'
import { appointmentsService } from '@/services/appointments'
import { sessionsService } from '@/services/sessions'
import { PatientRecord, AppointmentRecord, SessionRecord } from '@/types/clinical'
import { PatientAvatar, StatusBadge } from '@/components/PatientAvatar'
import { ConsultationModal } from '@/components/ConsultationModal'
import { PatientModal } from '@/components/PatientModal'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useRealtime } from '@/hooks/use-realtime'
import {
  Users,
  Calendar,
  CalendarCheck,
  TrendingUp,
  ArrowRight,
  Plus,
  Video,
  Clock,
  ChevronRight,
  Sparkles,
  Phone,
} from 'lucide-react'
import { format, startOfWeek, endOfWeek, addDays, isWithinInterval, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Index() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState<PatientRecord[]>([])
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([])
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false)
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false)

  const loadAll = useCallback(async () => {
    try {
      const [pts, appts, sess] = await Promise.all([
        patientsService.list('', '-created'),
        appointmentsService.list('', 'date,start_time'),
        sessionsService.list('', '-date,-start_time'),
      ])
      setPatients(pts)
      setAppointments(appts)
      setSessions(sess)
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  useRealtime<PatientRecord>('patients', () => loadAll())
  useRealtime<AppointmentRecord>('appointments', () => loadAll())
  useRealtime<SessionRecord>('sessions', () => loadAll())

  const now = new Date()
  const todayIso = now.toISOString().slice(0, 10)
  const formattedToday = format(now, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })
  const capitalizedToday = formattedToday.charAt(0).toUpperCase() + formattedToday.slice(1)

  // 1. Pacientes ativos
  const activePatientsCount = useMemo(() => {
    return patients.filter((p) => p.status === 'active').length
  }, [patients])

  // 2. Consultas hoje
  const todayAppointments = useMemo(() => {
    return appointments.filter((a) => (a.date || '').slice(0, 10) === todayIso)
  }, [appointments, todayIso])

  // 3. Consultas esta semana
  const thisWeekAppointmentsCount = useMemo(() => {
    const start = startOfWeek(now, { weekStartsOn: 1 })
    const end = endOfWeek(now, { weekStartsOn: 1 })

    return appointments.filter((a) => {
      if (!a.date) return false
      try {
        const d = parseISO(a.date)
        return isWithinInterval(d, { start, end })
      } catch {
        return false
      }
    }).length
  }, [appointments, now])

  // 4. Taxa de comparecimento (sessions + appointments completed vs total scheduled/completed/no_show)
  const attendanceRate = useMemo(() => {
    const allRecords = [...sessions, ...appointments]
    const relevant = allRecords.filter((r) =>
      ['completed', 'no_show', 'cancelled'].includes(r.status),
    )
    if (relevant.length === 0) return 96 // default high benchmark if early
    const completed = relevant.filter((r) => r.status === 'completed').length
    return Math.round((completed / relevant.length) * 100)
  }, [sessions, appointments])

  // Próximas consultas (próximos 7 dias)
  const upcoming7Days = useMemo(() => {
    const nextWeekDate = addDays(now, 7)
    return appointments
      .filter((a) => {
        if (!a.date) return false
        try {
          const d = parseISO(a.date)
          return d >= now && d <= nextWeekDate
        } catch {
          return false
        }
      })
      .slice(0, 5)
  }, [appointments, now])

  // Pacientes recentes (últimos 4 cadastrados)
  const recentPatients = useMemo(() => {
    return patients.slice(0, 4)
  }, [patients])

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Greeting */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-[#E8F0EC]/80 via-white to-white p-6 sm:p-8 rounded-3xl border border-[#E5E0D8]/80 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-[#E5E0D8] text-xs font-semibold text-[#5F8D7A] shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Consultório Clínico Ativo</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2D3A34] tracking-tight">
            Bem-vinda, Beatriz
          </h1>
          <p className="text-sm sm:text-base text-[#6B7A72]">
            {capitalizedToday} • Que o seu dia de atendimentos seja sereno e produtivo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => setIsPatientModalOpen(true)}
            variant="outline"
            className="rounded-xl border-[#E5E0D8] bg-white text-[#2D3A34] hover:bg-[#FAF7F2] font-medium"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Novo paciente
          </Button>
          <Button
            onClick={() => setIsConsultationModalOpen(true)}
            className="rounded-xl bg-[#5F8D7A] hover:bg-[#4E7263] text-white font-medium shadow-sm"
          >
            <Calendar className="w-4 h-4 mr-1.5" />
            Agendar atendimento
          </Button>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1 */}
        <Card className="rounded-2xl border-[#E5E0D8] bg-white shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[#6B7A72]">
                Pacientes ativos
              </p>
              <h3 className="mt-1 text-2xl sm:text-3xl font-serif font-bold text-[#2D3A34]">
                {isLoading ? '...' : activePatientsCount}
              </h3>
              <p className="mt-1 text-xs text-[#5F8D7A] font-medium">
                {patients.length} pacientes totais no cadastro
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#E8F0EC] text-[#5F8D7A] flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2 */}
        <Card className="rounded-2xl border-[#E5E0D8] bg-white shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[#6B7A72]">
                Consultas hoje
              </p>
              <h3 className="mt-1 text-2xl sm:text-3xl font-serif font-bold text-[#2D3A34]">
                {isLoading ? '...' : todayAppointments.length}
              </h3>
              <p className="mt-1 text-xs text-[#6B7A72]">
                {todayAppointments.length === 0
                  ? 'Nenhum horário marcado'
                  : 'Atendimentos programados'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#FAEDE7] text-[#C97B5A] flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3 */}
        <Card className="rounded-2xl border-[#E5E0D8] bg-white shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[#6B7A72]">
                Consultas esta semana
              </p>
              <h3 className="mt-1 text-2xl sm:text-3xl font-serif font-bold text-[#2D3A34]">
                {isLoading ? '...' : thisWeekAppointmentsCount}
              </h3>
              <p className="mt-1 text-xs text-[#6B7A72]">De segunda a domingo</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#1E40AF] flex items-center justify-center shrink-0">
              <CalendarCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4 */}
        <Card className="rounded-2xl border-[#E5E0D8] bg-white shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[#6B7A72]">
                Taxa de comparecimento
              </p>
              <h3 className="mt-1 text-2xl sm:text-3xl font-serif font-bold text-[#2D3A34]">
                {isLoading ? '...' : `${attendanceRate}%`}
              </h3>
              <p className="mt-1 text-xs text-[#3E8E5A] font-medium">
                Alta adesão ao processo terapêutico
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#ECFDF5] text-[#065F46] flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout: Agenda de Hoje + Próximas Consultas / Pacientes Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 cols): Agenda de hoje */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#5F8D7A]" />
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#2D3A34]">
                Agenda de Hoje
              </h2>
            </div>
            <Link
              to="/agenda"
              className="text-xs font-semibold text-[#5F8D7A] hover:text-[#4E7263] flex items-center gap-1 group"
            >
              <span>Ver agenda completa</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E0D8] divide-y divide-[#E5E0D8]/60 overflow-hidden shadow-xs">
            {todayAppointments.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#E8F0EC] text-[#5F8D7A] flex items-center justify-center mx-auto">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-base font-semibold text-[#2D3A34]">
                  Nenhuma consulta agendada para hoje
                </h3>
                <p className="text-xs text-[#6B7A72] max-w-sm mx-auto">
                  Aproveite o intervalo para organizar prontuários e anotações, ou agende um novo
                  atendimento.
                </p>
                <div className="pt-2">
                  <Button
                    onClick={() => setIsConsultationModalOpen(true)}
                    size="sm"
                    className="bg-[#5F8D7A] hover:bg-[#4E7263] text-white rounded-xl text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Agendar para hoje
                  </Button>
                </div>
              </div>
            ) : (
              todayAppointments.map((appt) => {
                const patientName = appt.expand?.patient?.full_name || 'Paciente'
                const patientPhone = appt.expand?.patient?.phone || ''
                return (
                  <div
                    key={appt.id}
                    className="p-4 sm:p-5 hover:bg-[#FAF7F2]/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 text-center shrink-0 py-1 bg-[#FAF7F2] rounded-xl border border-[#E5E0D8]/60">
                        <span className="block font-mono text-base font-bold text-[#5F8D7A]">
                          {appt.start_time}
                        </span>
                        <span className="block text-[10px] text-[#6B7A72]">
                          {appt.duration_minutes || 50} min
                        </span>
                      </div>

                      <div className="min-w-0">
                        <Link
                          to={appt.patient ? `/pacientes/${appt.patient}` : '#'}
                          className="font-semibold text-sm sm:text-base text-[#2D3A34] hover:text-[#5F8D7A] flex items-center gap-1.5 transition-colors"
                        >
                          <span>{patientName}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-[#6B7A72] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[#6B7A72]">
                          {appt.type === 'online' ? (
                            <span className="inline-flex items-center gap-1 text-blue-600 font-medium">
                              <Video className="w-3 h-3" /> Online
                            </span>
                          ) : (
                            <span>Presencial no consultório</span>
                          )}
                          {patientPhone && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 font-mono text-[11px]">
                                <Phone className="w-3 h-3 text-[#5F8D7A]" />
                                {patientPhone}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <StatusBadge status={appt.status} />
                      {appt.patient && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/pacientes/${appt.patient}`)}
                          className="text-xs text-[#5F8D7A] hover:text-[#4E7263] hover:bg-[#E8F0EC]"
                        >
                          Ver ficha
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Próximas Consultas (7 dias) */}
          <div className="pt-4 space-y-4">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#2D3A34]">
              Próximos 7 Dias
            </h2>
            <div className="bg-white rounded-2xl border border-[#E5E0D8] divide-y divide-[#E5E0D8]/60 overflow-hidden shadow-xs">
              {upcoming7Days.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#6B7A72]">
                  Nenhuma consulta agendada para os próximos 7 dias.
                </div>
              ) : (
                upcoming7Days.map((appt) => {
                  const patientName = appt.expand?.patient?.full_name || 'Paciente'
                  const dateFormatted = appt.date
                    ? format(parseISO(appt.date), "dd/MM 'às' HH:mm", { locale: ptBR })
                    : '-'
                  return (
                    <div
                      key={appt.id}
                      onClick={() => {
                        if (appt.patient) navigate(`/pacientes/${appt.patient}`)
                      }}
                      className="p-3.5 sm:p-4 hover:bg-[#FAF7F2] cursor-pointer transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <PatientAvatar name={patientName} size="sm" />
                        <div>
                          <p className="text-sm font-semibold text-[#2D3A34]">{patientName}</p>
                          <p className="text-xs text-[#6B7A72] flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-[#5F8D7A]" />
                            {dateFormatted} • {appt.type === 'online' ? 'Online' : 'Presencial'}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={appt.status} />
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 col): Pacientes Recentes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-[#2D3A34]">Pacientes Recentes</h2>
            <Link
              to="/pacientes"
              className="text-xs font-semibold text-[#5F8D7A] hover:text-[#4E7263]"
            >
              Ver todos →
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E0D8] divide-y divide-[#E5E0D8]/60 overflow-hidden shadow-xs">
            {recentPatients.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#6B7A72]">
                Nenhum paciente cadastrado ainda.
              </div>
            ) : (
              recentPatients.map((p) => (
                <Link
                  key={p.id}
                  to={`/pacientes/${p.id}`}
                  className="p-4 hover:bg-[#FAF7F2] transition-colors flex items-center gap-3.5 block"
                >
                  <PatientAvatar name={p.full_name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#2D3A34] truncate">{p.full_name}</p>
                    <p className="text-xs text-[#6B7A72] font-mono truncate">{p.phone}</p>
                  </div>
                  <StatusBadge status={p.status} />
                </Link>
              ))
            )}
          </div>

          {/* Quick Notice Card: Confidentiality */}
          <div className="p-4 bg-[#E8F0EC]/50 rounded-2xl border border-[#C7DBCF]/60 text-xs text-[#3D594D] space-y-1.5">
            <p className="font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#5F8D7A]" />
              Sigilo & Proteção de Dados
            </p>
            <p className="text-[11px] leading-relaxed text-[#4E7263]">
              Todos os prontuários, anotações de sessões e contatos são criptografados e acessíveis
              exclusivamente por você.
            </p>
          </div>
        </div>
      </div>

      {/* Modais */}
      <ConsultationModal
        isOpen={isConsultationModalOpen}
        onClose={() => setIsConsultationModalOpen(false)}
        onSuccess={() => loadAll()}
        patientsList={patients}
      />

      <PatientModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        onSuccess={() => loadAll()}
      />
    </div>
  )
}
