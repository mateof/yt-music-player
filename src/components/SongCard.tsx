import { useState } from 'react'
import { Song, getBackendUrl } from '../services/api'

interface SongCardProps {
  song: Song
  isPlaying: boolean
  isCurrentSong: boolean
  onPlay: (song: Song) => void
  onPodcastClick?: (podcastId: string) => void
  onAddToPlaylist?: (song: Song) => void
  showAddToPlaylist?: boolean
}

export function SongCard({ song, isPlaying, isCurrentSong, onPlay, onPodcastClick, onAddToPlaylist, showAddToPlaylist = false }: SongCardProps) {
  const [downloading, setDownloading] = useState(false)

  const isPodcast = song.type === 'podcast' && song.podcastId

  const handleClick = () => {
    if (isPodcast && onPodcastClick && song.podcastId) {
      onPodcastClick(song.podcastId)
    } else if (song.videoId) {
      onPlay(song)
    }
  }

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!song.videoId) return

    setDownloading(true)

    // Crear un link temporal para descargar
    const link = document.createElement('a')
    link.href = `${getBackendUrl()}/api/download/${song.videoId}`
    link.download = '' // El servidor enviará el nombre del archivo
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Mostrar el spinner por unos segundos
    setTimeout(() => setDownloading(false), 3000)
  }

  return (
    <div
      onClick={handleClick}
      className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all hover:bg-gray-800 ${
        isCurrentSong ? 'bg-gray-800 border border-red-500' : ''
      }`}
    >
      <div className="relative w-14 h-14 flex-shrink-0">
        {song.thumbnail ? (
          <img
            src={song.thumbnail}
            alt={song.title}
            className={`w-full h-full object-cover ${isPodcast ? 'rounded-lg' : 'rounded'}`}
          />
        ) : (
          <div className="w-full h-full bg-gray-700 rounded flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
            </svg>
          </div>
        )}
        {isCurrentSong && isPlaying && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded">
            <div className="flex gap-0.5">
              <span className="w-1 h-4 bg-red-500 animate-pulse" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-4 bg-red-500 animate-pulse" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-4 bg-red-500 animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        {isPodcast && (
          <div className="absolute bottom-0 right-0 bg-purple-600 rounded px-1 text-xs text-white">
            Podcast
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className={`font-medium truncate ${isCurrentSong ? 'text-red-500' : 'text-white'}`}>
          {song.title}
        </h3>
        <p className="text-sm text-gray-400 truncate">{song.artist}</p>
      </div>

      {/* Boton añadir a playlist */}
      {song.videoId && showAddToPlaylist && onAddToPlaylist && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onAddToPlaylist(song)
          }}
          className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-full transition-colors"
          title="Añadir a playlist"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

      {/* Boton de descarga solo si tiene videoId */}
      {song.videoId && (
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50"
          title="Descargar"
        >
          {downloading ? (
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          )}
        </button>
      )}

      {/* Flecha para podcasts */}
      {isPodcast && (
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}

      <span className="text-sm text-gray-500 flex-shrink-0">
        {song.duration || (isPodcast ? '' : '--:--')}
      </span>
    </div>
  )
}
