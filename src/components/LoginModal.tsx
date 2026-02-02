import { useState } from 'react'
import axios from 'axios'
import { login } from '../services/api'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [headers, setHeaders] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleLogin = async () => {
    if (!headers.trim()) {
      setError('Por favor pega los headers del navegador')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await login(headers)
      if (result.success) {
        setHeaders('')
        onSuccess()
        onClose()
      } else {
        setError(result.message)
      }
    } catch (err: unknown) {
      let errorMessage = 'Error desconocido'
      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        errorMessage = err.response.data.detail
      } else if (err instanceof Error) {
        errorMessage = err.message
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Iniciar Sesion en YouTube Music</h2>

        <div className="mb-4 p-4 bg-gray-700/50 rounded-lg text-sm text-gray-300">
          <p className="font-semibold mb-2">Opcion 1: Copiar Cookies (mas facil)</p>
          <ol className="list-decimal list-inside space-y-1 text-gray-400 mb-4">
            <li>Abre <a href="https://music.youtube.com" target="_blank" rel="noopener noreferrer" className="text-red-400 hover:underline">music.youtube.com</a> e inicia sesion</li>
            <li>Abre DevTools (F12) → <strong>Application</strong> → <strong>Cookies</strong></li>
            <li>Selecciona <code className="bg-gray-600 px-1 rounded">https://music.youtube.com</code></li>
            <li>Clic derecho en la tabla → <strong>Copy all as JSON</strong> (Chrome)</li>
            <li>O usa la extension <strong>EditThisCookie</strong> → Exportar</li>
          </ol>

          <p className="font-semibold mb-2">Opcion 2: Copiar Headers (si lo anterior no funciona)</p>
          <ol className="list-decimal list-inside space-y-1 text-gray-400">
            <li>En DevTools → <strong>Network</strong> → Recarga la pagina (F5)</li>
            <li>Filtra por <code className="bg-gray-600 px-1 rounded">browse</code></li>
            <li>Clic en una solicitud → <strong>Request Headers</strong> → Copiar todo</li>
          </ol>
        </div>

        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">
            Cookies o Headers
          </label>
          <textarea
            value={headers}
            onChange={(e) => {
              setHeaders(e.target.value)
              setError(null)
            }}
            placeholder={'Pega aqui las cookies (JSON o texto) o los headers...\n\nEjemplo JSON:\n[{"name":"SAPISID","value":"xxx"},...]'}
            rows={8}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500 font-mono text-xs resize-none"
          />
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/50 text-red-300 border border-red-500 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleLogin}
            disabled={loading || !headers.trim()}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Iniciando sesion...' : 'Iniciar Sesion'}
          </button>
        </div>
      </div>
    </div>
  )
}
