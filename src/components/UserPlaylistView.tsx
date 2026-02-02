import { useState, useEffect, useRef, useCallback } from 'react'
import { PlaylistDetail, LikedSongs, Song, getPlaylistDetail, getLikedSongs, downloadPlaylistToServer, DownloadPlaylistResponse } from '../services/api'
import { SongCard } from './SongCard'

const TRACKS_PER_PAGE = 50

interface UserPlaylistViewProps {
  playlistId: string | null // null = liked songs
  onBack: () => void
  onPlay: (song: Song, songs?: Song[], index?: number) => void
  currentSong: Song | null
  isPlaying: boolean
  onAddToPlaylist?: (song: Song) => void
  showAddToPlaylist?: boolean
}

export function UserPlaylistView({ playlistId, onBack, onPlay, currentSong, isPlaying, onAddToPlaylist, showAddToPlaylist = false }: UserPlaylistViewProps) {
  const [playlist, setPlaylist] = useState<PlaylistDetail | LikedSongs | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [downloadResult, setDownloadResult] = useState<DownloadPlaylistResponse | null>(null)

  // Infinite scroll state
  const [displayCount, setDisplayCount] = useState(TRACKS_PER_PAGE)
  const [loadingMore, setLoadingMore] = useState(false)
  const loaderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadPlaylist()
    // Reset display count when playlist changes
    setDisplayCount(TRACKS_PER_PAGE)
  }, [playlistId])

  const loadPlaylist = async () => {
    setLoading(true)
    setError(null)
    try {
      if (playlistId) {
        const data = await getPlaylistDetail(playlistId)
        setPlaylist(data)
      } else {
        // Load liked songs with high limit
        const data = await getLikedSongs(5000)
        setPlaylist(data)
      }
    } catch {
      setError('Error al cargar la playlist')
    } finally {
      setLoading(false)
    }
  }

  const isLikedSongs = !playlistId
  const allTracks = playlist ? playlist.tracks : []
  const visibleTracks = allTracks.slice(0, displayCount)
  const hasMore = displayCount < allTracks.length
  const title = playlist?.title || (isLikedSongs ? 'Canciones que me gustan' : 'Playlist')
  const thumbnail = playlist && 'thumbnail' in playlist ? playlist.thumbnail : null

  // Load more tracks when user scrolls to bottom
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return

    setLoadingMore(true)
    // Simulate a small delay for smooth UX
    setTimeout(() => {
      setDisplayCount(prev => Math.min(prev + TRACKS_PER_PAGE, allTracks.length))
      setLoadingMore(false)
    }, 100)
  }, [loadingMore, hasMore, allTracks.length])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    const currentLoader = loaderRef.current
    if (currentLoader) {
      observer.observe(currentLoader)
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader)
      }
    }
  }, [hasMore, loadingMore, loadMore])

  const handleDownloadAll = async () => {
    if (!allTracks.length) return
    setDownloading(true)
    setDownloadResult(null)

    try {
      const tracksToDownload = allTracks
        .filter(track => track.videoId)
        .map(track => ({
          videoId: track.videoId,
          title: track.title,
        }))

      const result = await downloadPlaylistToServer(title, tracksToDownload)
      setDownloadResult(result)
    } catch (err) {
      setDownloadResult({
        success: false,
        message: 'Error al descargar la playlist',
        details: {
          total: allTracks.length,
          success: 0,
          failed: allTracks.length,
          skipped: 0,
          folder: '',
          errors: [],
        },
      })
    } finally {
      setDownloading(false)
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

  if (error || !playlist) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error || 'Playlist no encontrada'}</p>
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
      {/* Header de la playlist */}
      <div className="flex items-start gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {isLikedSongs ? (
          <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
        ) : thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            className="w-32 h-32 object-cover rounded-lg"
          />
        ) : (
          <div className="w-32 h-32 bg-gray-700 rounded-lg flex items-center justify-center">
            <svg className="w-16 h-16 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
            </svg>
          </div>
        )}

        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white mb-1">{title}</h1>
          {'description' in playlist && playlist.description && (
            <p className="text-sm text-gray-500 line-clamp-3 mb-2">{playlist.description}</p>
          )}
          <p className="text-sm text-gray-400">
            {allTracks.length} canciones
          </p>

          {/* Boton de descargar todo */}
          {allTracks.length > 0 && (
            <button
              onClick={handleDownloadAll}
              disabled={downloading}
              className="mt-3 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {downloading ? (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
              {downloading ? 'Descargando al servidor...' : 'Descargar todo al servidor'}
            </button>
          )}

          {/* Resultado de la descarga */}
          {downloadResult && (
            <div className={`mt-3 p-3 rounded-lg text-sm ${
              downloadResult.success ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
            }`}>
              <p className="font-medium">{downloadResult.message}</p>
              {downloadResult.details && (
                <p className="text-xs mt-1 opacity-80">
                  Guardado en: {downloadResult.details.folder}
                </p>
              )}
              <button
                onClick={() => setDownloadResult(null)}
                className="mt-2 text-xs underline opacity-70 hover:opacity-100"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lista de canciones */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white mb-3">
          Canciones
          {allTracks.length > visibleTracks.length && (
            <span className="text-sm font-normal text-gray-400 ml-2">
              (mostrando {visibleTracks.length} de {allTracks.length})
            </span>
          )}
        </h2>
      </div>

      <div className="space-y-1">
        {visibleTracks.map((track) => (
          <SongCard
            key={track.videoId}
            song={track}
            isPlaying={isPlaying}
            isCurrentSong={currentSong?.videoId === track.videoId}
            onPlay={(song) => onPlay(song, allTracks, allTracks.findIndex(t => t.videoId === song.videoId))}
            onAddToPlaylist={onAddToPlaylist}
            showAddToPlaylist={showAddToPlaylist}
          />
        ))}
      </div>

      {/* Loader para infinite scroll */}
      {hasMore && (
        <div ref={loaderRef} className="flex justify-center py-6">
          {loadingMore ? (
            <svg className="animate-spin h-6 w-6 text-red-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <span className="text-gray-500 text-sm">Desplazate para ver mas...</span>
          )}
        </div>
      )}

      {allTracks.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No hay canciones en esta playlist
        </div>
      )}
    </div>
  )
}
