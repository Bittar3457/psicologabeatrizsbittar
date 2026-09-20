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
import { paymentsService, PaymentFormData } from '@/services/payments'
import { appointmentsService } from '@/services/appointments'
import { sessionsService } from '@/services/sessions'
import {
  PaymentRecord,
  PaymentMethod,
  PaymentStatus,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  AppointmentRecord,
  SessionRecord,
} from '@/types/clinical'
import { toast } from '@/hooks/use-toast'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'
import { Loader2, DollarSign, Calendar } from 'lucide-react'
import { formatDatePtBr } from '@/lib/date-format'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialPatientId?: string
  initialAmount?: number
  initialDescription?: string
  initialAppointmentId?: string
  initialSessionId?: string
  paymentToEdit?: PaymentRecord | null
  patientsList: Array<{ id: string; full_name: string }>
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialPatientId,
  initialAmount,
  initialDescription,
  initialAppointmentId,
  initialSessionId,
  paymentToEdit,
  patientsList,
}) => {
  const [patientId, setPatientId] = useState('')
  const [amountInput, setAmountInput] = useState('')
  const [date, setDate] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix')
  const [status, setStatus] = useState<PaymentStatus>('paid')
  const [description, setDescription] = useState('')
  const [appointmentType, setAppointmentType] = useState('Sessão')
  const [appointmentId, setAppointmentId] = useState<string>('')
  const [sessionId, setSessionId] = useState<string>('')

  // Linked appointments & sessions for selected patient
  const [patientAppointments, setPatientAppointments] = useState<AppointmentRecord[]>([])
  const [patientSessions, setPatientSessions] = useState<SessionRecord[]>([])
  const [isLoadingLinks, setIsLoadingLinks] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const formatAmountString = (val: number): string => {
    return val.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '')
    if (!rawDigits) {
      setAmountInput('')
      return
    }
    const num = Number(rawDigits) / 100
    setAmountInput(formatAmountString(num))
  }

  // Populate data when modal opens
  useEffect(() => {
    if (!isOpen) return

    if (paymentToEdit) {
      setPatientId(paymentToEdit.patient || '')
      setAmountInput(formatAmountString(paymentToEdit.amount || 0))
      setDate(paymentToEdit.date ? paymentToEdit.date.slice(0, 10) : '')
      setPaymentMethod(paymentToEdit.payment_method || 'pix')
      setStatus(paymentToEdit.status || 'paid')
      setDescription(paymentToEdit.description || '')
      setAppointmentType(paymentToEdit.appointment_type || 'Sessão')
      setAppointmentId(paymentToEdit.appointment || '')
      setSessionId(paymentToEdit.session || '')
    } else {
      const todayIso = new Date().toISOString().slice(0, 10)
      const selectedPt = initialPatientId || patientsList[0]?.id || ''
      setPatientId(selectedPt)
      setAmountInput(initialAmount ? formatAmountString(initialAmount) : '250,00')
      setDate(todayIso)
      setPaymentMethod('pix')
      setStatus('paid')
      setDescription(initialDescription || 'Sessão individual de psicoterapia')
      setAppointmentType('Sessão')
      setAppointmentId(initialAppointmentId || '')
      setSessionId(initialSessionId || '')
    }
    setErrors({})
  }, [
    isOpen,
    paymentToEdit,
    initialPatientId,
    initialAmount,
    initialDescription,
    initialAppointmentId,
    initialSessionId,
    patientsList,
  ])

  // Fetch appointments and sessions whenever patient changes
  useEffect(() => {
    if (!patientId || !isOpen) {
      setPatientAppointments([])
      setPatientSessions([])
      return
    }

    let isMounted = true
    setIsLoadingLinks(true)
    Promise.all([
      appointmentsService.listByPatient(patientId).catch(() => []),
      sessionsService.listByPatient(patientId).catch(() => []),
    ])
      .then(([appts, sess]) => {
        if (!isMounted) return
        setPatientAppointments(appts)
        setPatientSessions(sess)
      })
      .finally(() => {
        if (isMounted) setIsLoadingLinks(false)
      })

    return () => {
      isMounted = false
    }
  }, [patientId, isOpen])

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!patientId) errs.patient = 'Selecione o paciente.'
    if (!date) errs.date = 'Informe a data do pagamento.'
    const numericAmount = Number(amountInput.replace(/\./g, '').replace(',', '.'))
    if (!amountInput || isNaN(numericAmount) || numericAmount <= 0) {
      errs.amount = 'Informe um valor válido maior que zero.'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      setIsSubmitting(true)
      const numericAmount = Number(amountInput.replace(/\./g, '').replace(',', '.'))
      const datePayload = `${date} 00:00:00.000Z`

      const payload: PaymentFormData = {
        patient: patientId,
        date: datePayload,
        amount: numericAmount,
        payment_method: paymentMethod,
        status,
        description: description.trim(),
        appointment_type: appointmentType.trim(),
      }

      if (appointmentId && appointmentId !== 'none') {
        payload.appointment = appointmentId
      }
      if (sessionId && sessionId !== 'none') {
        payload.session = sessionId
      }

      if (paymentToEdit) {
        await paymentsService.update(paymentToEdit.id, payload)
        toast({
          title: 'Lançamento atualizado!',
          description: 'Os dados do pagamento foram salvos com sucesso.',
        })
      } else {
        await paymentsService.create(payload)
        toast({
          title: 'Pagamento registrado!',
          description: 'O lançamento foi adicionado ao módulo financeiro.',
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
          title: 'Erro ao salvar pagamento',
          description: getErrorMessage(err),
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl border-[#E2E8F0]">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#EAEFF2] text-[#2F4858] flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5 text-[#2F4858]" />
            </div>
            <div>
              <DialogTitle className="font-serif text-2xl text-[#1E293B]">
                {paymentToEdit ? 'Editar Lançamento' : 'Registrar Pagamento'}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-[#64748B]">
                {paymentToEdit
                  ? 'Atualize os detalhes financeiros do atendimento ou altere o status.'
                  : 'Lance uma receita de atendimento clínico ou consulta particular.'}
              </DialogDescription>
            </div>
          </div>
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
                  className={`border-[#E2E8F0] rounded-xl ${errors.patient ? 'border-red-500' : ''}`}
                >
                  <SelectValue placeholder="Selecione o paciente" />
                </SelectTrigger>
                <SelectContent className="max-h-60 rounded-xl">
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

          {/* Valor (R$) e Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="p_amount" className="text-xs font-semibold text-[#1E293B]">
                Valor (R$) *
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#64748B]">
                  R$
                </span>
                <Input
                  id="p_amount"
                  type="text"
                  inputMode="numeric"
                  value={amountInput}
                  onChange={handleAmountChange}
                  placeholder="250,00"
                  className={`pl-9 border-[#E2E8F0] rounded-xl font-mono text-sm ${
                    errors.amount ? 'border-red-500' : ''
                  }`}
                />
              </div>
              {errors.amount && <p className="text-xs text-red-500">{errors.amount}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="p_date" className="text-xs font-semibold text-[#1E293B]">
                Data do pagamento *
              </Label>
              <Input
                id="p_date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`border-[#E2E8F0] rounded-xl ${errors.date ? 'border-red-500' : ''}`}
              />
              {errors.date && <p className="text-xs text-red-500">{errors.date}</p>}
            </div>
          </div>

          {/* Forma de Pagamento e Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#1E293B]">Forma de Pagamento *</Label>
              <Select
                value={paymentMethod}
                onValueChange={(val: PaymentMethod) => setPaymentMethod(val)}
              >
                <SelectTrigger className="border-[#E2E8F0] rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#1E293B]">Status *</Label>
              <Select value={status} onValueChange={(val: PaymentStatus) => setStatus(val)}>
                <SelectTrigger className="border-[#E2E8F0] rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {Object.entries(PAYMENT_STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tipo de Atendimento & Vínculo com Agendamento/Sessão (Opcional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="p_type" className="text-xs font-semibold text-[#1E293B]">
                Tipo de Atendimento
              </Label>
              <Input
                id="p_type"
                type="text"
                value={appointmentType}
                onChange={(e) => setAppointmentType(e.target.value)}
                placeholder="Ex: Sessão, Avaliação, Retorno"
                className="border-[#E2E8F0] rounded-xl text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#1E293B] flex items-center justify-between">
                <span>Vincular a Agendamento</span>
                {isLoadingLinks && <span className="text-[10px] text-[#64748B]">Buscando...</span>}
              </Label>
              <Select
                value={appointmentId || 'none'}
                onValueChange={(val) => setAppointmentId(val === 'none' ? '' : val)}
              >
                <SelectTrigger className="border-[#E2E8F0] rounded-xl text-xs">
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
                <SelectContent className="max-h-48 rounded-xl text-xs">
                  <SelectItem value="none">Nenhum vínculo</SelectItem>
                  {patientAppointments.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {formatDatePtBr(a.date)} às {a.start_time} (
                      {a.type === 'online' ? 'Online' : 'Presencial'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Descrição / Observações */}
          <div className="space-y-1.5">
            <Label htmlFor="p_desc" className="text-xs font-semibold text-[#1E293B]">
              Descrição / Observações adicionais (opcional)
            </Label>
            <Textarea
              id="p_desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Sessão semanal de psicoterapia individual, pacote mensal ou observações de recibo..."
              className="border-[#E2E8F0] rounded-xl resize-none text-sm"
            />
          </div>

          <DialogFooter className="pt-4 border-t border-[#E2E8F0] flex sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="border-[#E2E8F0] rounded-xl text-xs sm:text-sm"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || patientsList.length === 0}
              className="bg-[#2F4858] hover:bg-[#243743] text-white rounded-xl text-xs sm:text-sm font-medium shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : paymentToEdit ? (
                'Salvar alterações'
              ) : (
                'Registrar pagamento'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
