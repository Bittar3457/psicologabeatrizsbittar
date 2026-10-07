import React, { useState, useEffect, useMemo, useCallback } from 'react'
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
  BillingType,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  AppointmentRecord,
  SessionRecord,
} from '@/types/clinical'
import { toast } from '@/hooks/use-toast'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'
import {
  Loader2,
  DollarSign,
  Calendar,
  Sparkles,
  Layers,
  CalendarDays,
  FileCheck2,
} from 'lucide-react'
import { formatDatePtBr, formatReferenceMonthPtBr } from '@/lib/date-format'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialPatientId?: string
  initialAmount?: number
  initialDescription?: string
  initialAppointmentId?: string
  initialSessionId?: string
  initialBillingType?: BillingType
  initialReferenceMonth?: string
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
  initialBillingType,
  initialReferenceMonth,
  paymentToEdit,
  patientsList,
}) => {
  const [patientId, setPatientId] = useState('')
  const [billingType, setBillingType] = useState<BillingType>('per_session')
  const [referenceMonth, setReferenceMonth] = useState('') // "YYYY-MM"
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

  // Generate reference month options: past 6 months to next 3 months
  const referenceMonthOptions = useMemo(() => {
    const options: Array<{ value: string; label: string }> = []
    const now = new Date()
    for (let i = -6; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const value = `${year}-${month}`
      const label = formatReferenceMonthPtBr(value)
      options.push({ value, label })
    }
    return options
  }, [])

  // Calculate sessions/appointments count in the selected reference month for the selected patient
  const monthlySessionsCount = useMemo(() => {
    if (!referenceMonth || !patientId) return 0
    // Check appointments in that month
    const apptsInMonth = patientAppointments.filter((a) => {
      if (!a.date) return false
      return a.date.startsWith(referenceMonth) && a.status !== 'cancelled'
    })
    // Check sessions in that month
    const sessInMonth = patientSessions.filter((s) => {
      if (!s.date) return false
      return s.date.startsWith(referenceMonth) && s.status !== 'cancelled'
    })
    // Take the maximum of scheduled/completed appointments vs session logs
    return Math.max(apptsInMonth.length, sessInMonth.length)
  }, [referenceMonth, patientId, patientAppointments, patientSessions])

  // Suggested amount based on 4 sessions or actual sessions count * standard rate (R$ 250,00)
  const calculateSuggestedAmount = useCallback((sessionsCount: number, defaultPerSession = 250) => {
    const count = sessionsCount > 0 ? sessionsCount : 4
    return count * defaultPerSession
  }, [])

  // Populate data when modal opens
  useEffect(() => {
    if (!isOpen) return

    const now = new Date()
    const currentMonthIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const todayIso = now.toISOString().slice(0, 10)

    if (paymentToEdit) {
      setPatientId(paymentToEdit.patient || '')
      const bType: BillingType = paymentToEdit.billing_type || 'per_session'
      setBillingType(bType)
      setReferenceMonth(paymentToEdit.reference_month || currentMonthIso)
      setAmountInput(formatAmountString(paymentToEdit.amount || 0))
      setDate(paymentToEdit.date ? paymentToEdit.date.slice(0, 10) : todayIso)
      setPaymentMethod(paymentToEdit.payment_method || 'pix')
      setStatus(paymentToEdit.status || 'paid')
      setDescription(paymentToEdit.description || '')
      setAppointmentType(
        paymentToEdit.appointment_type || (bType === 'monthly' ? 'Mensalidade' : 'Sessão'),
      )
      setAppointmentId(paymentToEdit.appointment || '')
      setSessionId(paymentToEdit.session || '')
    } else {
      const selectedPt = initialPatientId || patientsList[0]?.id || ''
      const bType: BillingType = initialBillingType || 'per_session'
      const refMonth = initialReferenceMonth || currentMonthIso

      setPatientId(selectedPt)
      setBillingType(bType)
      setReferenceMonth(refMonth)
      setDate(todayIso)
      setPaymentMethod('pix')
      setStatus('paid')

      if (bType === 'monthly') {
        const suggested = initialAmount || 1000 // 4x R$ 250 = R$ 1.000,00
        setAmountInput(formatAmountString(suggested))
        const monthFriendly = formatReferenceMonthPtBr(refMonth)
        setDescription(initialDescription || `Mensalidade referente a ${monthFriendly}`)
        setAppointmentType('Mensalidade')
      } else {
        setAmountInput(initialAmount ? formatAmountString(initialAmount) : '250,00')
        setDescription(initialDescription || 'Sessão individual de psicoterapia')
        setAppointmentType('Sessão')
      }

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
    initialBillingType,
    initialReferenceMonth,
    patientsList,
  ])

  // Handle billing type toggle
  const handleBillingTypeChange = (newType: BillingType) => {
    setBillingType(newType)
    if (newType === 'monthly') {
      setAppointmentType('Mensalidade')
      setAppointmentId('')
      setSessionId('')
      // Set default description if current description was standard session
      if (
        !description ||
        description === 'Sessão individual de psicoterapia' ||
        description.startsWith('Sessão')
      ) {
        const monthFriendly = formatReferenceMonthPtBr(referenceMonth)
        setDescription(`Mensalidade referente a ${monthFriendly}`)
      }
      // Suggest value if current amount is default single session (250)
      const currentVal = Number(amountInput.replace(/\./g, '').replace(',', '.'))
      if (!currentVal || currentVal === 250) {
        const count = monthlySessionsCount > 0 ? monthlySessionsCount : 4
        setAmountInput(formatAmountString(count * 250))
      }
    } else {
      setAppointmentType('Sessão')
      if (!description || description.startsWith('Mensalidade referente a')) {
        setDescription('Sessão individual de psicoterapia')
      }
      const currentVal = Number(amountInput.replace(/\./g, '').replace(',', '.'))
      if (currentVal >= 1000) {
        setAmountInput('250,00')
      }
    }
  }

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

  // Auto-apply suggested amount button
  const handleApplySuggestion = () => {
    const count = monthlySessionsCount > 0 ? monthlySessionsCount : 4
    const total = calculateSuggestedAmount(count, 250)
    setAmountInput(formatAmountString(total))
    const monthFriendly = formatReferenceMonthPtBr(referenceMonth)
    setDescription(`Mensalidade de ${monthFriendly} (${count} sessão/sessões)`)
    toast({
      title: 'Valor sugerido aplicado!',
      description: `${count} sessão(ões) x R$ 250,00 = ${formatAmountString(total)}`,
    })
  }

  // Update description when reference month changes in monthly mode
  const handleReferenceMonthChange = (val: string) => {
    setReferenceMonth(val)
    if (billingType === 'monthly') {
      const monthFriendly = formatReferenceMonthPtBr(val)
      if (
        !description ||
        description.startsWith('Mensalidade referente a') ||
        description.startsWith('Mensalidade de')
      ) {
        setDescription(`Mensalidade referente a ${monthFriendly}`)
      }
    }
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!patientId) errs.patient = 'Selecione o paciente.'
    if (!date) errs.date = 'Informe a data do pagamento.'
    if (billingType === 'monthly' && !referenceMonth) {
      errs.referenceMonth = 'Selecione o mês de referência.'
    }
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
        appointment_type:
          appointmentType.trim() || (billingType === 'monthly' ? 'Mensalidade' : 'Sessão'),
        billing_type: billingType,
        reference_month: billingType === 'monthly' ? referenceMonth : '',
      }

      if (billingType === 'per_session') {
        if (appointmentId && appointmentId !== 'none') {
          payload.appointment = appointmentId
        }
        if (sessionId && sessionId !== 'none') {
          payload.session = sessionId
        }
      } else {
        // Monthly payment is not bound to a single consultation
        payload.appointment = undefined
        payload.session = undefined
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
          title: billingType === 'monthly' ? 'Mensalidade registrada!' : 'Pagamento registrado!',
          description:
            billingType === 'monthly'
              ? `Pagamento mensal de ${formatReferenceMonthPtBr(referenceMonth)} registrado.`
              : 'O lançamento foi adicionado ao módulo financeiro.',
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
            <div className="w-10 h-10 rounded-2xl bg-[#E8F0EC] text-[#5F8D7A] flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5 text-[#5F8D7A]" />
            </div>
            <div>
              <DialogTitle className="font-serif text-2xl text-[#1E293B]">
                {paymentToEdit ? 'Editar Lançamento' : 'Registrar Pagamento'}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-[#64748B]">
                {paymentToEdit
                  ? 'Atualize os detalhes financeiros do atendimento ou mensalidade.'
                  : 'Lance uma receita por consulta avulsa ou fechamento mensal.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Escolha do Tipo de Cobrança: Por Consulta vs Mensal */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#1E293B]">Tipo de cobrança *</Label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => handleBillingTypeChange('per_session')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                  billingType === 'per_session'
                    ? 'bg-white text-[#5F8D7A] shadow-xs border border-[#C7DBCF]'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Por consulta avulsa</span>
              </button>
              <button
                type="button"
                onClick={() => handleBillingTypeChange('monthly')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                  billingType === 'monthly'
                    ? 'bg-[#5F8D7A] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Pagamento mensal</span>
              </button>
            </div>
          </div>

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

          {/* Mês de Referência (Apenas no Modo Mensal) */}
          {billingType === 'monthly' && (
            <div className="p-3.5 rounded-2xl bg-[#E8F0EC]/60 border border-[#C7DBCF] space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1E293B] flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[#5F8D7A]">
                    <Calendar className="w-3.5 h-3.5" />
                    Mês de referência da mensalidade *
                  </span>
                  {monthlySessionsCount > 0 && (
                    <span className="text-[11px] font-semibold text-[#5F8D7A]">
                      {monthlySessionsCount} consulta(s) no mês
                    </span>
                  )}
                </Label>
                <Select value={referenceMonth} onValueChange={handleReferenceMonthChange}>
                  <SelectTrigger
                    className={`bg-white border-[#C7DBCF] rounded-xl text-xs sm:text-sm ${
                      errors.referenceMonth ? 'border-red-500' : ''
                    }`}
                  >
                    <SelectValue placeholder="Selecione o mês" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 rounded-xl">
                    {referenceMonthOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.referenceMonth && (
                  <p className="text-xs text-red-500">{errors.referenceMonth}</p>
                )}
              </div>

              {/* Sugestão de valor com base nas sessões */}
              <div className="flex items-center justify-between pt-1 text-xs text-[#1E293B]">
                <div className="flex items-center gap-1.5 text-[#64748B]">
                  <Sparkles className="w-3.5 h-3.5 text-[#C97B5A]" />
                  <span>
                    {monthlySessionsCount > 0
                      ? `${monthlySessionsCount} consulta(s) agendada(s) neste mês (sugerido: R$ ${(
                          monthlySessionsCount * 250
                        ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`
                      : 'Pacote padrão de 4 sessões sugerido (R$ 1.000,00)'}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleApplySuggestion}
                  className="rounded-xl border-[#C7DBCF] bg-white hover:bg-[#E8F0EC] text-[#5F8D7A] text-[11px] h-7 px-2.5 font-medium shrink-0"
                >
                  Sugerir valor
                </Button>
              </div>
            </div>
          )}

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
                  placeholder={billingType === 'monthly' ? '1.000,00' : '250,00'}
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

          {/* Tipo de Atendimento & Vínculo com Agendamento/Sessão (Apenas no Modo Por Consulta) */}
          {billingType === 'per_session' ? (
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
                  {isLoadingLinks && (
                    <span className="text-[10px] text-[#64748B]">Buscando...</span>
                  )}
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
                        {a.type === 'online'
                          ? 'Online'
                          : a.type === 'mixed'
                            ? 'Mista'
                            : 'Presencial'}
                        )
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="p_type_monthly" className="text-xs font-semibold text-[#1E293B]">
                Identificador de Cobrança
              </Label>
              <Input
                id="p_type_monthly"
                type="text"
                value={appointmentType}
                onChange={(e) => setAppointmentType(e.target.value)}
                placeholder="Ex: Mensalidade, Fechamento mensal"
                className="border-[#E2E8F0] rounded-xl text-sm"
              />
            </div>
          )}

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
              placeholder={
                billingType === 'monthly'
                  ? 'Ex: Mensalidade referente a Março de 2025 cobrindo 4 sessões semanais...'
                  : 'Ex: Sessão individual de psicoterapia, recibo emitido...'
              }
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
              className="bg-[#5F8D7A] hover:bg-[#4E7263] text-white rounded-xl text-xs sm:text-sm font-medium shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : paymentToEdit ? (
                'Salvar alterações'
              ) : billingType === 'monthly' ? (
                'Registrar mensalidade'
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
