import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { Loader2, Lock, Mail, HeartHandshake } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!email.trim() || !password) {
      setErrorMessage('Por favor, informe seu e-mail e sua senha.')
      return
    }

    try {
      setIsSubmitting(true)
      await login(email, password)
      toast({
        title: 'Bem-vinda de volta!',
        description: 'Acesso realizado com sucesso ao consultório virtual.',
      })
      navigate('/')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao autenticar'
      setErrorMessage(
        msg.includes('Failed to authenticate') || msg.includes('400')
          ? 'E-mail ou senha incorretos. Por favor, verifique os dados.'
          : 'Não foi possível entrar. Verifique sua conexão e tente novamente.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const fillQuickAccess = () => {
    setEmail('robertobittar98@gmail.com')
    setPassword('Skip@Pass')
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          {/* Monograma oficial B com acentos orgânicos Terracota e Sálvia */}
          <div className="relative w-16 h-16 rounded-2xl bg-[#5F8D7A] shadow-md flex items-center justify-center text-white font-serif text-3xl tracking-tight select-none">
            <span>B</span>
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#C97B5A] ring-2 ring-white" />
            <span className="absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full bg-[#4E7263] ring-2 ring-white" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-serif text-[#1E293B] tracking-tight">
          Beatriz Souza Bittar
        </h2>
        <p className="mt-1 text-center text-base font-medium text-[#64748B]">Psicóloga</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-[#E2E8F0] sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {errorMessage && (
              <div className="p-3 text-sm rounded-xl bg-red-50 text-[#DC2626] border border-red-200">
                {errorMessage}
              </div>
            )}

            <div>
              <Label htmlFor="email" className="text-sm font-medium text-[#1E293B]">
                E-mail
              </Label>
              <div className="mt-1 relative">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="seu.email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 border-[#E2E8F0] focus-visible:ring-[#5F8D7A]"
                />
                <Mail className="w-4 h-4 text-[#64748B] absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-[#1E293B]">
                  Senha
                </Label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-[#5F8D7A] hover:text-[#4E7263]"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="mt-1 relative">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11 border-[#E2E8F0] focus-visible:ring-[#5F8D7A]"
                />
                <Lock className="w-4 h-4 text-[#64748B] absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-[#5F8D7A] hover:bg-[#4E7263] text-white rounded-xl text-sm font-medium transition-colors shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar no consultório'
                )}
              </Button>
            </div>
          </form>

          {/* Quick helper for instant test credentials */}
          <div className="mt-6 pt-6 border-t border-[#E2E8F0]/80 text-center">
            <button
              type="button"
              onClick={fillQuickAccess}
              className="text-xs text-[#64748B] hover:text-[#5F8D7A] inline-flex items-center gap-1.5 transition-colors underline"
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              Preencher dados de acesso inicial (robertobittar98@gmail.com)
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-[#64748B]">
          Acesso seguro e confidencial em conformidade com o sigilo profissional de psicologia.
        </p>
      </div>
    </div>
  )
}
