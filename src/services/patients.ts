import pb from '@/lib/pocketbase/client'
import type { PatientRecord, PatientStatus } from '@/types/clinical'

export interface PatientFormData {
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
}

export const patientsService = {
  async list(filter?: string, sort = 'full_name'): Promise<PatientRecord[]> {
    return await pb.collection('patients').getFullList<PatientRecord>({
      filter: filter || '',
      sort,
    })
  },

  async getById(id: string): Promise<PatientRecord> {
    return await pb.collection('patients').getOne<PatientRecord>(id)
  },

  async create(data: PatientFormData): Promise<PatientRecord> {
    return await pb.collection('patients').create<PatientRecord>(data)
  },

  async update(id: string, data: Partial<PatientFormData>): Promise<PatientRecord> {
    return await pb.collection('patients').update<PatientRecord>(id, data)
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('patients').delete(id)
  },
}
