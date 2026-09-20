migrate(
  (app) => {
    const patientsId = app.findCollectionByNameOrId('patients').id
    const appointmentsId = app.findCollectionByNameOrId('appointments').id
    const sessionsId = app.findCollectionByNameOrId('sessions').id

    // Check if payments collection already exists
    let payments
    try {
      payments = app.findCollectionByNameOrId('payments')
    } catch (_) {
      payments = new Collection({
        name: 'payments',
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
            name: 'appointment',
            type: 'relation',
            required: false,
            collectionId: appointmentsId,
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'session',
            type: 'relation',
            required: false,
            collectionId: sessionsId,
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'date',
            type: 'date',
            required: true,
          },
          {
            name: 'amount',
            type: 'number',
            required: true,
          },
          {
            name: 'payment_method',
            type: 'select',
            required: true,
            values: ['pix', 'cash', 'credit_card', 'debit_card', 'bank_transfer', 'other'],
            maxSelect: 1,
          },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['paid', 'pending', 'canceled'],
            maxSelect: 1,
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'appointment_type',
            type: 'text',
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_payments_patient ON payments (patient)',
          'CREATE INDEX idx_payments_date ON payments (date)',
          'CREATE INDEX idx_payments_status ON payments (status)',
        ],
      })
      app.save(payments)
    }

    // Seed some initial payments for realistic showcase if Mariana and Lucas exist
    try {
      const paymentsCol = app.findCollectionByNameOrId('payments')
      const count = app.countRecords('payments')
      if (count === 0) {
        const patientsCol = app.findCollectionByNameOrId('patients')
        let mariana
        let lucas
        try {
          mariana = app.findFirstRecordByData('patients', 'full_name', 'Mariana Alves Costa')
        } catch (_) {}
        try {
          lucas = app.findFirstRecordByData('patients', 'full_name', 'Lucas Gabriel Ferreira')
        } catch (_) {}

        const now = new Date()
        const pad = (n) => String(n).padStart(2, '0')
        const currentYear = now.getUTCFullYear()
        const currentMonth = pad(now.getUTCMonth() + 1)
        const date1 = `${currentYear}-${currentMonth}-05 10:00:00.000Z`
        const date2 = `${currentYear}-${currentMonth}-12 14:00:00.000Z`
        const date3 = `${currentYear}-${currentMonth}-19 09:00:00.000Z`

        if (mariana) {
          const p1 = new Record(paymentsCol)
          p1.set('patient', mariana.id)
          p1.set('date', date1)
          p1.set('amount', 250)
          p1.set('payment_method', 'pix')
          p1.set('status', 'paid')
          p1.set('description', 'Sessão individual de psicoterapia')
          p1.set('appointment_type', 'Sessão')
          app.save(p1)

          const p2 = new Record(paymentsCol)
          p2.set('patient', mariana.id)
          p2.set('date', date3)
          p2.set('amount', 250)
          p2.set('payment_method', 'pix')
          p2.set('status', 'paid')
          p2.set('description', 'Sessão individual de psicoterapia')
          p2.set('appointment_type', 'Sessão')
          app.save(p2)
        }

        if (lucas) {
          const p3 = new Record(paymentsCol)
          p3.set('patient', lucas.id)
          p3.set('date', date2)
          p3.set('amount', 280)
          p3.set('payment_method', 'credit_card')
          p3.set('status', 'paid')
          p3.set('description', 'Sessão online de psicoterapia')
          p3.set('appointment_type', 'Sessão')
          app.save(p3)

          const p4 = new Record(paymentsCol)
          p4.set('patient', lucas.id)
          p4.set('date', `${currentYear}-${currentMonth}-25 15:00:00.000Z`)
          p4.set('amount', 280)
          p4.set('payment_method', 'pix')
          p4.set('status', 'pending')
          p4.set('description', 'Atendimento clínico agendado')
          p4.set('appointment_type', 'Sessão')
          app.save(p4)
        }
      }
    } catch (_) {}
  },
  (app) => {
    try {
      const payments = app.findCollectionByNameOrId('payments')
      app.delete(payments)
    } catch (_) {}
  },
)
