import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { patientsService } from '@/services/patients'
import { sessionsService } from '@/services/sessions'
import { appointmentsService } from '@/services/appointments'
import { paymentsService } from '@/services/payments'
import {
  PatientRecord,
  SessionRecord,
  AppointmentRecord,
  PaymentRecord,
  ConsultationStatus,
  PAYMENT_METHOD_LABELS,
} from '@/types/clinical'
import {
  PatientAvatar,
  StatusBadge,
  PaymentStatusBadge,
  BillingTypeBadge,
} from '@/components/PatientAvatar'
import { BillingType } from '@/types/clinical'
import { PatientModal } from '@/components/PatientModal'
import { ConsultationModal } from '@/components/ConsultationModal'
import { PaymentModal } from '@/components/PaymentModal'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  AlertCircle,
  Clock,
  Calendar,
  FileText,
  Edit2,
  Plus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Video,
  Layers,
  UserCheck,
  DollarSign,
  CreditCard,
  TrendingUp,
} from 'lucide-react'
import { formatDatePtBr, cleanPhoneForTel, formatCurrencyBRL } from '@/lib/date-format'

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [patient, setPatient] = useState<PatientRecord | null>(null)
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([])
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Modals
  const [isEditPatientOpen, setIsEditPatientOpen] = useState(false)
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [initialPaymentBillingType, setInitialPaymentBillingType] =
    useState<BillingType>('per_session')
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null)
  const [editingSession, setEditingSession] = useState<SessionRecord | null>(null)
  const [editingAppointment, setEditingAppointment] = useState<AppointmentRecord | null>(null)

  const loadPatientData = useCallback(async () => {
    if (!id) return
    try {
      const [pt, sess, appts, pymts] = await Promise.all([
        patientsService.getById(id),
        sessionsService.listByPatient(id),
        appointmentsService.listByPatient(id),
        paymentsService.listByPatient(id),
      ])
      setPatient(pt)
      setSessions(sess)
      setAppointments(appts)
      setPayments(pymts)
    } catch {
      toast({
        variant: 'destructive',
        title: 'Paciente não encontrado',
        description: 'O paciente solicitado não existe ou foi removido.',
      })
      navigate('/pacientes')
    } finally {
      setIsLoading(false)
    }
  }, [id, navigate])

  useEffect(() => {
    loadPatientData()
  }, [loadPatientData])

  // Realtime updates
  useRealtime<PatientRecord>('patients', (e) => {
    if (e.record.id === id) loadPatientData()
  })
  useRealtime<SessionRecord>('sessions', () => loadPatientData())
  useRealtime<AppointmentRecord>('appointments', () => loadPatientData())
  useRealtime<PaymentRecord>('payments', () => loadPatientData())

  const handleUpdateAppointmentStatus = async (
    appt: AppointmentRecord,
    newStatus: ConsultationStatus,
  ) => {
    try {
      await appointmentsService.update(appt.id, { status: newStatus })

      // If marked completed, also register in sessions
      if (newStatus === 'completed') {
        await sessionsService.create({
          patient: appt.patient,
          date: appt.date,
          start_time: appt.start_time,
          duration_minutes: appt.duration_minutes || 50,
          type: appt.type,
          status: 'completed',
          notes: appt.notes || 'Sessão concluída e registrada no prontuário.',
        })
      }

      toast({
        title: 'Status atualizado',
        description: `Consulta marcada como ${
          newStatus === 'completed'
            ? 'concluída'
            : newStatus === 'no_show'
              ? 'não compareceu'
              : 'cancelada'
        }.`,
      })
      loadPatientData()
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar status',
      })
    }
  }

  if (isLoading || !patient) {
    return (
      <div className="p-16 text-center text-sm text-[#64748B] flex flex-col items-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-[#5F8D7A]" />
        <span>Carregando prontuário do paciente...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button and quick navigation */}
      <div>
        <Link
          to="/pacientes"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#5F8D7A] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar para lista de pacientes
        </Link>
      </div>

      {/* Patient Header Card */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <PatientAvatar name={patient.full_name} size="xl" />

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1E293B]">
                {patient.full_name}
              </h1>
              <StatusBadge status={patient.status} />
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-[#64748B]">
              {patient.occupation && (
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-[#5F8D7A]" />
                  {patient.occupation}
                </span>
              )}
              {patient.address && (
                <span className="flex items-center gap-1.5 truncate max-w-xs">
                  <MapPin className="w-4 h-4 text-[#5F8D7A]" />
                  <span className="truncate">{patient.address}</span>
                </span>
              )}
            </div>

            {/* Direct Dial Tel action */}
            <div className="pt-1 flex flex-wrap items-center gap-3">
              <a
                href={`tel:${cleanPhoneForTel(patient.phone)}`}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#E8F0EC] hover:bg-[#C7DBCF]/60 text-[#5F8D7A] font-mono text-xs font-semibold transition-colors border border-[#C7DBCF]"
              >
                <Phone className="w-3.5 h-3.5 text-[#5F8D7A]" />
                <span>Ligar: {patient.phone}</span>
              </a>

              {patient.email && (
                <a
                  href={`mailto:${patient.email}`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-[#1E293B] text-xs font-medium transition-colors border border-[#E2E8F0]"
                >
                  <Mail className="w-3.5 h-3.5 text-[#5F8D7A]" />
                  <span>{patient.email}</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 self-stretch sm:self-auto justify-end">
          <Button
            variant="outline"
            onClick={() => {
              setEditingPayment(null)
              setInitialPaymentBillingType('monthly')
              setIsPaymentModalOpen(true)
            }}
            className="rounded-xl border-[#F1D0C5] text-[#C97B5A] bg-[#FAEDE7] hover:bg-[#FBE4DA] text-xs sm:text-sm font-medium"
            title="Lançar fechamento mensal para este paciente"
          >
            <Calendar className="w-3.5 h-3.5 mr-1 text-[#C97B5A]" />
            Mensalidade
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setEditingPayment(null)
              setInitialPaymentBillingType('per_session')
              setIsPaymentModalOpen(true)
            }}
            className="rounded-xl border-[#C7DBCF] text-[#5F8D7A] bg-[#E8F0EC]/70 hover:bg-[#E8F0EC] text-xs sm:text-sm font-medium"
          >
            <DollarSign className="w-3.5 h-3.5 mr-1 text-[#5F8D7A]" />
            Registrar pagamento
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsEditPatientOpen(true)}
            className="rounded-xl border-[#E2E8F0] text-[#1E293B] hover:bg-[#F8FAFC] text-xs sm:text-sm font-medium"
          >
            <Edit2 className="w-3.5 h-3.5 mr-1.5" />
            Editar ficha
          </Button>
          <Button
            onClick={() => {
              setEditingAppointment(null)
              setEditingSession(null)
              setIsConsultationModalOpen(true)
            }}
            className="rounded-xl bg-[#5F8D7A] hover:bg-[#4E7263] text-white text-xs sm:text-sm font-medium shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Nova consulta
          </Button>
        </div>
      </div>

      {/* Resumo Financeiro Rápido do Paciente */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Pago no Histórico */}
        <Card className="rounded-2xl border-[#E2E8F0] bg-white shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                Total Pago no Histórico
              </span>
              <h4 className="text-xl font-serif font-bold text-emerald-700">
                {formatCurrencyBRL(
                  payments
                    .filter((p) => p.status === 'paid')
                    .reduce((acc, curr) => acc + (curr.amount || 0), 0),
                )}
              </h4>
              <p className="text-[11px] text-[#64748B]">
                {payments.filter((p) => p.status === 'paid').length} atendimento(s) quitado(s)
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <CheckCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Pagamentos Pendentes */}
        <Card className="rounded-2xl border-[#E2E8F0] bg-white shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                Pagamentos Pendentes
              </span>
              <h4 className="text-xl font-serif font-bold text-amber-700">
                {formatCurrencyBRL(
                  payments
                    .filter((p) => p.status === 'pending')
                    .reduce((acc, curr) => acc + (curr.amount || 0), 0),
                )}
              </h4>
              <p className="text-[11px] text-[#64748B]">
                {payments.filter((p) => p.status === 'pending').length} lançamento(s) em aberto
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Total de Sessões Realizadas */}
        <Card className="rounded-2xl border-[#E2E8F0] bg-white shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                Consultas Realizadas
              </span>
              <h4 className="text-xl font-serif font-bold text-[#1E293B]">
                {sessions.filter((s) => s.status === 'completed').length}
              </h4>
              <p className="text-[11px] text-[#5F8D7A]">
                Sessões clínicas registradas no prontuário
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#E8F0EC] text-[#5F8D7A] flex items-center justify-center border border-[#C7DBCF]">
              <FileText className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Histórico de Consultas, Próximas Consultas, Financeiro, Informações */}
      <Tabs defaultValue="history" className="space-y-6">
        <TabsList className="bg-white border border-[#E2E8F0] p-1 rounded-2xl h-12 flex flex-wrap gap-1">
          <TabsTrigger
            value="history"
            className="rounded-xl data-[state=active]:bg-[#5F8D7A] data-[state=active]:text-white data-[state=active]:shadow-xs text-xs sm:text-sm font-medium px-4"
          >
            Histórico de consultas ({sessions.length})
          </TabsTrigger>
          <TabsTrigger
            value="upcoming"
            className="rounded-xl data-[state=active]:bg-[#5F8D7A] data-[state=active]:text-white data-[state=active]:shadow-xs text-xs sm:text-sm font-medium px-4"
          >
            Próximas consultas ({appointments.length})
          </TabsTrigger>
          <TabsTrigger
            value="financial"
            className="rounded-xl data-[state=active]:bg-[#5F8D7A] data-[state=active]:text-white data-[state=active]:shadow-xs text-xs sm:text-sm font-medium px-4"
          >
            Financeiro ({payments.length})
          </TabsTrigger>
          <TabsTrigger
            value="info"
            className="rounded-xl data-[state=active]:bg-[#5F8D7A] data-[state=active]:text-white data-[state=active]:shadow-xs text-xs sm:text-sm font-medium px-4"
          >
            Informações cadastrais
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Histórico de Consultas (Sessões Clínicas Realizadas) */}
        <TabsContent value="history" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-[#1E293B]">
              Registro Cronológico de Sessões
            </h2>
            <span className="text-xs text-[#64748B]">
              Clique em uma sessão para ler ou editar as anotações
            </span>
          </div>

          {sessions.length === 0 ? (
            <div className="p-12 bg-white rounded-2xl border border-[#E2E8F0] text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#E8F0EC] text-[#5F8D7A] flex items-center justify-center mx-auto border border-[#C7DBCF]">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-base font-bold text-[#1E293B]">
                Nenhuma sessão registrada para este paciente
              </h3>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                As anotações e evoluções de consultas anteriores serão listadas aqui
                cronologicamente.
              </p>
              <div className="pt-2">
                <Button
                  onClick={() => setIsConsultationModalOpen(true)}
                  className="bg-[#5F8D7A] hover:bg-[#4E7263] text-white rounded-xl text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Registrar sessão
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((sess) => (
                <div
                  key={sess.id}
                  onClick={() => {
                    setEditingSession(sess)
                    setEditingAppointment(null)
                    setIsConsultationModalOpen(true)
                  }}
                  className="bg-white rounded-2xl border border-[#E2E8F0] p-5 hover:shadow-md hover:border-[#5F8D7A]/40 transition-all cursor-pointer group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]/80">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center font-mono font-bold text-xs text-[#5F8D7A]">
                        {sess.start_time}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-[#1E293B] flex items-center gap-2">
                          <span>{formatDatePtBr(sess.date)}</span>
                          <span className="text-xs text-[#64748B] font-normal">
                            ({sess.duration_minutes || 50} min)
                          </span>
                        </p>
                        <p className="text-xs text-[#64748B] flex items-center gap-1.5 mt-0.5">
                          {sess.type === 'online' ? (
                            <span className="inline-flex items-center gap-1 text-sky-600">
                              <Video className="w-3 h-3" /> Online
                            </span>
                          ) : sess.type === 'mixed' ? (
                            <span className="inline-flex items-center gap-1 text-[#5F8D7A] font-medium">
                              <Layers className="w-3 h-3 text-[#5F8D7A]" /> Modalidade Mista
                            </span>
                          ) : (
                            <span>Presencial no consultório</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusBadge status={sess.status} />
                      <span className="text-xs text-[#5F8D7A] group-hover:underline flex items-center gap-1">
                        <Edit2 className="w-3 h-3" /> Editar
                      </span>
                    </div>
                  </div>

                  {/* Sessão notes */}
                  <div className="mt-3 text-xs sm:text-sm text-[#1E293B] leading-relaxed bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
                    {sess.notes ? (
                      <p className="whitespace-pre-line">{sess.notes}</p>
                    ) : (
                      <span className="italic text-[#64748B]">
                        Nenhuma anotação registrada nesta sessão.
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB 2: Próximas Consultas (Appointments agendados) */}
        <TabsContent value="upcoming" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-[#1E293B]">
              Atendimentos Programados
            </h2>
            <Button
              onClick={() => setIsConsultationModalOpen(true)}
              size="sm"
              className="bg-[#5F8D7A] hover:bg-[#4E7263] text-white rounded-xl text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Agendar novo
            </Button>
          </div>

          {appointments.length === 0 ? (
            <div className="p-12 bg-white rounded-2xl border border-[#E2E8F0] text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#E8F0EC] text-[#5F8D7A] flex items-center justify-center mx-auto border border-[#C7DBCF]">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-base font-bold text-[#1E293B]">
                Nenhuma consulta agendada
              </h3>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                Agende a próxima sessão para manter a continuidade do processo terapêutico.
              </p>
              <div className="pt-2">
                <Button
                  onClick={() => setIsConsultationModalOpen(true)}
                  className="bg-[#5F8D7A] hover:bg-[#4E7263] text-white rounded-xl text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Agendar consulta
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((appt) => (
                <div
                  key={appt.id}
                  className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-14 text-center shrink-0 py-2 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                      <span className="block font-mono text-base font-bold text-[#5F8D7A]">
                        {appt.start_time}
                      </span>
                      <span className="block text-[10px] text-[#64748B]">
                        {appt.duration_minutes || 50} min
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#1E293B]">
                          {formatDatePtBr(appt.date)}
                        </span>
                        <StatusBadge status={appt.status} />
                      </div>
                      <p className="text-xs text-[#64748B] flex items-center gap-2">
                        {appt.type === 'online' ? (
                          <span className="inline-flex items-center gap-1 text-sky-600 font-medium">
                            <Video className="w-3.5 h-3.5" /> Atendimento Online
                          </span>
                        ) : appt.type === 'mixed' ? (
                          <span className="inline-flex items-center gap-1 text-[#5F8D7A] font-medium">
                            <Layers className="w-3.5 h-3.5 text-[#5F8D7A]" /> Atendimento Misto
                          </span>
                        ) : (
                          <span>Atendimento Presencial</span>
                        )}
                        {appt.notes && <span>• {appt.notes}</span>}
                      </p>
                    </div>
                  </div>

                  {/* Actions: Concluída (esmeralda), Não compareceu (âmbar), Cancelada, Editar */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-[#E2E8F0]">
                    <Button
                      size="sm"
                      onClick={() => handleUpdateAppointmentStatus(appt, 'completed')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs h-8 px-2.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      Concluída
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateAppointmentStatus(appt, 'no_show')}
                      className="border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs h-8 px-2.5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                      Não compareceu
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateAppointmentStatus(appt, 'cancelled')}
                      className="border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-xl text-xs h-8 px-2.5"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingAppointment(appt)
                        setEditingSession(null)
                        setIsConsultationModalOpen(true)
                      }}
                      className="text-xs text-[#64748B] hover:text-[#1E293B] h-8 px-2"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB 3: Histórico Financeiro do Paciente */}
        <TabsContent value="financial" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-lg font-bold text-[#1E293B]">
                Lançamentos Financeiros do Paciente
              </h2>
              <p className="text-xs text-[#64748B]">
                Histórico de pagamentos de sessões e consultas deste paciente
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  setEditingPayment(null)
                  setInitialPaymentBillingType('monthly')
                  setIsPaymentModalOpen(true)
                }}
                size="sm"
                variant="outline"
                className="border-[#F1D0C5] text-[#C97B5A] bg-[#FAEDE7] hover:bg-[#FBE4DA] rounded-xl text-xs"
              >
                <Calendar className="w-3.5 h-3.5 mr-1" />
                Lançar mensalidade
              </Button>
              <Button
                onClick={() => {
                  setEditingPayment(null)
                  setInitialPaymentBillingType('per_session')
                  setIsPaymentModalOpen(true)
                }}
                size="sm"
                className="bg-[#5F8D7A] hover:bg-[#4E7263] text-white rounded-xl text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Novo pagamento
              </Button>
            </div>
          </div>

          {payments.length === 0 ? (
            <div className="p-12 bg-white rounded-2xl border border-[#E2E8F0] text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#E8F0EC] text-[#5F8D7A] flex items-center justify-center mx-auto border border-[#C7DBCF]">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-base font-bold text-[#1E293B]">
                Nenhum pagamento registrado para este paciente
              </h3>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                Lance os pagamentos das consultas para manter o controle financeiro do atendimento.
              </p>
              <div className="pt-2">
                <Button
                  onClick={() => {
                    setEditingPayment(null)
                    setIsPaymentModalOpen(true)
                  }}
                  className="bg-[#5F8D7A] hover:bg-[#4E7263] text-white rounded-xl text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Registrar primeiro pagamento
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] divide-y divide-[#E2E8F0]/80 overflow-hidden shadow-xs">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="p-4 sm:p-5 hover:bg-[#F8FAFC] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-12 text-center shrink-0 py-2 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                      <span className="block font-mono text-xs font-bold text-[#5F8D7A]">
                        {p.date ? formatDatePtBr(p.date).slice(0, 5) : '-'}
                      </span>
                      <span className="block text-[10px] text-[#64748B]">
                        {p.date ? formatDatePtBr(p.date).slice(6) : ''}
                      </span>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[#1E293B]">
                          {formatCurrencyBRL(p.amount)}
                        </span>
                        <BillingTypeBadge
                          billingType={p.billing_type}
                          referenceMonth={p.reference_month}
                        />
                        <PaymentStatusBadge status={p.status} />
                        <span className="text-xs text-[#64748B] font-medium bg-[#F8FAFC] px-2 py-0.5 rounded-lg border border-[#E2E8F0]">
                          {PAYMENT_METHOD_LABELS[p.payment_method] || p.payment_method}
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] mt-1 flex flex-wrap items-center gap-2">
                        <span className="font-medium text-[#5F8D7A]">
                          {p.appointment_type ||
                            (p.billing_type === 'monthly' ? 'Mensalidade' : 'Sessão')}
                        </span>
                        {p.description && <span>• {p.description}</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingPayment(p)
                        setIsPaymentModalOpen(true)
                      }}
                      className="text-xs text-[#5F8D7A] hover:text-[#4E7263] hover:bg-[#E8F0EC] rounded-xl h-8 px-2.5"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1" />
                      Editar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB 4: Informações Cadastrais */}
        <TabsContent value="info" className="space-y-4">
          <Card className="rounded-3xl border-[#E2E8F0] bg-white shadow-xs">
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#1E293B]">
                    Ficha Cadastral e Dados Pessoais
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Informações arquivadas com sigilo profissional
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditPatientOpen(true)}
                  className="rounded-xl border-[#E2E8F0] text-xs font-medium"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1" />
                  Editar dados
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <span className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                    Nome Completo
                  </span>
                  <span className="font-medium text-[#1E293B] mt-1 block">{patient.full_name}</span>
                </div>

                <div>
                  <span className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                    Data de Nascimento
                  </span>
                  <span className="font-medium text-[#1E293B] mt-1 block">
                    {formatDatePtBr(patient.birth_date)}
                  </span>
                </div>

                <div>
                  <span className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                    Telefone / WhatsApp
                  </span>
                  <span className="font-mono font-medium text-[#1E293B] mt-1 block">
                    {patient.phone}
                  </span>
                </div>

                <div>
                  <span className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                    E-mail
                  </span>
                  <span className="font-medium text-[#1E293B] mt-1 block">
                    {patient.email || 'Não informado'}
                  </span>
                </div>

                <div>
                  <span className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                    Profissão / Ocupação
                  </span>
                  <span className="font-medium text-[#1E293B] mt-1 block">
                    {patient.occupation || 'Não informado'}
                  </span>
                </div>

                <div>
                  <span className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                    Indicado por
                  </span>
                  <span className="font-medium text-[#1E293B] mt-1 block">
                    {patient.referred_by || 'Busca direta'}
                  </span>
                </div>

                <div className="sm:col-span-2 md:col-span-3">
                  <span className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                    Endereço
                  </span>
                  <span className="font-medium text-[#1E293B] mt-1 block">
                    {patient.address || 'Não informado'}
                  </span>
                </div>
              </div>

              {/* Contato de emergência */}
              <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#1E293B] uppercase tracking-wider">
                  <AlertCircle className="w-4 h-4 text-[#5F8D7A]" />
                  <span>Contato de Emergência</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div>
                    <span className="text-[#64748B] block">Nome e relação:</span>
                    <span className="font-medium text-[#1E293B]">
                      {patient.emergency_contact || 'Não cadastrado'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block">Telefone de emergência:</span>
                    <span className="font-mono font-medium text-[#1E293B]">
                      {patient.emergency_phone || 'Não cadastrado'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Observações gerais */}
              <div className="space-y-1.5">
                <span className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  Observações Gerais / Queixa Inicial
                </span>
                <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] text-xs sm:text-sm text-[#1E293B] leading-relaxed whitespace-pre-line">
                  {patient.notes || 'Nenhuma observação cadastrada.'}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Patient Modal */}
      <PatientModal
        isOpen={isEditPatientOpen}
        onClose={() => setIsEditPatientOpen(false)}
        onSuccess={() => loadPatientData()}
        patientToEdit={patient}
      />

      {/* Consultation Modal (New / Edit) */}
      <ConsultationModal
        isOpen={isConsultationModalOpen}
        onClose={() => {
          setIsConsultationModalOpen(false)
          setEditingAppointment(null)
          setEditingSession(null)
        }}
        onSuccess={() => loadPatientData()}
        initialPatientId={patient.id}
        recordToEdit={editingSession || editingAppointment}
        isSessionRecord={!!editingSession}
        patientsList={[{ id: patient.id, full_name: patient.full_name }]}
      />

      {/* Payment Modal for Patient */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false)
          setEditingPayment(null)
          setInitialPaymentBillingType('per_session')
        }}
        onSuccess={() => loadPatientData()}
        initialPatientId={patient.id}
        initialBillingType={initialPaymentBillingType}
        paymentToEdit={editingPayment}
        patientsList={[{ id: patient.id, full_name: patient.full_name }]}
      />
    </div>
  )
}
