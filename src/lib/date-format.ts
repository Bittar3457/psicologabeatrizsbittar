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
