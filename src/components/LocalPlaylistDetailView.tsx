import { useState, useEffect } from 'react'
import {
  LocalPlaylistDetail,
  LocalTrack,
  getLocalPlaylistDetail,
  getLocalDownloadUrl,
  getLocalZipUrl,
  deleteLocalFile,
} from '../services/api'

interface LocalPlaylistDetailViewProps {
  playlistName: string
  onBack: () => void
  onPlayLocal: (playlistName: string, track: LocalTrack, tracks?: LocalTrack[], index?: number) => void
  currentLocalTrack: LocalTrack | null
  isPlaying: boolean
}

export function LocalPlaylistDetailView({
  playlistName,
  onBack,
  onPlayLocal,
  currentLocalTrack,
  isPlaying,
}: LocalPlaylistDetailViewProps) {
  const [playlist, setPlaylist] = useState<LocalPlaylistDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingFile, setDeletingFile] = useState<string | null>(null)

  useEffect(() => {
    loadPlaylist()
  }, [playlistName])

  const loadPlaylist = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getLocalPlaylistDetail(playlistName)
      setPlaylist(data)
    } catch {
      setError('Error al cargar la playlist')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteFile = async (filename: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Eliminar "${filename}"?`)) return

    setDeletingFile(filename)
    try {
      await deleteLocalFile(playlistName, filename)
      if (playlist) {
        setPlaylist({
          ...playlist,
          tracks: playlist.tracks.filter(t => t.filename !== filename),
          trackCount: playlist.trackCount - 1,
        })
      }
    } catch {
      alert('Error al eliminar el archivo')
    } finally {
      setDeletingFile(null)
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
    <div className="w-full max-w-3xl mx-auto px-2 sm:px-0">
      {/* Header - responsive layout */}
      <div className="flex flex-col sm:flex-row items-start gap-4 mb-6">
        {/* Back button + folder icon row on mobile */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onBack}
            className="p-2 text-gray-400 hover:text-white transition-colors flex-shrink-0"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Icono de carpeta - smaller on mobile */}
          <div className="w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-br from-green-600 to-green-800 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-10 h-10 sm:w-16 sm:h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
            </svg>
          </div>

          {/* Info on mobile - next to icon */}
          <div className="flex-1 min-w-0 sm:hidden">
            <h1 className="text-lg font-bold text-white mb-1 truncate">{playlist.name}</h1>
            <p className="text-xs text-gray-400">
              {playlist.trackCount} canciones
            </p>
            <p className="text-xs text-gray-400">
              {playlist.totalSizeFormatted}
            </p>
          </div>
        </div>

        {/* Info on desktop */}
        <div className="hidden sm:block flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-white mb-1">{playlist.name}</h1>
          <p className="text-sm text-gray-400 mb-1">
            {playlist.trackCount} canciones - {playlist.totalSizeFormatted}
          </p>
          <p className="text-xs text-gray-500 truncate" title={playlist.folder}>
            {playlist.folder}
          </p>

          {/* Boton ZIP - desktop */}
          <div className="flex gap-2 mt-3">
            <a
              href={getLocalZipUrl(playlistName)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Descargar ZIP
            </a>
          </div>
        </div>

        {/* Boton ZIP - mobile (full width) */}
        <div className="w-full sm:hidden">
          <a
            href={getLocalZipUrl(playlistName)}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Descargar ZIP
          </a>
        </div>
      </div>

      {/* Lista de canciones */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white mb-3">Canciones</h2>
      </div>

      <div className="space-y-1">
        {playlist.tracks.map((track, index) => {
          const isCurrentTrack = currentLocalTrack?.filename === track.filename
          return (
            <div
              key={track.filename}
              className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg cursor-pointer transition-colors group ${
                isCurrentTrack
                  ? 'bg-green-900/30 border border-green-700'
                  : 'hover:bg-gray-800'
              }`}
              onClick={() => onPlayLocal(playlistName, track, playlist.tracks, index)}
            >
              {/* Icono de reproduccion */}
              <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0">
                {isCurrentTrack && isPlaying ? (
                  <div className="flex items-center gap-0.5">
                    <span className="w-1 h-3 sm:h-4 bg-green-500 animate-pulse" />
                    <span className="w-1 h-4 sm:h-6 bg-green-500 animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <span className="w-1 h-2 sm:h-3 bg-green-500 animate-pulse" style={{ animationDelay: '0.4s' }} />
                  </div>
                ) : (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 group-hover:text-green-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className={`text-sm sm:text-base font-medium truncate ${isCurrentTrack ? 'text-green-400' : 'text-white'}`}>
                  {track.title}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {track.sizeFormatted} - {track.extension.toUpperCase().slice(1)}
                </p>
              </div>

              {/* Botones de accion - always visible on mobile */}
              <div className="flex items-center gap-0 sm:gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                {/* Descargar */}
                <a
                  href={getLocalDownloadUrl(playlistName, track.filename)}
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-green-500 transition-colors"
                  title="Descargar"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>

                {/* Eliminar */}
                <button
                  onClick={(e) => handleDeleteFile(track.filename, e)}
                  disabled={deletingFile === track.filename}
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                  title="Eliminar"
                >
                  {deletingFile === track.filename ? (
                    <svg className="animate-spin w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {playlist.tracks.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No hay canciones en esta carpeta
        </div>
      )}
    </div>
  )
}
