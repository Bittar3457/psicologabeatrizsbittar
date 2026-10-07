import { format, parseISO, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function formatDatePtBr(dateStr?: string | null): string {
  if (!dateStr) return 'Não informada'
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr)
    if (!isValid(d)) return 'Data inválida'
    return format(d, 'dd/MM/yyyy', { locale: ptBR })
  } catch {
    return 'Data inválida'
  }
}

export function formatDateTimePtBr(dateStr?: string | null): string {
  if (!dateStr) return '-'
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr)
    if (!isValid(d)) return '-'
    return format(d, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  } catch {
    return '-'
  }
}

export function formatPhone(phone: string): string {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return phone
}

export function cleanPhoneForTel(phone: string): string {
  return phone.replace(/\D/g, '')
}

export function formatCurrencyBRL(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function parseCurrencyInput(value: string): number {
  const digits = value.replace(/\D/g, '')
  if (!digits) return 0
  return Number(digits) / 100
}

export function formatCurrencyDigits(cents: number): string {
  return cents.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Formata um mês de referência no formato "YYYY-MM" para exibição em pt-BR (ex: "Março de 2025")
 */
export function formatReferenceMonthPtBr(refMonth?: string | null): string {
  if (!refMonth) return ''
  const parts = refMonth.split('-')
  if (parts.length < 2) return refMonth
  const year = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10) - 1
  if (isNaN(year) || isNaN(month)) return refMonth
  const date = new Date(year, month, 1)
  const label = format(date, "MMMM 'de' yyyy", { locale: ptBR })
  return label.charAt(0).toUpperCase() + label.slice(1)
}
