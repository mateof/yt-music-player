import { useState, useEffect } from 'react'
import { Podcast, Song, getPodcastDetails } from '../services/api'
import { SongCard } from './SongCard'

interface PodcastViewProps {
  podcastId: string
  onBack: () => void
  onPlay: (song: Song) => void
  currentSong: Song | null
  isPlaying: boolean
  onAddToPlaylist?: (song: Song) => void
  showAddToPlaylist?: boolean
}

export function PodcastView({ podcastId, onBack, onPlay, currentSong, isPlaying, onAddToPlaylist, showAddToPlaylist = false }: PodcastViewProps) {
  const [podcast, setPodcast] = useState<Podcast | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPodcast()
  }, [podcastId])

  const loadPodcast = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getPodcastDetails(podcastId)
      setPodcast(data)
    } catch {
      setError('Error al cargar el podcast')
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

  if (error || !podcast) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error || 'Podcast no encontrado'}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
        >
          Volver
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Header del podcast */}
      <div className="flex items-start gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {podcast.thumbnail && (
          <img
            src={podcast.thumbnail}
            alt={podcast.title}
            className="w-32 h-32 object-cover rounded-lg"
          />
        )}

        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white mb-1">{podcast.title}</h1>
          <p className="text-gray-400 mb-2">{podcast.author}</p>
          {podcast.description && (
            <p className="text-sm text-gray-500 line-clamp-3">{podcast.description}</p>
          )}
          <p className="text-sm text-gray-500 mt-2">
            {podcast.episodes.length} episodios
          </p>
        </div>
      </div>

      {/* Lista de episodios */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white mb-3">
          Episodios (mas recientes primero)
        </h2>
      </div>

      <div className="space-y-1">
        {podcast.episodes.map((episode) => (
          <div key={episode.videoId} className="relative">
            <SongCard
              song={episode}
              isPlaying={isPlaying}
              isCurrentSong={currentSong?.videoId === episode.videoId}
              onPlay={onPlay}
              onAddToPlaylist={onAddToPlaylist}
              showAddToPlaylist={showAddToPlaylist}
            />
            {episode.date && (
              <span className="absolute right-20 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                {episode.date}
              </span>
            )}
          </div>
        ))}
      </div>

      {podcast.episodes.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No se encontraron episodios
        </div>
      )}
    </div>
  )
}
