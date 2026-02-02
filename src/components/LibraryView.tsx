import { useState, useEffect } from 'react'
import { Playlist, getLibraryPlaylists, getLikedSongs } from '../services/api'

interface LibraryViewProps {
  onPlaylistClick: (playlistId: string) => void
  onLikedSongsClick: () => void
  onBack: () => void
}

export function LibraryView({ onPlaylistClick, onLikedSongsClick, onBack }: LibraryViewProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [likedCount, setLikedCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadLibrary()
  }, [])

  const loadLibrary = async () => {
    setLoading(true)
    setError(null)
    try {
      const [playlistsData, likedData] = await Promise.all([
        getLibraryPlaylists(),
        getLikedSongs(1) // Solo obtener el conteo
      ])
      setPlaylists(playlistsData)
      setLikedCount(likedData.trackCount)
    } catch {
      setError('Error al cargar la biblioteca')
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
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-white">Tu Biblioteca</h1>
      </div>

      {/* Liked Songs */}
      <div className="mb-6">
        <button
          onClick={onLikedSongsClick}
          className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-purple-900 to-blue-900 rounded-lg hover:from-purple-800 hover:to-blue-800 transition-colors"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-lg font-semibold text-white">Canciones que me gustan</h3>
            <p className="text-sm text-gray-300">{likedCount} canciones</p>
          </div>
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Playlists */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Tus Playlists</h2>
        {playlists.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No tienes playlists
          </div>
        ) : (
          <div className="space-y-1">
            {playlists.map((playlist) => (
              <button
                key={playlist.playlistId}
                onClick={() => onPlaylistClick(playlist.playlistId)}
                className="w-full flex items-center gap-4 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                {playlist.thumbnail ? (
                  <img
                    src={playlist.thumbnail}
                    alt={playlist.title}
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-700 rounded flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
                    </svg>
                  </div>
                )}
                <div className="flex-1 text-left">
                  <h3 className="text-white font-medium truncate">{playlist.title}</h3>
                  <p className="text-sm text-gray-400">{playlist.trackCount} canciones</p>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
