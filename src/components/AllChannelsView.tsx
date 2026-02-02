import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LibraryChannel, getLibraryChannels } from '../services/api'

export function AllChannelsView() {
  const navigate = useNavigate()
  const [channels, setChannels] = useState<LibraryChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadChannels()
  }, [])

  const loadChannels = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getLibraryChannels(500)
      setChannels(data)
    } catch {
      setError('Error al cargar canales')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <svg className="animate-spin h-8 w-8 text-red-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
        >
          Volver
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-white">Todos mis Canales</h1>
        <span className="text-gray-400 text-sm">({channels.length})</span>
      </div>

      {channels.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No tienes canales suscritos
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
          {channels.map((channel) => (
            <button
              key={channel.channelId}
              onClick={() => navigate(`/channel/${channel.channelId}`)}
              className="group text-center"
            >
              <div className="w-20 h-20 mx-auto bg-gray-800 rounded-full overflow-hidden mb-2">
                {channel.thumbnail ? (
                  <img
                    src={channel.thumbnail}
                    alt={channel.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                )}
              </div>
              <p className="text-sm text-white font-medium truncate">{channel.title}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
