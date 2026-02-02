import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Song, ChannelInfo, getChannelInfo, getChannelEpisodes } from '../services/api'
import { SongCard } from './SongCard'

interface ChannelViewProps {
  onPlay: (song: Song) => void
  onAddToPlaylist?: (song: Song) => void
  currentSong: Song | null
  isPlaying: boolean
  showAddToPlaylist?: boolean
}

export function ChannelView({
  onPlay,
  onAddToPlaylist,
  currentSong,
  isPlaying,
  showAddToPlaylist = false,
}: ChannelViewProps) {
  const { channelId } = useParams<{ channelId: string }>()
  const navigate = useNavigate()

  const [channel, setChannel] = useState<ChannelInfo | null>(null)
  const [episodes, setEpisodes] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [continuation, setContinuation] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  // Cargar datos iniciales
  useEffect(() => {
    if (!channelId) {
      navigate('/podcasts')
      return
    }
    loadInitialData()
  }, [channelId])

  const loadInitialData = async () => {
    if (!channelId) return

    setLoading(true)
    setError(null)
    setEpisodes([])
    setContinuation(null)
    setHasMore(false)

    try {
      const [channelData, episodesData] = await Promise.all([
        getChannelInfo(channelId),
        getChannelEpisodes(channelId),
      ])

      setChannel(channelData)
      setEpisodes(episodesData.episodes)
      setContinuation(episodesData.continuation)
      setHasMore(episodesData.hasMore)
    } catch {
      setError('Error al cargar el canal')
    } finally {
      setLoading(false)
    }
  }

  // Cargar más episodios
  const loadMoreEpisodes = useCallback(async () => {
    if (!channelId || !continuation || loadingMore) return

    setLoadingMore(true)
    try {
      const data = await getChannelEpisodes(channelId, continuation)
      setEpisodes((prev) => [...prev, ...data.episodes])
      setContinuation(data.continuation)
      setHasMore(data.hasMore)
    } catch {
      console.error('Error al cargar más episodios')
    } finally {
      setLoadingMore(false)
    }
  }, [channelId, continuation, loadingMore])

  // Intersection Observer para scroll infinito
  useEffect(() => {
    if (loading || !hasMore) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMoreEpisodes()
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [loading, hasMore, loadingMore, loadMoreEpisodes])

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

  if (error || !channel) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error || 'Canal no encontrado'}</p>
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
      {/* Header del canal */}
      <div className="flex items-start gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {channel.thumbnail && (
          <img
            src={channel.thumbnail}
            alt={channel.title}
            className="w-24 h-24 object-cover rounded-full"
          />
        )}

        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white mb-1">{channel.title}</h1>
          {channel.description && (
            <p className="text-sm text-gray-400 line-clamp-2">{channel.description}</p>
          )}
          <p className="text-sm text-gray-500 mt-2">
            {channel.episodeCount > 0 ? `${channel.episodeCount} episodios` : 'Episodios'}
          </p>
        </div>
      </div>

      {/* Lista de episodios */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white mb-3">
          Episodios (del mas reciente al mas antiguo)
        </h2>
      </div>

      <div className="space-y-1">
        {episodes.map((episode, index) => (
          <SongCard
            key={`${episode.videoId}-${index}`}
            song={episode}
            isPlaying={isPlaying}
            isCurrentSong={currentSong?.videoId === episode.videoId}
            onPlay={onPlay}
            onAddToPlaylist={onAddToPlaylist}
            showAddToPlaylist={showAddToPlaylist}
          />
        ))}
      </div>

      {episodes.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No se encontraron episodios
        </div>
      )}

      {/* Trigger para cargar más */}
      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-8">
          {loadingMore && (
            <svg className="animate-spin h-6 w-6 text-red-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
        </div>
      )}

      {!hasMore && episodes.length > 0 && (
        <div className="text-center py-4 text-gray-500 text-sm">
          No hay mas episodios
        </div>
      )}
    </div>
  )
}
