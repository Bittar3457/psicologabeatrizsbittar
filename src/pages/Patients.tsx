import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { patientsService } from '@/services/patients'
import { PatientRecord, PatientStatus } from '@/types/clinical'
import { PatientAvatar, StatusBadge } from '@/components/PatientAvatar'
import { PatientModal } from '@/components/PatientModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import {
  Search,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Calendar,
  UserX,
  Loader2,
} from 'lucide-react'
import { formatDatePtBr } from '@/lib/date-format'

type FilterStatus = 'all' | PatientStatus

export default function Patients() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState<PatientRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [patientToEdit, setPatientToEdit] = useState<PatientRecord | null>(null)
  const [patientToDelete, setPatientToDelete] = useState<PatientRecord | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadPatients = useCallback(async () => {
    try {
      const list = await patientsService.list('', 'full_name')
      setPatients(list)
    } catch {
      // error handled
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPatients()
  }, [loadPatients])

  useRealtime<PatientRecord>('patients', () => {
    loadPatients()
  })

  // Filtered patients
  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const matchesStatus = statusFilter === 'all' ? true : patient.status === statusFilter

      const q = searchQuery.toLowerCase().trim()
      if (!q) return matchesStatus

      const matchesSearch =
        (patient.full_name || '').toLowerCase().includes(q) ||
        (patient.phone || '').toLowerCase().includes(q) ||
        (patient.email || '').toLowerCase().includes(q) ||
        (patient.occupation || '').toLowerCase().includes(q)

      return matchesStatus && matchesSearch
    })
  }, [patients, statusFilter, searchQuery])

  // Count by status
  const counts = useMemo(() => {
    return {
      all: patients.length,
      active: patients.filter((p) => p.status === 'active').length,
      waitlist: patients.filter((p) => p.status === 'waitlist').length,
      inactive: patients.filter((p) => p.status === 'inactive').length,
    }
  }, [patients])

  const handleDelete = async () => {
    if (!patientToDelete) return
    try {
      setIsDeleting(true)
      await patientsService.delete(patientToDelete.id)
      toast({
        title: 'Paciente removido',
        description: `O registro de ${patientToDelete.full_name} e seus históricos foram excluídos.`,
      })
      setPatientToDelete(null)
      loadPatients()
    } catch (err: unknown) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description:
          err instanceof Error
            ? err.message
            : 'Não foi possível remover o paciente. Tente novamente.',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Title, Search and Create button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1E293B]">Pacientes</h1>
          <p className="text-sm text-[#64748B]">
            Ficha cadastral completa, histórico de sessões e contatos clínicos
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
            <Input
              type="text"
              placeholder="Buscar por nome, telefone ou e-mail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 border-[#E2E8F0] bg-white rounded-xl text-sm"
            />
          </div>

          <Button
            onClick={() => {
              setPatientToEdit(null)
              setIsModalOpen(true)
            }}
            className="bg-[#2F4858] hover:bg-[#243743] text-white rounded-xl h-10 shadow-xs shrink-0 font-medium"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Novo paciente
          </Button>
        </div>
      </div>

      {/* Status Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
            statusFilter === 'all'
              ? 'bg-[#2F4858] text-white shadow-xs'
              : 'bg-white text-[#64748B] border border-[#E2E8F0] hover:bg-[#F8FAFC]'
          }`}
        >
          Todos ({counts.all})
        </button>

        <button
          onClick={() => setStatusFilter('active')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
            statusFilter === 'active'
              ? 'bg-[#059669] text-white shadow-xs'
              : 'bg-white text-[#64748B] border border-[#E2E8F0] hover:bg-[#F8FAFC]'
          }`}
        >
          Ativos ({counts.active})
        </button>

        <button
          onClick={() => setStatusFilter('waitlist')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
            statusFilter === 'waitlist'
              ? 'bg-[#D97706] text-white shadow-xs'
              : 'bg-white text-[#64748B] border border-[#E2E8F0] hover:bg-[#F8FAFC]'
          }`}
        >
          Lista de espera ({counts.waitlist})
        </button>

        <button
          onClick={() => setStatusFilter('inactive')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
            statusFilter === 'inactive'
              ? 'bg-slate-600 text-white shadow-xs'
              : 'bg-white text-[#64748B] border border-[#E2E8F0] hover:bg-[#F8FAFC]'
          }`}
        >
          Inativos ({counts.inactive})
        </button>
      </div>

      {/* Patients Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-sm text-[#64748B] flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#2F4858]" />
          <span>Carregando lista de pacientes...</span>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-[#E2E8F0] text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#EAEFF2] text-[#2F4858] flex items-center justify-center mx-auto">
            <UserX className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg font-bold text-[#1E293B]">
            {searchQuery || statusFilter !== 'all'
              ? 'Nenhum paciente encontrado com esses filtros'
              : 'Nenhum paciente cadastrado ainda'}
          </h3>
          <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto">
            {searchQuery || statusFilter !== 'all'
              ? 'Tente ajustar sua busca ou limpar os filtros para visualizar outros registros.'
              : 'Cadastre seus primeiros pacientes para começar o gerenciamento dos prontuários e agendamento de consultas.'}
          </p>
          <div className="pt-2">
            {searchQuery || statusFilter !== 'all' ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                }}
                className="rounded-xl border-[#E2E8F0] text-xs"
              >
                Limpar filtros
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setPatientToEdit(null)
                  setIsModalOpen(true)
                }}
                className="bg-[#2F4858] hover:bg-[#243743] text-white rounded-xl text-xs"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Cadastrar primeiro paciente
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPatients.map((patient) => {
            return (
              <div
                key={patient.id}
                onClick={() => navigate(`/pacientes/${patient.id}`)}
                className="bg-white rounded-2xl border border-[#E2E8F0] p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  {/* Top: Avatar + Name + Action Dropdown */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <PatientAvatar name={patient.full_name} size="md" />
                      <div className="min-w-0">
                        <h3 className="font-semibold text-base text-[#1E293B] truncate group-hover:text-[#2F4858] transition-colors">
                          {patient.full_name}
                        </h3>
                        <p className="text-xs text-[#64748B] truncate">
                          {patient.occupation || 'Profissão não informada'}
                        </p>
                      </div>
                    </div>

                    <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-[#64748B] hover:text-[#1E293B] rounded-lg"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="border-[#E2E8F0] rounded-xl">
                          <DropdownMenuItem
                            onClick={() => {
                              setPatientToEdit(patient)
                              setIsModalOpen(true)
                            }}
                            className="text-xs cursor-pointer gap-2"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Editar dados
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setPatientToDelete(patient)}
                            className="text-xs text-[#DC2626] focus:text-[#DC2626] focus:bg-red-50 cursor-pointer gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Excluir paciente
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Contact infos */}
                  <div className="mt-4 space-y-2 text-xs text-[#64748B]">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[#2F4858]" />
                      <span className="font-mono text-[#1E293B] font-medium">{patient.phone}</span>
                    </div>
                    {patient.email && (
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-[#2F4858] shrink-0" />
                        <span className="truncate">{patient.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#2F4858]" />
                      <span>Cadastrado em {formatDatePtBr(patient.created)}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom status and click indicator */}
                <div className="mt-5 pt-3 border-t border-[#E2E8F0]/80 flex items-center justify-between">
                  <StatusBadge status={patient.status} />
                  <span className="text-[11px] font-medium text-[#2F4858] group-hover:underline">
                    Ver prontuário →
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Patient Create/Edit Modal */}
      <PatientModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setPatientToEdit(null)
        }}
        onSuccess={() => loadPatients()}
        patientToEdit={patientToEdit}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!patientToDelete}
        onOpenChange={(open) => !open && setPatientToDelete(null)}
      >
        <AlertDialogContent className="rounded-2xl border-[#E2E8F0]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-xl text-[#1E293B]">
              Confirmar exclusão de paciente
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-[#64748B] space-y-2">
              <p>
                Tem certeza de que deseja excluir o cadastro de{' '}
                <strong className="text-[#1E293B]">{patientToDelete?.full_name}</strong>?
              </p>
              <p className="p-3 bg-red-50 text-[#DC2626] rounded-xl text-xs border border-red-200">
                Atenção: Todas as consultas agendadas, sessões clínicas realizadas e anotações
                vinculadas a este paciente também serão removidas permanentemente.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isDeleting} className="border-[#E2E8F0] rounded-xl">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-[#DC2626] hover:bg-red-700 text-white rounded-xl"
            >
              {isDeleting ? 'Excluindo...' : 'Sim, excluir paciente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
