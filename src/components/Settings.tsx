import { useState, useEffect } from 'react'
import {
  getBackendUrl,
  setBackendUrl,
  testConnection,
  getCacheStats,
  saveCacheSettings,
  cleanupCache,
  clearCache,
  CacheStats,
} from '../services/api'

interface SettingsProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export function Settings({ isOpen, onClose, onSave }: SettingsProps) {
  const [url, setUrl] = useState(getBackendUrl())
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)

  // Cache settings
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null)
  const [cacheEnabled, setCacheEnabled] = useState(true)
  const [retentionDays, setRetentionDays] = useState(10)
  const [loadingCache, setLoadingCache] = useState(false)
  const [cacheSaving, setCacheSaving] = useState(false)
  const [cacheClearing, setCacheClearing] = useState(false)
  const [cacheMessage, setCacheMessage] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadCacheStats()
    }
  }, [isOpen])

  const loadCacheStats = async () => {
    setLoadingCache(true)
    try {
      const stats = await getCacheStats()
      setCacheStats(stats)
      setCacheEnabled(stats.settings.enabled)
      setRetentionDays(stats.settings.retention_days)
    } catch {
      // Error loading cache stats
    } finally {
      setLoadingCache(false)
    }
  }

  if (!isOpen) return null

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    const success = await testConnection(url)
    setTestResult(success ? 'success' : 'error')
    setTesting(false)
  }

  const handleSave = () => {
    setBackendUrl(url)
    onSave()
    onClose()
  }

  const handleSaveCacheSettings = async () => {
    setCacheSaving(true)
    setCacheMessage(null)
    try {
      await saveCacheSettings({
        enabled: cacheEnabled,
        retention_days: retentionDays,
      })
      setCacheMessage('Configuracion guardada')
      loadCacheStats()
    } catch {
      setCacheMessage('Error al guardar')
    } finally {
      setCacheSaving(false)
    }
  }

  const handleCleanupCache = async () => {
    setCacheClearing(true)
    setCacheMessage(null)
    try {
      const result = await cleanupCache()
      setCacheMessage(`Limpieza completada: ${result.deleted} archivos (${result.freed_formatted})`)
      loadCacheStats()
    } catch {
      setCacheMessage('Error al limpiar')
    } finally {
      setCacheClearing(false)
    }
  }

  const handleClearCache = async () => {
    if (!confirm('Esto eliminara todos los archivos en cache. Continuar?')) return
    setCacheClearing(true)
    setCacheMessage(null)
    try {
      const result = await clearCache()
      setCacheMessage(`Cache vaciada: ${result.deleted} archivos (${result.freed_formatted})`)
      loadCacheStats()
    } catch {
      setCacheMessage('Error al vaciar cache')
    } finally {
      setCacheClearing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-4">Configuracion</h2>

        {/* Servidor */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
            Servidor
          </h3>
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">
              URL del Backend
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value)
                setTestResult(null)
              }}
              placeholder="http://localhost:8000"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Ejemplo: http://192.168.1.100:8000
            </p>
          </div>

          {testResult && (
            <div className={`mb-4 p-3 rounded-lg ${
              testResult === 'success'
                ? 'bg-green-900/50 text-green-300 border border-green-500'
                : 'bg-red-900/50 text-red-300 border border-red-500'
            }`}>
              {testResult === 'success'
                ? 'Conexion exitosa!'
                : 'No se pudo conectar al servidor'}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleTest}
              disabled={testing || !url.trim()}
              className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
            >
              {testing ? 'Probando...' : 'Probar'}
            </button>
            <button
              onClick={handleSave}
              disabled={!url.trim()}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              Guardar
            </button>
          </div>
        </div>

        {/* Cache */}
        <div className="mb-6 border-t border-gray-700 pt-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
            Cache de Audio
          </h3>

          {loadingCache ? (
            <div className="text-gray-400 text-sm">Cargando...</div>
          ) : (
            <>
              {/* Estadisticas */}
              {cacheStats && (
                <div className="bg-gray-700/50 rounded-lg p-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Archivos en cache:</span>
                    <span className="text-white">{cacheStats.file_count}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-400">Tamano total:</span>
                    <span className="text-white">{cacheStats.total_size_formatted}</span>
                  </div>
                </div>
              )}

              {/* Habilitar cache */}
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm text-gray-400">Habilitar cache</label>
                <button
                  onClick={() => setCacheEnabled(!cacheEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    cacheEnabled ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                      cacheEnabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Dias de retencion */}
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">
                  Dias de retencion: {retentionDays}
                </label>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 dia</span>
                  <span>30 dias</span>
                </div>
              </div>

              {/* Mensaje */}
              {cacheMessage && (
                <div className="mb-4 p-2 bg-gray-700/50 rounded text-sm text-gray-300">
                  {cacheMessage}
                </div>
              )}

              {/* Botones */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handleSaveCacheSettings}
                  disabled={cacheSaving}
                  className="px-3 py-2 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
                >
                  {cacheSaving ? '...' : 'Guardar'}
                </button>
                <button
                  onClick={handleCleanupCache}
                  disabled={cacheClearing}
                  className="px-3 py-2 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
                >
                  {cacheClearing ? '...' : 'Limpiar'}
                </button>
                <button
                  onClick={handleClearCache}
                  disabled={cacheClearing}
                  className="px-3 py-2 bg-red-900/50 text-red-300 text-sm rounded-lg hover:bg-red-900 disabled:opacity-50 transition-colors"
                >
                  Vaciar
                </button>
              </div>
            </>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full px-4 py-2 text-gray-400 hover:text-white transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}
