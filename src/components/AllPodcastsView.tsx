import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LibraryPodcast, getLibraryPodcasts } from '../services/api'

export function AllPodcastsView() {
  const navigate = useNavigate()
  const [podcasts, setPodcasts] = useState<LibraryPodcast[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPodcasts()
  }, [])

  const loadPodcasts = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getLibraryPodcasts(500)
      setPodcasts(data)
    } catch {
      setError('Error al cargar podcasts')
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
        <h1 className="text-2xl font-bold text-white">Todos mis Programas</h1>
        <span className="text-gray-400 text-sm">({podcasts.filter(p => p.podcastId).length})</span>
      </div>

      {podcasts.filter(p => p.podcastId).length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No tienes podcasts suscritos
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {podcasts.filter(p => p.podcastId).map((podcast) => (
            <button
              key={podcast.podcastId}
              onClick={() => navigate(`/podcast/${podcast.podcastId}`)}
              className="group text-left"
            >
              <div className="aspect-square bg-gray-800 rounded-lg overflow-hidden mb-2">
                {podcast.thumbnail ? (
                  <img
                    src={podcast.thumbnail}
                    alt={podcast.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-16 h-16 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </div>
                )}
              </div>
              <p className="text-sm text-white font-medium truncate">{podcast.title}</p>
              <p className="text-xs text-gray-400 truncate">{podcast.author}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
