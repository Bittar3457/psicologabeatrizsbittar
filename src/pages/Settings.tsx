import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import {
  getClinicalPreferences,
  saveClinicalPreferences,
  ClinicalPreferences,
  ConsultationType,
} from '@/types/clinical'
import {
  User,
  Mail,
  Lock,
  Sliders,
  Shield,
  Loader2,
  CheckCircle2,
  Upload,
  Trash2,
} from 'lucide-react'

export default function Settings() {
  const { user, getUserAvatarUrl, updateProfile, updatePassword, requestEmailChange } = useAuth()

  // 1. Profile State
  const [name, setName] = useState(user?.name || 'Beatriz Souza Bittar')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [removeAvatar, setRemoveAvatar] = useState(false)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

  // Sincronizar nome caso user seja carregado assincronamente
  useEffect(() => {
    if (user?.name) {
      setName(user.name)
    }
  }, [user?.name])

  // Limpar Object URL quando houver preview criado localmente
  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview)
      }
    }
  }, [avatarPreview])

  // 2. Email Change State
  const [newEmail, setNewEmail] = useState('')
  const [isRequestingEmail, setIsRequestingEmail] = useState(false)
  const [emailChangeSuccess, setEmailChangeSuccess] = useState(false)

  // 3. Password Change State
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  // 4. Clinical Preferences State
  const [preferences, setPreferences] = useState<ClinicalPreferences>(getClinicalPreferences())
  const [isPrefsSaved, setIsPrefsSaved] = useState(false)

  // Determina a imagem exibida no momento
  const savedAvatarUrl = getUserAvatarUrl(user)
  const currentAvatarDisplay = removeAvatar ? null : avatarPreview || savedAvatarUrl

  // Iniciais para fallback
  const initials =
    (name || user?.name || 'Beatriz Souza Bittar')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join('') || 'BS'

  // Handle avatar select
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview)
      }
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
      setRemoveAvatar(false)
    }
  }

  const handleRemoveAvatar = () => {
    if (avatarPreview && avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview)
    }
    setAvatarFile(null)
    setAvatarPreview(null)
    setRemoveAvatar(true)
  }

  // Handle Profile Update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsUpdatingProfile(true)
      const payload: { name: string; avatar?: File | null } = {
        name: name.trim(),
      }
      if (removeAvatar) {
        payload.avatar = null
      } else if (avatarFile) {
        payload.avatar = avatarFile
      }

      await updateProfile(payload)

      // Limpar estados temporários de upload após sucesso para usar avatar persistido
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview)
      }
      setAvatarFile(null)
      setAvatarPreview(null)
      setRemoveAvatar(false)

      toast({
        title: 'Perfil atualizado',
        description: 'Sua foto e dados de exibição foram salvos com sucesso.',
      })
    } catch (err: unknown) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar perfil',
        description:
          err instanceof Error
            ? err.message
            : 'Não foi possível atualizar o perfil. Tente novamente.',
      })
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  // Handle Request Email Change
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail.trim() || !newEmail.includes('@')) {
      toast({
        variant: 'destructive',
        title: 'E-mail inválido',
        description: 'Informe um endereço de e-mail válido.',
      })
      return
    }

    try {
      setIsRequestingEmail(true)
      await requestEmailChange(newEmail)
      setEmailChangeSuccess(true)
      toast({
        title: 'Confirmação enviada!',
        description: `Enviamos um link de confirmação para ${newEmail}. Acesse o link para concluir a troca.`,
      })
    } catch (err: unknown) {
      toast({
        variant: 'destructive',
        title: 'Falha ao solicitar troca de e-mail',
        description:
          err instanceof Error
            ? err.message
            : 'Verifique se o e-mail já não está em uso por outra conta.',
      })
    } finally {
      setIsRequestingEmail(false)
    }
  }

  // Handle Password Update
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 8) {
      toast({
        variant: 'destructive',
        title: 'Senha muito curta',
        description: 'A nova senha deve ter no mínimo 8 caracteres.',
      })
      return
    }

    if (newPassword !== confirmNewPassword) {
      toast({
        variant: 'destructive',
        title: 'Senhas não conferem',
        description: 'A confirmação de senha é diferente da nova senha.',
      })
      return
    }

    try {
      setIsUpdatingPassword(true)
      await updatePassword(oldPassword, newPassword, confirmNewPassword)
      toast({
        title: 'Senha atualizada!',
        description: 'Sua credencial de acesso foi alterada com sucesso.',
      })
      setOldPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
    } catch (err: unknown) {
      toast({
        variant: 'destructive',
        title: 'Erro ao alterar senha',
        description: err instanceof Error ? err.message : 'A senha atual informada está incorreta.',
      })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  // Handle Preferences Save
  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault()
    saveClinicalPreferences(preferences)
    setIsPrefsSaved(true)
    toast({
      title: 'Preferências salvas!',
      description: 'Seus padrões de horário e modalidade serão usados nos formulários.',
    })
    setTimeout(() => setIsPrefsSaved(false), 2500)
  }

  return (
    <div className="space-y-8 max-w-4xl animate-fade-in pb-12">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1E293B]">
          Configurações da Clínica
        </h1>
        <p className="text-sm text-[#64748B]">
          Gerencie seu perfil profissional, segurança de acesso e preferências da agenda
        </p>
      </div>

      {/* 1. SEÇÃO PERFIL */}
      <Card className="rounded-3xl border-[#E2E8F0] bg-white shadow-xs">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-[#E2E8F0]">
            <User className="w-5 h-5 text-[#5F8D7A]" />
            <h2 className="font-serif text-lg font-bold text-[#1E293B]">Perfil da Profissional</h2>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-5">
            {/* Avatar upload */}
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-[#E8F0EC] border border-[#C7DBCF] text-[#5F8D7A] flex items-center justify-center font-bold text-xl overflow-hidden shrink-0">
                {currentAvatarDisplay ? (
                  <img
                    src={currentAvatarDisplay}
                    alt="Foto de perfil de Beatriz Souza Bittar"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback se URL falhar
                      ;(e.target as HTMLElement).style.display = 'none'
                    }}
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <Label
                    htmlFor="avatar-file"
                    className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#E8F0EC] text-xs font-semibold text-[#1E293B] transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#5F8D7A]" />
                    <span>
                      {currentAvatarDisplay ? 'Alterar foto de perfil' : 'Escolher foto de perfil'}
                    </span>
                  </Label>
                  <input
                    id="avatar-file"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  {currentAvatarDisplay && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveAvatar}
                      className="h-8 px-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Remover foto
                    </Button>
                  )}
                </div>
                <p className="text-[11px] text-[#64748B]">
                  Formatos recomendados: JPG ou PNG (máx. 5MB). A foto fica salva no seu perfil.
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="prof_name" className="text-xs font-semibold text-[#1E293B]">
                Nome de exibição completo
              </Label>
              <Input
                id="prof_name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Beatriz Souza Bittar"
                className="mt-1 h-11 border-[#E2E8F0] max-w-md"
              />
            </div>

            <Button
              type="submit"
              disabled={isUpdatingProfile}
              className="bg-[#5F8D7A] hover:bg-[#4E7263] text-white rounded-xl text-xs sm:text-sm font-medium"
            >
              {isUpdatingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando alterações...
                </>
              ) : (
                'Salvar dados do perfil'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 2. SEÇÃO PREFERÊNCIAS DA AGENDA */}
      <Card className="rounded-3xl border-[#E2E8F0] bg-white shadow-xs">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-[#E2E8F0]">
            <Sliders className="w-5 h-5 text-[#5F8D7A]" />
            <div>
              <h2 className="font-serif text-lg font-bold text-[#1E293B]">
                Preferências da Prática Clínica
              </h2>
              <p className="text-xs text-[#64748B]">
                Parâmetros aplicados como padrão ao agendar novas consultas
              </p>
            </div>
          </div>

          <form onSubmit={handleSavePreferences} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="p_start" className="text-xs font-semibold text-[#1E293B]">
                  Horário de início do expediente
                </Label>
                <Input
                  id="p_start"
                  type="time"
                  value={preferences.workStart}
                  onChange={(e) => setPreferences({ ...preferences, workStart: e.target.value })}
                  className="mt-1 border-[#E2E8F0]"
                />
              </div>

              <div>
                <Label htmlFor="p_end" className="text-xs font-semibold text-[#1E293B]">
                  Horário de encerramento do expediente
                </Label>
                <Input
                  id="p_end"
                  type="time"
                  value={preferences.workEnd}
                  onChange={(e) => setPreferences({ ...preferences, workEnd: e.target.value })}
                  className="mt-1 border-[#E2E8F0]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="p_duration" className="text-xs font-semibold text-[#1E293B]">
                  Duração padrão da sessão (minutos)
                </Label>
                <Input
                  id="p_duration"
                  type="number"
                  min={15}
                  max={240}
                  step={5}
                  value={preferences.defaultDuration}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      defaultDuration: Number(e.target.value),
                    })
                  }
                  className="mt-1 border-[#E2E8F0]"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-[#1E293B]">Modalidade padrão</Label>
                <Select
                  value={preferences.defaultType}
                  onValueChange={(val: ConsultationType) =>
                    setPreferences({ ...preferences, defaultType: val })
                  }
                >
                  <SelectTrigger className="mt-1 border-[#E2E8F0]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="presential">Presencial (Consultório)</SelectItem>
                    <SelectItem value="online">Online (Teleconsulta)</SelectItem>
                    <SelectItem value="mixed">Mista (Presencial e Online alternados)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              type="submit"
              className="bg-[#5F8D7A] hover:bg-[#4E7263] text-white rounded-xl text-xs sm:text-sm font-medium"
            >
              {isPrefsSaved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Preferências salvas!
                </>
              ) : (
                'Salvar preferências da agenda'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 3. SEÇÃO ALTERAR E-MAIL */}
      <Card className="rounded-3xl border-[#E2E8F0] bg-white shadow-xs">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-[#E2E8F0]">
            <Mail className="w-5 h-5 text-[#5F8D7A]" />
            <div>
              <h2 className="font-serif text-lg font-bold text-[#1E293B]">
                Alterar E-mail de Acesso
              </h2>
              <p className="text-xs text-[#64748B]">
                E-mail atual da conta: <strong className="text-[#1E293B]">{user?.email}</strong>
              </p>
            </div>
          </div>

          {emailChangeSuccess ? (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Link de confirmação enviado</span>
              </div>
              <p>
                Acesse o endereço <strong className="underline">{newEmail}</strong> e clique no link
                recebido para validar a alteração.
              </p>
            </div>
          ) : (
            <form onSubmit={handleEmailSubmit} className="space-y-4 max-w-md">
              <div>
                <Label htmlFor="new_email" className="text-xs font-semibold text-[#1E293B]">
                  Novo endereço de e-mail
                </Label>
                <Input
                  id="new_email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="novo.email@exemplo.com.br"
                  className="mt-1 border-[#E2E8F0]"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isRequestingEmail}
                variant="outline"
                className="border-[#5F8D7A] text-[#5F8D7A] hover:bg-[#E8F0EC] rounded-xl text-xs font-medium"
              >
                {isRequestingEmail ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando solicitação...
                  </>
                ) : (
                  'Solicitar troca de e-mail'
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* 4. SEÇÃO ALTERAR SENHA */}
      <Card className="rounded-3xl border-[#E2E8F0] bg-white shadow-xs">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-[#E2E8F0]">
            <Lock className="w-5 h-5 text-[#5F8D7A]" />
            <h2 className="font-serif text-lg font-bold text-[#1E293B]">
              Alterar Senha de Segurança
            </h2>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
            <div>
              <Label htmlFor="old_pwd" className="text-xs font-semibold text-[#1E293B]">
                Senha atual
              </Label>
              <Input
                id="old_pwd"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 border-[#E2E8F0]"
                required
              />
            </div>

            <div>
              <Label htmlFor="new_pwd" className="text-xs font-semibold text-[#1E293B]">
                Nova senha (mínimo 8 caracteres)
              </Label>
              <Input
                id="new_pwd"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 border-[#E2E8F0]"
                required
              />
            </div>

            <div>
              <Label htmlFor="conf_pwd" className="text-xs font-semibold text-[#1E293B]">
                Confirmar nova senha
              </Label>
              <Input
                id="conf_pwd"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 border-[#E2E8F0]"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isUpdatingPassword}
              variant="outline"
              className="border-[#5F8D7A] text-[#5F8D7A] hover:bg-[#E8F0EC] rounded-xl text-xs font-medium"
            >
              {isUpdatingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Atualizando senha...
                </>
              ) : (
                'Atualizar senha'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 5. ZONA DE DADOS SENSÍVEIS E PRIVACIDADE com acento sálvia pontual */}
      <Card className="rounded-3xl border border-[#C7DBCF] bg-[#E8F0EC]/60 shadow-xs">
        <CardContent className="p-6 sm:p-8 space-y-3">
          <div className="flex items-center gap-2.5 text-[#3D594D]">
            <Shield className="w-5 h-5 text-[#5F8D7A]" />
            <h3 className="font-serif text-base font-bold">
              Zona de Sigilo Profissional e Proteção de Dados de Saúde
            </h3>
          </div>
          <p className="text-xs text-[#4E7263] leading-relaxed">
            Este consultório foi arquitetado em conformidade com as diretrizes do Código de Ética
            Profissional do Psicólogo (CFP) e da Lei Geral de Proteção de Dados (LGPD). Todos os
            prontuários, contatos de emergência e anotações clínicas ficam vinculados exclusivamente
            à sua chave de acesso privado. Nenhuma informação de paciente é compartilhada com
            terceiros ou indexada publicamente.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
