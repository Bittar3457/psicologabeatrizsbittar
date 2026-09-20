/* 404 Page - Displays when a user attempts to access a non-existent route - translate to the language of the user */
import { useLocation } from 'react-router-dom'
import { useEffect } from 'react'

const NotFound = () => {
  const location = useLocation()

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname)
  }, [location.pathname])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] p-6 text-[#2D3A34]">
      <div className="text-center max-w-md bg-white p-8 rounded-3xl border border-[#E5E0D8] shadow-sm space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-[#E8F0EC] text-[#5F8D7A] flex items-center justify-center mx-auto font-serif text-3xl font-bold">
          404
        </div>
        <h1 className="text-2xl font-serif font-bold text-[#2D3A34]">Página não encontrada</h1>
        <p className="text-sm text-[#6B7A72]">
          O endereço acessado não existe ou foi movido no consultório virtual.
        </p>
        <div className="pt-2">
          <a
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#5F8D7A] hover:bg-[#4E7263] text-white text-sm font-medium transition-colors"
          >
            Voltar ao Início
          </a>
        </div>
      </div>
    </div>
  )
}

export default NotFound
