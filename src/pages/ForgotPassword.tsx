import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { requestPasswordReset } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!email.trim()) {
      setErrorMessage('Informe seu e-mail para continuar.')
      return
    }

    try {
      setIsSubmitting(true)
      await requestPasswordReset(email)
      setIsSent(true)
    } catch {
      // For security, show success even if the email does not exist, or gentle generic
      setIsSent(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="relative w-14 h-14 rounded-2xl bg-[#5F8D7A] shadow-md flex items-center justify-center text-white font-serif text-2xl select-none">
            <span>B</span>
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#C97B5A] ring-2 ring-white" />
            <span className="absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 rounded-full bg-[#4E7263] ring-2 ring-white" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-serif text-[#1E293B] tracking-tight">
          Recuperação de Senha
        </h2>
        <p className="mt-2 text-center text-sm text-[#64748B]">
          Informe seu e-mail para receber as instruções de redefinição
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-[#E2E8F0] sm:px-10">
          {isSent ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-50 text-[#059669] rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-serif text-[#1E293B]">Link enviado!</h3>
              <p className="text-sm text-[#64748B]">
                Se existir uma conta cadastrada para{' '}
                <strong className="text-[#1E293B]">{email}</strong>, você receberá um link seguro
                para redefinir sua senha em instantes.
              </p>
              <div className="pt-4">
                <Link to="/login">
                  <Button variant="outline" className="w-full border-[#E2E8F0] text-[#1E293B]">
                    Voltar para o login
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              {errorMessage && (
                <div className="p-3 text-sm rounded-xl bg-red-50 text-[#DC2626] border border-red-200">
                  {errorMessage}
                </div>
              )}

              <div>
                <Label htmlFor="email" className="text-sm font-medium text-[#1E293B]">
                  E-mail cadastrado
                </Label>
                <div className="mt-1 relative">
                  <Input
                    id="email"
                    name="email"
                    type="email"
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
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 bg-[#5F8D7A] hover:bg-[#4E7263] text-white rounded-xl text-sm font-medium transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando instruções...
                    </>
                  ) : (
                    'Enviar link de recuperação'
                  )}
                </Button>
              </div>

              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#5F8D7A]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Voltar para tela de login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
