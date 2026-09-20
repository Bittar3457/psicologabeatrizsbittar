import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { confirmVerification } = useAuth()

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setErrorMessage('Token de verificação ausente ou link incompleto.')
      return
    }

    let isMounted = true
    confirmVerification(token)
      .then(() => {
        if (isMounted) setStatus('success')
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setStatus('error')
          const msg = err instanceof Error ? err.message : ''
          setErrorMessage(
            msg.includes('token')
              ? 'O link de verificação expirou ou já foi utilizado.'
              : 'Não foi possível confirmar o e-mail no momento.',
          )
        }
      })

    return () => {
      isMounted = false
    }
  }, [token, confirmVerification])

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
          Verificação de E-mail
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-[#E2E8F0] sm:px-10 text-center">
          {status === 'verifying' && (
            <div className="space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-[#5F8D7A] mx-auto" />
              <h3 className="text-lg font-serif text-[#1E293B]">Confirmando seu e-mail...</h3>
              <p className="text-sm text-[#64748B]">
                Aguarde alguns segundos enquanto validamos suas credenciais.
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <div className="w-12 h-12 bg-emerald-50 text-[#059669] rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-serif text-[#1E293B]">E-mail verificado com sucesso!</h3>
              <p className="text-sm text-[#64748B]">
                Sua conta está ativa e pronta para uso no consultório.
              </p>
              <div className="pt-4">
                <Link to="/login">
                  <Button className="w-full bg-[#5F8D7A] hover:bg-[#4E7263] text-white">
                    Ir para Login
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="w-12 h-12 bg-amber-50 text-[#D97706] rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-serif text-[#1E293B]">Verificação não concluída</h3>
              <p className="text-sm text-[#64748B]">{errorMessage}</p>
              <div className="pt-4">
                <Link to="/login">
                  <Button variant="outline" className="w-full border-[#E2E8F0]">
                    Voltar para o Login
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
