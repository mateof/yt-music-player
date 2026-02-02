import { useState, useEffect } from 'react'
import { LocalPlaylist, getLocalPlaylists, deleteLocalPlaylist } from '../services/api'

interface LocalPlaylistsViewProps {
  onSelectPlaylist: (playlistName: string) => void
}

export function LocalPlaylistsView({ onSelectPlaylist }: LocalPlaylistsViewProps) {
  const [playlists, setPlaylists] = useState<LocalPlaylist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingPlaylist, setDeletingPlaylist] = useState<string | null>(null)

  useEffect(() => {
    loadPlaylists()
  }, [])

  const loadPlaylists = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getLocalPlaylists()
      setPlaylists(data)
    } catch {
      setError('Error al cargar las playlists locales')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (name: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`¿Eliminar la playlist "${name}" y todos sus archivos?`)) return

    setDeletingPlaylist(name)
    try {
      await deleteLocalPlaylist(name)
      setPlaylists(playlists.filter(p => p.name !== name))
    } catch {
      alert('Error al eliminar la playlist')
    } finally {
      setDeletingPlaylist(null)
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
          onClick={loadPlaylists}
          className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (playlists.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <p className="text-gray-500 mb-2">No hay playlists descargadas</p>
        <p className="text-gray-600 text-sm">
          Descarga una playlist desde tu biblioteca para verla aqui
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {playlists.map((playlist) => (
        <div
          key={playlist.name}
          onClick={() => onSelectPlaylist(playlist.name)}
          className="flex items-center gap-4 p-4 bg-gray-800/50 hover:bg-gray-800 rounded-lg cursor-pointer transition-colors group"
        >
          {/* Icono de carpeta */}
          <div className="w-14 h-14 bg-gradient-to-br from-green-600 to-green-800 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
            </svg>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium truncate">{playlist.name}</h3>
            <p className="text-sm text-gray-400">
              {playlist.trackCount} canciones - {playlist.totalSizeFormatted}
            </p>
          </div>

          {/* Boton eliminar */}
          <button
            onClick={(e) => handleDelete(playlist.name, e)}
            disabled={deletingPlaylist === playlist.name}
            className="p-2 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
            title="Eliminar playlist"
          >
            {deletingPlaylist === playlist.name ? (
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
          </button>
        </div>
      ))}
    </div>
  )
}
