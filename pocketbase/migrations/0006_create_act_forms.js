migrate(
  (app) => {
    const patientsId = app.findCollectionByNameOrId('patients').id

    const actForms = new Collection({
      name: 'act_forms',
      type: 'base',
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
      fields: [
        {
          name: 'patient',
          type: 'relation',
          required: true,
          collectionId: patientsId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          // Data de aplicação do formulário (editável pelo usuário)
          name: 'applied_at',
          type: 'date',
          required: true,
        },
        // 1. Problema apresentado
        { name: 'client_problem', type: 'text' },
        { name: 'initial_goals', type: 'text' },
        { name: 'act_reformulation', type: 'text' },
        { name: 'assessment_measures', type: 'text' },
        // 2. Inflexibilidade: evitação e fusão
        { name: 'avoidance_fusion', type: 'text' },
        { name: 'strategy_internal', type: 'bool' },
        { name: 'strategy_external', type: 'bool' },
        { name: 'strategy_in_session', type: 'bool' },
        { name: 'internal_example', type: 'text' },
        { name: 'external_example', type: 'text' },
        { name: 'in_session_example', type: 'text' },
        {
          // Abrangência da evitação experiencial: 1 (Pouca) a 5 (Muita)
          name: 'experiential_avoidance',
          type: 'number',
          onlyInt: true,
          min: 1,
          max: 5,
        },
        { name: 'avoidance_analysis', type: 'text' },
        // 3. Inflexibilidade: insensibilidade ao momento presente
        { name: 'present_moment', type: 'text' },
        { name: 'present_moment_analysis', type: 'text' },
        // 4. Inflexibilidade: falta de engajamento
        { name: 'lack_engagement', type: 'text' },
        { name: 'lack_engagement_analysis', type: 'text' },
        // 5. Fatores que podem limitar a motivação
        { name: 'motivation_factors', type: 'text' },
        { name: 'motivation_impact', type: 'text' },
        // 6. Variáveis culturais, sociais, ambientais
        { name: 'context_variables', type: 'text' },
        // 7. Pontos fortes do cliente
        { name: 'client_strengths', type: 'text' },
        // 8. Plano de tratamento abrangente
        { name: 'treatment_plan', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_act_forms_patient ON act_forms (patient)',
        'CREATE INDEX idx_act_forms_applied_at ON act_forms (applied_at)',
      ],
    })
    app.save(actForms)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('act_forms')
    app.delete(collection)
  },
)
