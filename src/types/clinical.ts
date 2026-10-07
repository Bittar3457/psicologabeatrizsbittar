import type { RecordModel } from 'pocketbase'

export type PatientStatus = 'active' | 'inactive' | 'waitlist'

export interface PatientRecord extends RecordModel {
  full_name: string
  birth_date?: string
  phone: string
  email?: string
  address?: string
  occupation?: string
  emergency_contact?: string
  emergency_phone?: string
  referred_by?: string
  status: PatientStatus
  notes?: string
  created: string
  updated: string
}

export type ConsultationType = 'presential' | 'online' | 'mixed'
export type ConsultationStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show'

export const CONSULTATION_TYPE_LABELS: Record<ConsultationType, string> = {
  presential: 'Presencial',
  online: 'Online',
  mixed: 'Mista',
}

export const CONSULTATION_TYPE_DESCRIPTIONS: Record<ConsultationType, string> = {
  presential: 'Presencial (Consultório)',
  online: 'Online (Teleconsulta)',
  mixed: 'Mista (Híbrido presencial/online)',
}

export interface SessionRecord extends RecordModel {
  patient: string
  date: string
  start_time: string
  duration_minutes: number
  type: ConsultationType
  status: ConsultationStatus
  notes?: string
  created: string
  updated: string
  expand?: {
    patient?: PatientRecord
  }
}

export interface AppointmentRecord extends RecordModel {
  patient: string
  date: string
  start_time: string
  duration_minutes: number
  type: ConsultationType
  status: ConsultationStatus
  notes?: string
  created: string
  updated: string
  expand?: {
    patient?: PatientRecord
  }
}

export type PaymentMethod =
  | 'pix'
  | 'cash'
  | 'credit_card'
  | 'debit_card'
  | 'bank_transfer'
  | 'other'
export type PaymentStatus = 'paid' | 'pending' | 'canceled'
export type BillingType = 'per_session' | 'monthly'

export const BILLING_TYPE_LABELS: Record<BillingType, string> = {
  per_session: 'Por consulta',
  monthly: 'Mensal',
}

export interface PaymentRecord extends RecordModel {
  patient: string
  appointment?: string
  session?: string
  date: string
  amount: number
  payment_method: PaymentMethod
  status: PaymentStatus
  description?: string
  appointment_type?: string
  billing_type?: BillingType
  reference_month?: string // Formato "YYYY-MM" (ex: "2025-03")
  created: string
  updated: string
  expand?: {
    patient?: PatientRecord
    appointment?: AppointmentRecord
    session?: SessionRecord
  }
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pix: 'PIX',
  cash: 'Dinheiro',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  bank_transfer: 'Transferência Bancária',
  other: 'Outro',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: 'Pago',
  pending: 'Pendente',
  canceled: 'Cancelado',
}

export interface ClinicalPreferences {
  workStart: string // e.g. "08:00"
  workEnd: string // e.g. "19:00"
  defaultDuration: number // 50
  defaultType: ConsultationType // "presential"
}

export const DEFAULT_PREFERENCES: ClinicalPreferences = {
  workStart: '08:00',
  workEnd: '19:00',
  defaultDuration: 50,
  defaultType: 'presential',
}

const PREFS_STORAGE_KEY = 'agenda_psicologa_preferences_v1'

export function getClinicalPreferences(): ClinicalPreferences {
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY)
    if (!raw) return DEFAULT_PREFERENCES
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_PREFERENCES
  }
}

export function saveClinicalPreferences(prefs: ClinicalPreferences): void {
  try {
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // ignore local storage errors
  }
}
