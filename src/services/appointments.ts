import pb from '@/lib/pocketbase/client'
import type { AppointmentRecord, ConsultationType, ConsultationStatus } from '@/types/clinical'

export interface AppointmentFormData {
  patient: string
  date: string
  start_time: string
  duration_minutes: number
  type: ConsultationType
  status: ConsultationStatus
  notes?: string
}

export const appointmentsService = {
  async list(filter?: string, sort = 'date,start_time'): Promise<AppointmentRecord[]> {
    return await pb.collection('appointments').getFullList<AppointmentRecord>({
      filter: filter || '',
      sort,
      expand: 'patient',
    })
  },

  async listByPatient(patientId: string): Promise<AppointmentRecord[]> {
    return await pb.collection('appointments').getFullList<AppointmentRecord>({
      filter: `patient = "${patientId}"`,
      sort: 'date,start_time',
      expand: 'patient',
    })
  },

  async getById(id: string): Promise<AppointmentRecord> {
    return await pb.collection('appointments').getOne<AppointmentRecord>(id, {
      expand: 'patient',
    })
  },

  async create(data: AppointmentFormData): Promise<AppointmentRecord> {
    return await pb.collection('appointments').create<AppointmentRecord>(data, {
      expand: 'patient',
    })
  },

  async update(id: string, data: Partial<AppointmentFormData>): Promise<AppointmentRecord> {
    return await pb.collection('appointments').update<AppointmentRecord>(id, data, {
      expand: 'patient',
    })
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('appointments').delete(id)
  },
}
