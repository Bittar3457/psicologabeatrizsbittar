import type { ActFormRecord } from '@/types/clinical'

/**
 * Campos de texto do Formulário de Conceitualização de Caso em ACT, agrupados
 * por seção (1 a 8). Usado para resumos e contagem de seções preenchidas.
 */
export const ACT_SECTION_FIELDS: Array<Array<{ key: keyof ActFormRecord; label: string }>> = [
  // 1. Problema apresentado
  [
    { key: 'client_problem', label: 'Problema apresentado' },
    { key: 'initial_goals', label: 'Objetivos iniciais' },
    { key: 'act_reformulation', label: 'Reformulação ACT' },
    { key: 'assessment_measures', label: 'Medidas de avaliação' },
  ],
  // 2. Inflexibilidade: evitação e fusão
  [
    { key: 'avoidance_fusion', label: 'Comportamentos de evitação/fusão' },
    { key: 'avoidance_analysis', label: 'Análise do tratamento' },
  ],
  // 3. Inflexibilidade: momento presente
  [
    { key: 'present_moment', label: 'Momento presente / perspectiva' },
    { key: 'present_moment_analysis', label: 'Análise do tratamento' },
  ],
  // 4. Inflexibilidade: falta de engajamento
  [
    { key: 'lack_engagement', label: 'Falta de engajamento' },
    { key: 'lack_engagement_analysis', label: 'Análise do tratamento' },
  ],
  // 5. Fatores que limitam a motivação
  [
    { key: 'motivation_factors', label: 'Fatores que limitam a motivação' },
    { key: 'motivation_impact', label: 'Impacto no tratamento' },
  ],
  // 6. Variáveis contextuais
  [{ key: 'context_variables', label: 'Variáveis contextuais' }],
  // 7. Pontos fortes
  [{ key: 'client_strengths', label: 'Pontos fortes' }],
  // 8. Plano de tratamento
  [{ key: 'treatment_plan', label: 'Plano de tratamento' }],
]
