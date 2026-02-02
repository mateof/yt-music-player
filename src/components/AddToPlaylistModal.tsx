import { useState, useEffect } from 'react'
import {
  Playlist,
  getLibraryPlaylists,
  createPlaylist,
  addSongToPlaylist,
  Song,
} from '../services/api'

interface AddToPlaylistModalProps {
  isOpen: boolean
  onClose: () => void
  song: Song | null
  onSuccess?: () => void
}

export function AddToPlaylistModal({ isOpen, onClose, song, onSuccess }: AddToPlaylistModalProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Estado para crear nueva playlist
  const [showNewPlaylist, setShowNewPlaylist] = useState(false)
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('')
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('')
  const [creatingPlaylist, setCreatingPlaylist] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadPlaylists()
      setSuccessMessage(null)
      setError(null)
    }
  }, [isOpen])

  const loadPlaylists = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getLibraryPlaylists()
      setPlaylists(data)
    } catch {
      setError('Error al cargar las playlists')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToPlaylist = async (playlist: Playlist) => {
    if (!song?.videoId) return

    setAddingTo(playlist.playlistId)
    setError(null)
    setSuccessMessage(null)

    try {
      await addSongToPlaylist(playlist.playlistId, song.videoId)
      setSuccessMessage(`Añadida a "${playlist.title}"`)
      onSuccess?.()
      // Cerrar después de un momento
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err) {
      setError('Error al añadir la canción')
    } finally {
      setAddingTo(null)
    }
  }

  const handleCreatePlaylist = async () => {
    if (!newPlaylistTitle.trim()) {
      setError('El título es requerido')
      return
    }

    setCreatingPlaylist(true)
    setError(null)

    try {
      const result = await createPlaylist(newPlaylistTitle.trim(), newPlaylistDescription)

      // Añadir la canción a la nueva playlist si hay una
      if (song?.videoId && result.playlist?.playlistId) {
        await addSongToPlaylist(result.playlist.playlistId, song.videoId)
        setSuccessMessage(`Playlist creada y canción añadida`)
      } else {
        setSuccessMessage(`Playlist "${newPlaylistTitle}" creada`)
      }

      // Limpiar y recargar
      setNewPlaylistTitle('')
      setNewPlaylistDescription('')
      setShowNewPlaylist(false)
      loadPlaylists()
      onSuccess?.()

      // Cerrar después de un momento
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err) {
      setError('Error al crear la playlist')
    } finally {
      setCreatingPlaylist(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">
              {showNewPlaylist ? 'Nueva Playlist' : 'Añadir a Playlist'}
            </h2>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Info de la cancion */}
          {song && !showNewPlaylist && (
            <div className="flex items-center gap-3 mt-3">
              {song.thumbnail ? (
                <img src={song.thumbnail} alt={song.title} className="w-10 h-10 rounded object-cover" />
              ) : (
                <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                  </svg>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white truncate">{song.title}</p>
                <p className="text-xs text-gray-400 truncate">{song.artist}</p>
              </div>
            </div>
          )}
        </div>

        {/* Mensajes de error/éxito */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mx-4 mt-4 p-3 bg-green-900/50 border border-green-500 rounded-lg text-green-300 text-sm">
            {successMessage}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {showNewPlaylist ? (
            // Formulario de nueva playlist
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nombre</label>
                <input
                  type="text"
                  value={newPlaylistTitle}
                  onChange={(e) => setNewPlaylistTitle(e.target.value)}
                  placeholder="Mi nueva playlist"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Descripción (opcional)</label>
                <textarea
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  placeholder="Descripción de la playlist..."
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500 resize-none"
                />
              </div>
            </div>
          ) : loading ? (
            // Loading
            <div className="flex justify-center py-8">
              <svg className="animate-spin h-8 w-8 text-red-500" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : (
            // Lista de playlists
            <div className="space-y-2">
              {/* Boton crear nueva */}
              <button
                onClick={() => setShowNewPlaylist(true)}
                className="w-full flex items-center gap-3 p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-red-600 rounded flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="text-white font-medium">Crear nueva playlist</span>
              </button>

              {/* Playlists existentes */}
              {playlists.map((playlist) => (
                <button
                  key={playlist.playlistId}
                  onClick={() => handleAddToPlaylist(playlist)}
                  disabled={addingTo !== null}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-700/50 rounded-lg transition-colors disabled:opacity-50"
                >
                  {playlist.thumbnail ? (
                    <img src={playlist.thumbnail} alt={playlist.title} className="w-10 h-10 rounded object-cover" />
                  ) : (
                    <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-white truncate">{playlist.title}</p>
                    <p className="text-xs text-gray-400">{playlist.trackCount} canciones</p>
                  </div>
                  {addingTo === playlist.playlistId && (
                    <svg className="animate-spin h-5 w-5 text-red-500" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                </button>
              ))}

              {playlists.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  No tienes playlists. Crea una nueva.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex gap-3">
          {showNewPlaylist ? (
            <>
              <button
                onClick={() => {
                  setShowNewPlaylist(false)
                  setNewPlaylistTitle('')
                  setNewPlaylistDescription('')
                  setError(null)
                }}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreatePlaylist}
                disabled={creatingPlaylist || !newPlaylistTitle.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {creatingPlaylist ? 'Creando...' : 'Crear'}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
