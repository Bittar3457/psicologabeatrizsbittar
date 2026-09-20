migrate(
  (app) => {
    // 1. patients collection
    const patients = new Collection({
      name: 'patients',
      type: 'base',
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
      fields: [
        { name: 'full_name', type: 'text', required: true },
        { name: 'birth_date', type: 'date' },
        { name: 'phone', type: 'text', required: true },
        { name: 'email', type: 'email' },
        { name: 'address', type: 'text' },
        { name: 'occupation', type: 'text' },
        { name: 'emergency_contact', type: 'text' },
        { name: 'emergency_phone', type: 'text' },
        { name: 'referred_by', type: 'text' },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['active', 'inactive', 'waitlist'],
          maxSelect: 1,
        },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_patients_status ON patients (status)'],
    })
    app.save(patients)

    const patientsId = app.findCollectionByNameOrId('patients').id

    // 2. sessions collection
    const sessions = new Collection({
      name: 'sessions',
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
        { name: 'date', type: 'date', required: true },
        { name: 'start_time', type: 'text', required: true },
        { name: 'duration_minutes', type: 'number' },
        {
          name: 'type',
          type: 'select',
          required: true,
          values: ['presential', 'online'],
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['scheduled', 'completed', 'cancelled', 'no_show'],
          maxSelect: 1,
        },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_sessions_patient ON sessions (patient)',
        'CREATE INDEX idx_sessions_date ON sessions (date)',
        'CREATE INDEX idx_sessions_status ON sessions (status)',
      ],
    })
    app.save(sessions)

    // 3. appointments collection
    const appointments = new Collection({
      name: 'appointments',
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
        { name: 'date', type: 'date', required: true },
        { name: 'start_time', type: 'text', required: true },
        { name: 'duration_minutes', type: 'number' },
        {
          name: 'type',
          type: 'select',
          required: true,
          values: ['presential', 'online'],
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['scheduled', 'completed', 'cancelled', 'no_show'],
          maxSelect: 1,
        },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_appointments_patient ON appointments (patient)',
        'CREATE INDEX idx_appointments_date ON appointments (date)',
        'CREATE INDEX idx_appointments_status ON appointments (status)',
      ],
    })
    app.save(appointments)
  },
  (app) => {
    try {
      const appointments = app.findCollectionByNameOrId('appointments')
      app.delete(appointments)
    } catch (_) {}

    try {
      const sessions = app.findCollectionByNameOrId('sessions')
      app.delete(sessions)
    } catch (_) {}

    try {
      const patients = app.findCollectionByNameOrId('patients')
      app.delete(patients)
    } catch (_) {}
  },
)
