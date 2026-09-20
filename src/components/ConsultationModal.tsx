import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { appointmentsService } from '@/services/appointments'
import { sessionsService } from '@/services/sessions'
import {
  AppointmentRecord,
  SessionRecord,
  ConsultationType,
  ConsultationStatus,
  getClinicalPreferences,
} from '@/types/clinical'
import { toast } from '@/hooks/use-toast'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'
import { Loader2 } from 'lucide-react'

interface ConsultationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  // Optional prefilled data
  initialPatientId?: string
  initialDate?: string // YYYY-MM-DD
  initialStartTime?: string // HH:MM
  // If editing an existing item:
  recordToEdit?: AppointmentRecord | SessionRecord | null
  isSessionRecord?: boolean // true if editing a 'sessions' record, false for 'appointments'
  patientsList: Array<{ id: string; full_name: string }>
}

export const ConsultationModal: React.FC<ConsultationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialPatientId,
  initialDate,
  initialStartTime,
  recordToEdit,
  isSessionRecord = false,
  patientsList,
}) => {
  const prefs = getClinicalPreferences()

  const [patientId, setPatientId] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [duration, setDuration] = useState<number>(prefs.defaultDuration || 50)
  const [type, setType] = useState<ConsultationType>(prefs.defaultType || 'presential')
  const [status, setStatus] = useState<ConsultationStatus>('scheduled')
  const [notes, setNotes] = useState('')
  const [saveToSessionToo, setSaveToSessionToo] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (recordToEdit) {
      setPatientId(recordToEdit.patient || '')
      setDate(recordToEdit.date ? recordToEdit.date.slice(0, 10) : '')
      setStartTime(recordToEdit.start_time || '09:00')
      setDuration(recordToEdit.duration_minutes || 50)
      setType(recordToEdit.type || 'presential')
      setStatus(recordToEdit.status || 'scheduled')
      setNotes(recordToEdit.notes || '')
      setSaveToSessionToo(false)
    } else {
      const todayIso = new Date().toISOString().slice(0, 10)
      setPatientId(initialPatientId || patientsList[0]?.id || '')
      setDate(initialDate || todayIso)
      setStartTime(initialStartTime || prefs.workStart || '09:00')
      setDuration(prefs.defaultDuration || 50)
      setType(prefs.defaultType || 'presential')
      setStatus('scheduled')
      setNotes('')
      setSaveToSessionToo(false)
    }
    setErrors({})
  }, [
    isOpen,
    recordToEdit,
    initialPatientId,
    initialDate,
    initialStartTime,
    patientsList,
    prefs.defaultDuration,
    prefs.defaultType,
    prefs.workStart,
  ])

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!patientId) errs.patient = 'Selecione o paciente.'
    if (!date) errs.date = 'Informe a data da consulta.'
    if (!startTime) errs.start_time = 'Informe o horário de início.'
    if (!duration || duration <= 0) errs.duration = 'Duração inválida.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      setIsSubmitting(true)
      const datePayload = `${date} 00:00:00.000Z`

      const payload = {
        patient: patientId,
        date: datePayload,
        start_time: startTime,
        duration_minutes: Number(duration),
        type,
        status,
        notes: notes.trim(),
      }

      if (recordToEdit) {
        if (isSessionRecord) {
          await sessionsService.update(recordToEdit.id, payload)
        } else {
          await appointmentsService.update(recordToEdit.id, payload)
          // If status marked as completed and it was an appointment, we can mirror to sessions if needed
          if (status === 'completed') {
            await sessionsService.create(payload)
          }
        }
        toast({
          title: 'Consulta atualizada!',
          description: 'As alterações foram salvas com sucesso.',
        })
      } else {
        // Create new
        await appointmentsService.create(payload)
        if (status === 'completed' || saveToSessionToo) {
          await sessionsService.create(payload)
        }
        toast({
          title: 'Consulta agendada!',
          description: 'O atendimento foi adicionado à agenda da clínica.',
        })
      }

      onSuccess()
      onClose()
    } catch (err) {
      const fieldErrs = extractFieldErrors(err)
      if (Object.keys(fieldErrs).length > 0) {
        setErrors(fieldErrs)
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao salvar consulta',
          description: getErrorMessage(err),
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border-[#E2E8F0]">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-[#1E293B]">
            {recordToEdit
              ? isSessionRecord
                ? 'Editar Sessão Clínica'
                : 'Editar Consulta Agendada'
              : 'Nova Consulta'}
          </DialogTitle>
          <DialogDescription className="text-sm text-[#64748B]">
            {recordToEdit
              ? 'Atualize os dados do atendimento ou registre anotações da sessão.'
              : 'Agende um novo atendimento presencial, online ou de modalidade mista.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Paciente */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#1E293B]">Paciente *</Label>
            {patientsList.length === 0 ? (
              <p className="text-xs text-amber-700">
                Nenhum paciente cadastrado. Cadastre um paciente primeiro.
              </p>
            ) : (
              <Select value={patientId} onValueChange={setPatientId}>
                <SelectTrigger
                  className={`border-[#E2E8F0] ${errors.patient ? 'border-red-500' : ''}`}
                >
                  <SelectValue placeholder="Selecione o paciente" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {patientsList.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.patient && <p className="text-xs text-red-500">{errors.patient}</p>}
          </div>

          {/* Data e Horário */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="c_date" className="text-xs font-semibold text-[#1E293B]">
                Data *
              </Label>
              <Input
                id="c_date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`border-[#E2E8F0] ${errors.date ? 'border-red-500' : ''}`}
              />
              {errors.date && <p className="text-xs text-red-500">{errors.date}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="c_time" className="text-xs font-semibold text-[#1E293B]">
                Horário de início (HH:MM) *
              </Label>
              <Input
                id="c_time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={`border-[#E2E8F0] ${errors.start_time ? 'border-red-500' : ''}`}
              />
              {errors.start_time && <p className="text-xs text-red-500">{errors.start_time}</p>}
            </div>
          </div>

          {/* Duração e Modalidade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="c_duration" className="text-xs font-semibold text-[#1E293B]">
                Duração (minutos)
              </Label>
              <Input
                id="c_duration"
                type="number"
                min={15}
                max={240}
                step={5}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="border-[#E2E8F0]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#1E293B]">Modalidade</Label>
              <Select value={type} onValueChange={(val: ConsultationType) => setType(val)}>
                <SelectTrigger className="border-[#E2E8F0]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="presential">Presencial (Consultório)</SelectItem>
                  <SelectItem value="online">Online (Teleconsulta)</SelectItem>
                  <SelectItem value="mixed">Mista (Híbrido presencial/online)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status da consulta */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#1E293B]">Status do atendimento</Label>
            <Select value={status} onValueChange={(val: ConsultationStatus) => setStatus(val)}>
              <SelectTrigger className="border-[#E2E8F0]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Agendada</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
                <SelectItem value="no_show">Não compareceu</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Anotações da sessão */}
          <div className="space-y-1.5">
            <Label htmlFor="c_notes" className="text-xs font-semibold text-[#1E293B]">
              Anotações clínicas e observações
            </Label>
            <Textarea
              id="c_notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Evolução clínica, temas trabalhados, reflexões, tarefas acordadas..."
              className="border-[#E2E8F0] resize-none"
            />
          </div>

          <DialogFooter className="pt-4 border-t border-[#E2E8F0] flex sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="border-[#E2E8F0]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || patientsList.length === 0}
              className="bg-[#2F4858] hover:bg-[#243743] text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : recordToEdit ? (
                'Salvar alterações'
              ) : (
                'Agendar consulta'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
