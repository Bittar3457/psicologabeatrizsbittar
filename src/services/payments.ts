import pb from '@/lib/pocketbase/client'
import type { PaymentRecord, PaymentMethod, PaymentStatus } from '@/types/clinical'

export interface PaymentFormData {
  patient: string
  appointment?: string
  session?: string
  date: string
  amount: number
  payment_method: PaymentMethod
  status: PaymentStatus
  description?: string
  appointment_type?: string
}

export const paymentsService = {
  async list(filter?: string, sort = '-date'): Promise<PaymentRecord[]> {
    return await pb.collection('payments').getFullList<PaymentRecord>({
      filter: filter || '',
      sort,
      expand: 'patient,appointment,session',
    })
  },

  async listByPatient(patientId: string): Promise<PaymentRecord[]> {
    return await pb.collection('payments').getFullList<PaymentRecord>({
      filter: `patient = "${patientId}"`,
      sort: '-date',
      expand: 'patient,appointment,session',
    })
  },

  async getById(id: string): Promise<PaymentRecord> {
    return await pb.collection('payments').getOne<PaymentRecord>(id, {
      expand: 'patient,appointment,session',
    })
  },

  async create(data: PaymentFormData): Promise<PaymentRecord> {
    return await pb.collection('payments').create<PaymentRecord>(data, {
      expand: 'patient,appointment,session',
    })
  },

  async update(id: string, data: Partial<PaymentFormData>): Promise<PaymentRecord> {
    return await pb.collection('payments').update<PaymentRecord>(id, data, {
      expand: 'patient,appointment,session',
    })
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('payments').delete(id)
  },
}
