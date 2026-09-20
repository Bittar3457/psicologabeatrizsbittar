import { useState, useEffect, useMemo, useCallback } from 'react'
import { appointmentsService } from '@/services/appointments'
import { patientsService } from '@/services/patients'
import { AppointmentRecord, PatientRecord } from '@/types/clinical'
import { ConsultationModal } from '@/components/ConsultationModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRealtime } from '@/hooks/use-realtime'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Video,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Loader2,
} from 'lucide-react'
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  parseISO,
  isSameDay,
  addWeeks,
  subWeeks,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

const HOURS = [
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
]

export default function Agenda() {
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([])
  const [patients, setPatients] = useState<PatientRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedApptToEdit, setSelectedApptToEdit] = useState<AppointmentRecord | null>(null)
  const [newConsultationPrefill, setNewConsultationPrefill] = useState<{
    date?: string
    startTime?: string
  }>({})

  const loadData = useCallback(async () => {
    try {
      const [appts, pts] = await Promise.all([
        appointmentsService.list('', 'date,start_time'),
        patientsService.list('', 'full_name'),
      ])
      setAppointments(appts)
      setPatients(pts)
    } catch {
      // safe fallback
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime<AppointmentRecord>('appointments', () => {
    loadData()
  })
  useRealtime<PatientRecord>('patients', () => {
    loadData()
  })

  // Date Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'day') {
      setSelectedDate((d) => subDays(d, 1))
    } else {
      setSelectedDate((d) => subWeeks(d, 1))
    }
  }

  const handleNext = () => {
    if (viewMode === 'day') {
      setSelectedDate((d) => addDays(d, 1))
    } else {
      setSelectedDate((d) => addWeeks(d, 1))
    }
  }

  const handleToday = () => {
    setSelectedDate(new Date())
  }

  // Week days starting on Monday
  const weekDays = useMemo(() => {
    const monday = startOfWeek(selectedDate, { weekStartsOn: 1 })
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
  }, [selectedDate])

  // Appointments for the selected day in Day View
  const dayAppointments = useMemo(() => {
    return appointments.filter((a) => {
      if (!a.date) return false
      try {
        const d = parseISO(a.date)
        return isSameDay(d, selectedDate)
      } catch {
        return false
      }
    })
  }, [appointments, selectedDate])

  const openNewForSlot = (dateStr: string, timeStr: string) => {
    setSelectedApptToEdit(null)
    setNewConsultationPrefill({
      date: dateStr,
      startTime: timeStr,
    })
    setIsModalOpen(true)
  }

  const openEditAppt = (appt: AppointmentRecord) => {
    setSelectedApptToEdit(appt)
    setNewConsultationPrefill({})
    setIsModalOpen(true)
  }

  // Visual appearance per status
  const getApptStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-50 border-emerald-300 text-emerald-900'
      case 'cancelled':
        return 'bg-gray-100 border-gray-300 text-gray-400 line-through'
      case 'no_show':
        return 'bg-amber-50 border-amber-300 text-amber-900'
      case 'scheduled':
      default:
        return 'bg-[#E8F0EC] border-[#5F8D7A]/50 text-[#2D3A34]'
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-[#E5E0D8] shadow-xs">
        {/* Left: View Mode Toggle & Navigation */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Segmented Control */}
          <div className="bg-[#FAF7F2] p-1 rounded-xl border border-[#E5E0D8] flex items-center">
            <button
              onClick={() => setViewMode('day')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'day'
                  ? 'bg-white text-[#2D3A34] shadow-xs'
                  : 'text-[#6B7A72] hover:text-[#2D3A34]'
              }`}
            >
              Dia
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'week'
                  ? 'bg-white text-[#2D3A34] shadow-xs'
                  : 'text-[#6B7A72] hover:text-[#2D3A34]'
              }`}
            >
              Semana
            </button>
          </div>

          {/* Prev / Today / Next */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrev}
              className="h-9 w-9 rounded-xl border-[#E5E0D8]"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              onClick={handleToday}
              className="h-9 px-3 rounded-xl border-[#E5E0D8] text-xs font-semibold"
            >
              Hoje
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              className="h-9 w-9 rounded-xl border-[#E5E0D8]"
              aria-label="Próximo"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Date Picker Input */}
          <div className="relative flex items-center">
            <Input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDate(new Date(e.target.value + 'T00:00:00'))
                }
              }}
              className="h-9 rounded-xl border-[#E5E0D8] text-xs font-medium w-38 bg-[#FAF7F2]"
            />
          </div>
        </div>

        {/* Center / Right: Formatted Date title & Nova Consulta button */}
        <div className="flex items-center justify-between lg:justify-end gap-4">
          <div className="text-right">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#2D3A34] capitalize">
              {viewMode === 'day'
                ? format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })
                : `${format(weekDays[0], "d 'de' MMM", { locale: ptBR })} — ${format(
                    weekDays[6],
                    "d 'de' MMM 'de' yyyy",
                    { locale: ptBR },
                  )}`}
            </h2>
            <p className="text-xs text-[#6B7A72]">
              {dayAppointments.length} consulta(s) nesta visualização
            </p>
          </div>

          <Button
            onClick={() => {
              setSelectedApptToEdit(null)
              setNewConsultationPrefill({
                date: format(selectedDate, 'yyyy-MM-dd'),
                startTime: '09:00',
              })
              setIsModalOpen(true)
            }}
            className="bg-[#5F8D7A] hover:bg-[#4E7263] text-white rounded-xl text-xs sm:text-sm font-medium h-9 sm:h-10 shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Nova consulta
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-16 text-center text-sm text-[#6B7A72] flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#5F8D7A]" />
          <span>Carregando agenda clínica...</span>
        </div>
      ) : viewMode === 'day' ? (
        /* ================= DAY VIEW (Timeline 07:00 - 20:00) ================= */
        <div className="bg-white rounded-3xl border border-[#E5E0D8] p-4 sm:p-6 shadow-xs overflow-hidden">
          <div className="divide-y divide-[#E5E0D8]/60">
            {HOURS.map((hour) => {
              // Find appointments starting in this hour (e.g. 09:00, 09:30)
              const hourPrefix = hour.slice(0, 2)
              const apptsInHour = dayAppointments.filter(
                (a) => (a.start_time || '').slice(0, 2) === hourPrefix,
              )

              return (
                <div
                  key={hour}
                  className="py-3 sm:py-4 flex items-start gap-4 hover:bg-[#FAF7F2]/40 transition-colors group relative"
                >
                  {/* Time label */}
                  <div className="w-16 shrink-0 text-xs font-mono font-bold text-[#6B7A72] pt-1 text-right">
                    {hour}
                  </div>

                  {/* Slot content */}
                  <div className="flex-1 min-h-[50px] relative">
                    {apptsInHour.length === 0 ? (
                      <div
                        onClick={() => openNewForSlot(format(selectedDate, 'yyyy-MM-dd'), hour)}
                        className="h-10 rounded-xl border border-dashed border-transparent hover:border-[#5F8D7A]/40 hover:bg-[#E8F0EC]/20 flex items-center px-4 text-xs text-transparent group-hover:text-[#5F8D7A] cursor-pointer transition-all"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                        <span>Agendar neste horário ({hour})</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {apptsInHour.map((appt) => {
                          const patientName = appt.expand?.patient?.full_name || 'Paciente'
                          const style = getApptStyle(appt.status)
                          return (
                            <div
                              key={appt.id}
                              onClick={() => openEditAppt(appt)}
                              className={`p-3.5 rounded-2xl border ${style} shadow-xs hover:shadow-md cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-white/80 border border-black/5 flex items-center justify-center font-bold text-xs">
                                  {appt.status === 'completed' ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  ) : appt.status === 'cancelled' ? (
                                    <XCircle className="w-4 h-4 text-rose-500" />
                                  ) : appt.status === 'no_show' ? (
                                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                                  ) : (
                                    <Clock className="w-4 h-4 text-[#5F8D7A]" />
                                  )}
                                </div>

                                <div>
                                  <p className="font-bold text-sm text-[#2D3A34]">{patientName}</p>
                                  <div className="flex items-center gap-2 text-xs text-[#6B7A72]">
                                    <span className="font-mono font-medium">
                                      {appt.start_time} • {appt.duration_minutes || 50} min
                                    </span>
                                    <span>•</span>
                                    {appt.type === 'online' ? (
                                      <span className="inline-flex items-center gap-1 text-blue-600 font-medium">
                                        <Video className="w-3 h-3" /> Online
                                      </span>
                                    ) : (
                                      <span>Presencial</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="text-right">
                                <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/70 border border-black/5">
                                  {appt.status === 'completed'
                                    ? 'Concluída'
                                    : appt.status === 'cancelled'
                                      ? 'Cancelada'
                                      : appt.status === 'no_show'
                                        ? 'Não compareceu'
                                        : 'Agendada'}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* ================= WEEK VIEW (7 columns) ================= */
        <div className="bg-white rounded-3xl border border-[#E5E0D8] p-4 sm:p-6 shadow-xs overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Week Headers */}
            <div className="grid grid-cols-7 gap-2 pb-4 border-b border-[#E5E0D8]">
              {weekDays.map((day) => {
                const isSelected = isSameDay(day, selectedDate)
                const isDayToday = isSameDay(day, new Date())
                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => {
                      setSelectedDate(day)
                      setViewMode('day')
                    }}
                    className={`p-3 rounded-2xl text-center cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#5F8D7A] text-white shadow-xs'
                        : isDayToday
                          ? 'bg-[#E8F0EC] text-[#3D594D]'
                          : 'hover:bg-[#FAF7F2] text-[#2D3A34]'
                    }`}
                  >
                    <span className="block text-xs uppercase font-medium tracking-wider opacity-80">
                      {format(day, 'EEE', { locale: ptBR })}
                    </span>
                    <span className="block font-serif text-lg font-bold">{format(day, 'd')}</span>
                  </div>
                )
              })}
            </div>

            {/* Week Slots */}
            <div className="divide-y divide-[#E5E0D8]/60 pt-2">
              {HOURS.map((hour) => {
                const hourPrefix = hour.slice(0, 2)
                return (
                  <div key={hour} className="grid grid-cols-7 gap-2 py-2 min-h-[64px]">
                    {weekDays.map((day) => {
                      const dayStr = format(day, 'yyyy-MM-dd')
                      const apptsInCell = appointments.filter((a) => {
                        if (!a.date) return false
                        const matchesDay = a.date.slice(0, 10) === dayStr
                        const matchesHour = (a.start_time || '').slice(0, 2) === hourPrefix
                        return matchesDay && matchesHour
                      })

                      return (
                        <div
                          key={dayStr + hour}
                          className="relative rounded-xl border border-[#E5E0D8]/40 hover:border-[#5F8D7A]/40 p-1.5 transition-colors group bg-[#FAF7F2]/20"
                        >
                          <span className="text-[10px] text-[#6B7A72]/60 font-mono block">
                            {hour}
                          </span>

                          {apptsInCell.length === 0 ? (
                            <button
                              onClick={() => openNewForSlot(dayStr, hour)}
                              className="w-full h-8 mt-1 rounded-lg hover:bg-[#E8F0EC]/50 text-[10px] text-transparent group-hover:text-[#5F8D7A] flex items-center justify-center transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          ) : (
                            <div className="space-y-1 mt-1">
                              {apptsInCell.map((appt) => {
                                const patientName = appt.expand?.patient?.full_name || 'Paciente'
                                const style = getApptStyle(appt.status)
                                return (
                                  <div
                                    key={appt.id}
                                    onClick={() => openEditAppt(appt)}
                                    className={`p-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer truncate ${style}`}
                                    title={`${patientName} (${appt.start_time})`}
                                  >
                                    <div className="truncate">{patientName}</div>
                                    <div className="text-[10px] font-normal opacity-80 flex items-center gap-1">
                                      <span>{appt.start_time}</span>
                                      {appt.type === 'online' && <span>• Web</span>}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Consultation Modal */}
      <ConsultationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedApptToEdit(null)
          setNewConsultationPrefill({})
        }}
        onSuccess={() => loadData()}
        initialDate={newConsultationPrefill.date}
        initialStartTime={newConsultationPrefill.startTime}
        recordToEdit={selectedApptToEdit}
        isSessionRecord={false}
        patientsList={patients}
      />
    </div>
  )
}
