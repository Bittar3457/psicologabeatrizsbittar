import React from 'react'

const PALETTE = [
  // CLIAP: Azul-ardósia clínico suave
  { bg: 'bg-[#EAEFF2]', text: 'text-[#2F4858]', border: 'border-[#C5D3DC]' },
  // Acento terracota clínico suave
  { bg: 'bg-[#FAEDE7]', text: 'text-[#B46647]', border: 'border-[#F1D0C5]' },
  // Acento sálvia clínico suave
  { bg: 'bg-[#E8F0EC]', text: 'text-[#3D594D]', border: 'border-[#C7DBCF]' },
  // Slate neutro refinado
  { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300' },
  // Âmbar clínico muito suave
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
