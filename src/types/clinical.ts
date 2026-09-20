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

export type ConsultationType = 'presential' | 'online'
export type ConsultationStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show'

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
