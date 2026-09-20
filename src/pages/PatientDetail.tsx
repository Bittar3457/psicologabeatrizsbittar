import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { patientsService } from '@/services/patients'
import { sessionsService } from '@/services/sessions'
import { appointmentsService } from '@/services/appointments'
import {
  PatientRecord,
  SessionRecord,
  AppointmentRecord,
  ConsultationStatus,
} from '@/types/clinical'
import { PatientAvatar, StatusBadge } from '@/components/PatientAvatar'
import { PatientModal } from '@/components/PatientModal'
import { ConsultationModal } from '@/components/ConsultationModal'
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
  UserCheck,
} from 'lucide-react'
import { formatDatePtBr, cleanPhoneForTel } from '@/lib/date-format'

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [patient, setPatient] = useState<PatientRecord | null>(null)
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Modals
  const [isEditPatientOpen, setIsEditPatientOpen] = useState(false)
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<SessionRecord | null>(null)
  const [editingAppointment, setEditingAppointment] = useState<AppointmentRecord | null>(null)

  const loadPatientData = useCallback(async () => {
    if (!id) return
    try {
      const [pt, sess, appts] = await Promise.all([
        patientsService.getById(id),
        sessionsService.listByPatient(id),
        appointmentsService.listByPatient(id),
      ])
      setPatient(pt)
      setSessions(sess)
      setAppointments(appts)
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
      <div className="p-16 text-center text-sm text-[#6B7A72] flex flex-col items-center gap-3">
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
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B7A72] hover:text-[#5F8D7A] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar para lista de pacientes
        </Link>
      </div>

      {/* Patient Header Card */}
      <div className="bg-white rounded-3xl border border-[#E5E0D8] p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <PatientAvatar name={patient.full_name} size="xl" />

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D3A34]">
                {patient.full_name}
              </h1>
              <StatusBadge status={patient.status} />
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-[#6B7A72]">
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
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#E8F0EC] hover:bg-[#d8e6df] text-[#3D594D] font-mono text-xs font-semibold transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-[#5F8D7A]" />
                <span>Ligar: {patient.phone}</span>
              </a>

              {patient.email && (
                <a
                  href={`mailto:${patient.email}`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-[#2D3A34] text-xs font-medium transition-colors border border-[#E5E0D8]"
                >
                  <Mail className="w-3.5 h-3.5 text-[#5F8D7A]" />
                  <span>{patient.email}</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 self-stretch sm:self-auto justify-end">
          <Button
            variant="outline"
            onClick={() => setIsEditPatientOpen(true)}
            className="rounded-xl border-[#E5E0D8] text-[#2D3A34] hover:bg-[#FAF7F2] text-xs sm:text-sm font-medium"
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
            className="rounded-xl bg-[#5F8D7A] hover:bg-[#4E7263] text-white text-xs sm:text-sm font-medium shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Nova consulta
          </Button>
        </div>
      </div>

      {/* Tabs: Histórico de Consultas, Próximas Consultas, Informações */}
      <Tabs defaultValue="history" className="space-y-6">
        <TabsList className="bg-white border border-[#E5E0D8] p-1 rounded-2xl h-12 flex gap-1">
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
            value="info"
            className="rounded-xl data-[state=active]:bg-[#5F8D7A] data-[state=active]:text-white data-[state=active]:shadow-xs text-xs sm:text-sm font-medium px-4"
          >
            Informações cadastrais
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Histórico de Consultas (Sessões Clínicas Realizadas) */}
        <TabsContent value="history" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-[#2D3A34]">
              Registro Cronológico de Sessões
            </h2>
            <span className="text-xs text-[#6B7A72]">
              Clique em uma sessão para ler ou editar as anotações
            </span>
          </div>

          {sessions.length === 0 ? (
            <div className="p-12 bg-white rounded-2xl border border-[#E5E0D8] text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#E8F0EC] text-[#5F8D7A] flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-base font-bold text-[#2D3A34]">
                Nenhuma sessão registrada para este paciente
              </h3>
              <p className="text-xs text-[#6B7A72] max-w-sm mx-auto">
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
                  className="bg-white rounded-2xl border border-[#E5E0D8] p-5 hover:shadow-md hover:border-[#5F8D7A]/50 transition-all cursor-pointer group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E0D8]/60">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#E5E0D8] flex items-center justify-center font-mono font-bold text-xs text-[#5F8D7A]">
                        {sess.start_time}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-[#2D3A34] flex items-center gap-2">
                          <span>{formatDatePtBr(sess.date)}</span>
                          <span className="text-xs text-[#6B7A72] font-normal">
                            ({sess.duration_minutes || 50} min)
                          </span>
                        </p>
                        <p className="text-xs text-[#6B7A72] flex items-center gap-1.5 mt-0.5">
                          {sess.type === 'online' ? (
                            <span className="inline-flex items-center gap-1 text-blue-600">
                              <Video className="w-3 h-3" /> Online
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
                  <div className="mt-3 text-xs sm:text-sm text-[#2D3A34] leading-relaxed bg-[#FAF7F2]/60 p-3.5 rounded-xl border border-[#E5E0D8]/50">
                    {sess.notes ? (
                      <p className="whitespace-pre-line">{sess.notes}</p>
                    ) : (
                      <span className="italic text-[#6B7A72]">
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
            <h2 className="font-serif text-lg font-bold text-[#2D3A34]">
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
            <div className="p-12 bg-white rounded-2xl border border-[#E5E0D8] text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#E8F0EC] text-[#5F8D7A] flex items-center justify-center mx-auto">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-base font-bold text-[#2D3A34]">
                Nenhuma consulta agendada
              </h3>
              <p className="text-xs text-[#6B7A72] max-w-sm mx-auto">
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
                  className="bg-white rounded-2xl border border-[#E5E0D8] p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-14 text-center shrink-0 py-2 bg-[#FAF7F2] rounded-xl border border-[#E5E0D8]">
                      <span className="block font-mono text-base font-bold text-[#5F8D7A]">
                        {appt.start_time}
                      </span>
                      <span className="block text-[10px] text-[#6B7A72]">
                        {appt.duration_minutes || 50} min
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#2D3A34]">
                          {formatDatePtBr(appt.date)}
                        </span>
                        <StatusBadge status={appt.status} />
                      </div>
                      <p className="text-xs text-[#6B7A72] flex items-center gap-2">
                        {appt.type === 'online' ? (
                          <span className="inline-flex items-center gap-1 text-blue-600 font-medium">
                            <Video className="w-3.5 h-3.5" /> Atendimento Online
                          </span>
                        ) : (
                          <span>Atendimento Presencial</span>
                        )}
                        {appt.notes && <span>• {appt.notes}</span>}
                      </p>
                    </div>
                  </div>

                  {/* Actions: Concluída, Não compareceu, Cancelada, Editar */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-[#E5E0D8]">
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
                      className="border-amber-300 bg-amber-50/50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs h-8 px-2.5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                      Não compareceu
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateAppointmentStatus(appt, 'cancelled')}
                      className="border-rose-300 bg-rose-50/50 hover:bg-rose-100 text-rose-800 rounded-xl text-xs h-8 px-2.5"
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
                      className="text-xs text-[#6B7A72] hover:text-[#2D3A34] h-8 px-2"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB 3: Informações Cadastrais */}
        <TabsContent value="info" className="space-y-4">
          <Card className="rounded-3xl border-[#E5E0D8] bg-white shadow-xs">
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-4">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#2D3A34]">
                    Ficha Cadastral e Dados Pessoais
                  </h3>
                  <p className="text-xs text-[#6B7A72]">
                    Informações arquivadas com sigilo profissional
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditPatientOpen(true)}
                  className="rounded-xl border-[#E5E0D8] text-xs font-medium"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1" />
                  Editar dados
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <span className="block text-xs font-semibold text-[#6B7A72] uppercase tracking-wider">
                    Nome Completo
                  </span>
                  <span className="font-medium text-[#2D3A34] mt-1 block">{patient.full_name}</span>
                </div>

                <div>
                  <span className="block text-xs font-semibold text-[#6B7A72] uppercase tracking-wider">
                    Data de Nascimento
                  </span>
                  <span className="font-medium text-[#2D3A34] mt-1 block">
                    {formatDatePtBr(patient.birth_date)}
                  </span>
                </div>

                <div>
                  <span className="block text-xs font-semibold text-[#6B7A72] uppercase tracking-wider">
                    Telefone / WhatsApp
                  </span>
                  <span className="font-mono font-medium text-[#2D3A34] mt-1 block">
                    {patient.phone}
                  </span>
                </div>

                <div>
                  <span className="block text-xs font-semibold text-[#6B7A72] uppercase tracking-wider">
                    E-mail
                  </span>
                  <span className="font-medium text-[#2D3A34] mt-1 block">
                    {patient.email || 'Não informado'}
                  </span>
                </div>

                <div>
                  <span className="block text-xs font-semibold text-[#6B7A72] uppercase tracking-wider">
                    Profissão / Ocupação
                  </span>
                  <span className="font-medium text-[#2D3A34] mt-1 block">
                    {patient.occupation || 'Não informado'}
                  </span>
                </div>

                <div>
                  <span className="block text-xs font-semibold text-[#6B7A72] uppercase tracking-wider">
                    Indicado por
                  </span>
                  <span className="font-medium text-[#2D3A34] mt-1 block">
                    {patient.referred_by || 'Busca direta'}
                  </span>
                </div>

                <div className="sm:col-span-2 md:col-span-3">
                  <span className="block text-xs font-semibold text-[#6B7A72] uppercase tracking-wider">
                    Endereço
                  </span>
                  <span className="font-medium text-[#2D3A34] mt-1 block">
                    {patient.address || 'Não informado'}
                  </span>
                </div>
              </div>

              {/* Contato de emergência */}
              <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E5E0D8] space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#2D3A34] uppercase tracking-wider">
                  <AlertCircle className="w-4 h-4 text-[#5F8D7A]" />
                  <span>Contato de Emergência</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div>
                    <span className="text-[#6B7A72] block">Nome e relação:</span>
                    <span className="font-medium text-[#2D3A34]">
                      {patient.emergency_contact || 'Não cadastrado'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B7A72] block">Telefone de emergência:</span>
                    <span className="font-mono font-medium text-[#2D3A34]">
                      {patient.emergency_phone || 'Não cadastrado'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Observações gerais */}
              <div className="space-y-1.5">
                <span className="block text-xs font-semibold text-[#6B7A72] uppercase tracking-wider">
                  Observações Gerais / Queixa Inicial
                </span>
                <div className="p-4 bg-[#FAF7F2]/60 rounded-2xl border border-[#E5E0D8]/60 text-xs sm:text-sm text-[#2D3A34] leading-relaxed whitespace-pre-line">
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
    </div>
  )
}
