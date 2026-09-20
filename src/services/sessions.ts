import pb from '@/lib/pocketbase/client'
import type { SessionRecord, ConsultationType, ConsultationStatus } from '@/types/clinical'

export interface SessionFormData {
  patient: string
  date: string
  start_time: string
  duration_minutes: number
  type: ConsultationType
  status: ConsultationStatus
  notes?: string
}

export const sessionsService = {
  async list(filter?: string, sort = '-date,-start_time'): Promise<SessionRecord[]> {
    return await pb.collection('sessions').getFullList<SessionRecord>({
      filter: filter || '',
      sort,
      expand: 'patient',
    })
  },

  async listByPatient(patientId: string): Promise<SessionRecord[]> {
    return await pb.collection('sessions').getFullList<SessionRecord>({
      filter: `patient = "${patientId}"`,
      sort: '-date,-start_time',
      expand: 'patient',
    })
  },

  async getById(id: string): Promise<SessionRecord> {
    return await pb.collection('sessions').getOne<SessionRecord>(id, {
      expand: 'patient',
    })
  },

  async create(data: SessionFormData): Promise<SessionRecord> {
    return await pb.collection('sessions').create<SessionRecord>(data, {
      expand: 'patient',
    })
  },

  async update(id: string, data: Partial<SessionFormData>): Promise<SessionRecord> {
    return await pb.collection('sessions').update<SessionRecord>(id, data, {
      expand: 'patient',
    })
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('sessions').delete(id)
  },
}
