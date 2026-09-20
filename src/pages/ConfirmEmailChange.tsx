import React, { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { Loader2, Lock, CheckCircle2, AlertTriangle } from 'lucide-react'

export default function ConfirmEmailChange() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { confirmEmailChange } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!token) {
      setErrorMessage('Token de confirmação de e-mail não encontrado.')
      return
    }

    if (!password) {
      setErrorMessage('Por favor, confirme sua senha para autenticar a troca de e-mail.')
      return
    }

    try {
      setIsSubmitting(true)
      await confirmEmailChange(token, password)
      setIsSuccess(true)
      toast({
        title: 'E-mail alterado com sucesso!',
        description: 'Faça login com seu novo endereço de e-mail.',
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na confirmação'
      setErrorMessage(
        msg.includes('password')
          ? 'Senha incorreta. Por favor verifique e tente novamente.'
          : 'Link de confirmação expirado ou inválido. Solicite uma nova troca.',
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
          Confirmar Alteração de E-mail
        </h2>
        <p className="mt-2 text-center text-sm text-[#6B7A72]">
          Confirme sua senha para finalizar a atualização cadastral
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
                O token de confirmação não foi localizado na URL. Por favor, acesse o link enviado
                para o seu novo endereço de e-mail.
              </p>
              <div className="pt-2">
                <Link to="/login">
                  <Button variant="outline" className="w-full border-[#E5E0D8]">
                    Ir para Login
                  </Button>
                </Link>
              </div>
            </div>
          ) : isSuccess ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-green-50 text-[#3E8E5A] rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-serif text-[#2D3A34]">E-mail atualizado!</h3>
              <p className="text-sm text-[#6B7A72]">
                Sua conta foi atualizada com sucesso. Por segurança, realize login com seu novo
                e-mail.
              </p>
              <div className="pt-4">
                <Button
                  onClick={() => navigate('/login')}
                  className="w-full bg-[#5F8D7A] hover:bg-[#4E7263] text-white"
                >
                  Entrar com novo e-mail
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
                  Senha atual da sua conta
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
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 bg-[#5F8D7A] hover:bg-[#4E7263] text-white rounded-xl text-sm font-medium transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Confirmando alteração...
                    </>
                  ) : (
                    'Confirmar e atualizar e-mail'
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
