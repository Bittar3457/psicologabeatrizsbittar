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
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-[#5F8D7A] shadow-md flex items-center justify-center text-white font-serif text-2xl">
            B
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-serif text-[#2D3A34] tracking-tight">
          Verificação de E-mail
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-[#E5E0D8] sm:px-10 text-center">
          {status === 'verifying' && (
            <div className="space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-[#5F8D7A] mx-auto" />
              <h3 className="text-lg font-serif text-[#2D3A34]">Confirmando seu e-mail...</h3>
              <p className="text-sm text-[#6B7A72]">
                Aguarde alguns segundos enquanto validamos suas credenciais.
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <div className="w-12 h-12 bg-green-50 text-[#3E8E5A] rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-serif text-[#2D3A34]">E-mail verificado com sucesso!</h3>
              <p className="text-sm text-[#6B7A72]">
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
              <div className="w-12 h-12 bg-amber-50 text-[#D99A3B] rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-serif text-[#2D3A34]">Verificação não concluída</h3>
              <p className="text-sm text-[#6B7A72]">{errorMessage}</p>
              <div className="pt-4">
                <Link to="/login">
                  <Button variant="outline" className="w-full border-[#E5E0D8]">
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
