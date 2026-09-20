migrate(
  (app) => {
    // 1. Atualizar campo 'type' na coleção sessions para incluir 'mixed'
    const sessions = app.findCollectionByNameOrId('sessions')
    const sessionsTypeField = sessions.fields.getByName('type')
    if (sessionsTypeField) {
      sessionsTypeField.values = ['presential', 'online', 'mixed']
      sessionsTypeField.maxSelect = 1
      app.save(sessions)
    }

    // 2. Atualizar campo 'type' na coleção appointments para incluir 'mixed'
    const appointments = app.findCollectionByNameOrId('appointments')
    const apptsTypeField = appointments.fields.getByName('type')
    if (apptsTypeField) {
      apptsTypeField.values = ['presential', 'online', 'mixed']
      apptsTypeField.maxSelect = 1
      app.save(appointments)
    }
  },
  (app) => {
    try {
      const sessions = app.findCollectionByNameOrId('sessions')
      const sessionsTypeField = sessions.fields.getByName('type')
      if (sessionsTypeField) {
        sessionsTypeField.values = ['presential', 'online']
        sessionsTypeField.maxSelect = 1
        app.save(sessions)
      }
    } catch (_) {}

    try {
      const appointments = app.findCollectionByNameOrId('appointments')
      const apptsTypeField = appointments.fields.getByName('type')
      if (apptsTypeField) {
        apptsTypeField.values = ['presential', 'online']
        apptsTypeField.maxSelect = 1
        app.save(appointments)
      }
    } catch (_) {}
  },
)
