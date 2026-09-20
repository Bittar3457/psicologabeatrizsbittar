migrate(
  (app) => {
    // 1. Initial admin user (Beatriz / Roberto)
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    let userRecord
    try {
      userRecord = app.findAuthRecordByEmail('_pb_users_auth_', 'robertobittar98@gmail.com')
    } catch (_) {
      userRecord = new Record(users)
      userRecord.setEmail('robertobittar98@gmail.com')
      userRecord.setPassword('Skip@Pass')
      userRecord.setVerified(true)
      userRecord.set('name', 'Beatriz Souza Bittar')
      app.save(userRecord)
    }

    // 2. Sample patients
    const patientsCol = app.findCollectionByNameOrId('patients')
    const sessionsCol = app.findCollectionByNameOrId('sessions')
    const appointmentsCol = app.findCollectionByNameOrId('appointments')

    const samplePatients = [
      {
        full_name: 'Mariana Alves Costa',
        birth_date: '1992-04-15 00:00:00.000Z',
        phone: '(11) 98765-4321',
        email: 'mariana.costa@exemplo.com.br',
        address: 'Rua Oscar Freire, 1420 - Pinheiros, São Paulo/SP',
        occupation: 'Arquiteta e Urbanista',
        emergency_contact: 'Carlos Costa (Esposo)',
        emergency_phone: '(11) 98111-2233',
        referred_by: 'Dra. Helena Queiroz (Psiquiatra)',
        status: 'active',
        notes:
          'Queixa principal de ansiedade generalizada e sobrecarga de trabalho. Iniciou terapia em janeiro. Apresenta boa aliança terapêutica e evolução com técnicas de regulação emocional.',
      },
      {
        full_name: 'Lucas Gabriel Ferreira',
        birth_date: '1988-11-23 00:00:00.000Z',
        phone: '(11) 97654-3210',
        email: 'lucas.ferreira@exemplo.com.br',
        address: 'Av. Paulista, 900, Apto 82 - Bela Vista, São Paulo/SP',
        occupation: 'Engenheiro de Software',
        emergency_contact: 'Renata Ferreira (Irmã)',
        emergency_phone: '(11) 97222-3344',
        referred_by: 'Busca espontânea / Indicação de paciente',
        status: 'active',
        notes:
          'Demanda de transição de carreira, autocrítica severa e dificuldade de impor limites no ambiente profissional. Trabalhando reestruturação cognitiva e assertividade.',
      },
      {
        full_name: 'Camila Rodrigues Silva',
        birth_date: '2001-07-09 00:00:00.000Z',
        phone: '(11) 96543-2109',
        email: 'camila.silva@exemplo.com.br',
        address: 'Rua Pamplona, 540 - Jardim Paulista, São Paulo/SP',
        occupation: 'Estudante de Medicina',
        emergency_contact: 'Sônia Rodrigues (Mãe)',
        emergency_phone: '(11) 96333-4455',
        referred_by: 'Prof. Arthur Mendes',
        status: 'waitlist',
        notes:
          'Solicitou atendimento para quintas-feiras no período da tarde ou noturno. Relatou sintomas de estresse acadêmico e insônia. Aguardando abertura de vaga compatível.',
      },
      {
        full_name: 'Rodrigo Mendes Antunes',
        birth_date: '1979-02-18 00:00:00.000Z',
        phone: '(11) 95432-1098',
        email: 'rodrigo.antunes@exemplo.com.br',
        address: 'Rua Bela Cintra, 1800 - Consolação, São Paulo/SP',
        occupation: 'Diretor Comercial',
        emergency_contact: 'Patrícia Antunes (Esposa)',
        emergency_phone: '(11) 95444-5566',
        referred_by: 'Dr. Marcelo Santos',
        status: 'inactive',
        notes:
          'Alta clínica acordada em comum acordo após 18 meses de processo psicoterápico focado em luto e reorganização pessoal. Paciente orientado que a porta permanece aberta caso sinta necessidade de sessões de manutenção.',
      },
    ]

    const createdPatientMap = {}

    for (let i = 0; i < samplePatients.length; i++) {
      const pData = samplePatients[i]
      let record
      try {
        record = app.findFirstRecordByData('patients', 'phone', pData.phone)
      } catch (_) {
        record = new Record(patientsCol)
        record.set('full_name', pData.full_name)
        record.set('birth_date', pData.birth_date)
        record.set('phone', pData.phone)
        record.set('email', pData.email)
        record.set('address', pData.address)
        record.set('occupation', pData.occupation)
        record.set('emergency_contact', pData.emergency_contact)
        record.set('emergency_phone', pData.emergency_phone)
        record.set('referred_by', pData.referred_by)
        record.set('status', pData.status)
        record.set('notes', pData.notes)
        app.save(record)
      }
      createdPatientMap[pData.full_name] = record.id
    }

    // Current date helpers for realistic seeding
    const now = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    const todayStr = `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())} 00:00:00.000Z`

    const yesterday = new Date(now.getTime() - 24 * 3600 * 1000)
    const yesterdayStr = `${yesterday.getUTCFullYear()}-${pad(yesterday.getUTCMonth() + 1)}-${pad(yesterday.getUTCDate())} 00:00:00.000Z`

    const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000)
    const tomorrowStr = `${tomorrow.getUTCFullYear()}-${pad(tomorrow.getUTCMonth() + 1)}-${pad(tomorrow.getUTCDate())} 00:00:00.000Z`

    const marianaId = createdPatientMap['Mariana Alves Costa']
    const lucasId = createdPatientMap['Lucas Gabriel Ferreira']

    // 3. Sample sessions (past records)
    if (marianaId) {
      try {
        app.findFirstRecordByData('sessions', 'patient', marianaId)
      } catch (_) {
        const s1 = new Record(sessionsCol)
        s1.set('patient', marianaId)
        s1.set('date', yesterdayStr)
        s1.set('start_time', '09:00')
        s1.set('duration_minutes', 50)
        s1.set('type', 'presential')
        s1.set('status', 'completed')
        s1.set(
          'notes',
          'Sessão focada na identificação de gatilhos ansiogênicos durante reuniões de equipe. Paciente relatou melhora na qualidade do sono após implementação da rotina de desaceleração noturna combinada no último encontro.',
        )
        app.save(s1)
      }
    }

    if (lucasId) {
      try {
        app.findFirstRecordByData('sessions', 'patient', lucasId)
      } catch (_) {
        const s2 = new Record(sessionsCol)
        s2.set('patient', lucasId)
        s2.set('date', yesterdayStr)
        s2.set('start_time', '15:00')
        s2.set('duration_minutes', 50)
        s2.set('type', 'online')
        s2.set('status', 'completed')
        s2.set(
          'notes',
          'Discussão sobre a proposta de promoção profissional recebida. Trabalhamos os medos associados à síndrome do impostor e estruturamos um plano de ação para a conversa com a diretoria.',
        )
        app.save(s2)
      }
    }

    // 4. Sample appointments (today and upcoming)
    if (marianaId) {
      try {
        app.findFirstRecordByData('appointments', 'patient', marianaId)
      } catch (_) {
        const a1 = new Record(appointmentsCol)
        a1.set('patient', marianaId)
        a1.set('date', todayStr)
        a1.set('start_time', '10:00')
        a1.set('duration_minutes', 50)
        a1.set('type', 'presential')
        a1.set('status', 'scheduled')
        a1.set('notes', 'Sessão semanal de acompanhamento clínico presencial no consultório.')
        app.save(a1)
      }
    }

    if (lucasId) {
      try {
        app.findFirstRecordByData('appointments', 'patient', lucasId)
      } catch (_) {
        const a2 = new Record(appointmentsCol)
        a2.set('patient', lucasId)
        a2.set('date', todayStr)
        a2.set('start_time', '14:00')
        a2.set('duration_minutes', 50)
        a2.set('type', 'online')
        a2.set('status', 'scheduled')
        a2.set('notes', 'Atendimento online via link seguro de teleconsulta.')
        app.save(a2)

        const a3 = new Record(appointmentsCol)
        a3.set('patient', lucasId)
        a3.set('date', tomorrowStr)
        a3.set('start_time', '16:00')
        a3.set('duration_minutes', 50)
        a3.set('type', 'online')
        a3.set('status', 'scheduled')
        a3.set('notes', 'Sessão extra de suporte antes da apresentação do projeto.')
        app.save(a3)
      }
    }
  },
  (app) => {
    // down logic is optional/safe
  },
)
