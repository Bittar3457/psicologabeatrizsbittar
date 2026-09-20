import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { paymentsService } from '@/services/payments'
import { patientsService } from '@/services/patients'
import { appointmentsService } from '@/services/appointments'
import { sessionsService } from '@/services/sessions'
import {
  PaymentRecord,
  PatientRecord,
  AppointmentRecord,
  SessionRecord,
  PaymentMethod,
  PaymentStatus,
  PAYMENT_METHOD_LABELS,
} from '@/types/clinical'
import { PaymentModal } from '@/components/PaymentModal'
import { PatientAvatar, PaymentStatusBadge } from '@/components/PatientAvatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Edit2,
  Trash2,
  Download,
  CalendarDays,
  FileSpreadsheet,
  Award,
  CreditCard,
  PieChart,
  BarChart3,
  Calendar,
  User,
  ArrowUpRight,
  Loader2,
} from 'lucide-react'
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  isWithinInterval,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatDatePtBr, formatCurrencyBRL } from '@/lib/date-format'

export default function Financeiro() {
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [patients, setPatients] = useState<PatientRecord[]>([])
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([])
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Current selected month date (defaults to current month)
  const [currentDate, setCurrentDate] = useState<Date>(new Date())

  // Filters
  const [patientFilter, setPatientFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [methodFilter, setMethodFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null)
  const [deletingPayment, setDeletingPayment] = useState<PaymentRecord | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Load data
  const loadAllData = useCallback(async () => {
    try {
      const [allPayments, allPatients, allAppts, allSess] = await Promise.all([
        paymentsService.list('', '-date'),
        patientsService.list('', 'full_name'),
        appointmentsService.list('', 'date'),
        sessionsService.list('', 'date'),
      ])
      setPayments(allPayments)
      setPatients(allPatients)
      setAppointments(allAppts)
      setSessions(allSess)
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar dados financeiros',
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  // Realtime updates
  useRealtime<PaymentRecord>('payments', () => loadAllData())
  useRealtime<AppointmentRecord>('appointments', () => loadAllData())
  useRealtime<PatientRecord>('patients', () => loadAllData())

  // Month navigation helpers
  const handlePrevMonth = () => setCurrentDate((prev) => subMonths(prev, 1))
  const handleNextMonth = () => setCurrentDate((prev) => addMonths(prev, 1))
  const handleCurrentMonth = () => setCurrentDate(new Date())

  const formattedMonthLabel = useMemo(() => {
    const raw = format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })
    return raw.charAt(0).toUpperCase() + raw.slice(1)
  }, [currentDate])

  const monthInterval = useMemo(() => {
    return {
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate),
    }
  }, [currentDate])

  // Filter payments strictly for the current month
  const monthPayments = useMemo(() => {
    return payments.filter((p) => {
      if (!p.date) return false
      try {
        const d = parseISO(p.date)
        return isWithinInterval(d, monthInterval)
      } catch {
        return false
      }
    })
  }, [payments, monthInterval])

  // Filter appointments for the current month
  const monthAppointments = useMemo(() => {
    return appointments.filter((a) => {
      if (!a.date) return false
      try {
        const d = parseISO(a.date)
        return isWithinInterval(d, monthInterval)
      } catch {
        return false
      }
    })
  }, [appointments, monthInterval])

  // Filter sessions for the current month
  const monthSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (!s.date) return false
      try {
        const d = parseISO(s.date)
        return isWithinInterval(d, monthInterval)
      } catch {
        return false
      }
    })
  }, [sessions, monthInterval])

  // SUMMARY STATS (Current Month)
  // 1. Total faturado (pagos)
  const totalPaid = useMemo(() => {
    return monthPayments
      .filter((p) => p.status === 'paid')
      .reduce((acc, curr) => acc + (curr.amount || 0), 0)
  }, [monthPayments])

  // 2. Total pendente
  const totalPending = useMemo(() => {
    return monthPayments
      .filter((p) => p.status === 'pending')
      .reduce((acc, curr) => acc + (curr.amount || 0), 0)
  }, [monthPayments])

  // 3. Quantidade de atendimentos pagos no mês
  const paidCount = useMemo(() => {
    return monthPayments.filter((p) => p.status === 'paid').length
  }, [monthPayments])

  // 4. Ticket médio dos atendimentos pagos
  const averageTicket = useMemo(() => {
    if (paidCount === 0) return 0
    return totalPaid / paidCount
  }, [totalPaid, paidCount])

  // Filtered payments for table view (applying patient, status, method, search)
  const filteredTablePayments = useMemo(() => {
    return monthPayments.filter((p) => {
      if (patientFilter !== 'all' && p.patient !== patientFilter) return false
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      if (methodFilter !== 'all' && p.payment_method !== methodFilter) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const patientName = p.expand?.patient?.full_name?.toLowerCase() || ''
        const desc = (p.description || '').toLowerCase()
        const type = (p.appointment_type || '').toLowerCase()
        if (!patientName.includes(q) && !desc.includes(q) && !type.includes(q)) {
          return false
        }
      }
      return true
    })
  }, [monthPayments, patientFilter, statusFilter, methodFilter, searchQuery])

  // MONTHLY REPORT AGGREGATES
  // Atendimentos realizados no mês (completed from appointments + completed from sessions, deduplicated or summed)
  const attendanceStats = useMemo(() => {
    // Collect all completed / cancelled / no_show
    const appts = monthAppointments
    const sess = monthSessions

    // We can count completed appointments + completed sessions with status completed
    const completedAppts = appts.filter((a) => a.status === 'completed').length
    const completedSessions = sess.filter((s) => s.status === 'completed').length
    // Use maximum of completed sessions or appointments, or unique
    const totalCompleted = Math.max(completedAppts, completedSessions)

    const cancelledCount = appts.filter((a) => a.status === 'cancelled').length
    const noShowCount = appts.filter((a) => a.status === 'no_show').length
    const scheduledUpcoming = appts.filter((a) => a.status === 'scheduled').length

    return {
      completed: totalCompleted,
      cancelled: cancelledCount,
      noShow: noShowCount,
      scheduled: scheduledUpcoming,
      totalScheduled: appts.length,
    }
  }, [monthAppointments, monthSessions])

  // Revenue by payment method
  const revenueByMethod = useMemo(() => {
    const methods: Record<
      PaymentMethod,
      { label: string; amount: number; count: number; percentage: number }
    > = {
      pix: { label: 'PIX', amount: 0, count: 0, percentage: 0 },
      credit_card: { label: 'Cartão de Crédito', amount: 0, count: 0, percentage: 0 },
      debit_card: { label: 'Cartão de Débito', amount: 0, count: 0, percentage: 0 },
      cash: { label: 'Dinheiro', amount: 0, count: 0, percentage: 0 },
      bank_transfer: { label: 'Transferência', amount: 0, count: 0, percentage: 0 },
      other: { label: 'Outro', amount: 0, count: 0, percentage: 0 },
    }

    const paidPayments = monthPayments.filter((p) => p.status === 'paid')
    paidPayments.forEach((p) => {
      const m = p.payment_method
      if (methods[m]) {
        methods[m].amount += p.amount || 0
        methods[m].count += 1
      }
    })

    if (totalPaid > 0) {
      Object.keys(methods).forEach((key) => {
        const k = key as PaymentMethod
        methods[k].percentage = Math.round((methods[k].amount / totalPaid) * 100)
      })
    }

    return Object.entries(methods)
      .map(([id, data]) => ({ id: id as PaymentMethod, ...data }))
      .filter((m) => m.amount > 0 || m.count > 0)
      .sort((a, b) => b.amount - a.amount)
  }, [monthPayments, totalPaid])

  // Top patients by paid amount in this month
  const topPatientsThisMonth = useMemo(() => {
    const patientMap: Record<
      string,
      { id: string; name: string; totalPaid: number; count: number; pendingAmount: number }
    > = {}

    monthPayments.forEach((p) => {
      const pId = p.patient
      const pName = p.expand?.patient?.full_name || 'Paciente'
      if (!patientMap[pId]) {
        patientMap[pId] = {
          id: pId,
          name: pName,
          totalPaid: 0,
          count: 0,
          pendingAmount: 0,
        }
      }
      if (p.status === 'paid') {
        patientMap[pId].totalPaid += p.amount || 0
        patientMap[pId].count += 1
      } else if (p.status === 'pending') {
        patientMap[pId].pendingAmount += p.amount || 0
      }
    })

    return Object.values(patientMap)
      .filter((p) => p.totalPaid > 0 || p.pendingAmount > 0)
      .sort((a, b) => b.totalPaid - a.totalPaid)
  }, [monthPayments])

  // Delete payment handler
  const handleDeletePayment = async () => {
    if (!deletingPayment) return
    try {
      setIsDeleting(true)
      await paymentsService.delete(deletingPayment.id)
      toast({
        title: 'Lançamento excluído',
        description: 'O registro foi removido com sucesso.',
      })
      setDeletingPayment(null)
      loadAllData()
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir lançamento',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Export report as simple CSV
  const handleExportCSV = () => {
    if (monthPayments.length === 0) {
      toast({
        title: 'Sem dados para exportar',
        description: 'Não há lançamentos no período selecionado.',
      })
      return
    }

    const headers = [
      'Data',
      'Paciente',
      'Tipo',
      'Valor (R$)',
      'Forma de Pagamento',
      'Status',
      'Descrição',
    ]

    const rows = monthPayments.map((p) => [
      formatDatePtBr(p.date),
      `"${p.expand?.patient?.full_name || 'Paciente'}"`,
      `"${p.appointment_type || 'Sessão'}"`,
      p.amount.toFixed(2).replace('.', ','),
      `"${PAYMENT_METHOD_LABELS[p.payment_method] || p.payment_method}"`,
      p.status === 'paid' ? 'Pago' : p.status === 'pending' ? 'Pendente' : 'Cancelado',
      `"${(p.description || '').replace(/"/g, '""')}"`,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `relatorio-financeiro-${format(currentDate, 'yyyy-MM')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: 'Relatório exportado',
      description: 'O arquivo CSV foi baixado com sucesso.',
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner & Month Selector */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAEFF2] border border-[#C5D3DC] text-xs font-semibold text-[#2F4858]">
            <DollarSign className="w-3.5 h-3.5 text-[#2F4858]" />
            <span>Módulo de Gestão Financeira</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1E293B]">
            Controle Financeiro & Faturamento
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Acompanhe o faturamento clínico, gerencie pagamentos e gere relatórios mensais de
            atendimentos.
          </p>
        </div>

        {/* Month Selector Buttons & Quick Action */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-1 shadow-xs">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevMonth}
              className="h-8 w-8 text-[#2F4858] hover:bg-white rounded-xl"
              title="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <button
              onClick={handleCurrentMonth}
              className="px-3 text-xs sm:text-sm font-semibold text-[#1E293B] hover:text-[#2F4858] transition-colors"
              title="Voltar para o mês atual"
            >
              {formattedMonthLabel}
            </button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              className="h-8 w-8 text-[#2F4858] hover:bg-white rounded-xl"
              title="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <Button
            onClick={() => {
              setEditingPayment(null)
              setIsPaymentModalOpen(true)
            }}
            className="rounded-xl bg-[#2F4858] hover:bg-[#243743] text-white text-xs sm:text-sm font-medium shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Novo lançamento
          </Button>
        </div>
      </div>

      {/* 4 Cards de Resumo do Mês Corrente */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Total Faturado (Pagos) - Verde-esmeralda para sucesso */}
        <Card className="rounded-2xl border-[#E2E8F0] bg-white shadow-xs hover:shadow-sm transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                Total Recebido
              </p>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-emerald-700">
                {isLoading ? '...' : formatCurrencyBRL(totalPaid)}
              </h3>
              <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {paidCount} atendimento{paidCount === 1 ? '' : 's'} quitado
                  {paidCount === 1 ? '' : 's'}
                </span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <TrendingUp className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Total Pendente - Âmbar para atenção */}
        <Card className="rounded-2xl border-[#E2E8F0] bg-white shadow-xs hover:shadow-sm transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                A Receber / Pendente
              </p>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-amber-700">
                {isLoading ? '...' : formatCurrencyBRL(totalPending)}
              </h3>
              <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {monthPayments.filter((p) => p.status === 'pending').length} lançamento(s) em
                  aberto
                </span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
              <AlertCircle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Atendimentos Pagos - Azul ardósia principal CLIAP */}
        <Card className="rounded-2xl border-[#E2E8F0] bg-white shadow-xs hover:shadow-sm transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                Atendimentos Pagos
              </p>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#1E293B]">
                {isLoading ? '...' : paidCount}
              </h3>
              <p className="text-xs text-[#2F4858] font-medium">
                Em {formattedMonthLabel.toLowerCase()}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#EAEFF2] text-[#2F4858] flex items-center justify-center shrink-0 border border-[#C5D3DC]">
              <CalendarDays className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Ticket Médio - Terracota / Sálvia acento */}
        <Card className="rounded-2xl border-[#E2E8F0] bg-white shadow-xs hover:shadow-sm transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                Ticket Médio
              </p>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#1E293B]">
                {isLoading ? '...' : formatCurrencyBRL(averageTicket)}
              </h3>
              <p className="text-xs text-[#C97B5A] font-medium">Média por atendimento pago</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#FAEDE7] text-[#C97B5A] flex items-center justify-center shrink-0 border border-[#F1D0C5]">
              <DollarSign className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Lançamentos Financeiros vs Relatório Mensal */}
      <Tabs defaultValue="transactions" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TabsList className="bg-white border border-[#E2E8F0] p-1 rounded-2xl h-12 flex gap-1 self-start shadow-xs">
            <TabsTrigger
              value="transactions"
              className="rounded-xl data-[state=active]:bg-[#2F4858] data-[state=active]:text-white data-[state=active]:shadow-xs text-xs sm:text-sm font-medium px-4"
            >
              Lançamentos do Mês ({filteredTablePayments.length})
            </TabsTrigger>
            <TabsTrigger
              value="report"
              className="rounded-xl data-[state=active]:bg-[#2F4858] data-[state=active]:text-white data-[state=active]:shadow-xs text-xs sm:text-sm font-medium px-4"
            >
              Relatório Mensal de Atendimentos
            </TabsTrigger>
          </TabsList>

          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="rounded-xl border-[#E2E8F0] bg-white text-[#1E293B] hover:bg-[#F8FAFC] text-xs sm:text-sm self-start sm:self-auto shadow-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-[#2F4858]" />
            Exportar CSV ({formattedMonthLabel})
          </Button>
        </div>

        {/* SUB-ABA 1: TABELA DE LANÇAMENTOS COM FILTROS */}
        <TabsContent value="transactions" className="space-y-4">
          {/* Barra de Filtros */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Busca textual */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <Input
                placeholder="Buscar por paciente, tipo ou descrição..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rounded-xl border-[#E2E8F0] text-xs sm:text-sm"
              />
            </div>

            {/* Filtro por Paciente */}
            <div className="w-full md:w-56">
              <Select value={patientFilter} onValueChange={setPatientFilter}>
                <SelectTrigger className="rounded-xl border-[#E2E8F0] text-xs sm:text-sm">
                  <SelectValue placeholder="Filtrar paciente" />
                </SelectTrigger>
                <SelectContent className="max-h-60 rounded-xl text-xs sm:text-sm">
                  <SelectItem value="all">Todos os pacientes</SelectItem>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Status */}
            <div className="w-full md:w-44">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="rounded-xl border-[#E2E8F0] text-xs sm:text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl text-xs sm:text-sm">
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="paid">Pagos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="canceled">Cancelados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Forma de Pagamento */}
            <div className="w-full md:w-48">
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="rounded-xl border-[#E2E8F0] text-xs sm:text-sm">
                  <SelectValue placeholder="Forma" />
                </SelectTrigger>
                <SelectContent className="rounded-xl text-xs sm:text-sm">
                  <SelectItem value="all">Todas as formas</SelectItem>
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(patientFilter !== 'all' ||
              statusFilter !== 'all' ||
              methodFilter !== 'all' ||
              searchQuery) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setPatientFilter('all')
                  setStatusFilter('all')
                  setMethodFilter('all')
                  setSearchQuery('')
                }}
                className="text-xs text-[#C97B5A] hover:bg-rose-50 rounded-xl px-3"
              >
                Limpar
              </Button>
            )}
          </div>

          {/* Tabela de Lançamentos */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-xs">
            {filteredTablePayments.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#EAEFF2] text-[#2F4858] flex items-center justify-center mx-auto">
                  <DollarSign className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-base font-bold text-[#1E293B]">
                  Nenhum lançamento encontrado
                </h3>
                <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                  Não há registros com os filtros selecionados para{' '}
                  {formattedMonthLabel.toLowerCase()}.
                </p>
                <div className="pt-2">
                  <Button
                    onClick={() => {
                      setEditingPayment(null)
                      setIsPaymentModalOpen(true)
                    }}
                    className="bg-[#2F4858] hover:bg-[#243743] text-white rounded-xl text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Registrar novo pagamento
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm divide-y divide-[#E2E8F0]">
                  <thead className="bg-[#F8FAFC] text-[11px] font-semibold tracking-wider text-[#64748B] uppercase">
                    <tr>
                      <th className="py-3 px-4 sm:px-6">Data</th>
                      <th className="py-3 px-4 sm:px-6">Paciente</th>
                      <th className="py-3 px-4 sm:px-6">Tipo / Descrição</th>
                      <th className="py-3 px-4 sm:px-6">Forma</th>
                      <th className="py-3 px-4 sm:px-6">Valor</th>
                      <th className="py-3 px-4 sm:px-6">Status</th>
                      <th className="py-3 px-4 sm:px-6 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]/70 bg-white">
                    {filteredTablePayments.map((p) => {
                      const patientName = p.expand?.patient?.full_name || 'Paciente'
                      return (
                        <tr key={p.id} className="hover:bg-[#F8FAFC]/80 transition-colors group">
                          {/* Data */}
                          <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap font-mono text-xs text-[#1E293B]">
                            {formatDatePtBr(p.date)}
                          </td>

                          {/* Paciente */}
                          <td className="py-3.5 px-4 sm:px-6">
                            <div className="flex items-center gap-2.5">
                              <PatientAvatar name={patientName} size="sm" />
                              <span className="font-semibold text-[#1E293B] hover:text-[#2F4858] transition-colors">
                                {patientName}
                              </span>
                            </div>
                          </td>

                          {/* Tipo / Descrição */}
                          <td className="py-3.5 px-4 sm:px-6 max-w-xs truncate">
                            <span className="inline-block px-2 py-0.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] font-medium text-[#2F4858] mr-1.5">
                              {p.appointment_type || 'Sessão'}
                            </span>
                            {p.description && (
                              <span
                                className="text-xs text-[#64748B] truncate"
                                title={p.description}
                              >
                                {p.description}
                              </span>
                            )}
                          </td>

                          {/* Forma de Pagamento */}
                          <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#EAEFF2] text-[#2F4858] text-xs font-medium border border-[#C5D3DC]">
                              <CreditCard className="w-3 h-3 text-[#2F4858]" />
                              {PAYMENT_METHOD_LABELS[p.payment_method] || p.payment_method}
                            </span>
                          </td>

                          {/* Valor */}
                          <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap font-mono font-bold text-sm text-[#1E293B]">
                            {formatCurrencyBRL(p.amount)}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                            <PaymentStatusBadge status={p.status} />
                          </td>

                          {/* Ações */}
                          <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingPayment(p)
                                  setIsPaymentModalOpen(true)
                                }}
                                className="h-8 w-8 text-[#64748B] hover:text-[#2F4858] hover:bg-[#EAEFF2] rounded-xl"
                                title="Editar lançamento"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeletingPayment(p)}
                                className="h-8 w-8 text-[#64748B] hover:text-[#DC2626] hover:bg-red-50 rounded-xl"
                                title="Excluir lançamento"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* SUB-ABA 2: RELATÓRIO MENSAL DE ATENDIMENTOS E FATURAMENTO */}
        <TabsContent value="report" className="space-y-6">
          {/* Bloco de Indicadores de Atendimentos */}
          <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
              <div>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-[#1E293B]">
                  Atendimentos Realizados no Mês ({formattedMonthLabel})
                </h3>
                <p className="text-xs sm:text-sm text-[#64748B]">
                  Controle da assiduidade e volume clínico do período
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#64748B]">Total programado:</span>
                <span className="font-mono font-bold text-[#1E293B]">
                  {attendanceStats.totalScheduled} consultas
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Concluídos */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                  Atendimentos Concluídos
                </span>
                <div className="flex items-baseline justify-between">
                  <h4 className="text-2xl font-serif font-bold text-emerald-700">
                    {attendanceStats.completed}
                  </h4>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-[11px] text-emerald-700">Sessões realizadas com sucesso</p>
              </div>

              {/* Faltas / Não compareceu */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                  Faltas / Não Compareceu
                </span>
                <div className="flex items-baseline justify-between">
                  <h4 className="text-2xl font-serif font-bold text-amber-700">
                    {attendanceStats.noShow}
                  </h4>
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <p className="text-[11px] text-amber-700">Ausências sem aviso prévio</p>
              </div>

              {/* Cancelados */}
              <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/60 space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-rose-800">
                  Cancelados / Desmarcados
                </span>
                <div className="flex items-baseline justify-between">
                  <h4 className="text-2xl font-serif font-bold text-rose-700">
                    {attendanceStats.cancelled}
                  </h4>
                  <Calendar className="w-5 h-5 text-rose-600" />
                </div>
                <p className="text-[11px] text-rose-700">Remarcados ou cancelados</p>
              </div>

              {/* Agendados futuros no mês */}
              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                  Próximos no Mês
                </span>
                <div className="flex items-baseline justify-between">
                  <h4 className="text-2xl font-serif font-bold text-[#1E293B]">
                    {attendanceStats.scheduled}
                  </h4>
                  <Clock className="w-5 h-5 text-[#2F4858]" />
                </div>
                <p className="text-[11px] text-[#64748B]">Consultas a serem atendidas</p>
              </div>
            </div>
          </div>

          {/* Duas Colunas: Faturamento por Forma de Pagamento & Top Pacientes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Coluna 1: Faturamento por Forma de Pagamento */}
            <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#EAEFF2] text-[#2F4858] flex items-center justify-center">
                    <PieChart className="w-4 h-4 text-[#2F4858]" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#1E293B]">
                      Receitas por Forma de Pagamento
                    </h3>
                    <p className="text-xs text-[#64748B]">Distribuição percentual do mês</p>
                  </div>
                </div>
              </div>

              {revenueByMethod.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#64748B]">
                  Nenhum faturamento recebido neste mês até o momento.
                </div>
              ) : (
                <div className="space-y-4">
                  {revenueByMethod.map((item) => (
                    <div key={item.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="font-semibold text-[#1E293B] flex items-center gap-2">
                          <span>{item.label}</span>
                          <span className="text-xs text-[#64748B] font-normal">
                            ({item.count} atendimento{item.count === 1 ? '' : 's'})
                          </span>
                        </span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="font-bold text-[#1E293B]">
                            {formatCurrencyBRL(item.amount)}
                          </span>
                          <span className="text-xs text-[#64748B] w-9 text-right font-semibold">
                            {item.percentage}%
                          </span>
                        </div>
                      </div>

                      {/* Barra proporcional visual com paleta CLIAP */}
                      <div className="w-full bg-[#F1F5F9] rounded-full h-2.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500 bg-[#2F4858]"
                          style={{ width: `${Math.max(item.percentage, 4)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Coluna 2: Top Pacientes por Valor Pago no Mês */}
            <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#FAEDE7] text-[#C97B5A] flex items-center justify-center">
                    <Award className="w-4 h-4 text-[#C97B5A]" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#1E293B]">
                      Top Pacientes por Faturamento
                    </h3>
                    <p className="text-xs text-[#64748B]">Pacientes com maior volume no mês</p>
                  </div>
                </div>
              </div>

              {topPatientsThisMonth.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#64748B]">
                  Nenhum lançamento no período.
                </div>
              ) : (
                <div className="divide-y divide-[#E2E8F0]/70 max-h-80 overflow-y-auto">
                  {topPatientsThisMonth.map((p, idx) => (
                    <div key={p.id} className="py-3 flex items-center justify-between gap-3 group">
                      <div className="flex items-center gap-3">
                        <span className="w-5 text-xs font-mono font-bold text-[#64748B]">
                          #{idx + 1}
                        </span>
                        <PatientAvatar name={p.name} size="sm" />
                        <div>
                          <p className="text-sm font-semibold text-[#1E293B]">{p.name}</p>
                          <p className="text-xs text-[#64748B]">
                            {p.count} atendimento{p.count === 1 ? '' : 's'} quitado
                            {p.count === 1 ? '' : 's'}
                            {p.pendingAmount > 0 && (
                              <span className="text-amber-600 font-medium ml-1">
                                • {formatCurrencyBRL(p.pendingAmount)} pendente
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-bold text-sm text-[#1E293B]">
                          {formatCurrencyBRL(p.totalPaid)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Pagamento (Criar / Editar) */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false)
          setEditingPayment(null)
        }}
        onSuccess={() => loadAllData()}
        paymentToEdit={editingPayment}
        patientsList={patients}
      />

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={!!deletingPayment} onOpenChange={(open) => !open && setDeletingPayment(null)}>
        <DialogContent className="max-w-md rounded-2xl border-[#E2E8F0]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-[#1E293B]">
              Excluir lançamento financeiro?
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-[#64748B]">
              Esta ação removerá o registro de pagamento de{' '}
              <strong className="text-[#1E293B]">
                {formatCurrencyBRL(deletingPayment?.amount)}
              </strong>{' '}
              vinculado a{' '}
              <strong className="text-[#1E293B]">
                {deletingPayment?.expand?.patient?.full_name || 'Paciente'}
              </strong>
              . Não é possível desfazer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4 border-t border-[#E2E8F0] flex sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingPayment(null)}
              disabled={isDeleting}
              className="border-[#E2E8F0] rounded-xl text-xs sm:text-sm"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleDeletePayment}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs sm:text-sm font-medium"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Confirmar exclusão'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
