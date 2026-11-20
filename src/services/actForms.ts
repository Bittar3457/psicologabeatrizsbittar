import pb from '@/lib/pocketbase/client'
import type { ActFormRecord, ActFormData } from '@/types/clinical'

export const actFormsService = {
  async listByPatient(patientId: string): Promise<ActFormRecord[]> {
    return await pb.collection('act_forms').getFullList<ActFormRecord>({
      filter: `patient = "${patientId}"`,
      sort: '-applied_at,-created',
    })
  },

  async getById(id: string): Promise<ActFormRecord> {
    return await pb.collection('act_forms').getOne<ActFormRecord>(id)
  },

  async create(data: ActFormData): Promise<ActFormRecord> {
    return await pb.collection('act_forms').create<ActFormRecord>(data)
  },

  async update(id: string, data: Partial<ActFormData>): Promise<ActFormRecord> {
    return await pb.collection('act_forms').update<ActFormRecord>(id, data)
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('act_forms').delete(id)
  },
}
