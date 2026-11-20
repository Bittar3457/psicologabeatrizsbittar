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
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { actFormsService } from '@/services/actForms'
import type { ActFormRecord, ActFormData } from '@/types/clinical'
import { toast } from '@/hooks/use-toast'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'
import { Loader2, Info } from 'lucide-react'

interface ActFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  patientId: string
  recordToEdit?: ActFormRecord | null
}

type FormState = {
  applied_at: string
  client_problem: string
  initial_goals: string
  act_reformulation: string
  assessment_measures: string
  avoidance_fusion: string
  strategy_internal: boolean
  strategy_external: boolean
  strategy_in_session: boolean
  internal_example: string
  external_example: string
  in_session_example: string
  experiential_avoidance: number | null
  avoidance_analysis: string
  present_moment: string
  present_moment_analysis: string
  lack_engagement: string
  lack_engagement_analysis: string
  motivation_factors: string
  motivation_impact: string
  context_variables: string
  client_strengths: string
  treatment_plan: string
}

const EMPTY_STATE: FormState = {
  applied_at: new Date().toISOString().slice(0, 10),
  client_problem: '',
  initial_goals: '',
  act_reformulation: '',
  assessment_measures: '',
  avoidance_fusion: '',
  strategy_internal: false,
  strategy_external: false,
  strategy_in_session: false,
  internal_example: '',
  external_example: '',
  in_session_example: '',
  experiential_avoidance: null,
  avoidance_analysis: '',
  present_moment: '',
  present_moment_analysis: '',
  lack_engagement: '',
  lack_engagement_analysis: '',
  motivation_factors: '',
  motivation_impact: '',
  context_variables: '',
  client_strengths: '',
  treatment_plan: '',
}

const ANALYSIS_PROMPT =
  'O que esses padrões observados revelam sobre como contextualizar o tratamento para esse cliente? Quais métodos e intervenções devo usar? O que preciso fazer de maneira diferente para esse cliente?'

/** Rótulos dos checkboxes da seção 2, na redação do formulário impresso */
const AVOIDANCE_STRATEGIES: Array<{
  key: 'strategy_internal' | 'strategy_external' | 'strategy_in_session'
  exampleKey: 'internal_example' | 'external_example' | 'in_session_example'
  label: string
  exampleLabel: string
}> = [
  {
    key: 'strategy_internal',
    exampleKey: 'internal_example',
    label:
      'Estratégias internas de controle emocional (p. ex., distração, preocupação excessiva, entorpecimento)',
    exampleLabel: 'Exemplos de comportamento do cliente (estratégias internas)',
  },
  {
    key: 'strategy_external',
    exampleKey: 'external_example',
    label:
      'Estratégias externas de controle emocional (p. ex., usar drogas, autolesionar-se, situações evitadas)',
    exampleLabel: 'Exemplos de comportamento do cliente (estratégias externas)',
  },
  {
    key: 'strategy_in_session',
    exampleKey: 'in_session_example',
    label:
      'Padrões de evitação ou controle emocional em sessão (p. ex., mudança de assunto, risco de abandonar a terapia)',
    exampleLabel: 'Exemplos de comportamento do cliente (padrões em sessão)',
  },
]

export const ActFormModal: React.FC<ActFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  patientId,
  recordToEdit,
}) => {
  const [form, setForm] = useState<FormState>(EMPTY_STATE)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (recordToEdit) {
      setForm({
        applied_at: recordToEdit.applied_at ? recordToEdit.applied_at.slice(0, 10) : '',
        client_problem: recordToEdit.client_problem || '',
        initial_goals: recordToEdit.initial_goals || '',
        act_reformulation: recordToEdit.act_reformulation || '',
        assessment_measures: recordToEdit.assessment_measures || '',
        avoidance_fusion: recordToEdit.avoidance_fusion || '',
        strategy_internal: !!recordToEdit.strategy_internal,
        strategy_external: !!recordToEdit.strategy_external,
        strategy_in_session: !!recordToEdit.strategy_in_session,
        internal_example: recordToEdit.internal_example || '',
        external_example: recordToEdit.external_example || '',
        in_session_example: recordToEdit.in_session_example || '',
        experiential_avoidance: recordToEdit.experiential_avoidance ?? null,
        avoidance_analysis: recordToEdit.avoidance_analysis || '',
        present_moment: recordToEdit.present_moment || '',
        present_moment_analysis: recordToEdit.present_moment_analysis || '',
        lack_engagement: recordToEdit.lack_engagement || '',
        lack_engagement_analysis: recordToEdit.lack_engagement_analysis || '',
        motivation_factors: recordToEdit.motivation_factors || '',
        motivation_impact: recordToEdit.motivation_impact || '',
        context_variables: recordToEdit.context_variables || '',
        client_strengths: recordToEdit.client_strengths || '',
        treatment_plan: recordToEdit.treatment_plan || '',
      })
    } else {
      setForm({ ...EMPTY_STATE, applied_at: new Date().toISOString().slice(0, 10) })
    }
  }, [isOpen, recordToEdit])

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.applied_at) {
      toast({
        variant: 'destructive',
        title: 'Informe a data de aplicação do formulário.',
      })
      return
    }

    try {
      setIsSubmitting(true)
      const payload: ActFormData = {
        patient: patientId,
        applied_at: `${form.applied_at} 00:00:00.000Z`,
        client_problem: form.client_problem.trim(),
        initial_goals: form.initial_goals.trim(),
        act_reformulation: form.act_reformulation.trim(),
        assessment_measures: form.assessment_measures.trim(),
        avoidance_fusion: form.avoidance_fusion.trim(),
        strategy_internal: form.strategy_internal,
        strategy_external: form.strategy_external,
        strategy_in_session: form.strategy_in_session,
        internal_example: form.internal_example.trim(),
        external_example: form.external_example.trim(),
        in_session_example: form.in_session_example.trim(),
        experiential_avoidance: form.experiential_avoidance ?? 0,
        avoidance_analysis: form.avoidance_analysis.trim(),
        present_moment: form.present_moment.trim(),
        present_moment_analysis: form.present_moment_analysis.trim(),
        lack_engagement: form.lack_engagement.trim(),
        lack_engagement_analysis: form.lack_engagement_analysis.trim(),
        motivation_factors: form.motivation_factors.trim(),
        motivation_impact: form.motivation_impact.trim(),
        context_variables: form.context_variables.trim(),
        client_strengths: form.client_strengths.trim(),
        treatment_plan: form.treatment_plan.trim(),
      }

      if (recordToEdit) {
        await actFormsService.update(recordToEdit.id, payload)
        toast({
          title: 'Formulário ACT atualizado!',
          description: 'As alterações foram salvas no histórico do paciente.',
        })
      } else {
        await actFormsService.create(payload)
        toast({
          title: 'Formulário ACT salvo!',
          description: 'O formulário foi registrado no histórico do paciente.',
        })
      }

      onSuccess()
      onClose()
    } catch (err) {
      const fieldErrs = extractFieldErrors(err)
      const firstField = Object.keys(fieldErrs)[0]
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar o formulário ACT',
        description: firstField ? `${firstField}: ${fieldErrs[firstField]}` : getErrorMessage(err),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const sectionHeader = (num: number, title: React.ReactNode, hint?: string) => (
    <div className="space-y-1 border-b border-[#E2E8F0] pb-3">
      <h3 className="font-serif text-sm sm:text-base font-bold text-[#1E293B]">
        {num}. {title}
      </h3>
      {hint && <p className="text-xs text-[#64748B] leading-relaxed">{hint}</p>}
    </div>
  )

  const fieldLabel = (text: string) => (
    <Label className="text-xs font-semibold text-[#1E293B]">{text}</Label>
  )

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border-[#E2E8F0]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl sm:text-2xl text-[#1E293B]">
            {recordToEdit
              ? 'Editar Formulário ACT'
              : 'Formulário de Conceitualização de Caso em ACT'}
          </DialogTitle>
          <DialogDescription className="text-sm text-[#64748B]">
            {recordToEdit
              ? 'Revise e atualize as respostas deste formulário do histórico do paciente.'
              : 'Preencha as 8 seções do formulário. Tudo fica salvo no histórico do paciente.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* Data de aplicação */}
          <div className="space-y-1.5">
            <Label htmlFor="act_applied_at" className="text-xs font-semibold text-[#1E293B]">
              Data de aplicação *
            </Label>
            <Input
              id="act_applied_at"
              type="date"
              value={form.applied_at}
              onChange={(e) => setField('applied_at', e.target.value)}
              className="border-[#E2E8F0] max-w-[220px]"
              required
            />
          </div>

          {/* 1. Problema apresentado */}
          <div className="space-y-3">
            {sectionHeader(1, 'Problema apresentado nas próprias palavras do cliente')}
            <div className="space-y-1.5">
              {fieldLabel('Problema apresentado (nas próprias palavras do cliente)')}
              <Textarea
                rows={2}
                value={form.client_problem}
                onChange={(e) => setField('client_problem', e.target.value)}
                className="border-[#E2E8F0] text-sm"
              />
            </div>
            <div className="space-y-1.5">
              {fieldLabel('Objetivos iniciais do cliente (o que o cliente espera da terapia?)')}
              <Textarea
                rows={2}
                value={form.initial_goals}
                onChange={(e) => setField('initial_goals', e.target.value)}
                className="border-[#E2E8F0] text-sm"
              />
            </div>
            <div className="space-y-1.5">
              {fieldLabel('Reformulação ACT do problema apresentado')}
              <Textarea
                rows={2}
                value={form.act_reformulation}
                onChange={(e) => setField('act_reformulation', e.target.value)}
                className="border-[#E2E8F0] text-sm"
              />
            </div>
            <div className="space-y-1.5">
              {fieldLabel('Medidas de avaliação (incluindo os resultados e a interpretação)')}
              <Textarea
                rows={2}
                value={form.assessment_measures}
                onChange={(e) => setField('assessment_measures', e.target.value)}
                className="border-[#E2E8F0] text-sm"
              />
            </div>
          </div>

          {/* 2. Inflexibilidade: evitação e fusão */}
          <div className="space-y-3">
            {sectionHeader(
              2,
              'Inflexibilidade',
              'Avalie a rigidez devido a evitação e fusão relacionadas a experiências privadas. Que pensamentos, emoções, memórias e sensações o cliente está evitando? Com que histórias ou pensamentos o cliente está fusionado?',
            )}
            <div className="space-y-1.5">
              {fieldLabel(
                'Em quais comportamentos o cliente está se engajando para evitar ou fugir dessas experiências? Cheque os que se aplicam e dê exemplos de comportamento do cliente',
              )}
              <Textarea
                rows={2}
                value={form.avoidance_fusion}
                onChange={(e) => setField('avoidance_fusion', e.target.value)}
                className="border-[#E2E8F0] text-sm"
              />
            </div>

            {/* Checkboxes de estratégias */}
            <div className="space-y-3 pl-1">
              {AVOIDANCE_STRATEGIES.map((s) => (
                <div
                  key={s.key}
                  className="p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-2.5"
                >
                  <div className="flex items-start gap-2.5">
                    <Checkbox
                      id={`act_${s.key}`}
                      checked={form[s.key]}
                      onCheckedChange={(v) => setField(s.key, v === true)}
                      className="mt-0.5 border-[#9CA3AF] data-[state=checked]:bg-[#5F8D7A] data-[state=checked]:border-[#5F8D7A] data-[state=checked]:text-white"
                    />
                    <label
                      htmlFor={`act_${s.key}`}
                      className="text-xs text-[#1E293B] leading-relaxed cursor-pointer select-none"
                    >
                      {s.label}
                    </label>
                  </div>
                  {form[s.key] && (
                    <div className="space-y-1.5 pl-7">
                      {fieldLabel(s.exampleLabel)}
                      <Textarea
                        rows={2}
                        value={form[s.exampleKey]}
                        onChange={(e) => setField(s.exampleKey, e.target.value)}
                        className="border-[#E2E8F0] text-sm"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Escala 1–5 */}
            <div className="space-y-2">
              {fieldLabel('Abrangência da evitação experiencial')}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <span className="text-xs font-medium text-[#64748B]">Pouca</span>
                {[1, 2, 3, 4, 5].map((n) => (
                  <label
                    key={n}
                    className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-full border text-xs font-semibold cursor-pointer transition-colors',
                      form.experiential_avoidance === n
                        ? 'bg-[#5F8D7A] border-[#5F8D7A] text-white'
                        : 'bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#5F8D7A]/50 hover:text-[#5F8D7A]',
                    )}
                  >
                    <input
                      type="radio"
                      name="act_experiential_avoidance"
                      value={n}
                      checked={form.experiential_avoidance === n}
                      onChange={() => setField('experiential_avoidance', n)}
                      className="sr-only"
                    />
                    {n}
                  </label>
                ))}
                <span className="text-xs font-medium text-[#64748B]">Muita</span>
              </div>
            </div>

            <div className="space-y-1.5">
              {fieldLabel(ANALYSIS_PROMPT)}
              <Textarea
                rows={3}
                value={form.avoidance_analysis}
                onChange={(e) => setField('avoidance_analysis', e.target.value)}
                className="border-[#E2E8F0] text-sm"
              />
            </div>
          </div>

          {/* 3. Inflexibilidade: momento presente */}
          <div className="space-y-3">
            {sectionHeader(
              3,
              'Inflexibilidade',
              'Avalie a insensibilidade ao momento presente e a tomada de perspectiva limitada (p. ex., dominância do passado e do futuro conceitualizados, autoconhecimento limitado ou apego ao eu conceitualizado).',
            )}
            <div className="space-y-1.5">
              {fieldLabel('Descrição dos padrões observados')}
              <Textarea
                rows={2}
                value={form.present_moment}
                onChange={(e) => setField('present_moment', e.target.value)}
                className="border-[#E2E8F0] text-sm"
              />
            </div>
            <div className="space-y-1.5">
              {fieldLabel(ANALYSIS_PROMPT)}
              <Textarea
                rows={3}
                value={form.present_moment_analysis}
                onChange={(e) => setField('present_moment_analysis', e.target.value)}
                className="border-[#E2E8F0] text-sm"
              />
            </div>
          </div>

          {/* 4. Inflexibilidade: falta de engajamento */}
          <div className="space-y-3">
            {sectionHeader(
              4,
              'Inflexibilidade',
              'Avalie a falta de engajamento (p. ex., valores pouco claros ou ação comprometida limitada, refletida por inatividade, impulsividade ou persistência da evitação).',
            )}
            <div className="space-y-1.5">
              {fieldLabel('Descrição dos padrões observados')}
              <Textarea
                rows={2}
                value={form.lack_engagement}
                onChange={(e) => setField('lack_engagement', e.target.value)}
                className="border-[#E2E8F0] text-sm"
              />
            </div>
            <div className="space-y-1.5">
              {fieldLabel(ANALYSIS_PROMPT)}
              <Textarea
                rows={3}
                value={form.lack_engagement_analysis}
                onChange={(e) => setField('lack_engagement_analysis', e.target.value)}
                className="border-[#E2E8F0] text-sm"
              />
            </div>
          </div>

          {/* 5. Fatores que podem limitar a motivação */}
          <div className="space-y-3">
            {sectionHeader(
              5,
              'Fatores que podem limitar a motivação',
              '(p. ex., a experiência do cliente com o que não funciona, valores pouco claros ou problemas no relacionamento terapêutico)',
            )}
            <div className="space-y-1.5">
              {fieldLabel('Como esses fatores devem afetar o que eu faço no tratamento?')}
              <Textarea
                rows={3}
                value={form.motivation_impact}
                onChange={(e) => setField('motivation_impact', e.target.value)}
                className="border-[#E2E8F0] text-sm"
              />
            </div>
          </div>

          {/* 6. Variáveis culturais, sociais, ambientais */}
          <div className="space-y-3">
            {sectionHeader(
              6,
              'Variáveis culturais, sociais, ambientais e outras variáveis contextuais que podem influenciar o tratamento',
            )}
            <Textarea
              rows={3}
              value={form.context_variables}
              onChange={(e) => setField('context_variables', e.target.value)}
              className="border-[#E2E8F0] text-sm"
            />
          </div>

          {/* 7. Pontos fortes do cliente */}
          <div className="space-y-3">
            {sectionHeader(7, 'Pontos fortes do cliente e como podem ser usados no tratamento')}
            <Textarea
              rows={3}
              value={form.client_strengths}
              onChange={(e) => setField('client_strengths', e.target.value)}
              className="border-[#E2E8F0] text-sm"
            />
          </div>

          {/* 8. Plano de tratamento */}
          <div className="space-y-3">
            {sectionHeader(
              8,
              'Integre as informações de todas as seções anteriores para desenvolver um plano de tratamento abrangente',
            )}
            <Textarea
              rows={4}
              value={form.treatment_plan}
              onChange={(e) => setField('treatment_plan', e.target.value)}
              className="border-[#E2E8F0] text-sm"
            />
          </div>

          <Alert className="border-[#C7DBCF] bg-[#E8F0EC]/60">
            <Info className="w-4 h-4 text-[#5F8D7A]" />
            <AlertDescription className="text-xs text-[#1E293B]">
              Este formulário integra o prontuário do paciente e fica salvo no histórico para
              acompanhamento da evolução ao longo do tratamento.
            </AlertDescription>
          </Alert>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl border-[#E2E8F0] text-xs sm:text-sm"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#5F8D7A] hover:bg-[#4E7263] text-white text-xs sm:text-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Salvando...
                </>
              ) : recordToEdit ? (
                'Salvar alterações'
              ) : (
                'Salvar no histórico'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
