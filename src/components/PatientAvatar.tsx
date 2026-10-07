import React from 'react'

const PALETTE = [
  // Sálvia acolhedor suave
  { bg: 'bg-[#E8F0EC]', text: 'text-[#3D594D]', border: 'border-[#C7DBCF]' },
  // Terracota acolhedor suave
  { bg: 'bg-[#FAEDE7]', text: 'text-[#B46647]', border: 'border-[#F1D0C5]' },
  // Sálvia mais presente
  { bg: 'bg-[#D5E5DC]', text: 'text-[#2D453B]', border: 'border-[#A3C4B3]' },
  // Terracota quente
  { bg: 'bg-[#FBE4DA]', text: 'text-[#964E33]', border: 'border-[#E7B8A7]' },
  // Âmbar suave
  { bg: 'bg-amber-50', text: 'text-amber-900', border: 'border-amber-200' },
  // Esmeralda suave
  { bg: 'bg-emerald-50', text: 'text-emerald-900', border: 'border-emerald-200' },
]

export function getInitials(name: string): string {
  if (!name) return '?'
  const clean = name.trim().split(/\s+/).filter(Boolean)
  if (clean.length === 0) return '?'
  if (clean.length === 1) return clean[0].slice(0, 2).toUpperCase()
  return (clean[0][0] + clean[clean.length - 1][0]).toUpperCase()
}

export function getAvatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % PALETTE.length
  return PALETTE[index]
}

interface PatientAvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export const PatientAvatar: React.FC<PatientAvatarProps> = ({
  name,
  size = 'md',
  className = '',
}) => {
  const color = getAvatarColor(name)
  const initials = getInitials(name)

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs font-semibold',
    md: 'w-10 h-10 text-sm font-semibold',
    lg: 'w-14 h-14 text-lg font-bold',
    xl: 'w-20 h-20 text-2xl font-bold font-serif',
  }

  return (
    <div
      className={`rounded-2xl flex items-center justify-center shrink-0 border select-none transition-transform ${sizeClasses[size]} ${color.bg} ${color.text} ${color.border} ${className}`}
      aria-label={`Avatar de ${name}`}
    >
      {initials}
    </div>
  )
}

export const BillingTypeBadge: React.FC<{
  billingType?: 'per_session' | 'monthly' | string | null
  referenceMonth?: string | null
  className?: string
}> = ({ billingType = 'per_session', referenceMonth, className = '' }) => {
  const isMonthly = billingType === 'monthly'

  if (isMonthly) {
    let monthLabel = ''
    if (referenceMonth) {
      const parts = referenceMonth.split('-')
      if (parts.length >= 2) {
        const months = [
          'Jan',
          'Fev',
          'Mar',
          'Abr',
          'Mai',
          'Jun',
          'Jul',
          'Ago',
          'Set',
          'Out',
          'Nov',
          'Dez',
        ]
        const mIdx = parseInt(parts[1], 10) - 1
        if (mIdx >= 0 && mIdx < 12) {
          monthLabel = ` (${months[mIdx]}/${parts[0]})`
        }
      }
    }
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-[#FAEDE7] text-[#C97B5A] border border-[#F1D0C5] ${className}`}
        title={`Mensalidade referente a ${referenceMonth || 'mês informado'}`}
      >
        <span>Mensal</span>
        {monthLabel && <span className="font-normal opacity-90">{monthLabel}</span>}
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-[#F8FAFC] text-[#5F8D7A] border border-[#E2E8F0] ${className}`}
    >
      Sessão
    </span>
  )
}

export const PaymentStatusBadge: React.FC<{
  status: 'paid' | 'pending' | 'canceled'
  className?: string
}> = ({ status, className = '' }) => {
  const map: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    // Pago: Verde-esmeralda para sucesso
    paid: {
      label: 'Pago',
      bg: 'bg-emerald-50',
      text: 'text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-600',
    },
    // Pendente: Âmbar para atenção
    pending: {
      label: 'Pendente',
      bg: 'bg-amber-50',
      text: 'text-amber-900 border-amber-200',
      dot: 'bg-amber-500',
    },
    // Cancelado: Neutro
    canceled: {
      label: 'Cancelado',
      bg: 'bg-slate-100',
      text: 'text-slate-700 border-slate-200',
      dot: 'bg-slate-400',
    },
  }

  const conf = map[status] || {
    label: status,
    bg: 'bg-slate-100',
    text: 'text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${conf.bg} ${conf.text} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
      {conf.label}
    </span>
  )
}

export const StatusBadge: React.FC<{
  status: 'active' | 'inactive' | 'waitlist' | 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  className?: string
}> = ({ status, className = '' }) => {
  const map: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    // Sucesso: Verde-esmeralda
    active: {
      label: 'Ativo',
      bg: 'bg-emerald-50',
      text: 'text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-600',
    },
    // Neutro / Inativo: Slate
    inactive: {
      label: 'Inativo',
      bg: 'bg-slate-100',
      text: 'text-slate-700 border-slate-200',
      dot: 'bg-slate-400',
    },
    // Atenção: Âmbar
    waitlist: {
      label: 'Lista de espera',
      bg: 'bg-amber-50',
      text: 'text-amber-900 border-amber-200',
      dot: 'bg-amber-500',
    },
    // Agendada / Pendente: Âmbar clínico ("atenção" conforme solicitação)
    scheduled: {
      label: 'Agendada',
      bg: 'bg-amber-50',
      text: 'text-amber-900 border-amber-200',
      dot: 'bg-amber-500',
    },
    // Sucesso: Verde-esmeralda
    completed: {
      label: 'Concluída',
      bg: 'bg-emerald-50',
      text: 'text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-600',
    },
    // Cancelada: Rose
    cancelled: {
      label: 'Cancelada',
      bg: 'bg-rose-50',
      text: 'text-rose-800 border-rose-200',
      dot: 'bg-rose-500',
    },
    // Atenção: Âmbar
    no_show: {
      label: 'Não compareceu',
      bg: 'bg-amber-50',
      text: 'text-amber-900 border-amber-200',
      dot: 'bg-amber-500',
    },
  }

  const conf = map[status] || {
    label: status,
    bg: 'bg-slate-100',
    text: 'text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${conf.bg} ${conf.text} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
      {conf.label}
    </span>
  )
}
