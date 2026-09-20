import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { patientsService, PatientFormData } from '@/services/patients'
import { PatientRecord, PatientStatus } from '@/types/clinical'
import { toast } from '@/hooks/use-toast'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'
import { Loader2 } from 'lucide-react'

interface PatientModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (patient: PatientRecord) => void
  patientToEdit?: PatientRecord | null
}

const initialForm: PatientFormData = {
  full_name: '',
  birth_date: '',
  phone: '',
  email: '',
  address: '',
  occupation: '',
  emergency_contact: '',
  emergency_phone: '',
  referred_by: '',
  status: 'active',
  notes: '',
}

export const PatientModal: React.FC<PatientModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  patientToEdit,
}) => {
  const [formData, setFormData] = useState<PatientFormData>(initialForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (patientToEdit) {
      setFormData({
        full_name: patientToEdit.full_name || '',
        birth_date: patientToEdit.birth_date ? patientToEdit.birth_date.slice(0, 10) : '',
        phone: patientToEdit.phone || '',
        email: patientToEdit.email || '',
        address: patientToEdit.address || '',
        occupation: patientToEdit.occupation || '',
        emergency_contact: patientToEdit.emergency_contact || '',
        emergency_phone: patientToEdit.emergency_phone || '',
        referred_by: patientToEdit.referred_by || '',
        status: patientToEdit.status || 'active',
        notes: patientToEdit.notes || '',
      })
    } else {
      setFormData(initialForm)
    }
    setErrors({})
  }, [patientToEdit, isOpen])

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!formData.full_name.trim()) {
      errs.full_name = 'O nome completo do paciente é obrigatório.'
    }
    if (!formData.phone.trim()) {
      errs.phone = 'O telefone de contato é obrigatório.'
    }
    if (formData.email && !formData.email.includes('@')) {
      errs.email = 'Informe um endereço de e-mail válido.'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      setIsSubmitting(true)

      const payload: PatientFormData = {
        ...formData,
        birth_date: formData.birth_date ? `${formData.birth_date} 00:00:00.000Z` : undefined,
      }

      let saved: PatientRecord
      if (patientToEdit) {
        saved = await patientsService.update(patientToEdit.id, payload)
        toast({
          title: 'Paciente atualizado!',
          description: `Os dados de ${saved.full_name} foram salvos com sucesso.`,
        })
      } else {
        saved = await patientsService.create(payload)
        toast({
          title: 'Paciente cadastrado!',
          description: `${saved.full_name} foi adicionado(a) ao prontuário clínico.`,
        })
      }
      onSuccess(saved)
      onClose()
    } catch (err) {
      const fieldErrs = extractFieldErrors(err)
      if (Object.keys(fieldErrs).length > 0) {
        setErrors(fieldErrs)
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao salvar paciente',
          description: getErrorMessage(err),
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border-[#E2E8F0]">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-[#1E293B]">
            {patientToEdit ? 'Editar Dados do Paciente' : 'Novo Paciente'}
          </DialogTitle>
          <DialogDescription className="text-sm text-[#64748B]">
            {patientToEdit
              ? 'Atualize as informações de contato e prontuário do paciente.'
              : 'Preencha a ficha cadastral do novo paciente para a prática clínica.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Nome e Nascimento */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="full_name" className="text-xs font-semibold text-[#1E293B]">
                Nome completo *
              </Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Ex: Mariana Alves Costa"
                className={`border-[#E2E8F0] ${errors.full_name ? 'border-red-500' : ''}`}
              />
              {errors.full_name && <p className="text-xs text-red-500">{errors.full_name}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="birth_date" className="text-xs font-semibold text-[#1E293B]">
                Data de nascimento
              </Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                className="border-[#E2E8F0]"
              />
            </div>
          </div>

          {/* Telefone e E-mail */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-semibold text-[#1E293B]">
                Telefone / WhatsApp *
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 98765-4321"
                className={`border-[#E2E8F0] ${errors.phone ? 'border-red-500' : ''}`}
              />
              {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-[#1E293B]">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="paciente@exemplo.com.br"
                className={`border-[#E2E8F0] ${errors.email ? 'border-red-500' : ''}`}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>
          </div>

          {/* Endereço e Profissão */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-xs font-semibold text-[#1E293B]">
                Endereço residencial / Cidade
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Rua, número, bairro e cidade"
                className="border-[#E2E8F0]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="occupation" className="text-xs font-semibold text-[#1E293B]">
                Profissão / Ocupação
              </Label>
              <Input
                id="occupation"
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                placeholder="Ex: Arquiteta, Estudante..."
                className="border-[#E2E8F0]"
              />
            </div>
          </div>

          {/* Contato de emergência */}
          <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-3">
            <p className="text-xs font-semibold text-[#1E293B] uppercase tracking-wider">
              Contato de Emergência
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="emergency_contact" className="text-xs text-[#64748B]">
                  Nome do contato e parentesco
                </Label>
                <Input
                  id="emergency_contact"
                  value={formData.emergency_contact}
                  onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                  placeholder="Ex: Carlos Costa (Esposo)"
                  className="bg-white border-[#E2E8F0]"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="emergency_phone" className="text-xs text-[#64748B]">
                  Telefone de emergência
                </Label>
                <Input
                  id="emergency_phone"
                  value={formData.emergency_phone}
                  onChange={(e) => setFormData({ ...formData, emergency_phone: e.target.value })}
                  placeholder="(11) 98111-2233"
                  className="bg-white border-[#E2E8F0]"
                />
              </div>
            </div>
          </div>

          {/* Indicação e Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="referred_by" className="text-xs font-semibold text-[#1E293B]">
                Indicado por
              </Label>
              <Input
                id="referred_by"
                value={formData.referred_by}
                onChange={(e) => setFormData({ ...formData, referred_by: e.target.value })}
                placeholder="Ex: Dra. Helena Queiroz, Busca espontânea..."
                className="border-[#E2E8F0]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-xs font-semibold text-[#1E293B]">
                Status do paciente
              </Label>
              <Select
                value={formData.status}
                onValueChange={(val: PatientStatus) => setFormData({ ...formData, status: val })}
              >
                <SelectTrigger className="border-[#E2E8F0]">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo (em acompanhamento)</SelectItem>
                  <SelectItem value="waitlist">Lista de espera</SelectItem>
                  <SelectItem value="inactive">Inativo (alta ou pausa)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Anotações gerais */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs font-semibold text-[#1E293B]">
              Observações iniciais e queixa principal
            </Label>
            <Textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Anotações confidenciais sobre a demanda inicial do paciente, histórico relevante, etc."
              className="border-[#E2E8F0] resize-none"
            />
          </div>

          <DialogFooter className="pt-4 border-t border-[#E2E8F0] flex sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="border-[#E2E8F0]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#5F8D7A] hover:bg-[#4E7263] text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : patientToEdit ? (
                'Salvar alterações'
              ) : (
                'Cadastrar paciente'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
