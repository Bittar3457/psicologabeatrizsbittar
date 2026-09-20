import React, { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { Loader2, Lock, CheckCircle2, AlertTriangle } from 'lucide-react'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { confirmPasswordReset } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!token) {
      setErrorMessage('Token de redefinição não encontrado ou link inválido.')
      return
    }

    if (password.length < 8) {
      setErrorMessage('A nova senha deve ter no mínimo 8 caracteres.')
      return
    }

    if (password !== passwordConfirm) {
      setErrorMessage('As senhas não coincidem.')
      return
    }

    try {
      setIsSubmitting(true)
      await confirmPasswordReset(token, password, passwordConfirm)
      setIsSuccess(true)
      toast({
        title: 'Senha redefinida!',
        description: 'Sua nova senha foi salva com sucesso. Faça login.',
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao redefinir senha'
      setErrorMessage(
        msg.includes('token') || msg.includes('400')
          ? 'O link de recuperação expirou ou é inválido. Solicite um novo link.'
          : 'Não foi possível redefinir a senha. Tente novamente.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-[#5F8D7A] shadow-md flex items-center justify-center text-white font-serif text-2xl">
            B
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-serif text-[#2D3A34] tracking-tight">
          Definir Nova Senha
        </h2>
        <p className="mt-2 text-center text-sm text-[#6B7A72]">
          Crie uma senha segura para proteger sua agenda e pacientes
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-[#E5E0D8] sm:px-10">
          {!token ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-amber-50 text-[#D99A3B] rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-serif text-[#2D3A34]">Link incompleto</h3>
              <p className="text-sm text-[#6B7A72]">
                O token de verificação não foi detectado no endereço da página. Por favor, utilize o
                link recebido por e-mail.
              </p>
              <div className="pt-2">
                <Link to="/forgot-password">
                  <Button variant="outline" className="w-full border-[#E5E0D8]">
                    Solicitar novo link
                  </Button>
                </Link>
              </div>
            </div>
          ) : isSuccess ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-green-50 text-[#3E8E5A] rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-serif text-[#2D3A34]">Senha alterada com sucesso!</h3>
              <p className="text-sm text-[#6B7A72]">
                Sua credencial de acesso foi atualizada com segurança.
              </p>
              <div className="pt-4">
                <Button
                  onClick={() => navigate('/login')}
                  className="w-full bg-[#5F8D7A] hover:bg-[#4E7263] text-white"
                >
                  Ir para Login
                </Button>
              </div>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              {errorMessage && (
                <div className="p-3 text-sm rounded-xl bg-red-50 text-[#C2453D] border border-red-200">
                  {errorMessage}
                </div>
              )}

              <div>
                <Label htmlFor="password" className="text-sm font-medium text-[#2D3A34]">
                  Nova Senha (mínimo 8 caracteres)
                </Label>
                <div className="mt-1 relative">
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-11 border-[#E5E0D8] focus-visible:ring-[#5F8D7A]"
                  />
                  <Lock className="w-4 h-4 text-[#6B7A72] absolute left-3 top-3.5" />
                </div>
              </div>

              <div>
                <Label htmlFor="passwordConfirm" className="text-sm font-medium text-[#2D3A34]">
                  Confirmar Nova Senha
                </Label>
                <div className="mt-1 relative">
                  <Input
                    id="passwordConfirm"
                    name="passwordConfirm"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    className="pl-10 h-11 border-[#E5E0D8] focus-visible:ring-[#5F8D7A]"
                  />
                  <Lock className="w-4 h-4 text-[#6B7A72] absolute left-3 top-3.5" />
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 bg-[#5F8D7A] hover:bg-[#4E7263] text-white rounded-xl text-sm font-medium transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando nova senha...
                    </>
                  ) : (
                    'Salvar nova senha'
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
