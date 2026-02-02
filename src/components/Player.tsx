import { useState } from 'react'
import { PlayerState } from '../hooks/usePlayer'
import { LocalPlayerState } from '../hooks/useLocalPlayer'
import { RepeatMode } from '../hooks/useQueue'
import { getBackendUrl, getLocalDownloadUrl } from '../services/api'

interface PlayerProps {
  state: PlayerState
  onTogglePlay: () => void
  onSeek: (time: number) => void
  onVolumeChange: (volume: number) => void
  // Props para reproductor local
  localState?: LocalPlayerState
  onLocalTogglePlay?: () => void
  onLocalSeek?: (time: number) => void
  onLocalVolumeChange?: (volume: number) => void
  // Queue controls
  onNext?: () => void
  onPrevious?: () => void
  hasNext?: boolean
  hasPrevious?: boolean
  shuffle?: boolean
  onToggleShuffle?: () => void
  repeatMode?: RepeatMode
  onCycleRepeat?: () => void
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function Player({
  state,
  onTogglePlay,
  onSeek,
  onVolumeChange,
  localState,
  onLocalTogglePlay,
  onLocalSeek,
  onLocalVolumeChange,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false,
  shuffle = false,
  onToggleShuffle,
  repeatMode = 'off',
  onCycleRepeat,
}: PlayerProps) {
  const [downloading, setDownloading] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Determinar que reproductor esta activo
  const isLocalActive = localState?.currentTrack !== null && localState?.currentTrack !== undefined
  const isRemoteActive = state.currentSong !== null

  // Usar el estado activo
  const activeIsLocal = isLocalActive
  const currentTitle = activeIsLocal ? localState?.currentTrack?.title : state.currentSong?.title
  const currentArtist = activeIsLocal ? localState?.currentPlaylist : state.currentSong?.artist
  const currentThumbnail = activeIsLocal ? null : state.currentSong?.thumbnail
  const isPlaying = activeIsLocal ? localState?.isPlaying : state.isPlaying
  const isLoading = activeIsLocal ? localState?.isLoading : state.isLoading
  const currentTime = activeIsLocal ? (localState?.currentTime || 0) : state.currentTime
  const duration = activeIsLocal ? (localState?.duration || 0) : state.duration
  const volume = activeIsLocal ? (localState?.volume || 1) : state.volume
  const error = activeIsLocal ? localState?.error : state.error

  const handleTogglePlay = () => {
    if (activeIsLocal && onLocalTogglePlay) {
      onLocalTogglePlay()
    } else {
      onTogglePlay()
    }
  }

  const handleSeek = (time: number) => {
    if (activeIsLocal && onLocalSeek) {
      onLocalSeek(time)
    } else {
      onSeek(time)
    }
  }

  const handleVolumeChange = (vol: number) => {
    if (activeIsLocal && onLocalVolumeChange) {
      onLocalVolumeChange(vol)
    } else {
      onVolumeChange(vol)
    }
  }

  const handleDownload = () => {
    if (activeIsLocal && localState?.currentTrack && localState?.currentPlaylist) {
      const link = document.createElement('a')
      link.href = getLocalDownloadUrl(localState.currentPlaylist, localState.currentTrack.filename)
      link.download = localState.currentTrack.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else if (state.currentSong?.videoId) {
      setDownloading(true)
      const link = document.createElement('a')
      link.href = `${getBackendUrl()}/api/download/${state.currentSong.videoId}`
      link.download = ''
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setTimeout(() => setDownloading(false), 3000)
    }
  }

  const getRepeatIcon = () => {
    if (repeatMode === 'one') {
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
          <text x="12" y="14" textAnchor="middle" fontSize="8" fill="currentColor">1</text>
        </svg>
      )
    }
    return (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
      </svg>
    )
  }

  if (!isLocalActive && !isRemoteActive) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4">
        <div className="max-w-3xl mx-auto text-center text-gray-500">
          Selecciona una cancion para reproducir
        </div>
      </div>
    )
  }

  // Fullscreen player view
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-gray-800 to-gray-900 z-50 flex flex-col">
        {/* Header with close button */}
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setIsFullscreen(false)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <span className="text-sm text-gray-400">Reproduciendo</span>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            {downloading ? (
              <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
          </button>
        </div>

        {/* Album art */}
        <div className="flex-1 flex items-center justify-center p-8">
          {currentThumbnail ? (
            <img
              src={currentThumbnail}
              alt={currentTitle || ''}
              className="w-64 h-64 sm:w-80 sm:h-80 object-cover rounded-lg shadow-2xl"
            />
          ) : (
            <div className={`w-64 h-64 sm:w-80 sm:h-80 rounded-lg shadow-2xl flex items-center justify-center ${
              activeIsLocal ? 'bg-gradient-to-br from-green-600 to-green-800' : 'bg-gradient-to-br from-red-600 to-red-800'
            }`}>
              {activeIsLocal ? (
                <svg className="w-24 h-24 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                </svg>
              ) : (
                <svg className="w-24 h-24 text-white/80" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                </svg>
              )}
            </div>
          )}
        </div>

        {/* Song info and controls */}
        <div className="p-6 pb-8">
          {error && (
            <div className="text-red-500 text-sm text-center mb-4">{error}</div>
          )}

          {/* Title and artist */}
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white truncate">{currentTitle}</h2>
            <p className="text-gray-400 truncate">
              {activeIsLocal && <span className="text-green-400 mr-1">[Local]</span>}
              {currentArtist}
            </p>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={(e) => handleSeek(parseFloat(e.target.value))}
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                activeIsLocal ? 'accent-green-500' : 'accent-red-500'
              }`}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main controls */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 mb-6">
            {/* Shuffle */}
            <button
              onClick={onToggleShuffle}
              className={`p-2 transition-colors ${
                shuffle
                  ? (activeIsLocal ? 'text-green-400' : 'text-red-400')
                  : 'text-gray-400 hover:text-white'
              }`}
              title={shuffle ? 'Desactivar aleatorio' : 'Activar aleatorio'}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
              </svg>
            </button>

            {/* Previous */}
            <button
              onClick={onPrevious}
              disabled={!hasPrevious}
              className="p-2 text-white hover:text-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
              </svg>
            </button>

            {/* Play/Pause */}
            <button
              onClick={handleTogglePlay}
              disabled={isLoading}
              className={`w-16 h-16 rounded-full flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 ${
                activeIsLocal ? 'bg-green-500' : 'bg-white'
              }`}
            >
              {isLoading ? (
                <svg className="animate-spin h-8 w-8 text-gray-900" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : isPlaying ? (
                <svg className="w-8 h-8 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
              ) : (
                <svg className="w-8 h-8 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>

            {/* Next */}
            <button
              onClick={onNext}
              disabled={!hasNext}
              className="p-2 text-white hover:text-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
              </svg>
            </button>

            {/* Repeat */}
            <button
              onClick={onCycleRepeat}
              className={`p-2 transition-colors ${
                repeatMode !== 'off'
                  ? (activeIsLocal ? 'text-green-400' : 'text-red-400')
                  : 'text-gray-400 hover:text-white'
              }`}
              title={
                repeatMode === 'off' ? 'Repetir todo' :
                repeatMode === 'all' ? 'Repetir una' :
                'No repetir'
              }
            >
              {getRepeatIcon()}
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center justify-center gap-3">
            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className={`w-32 ${activeIsLocal ? 'accent-green-500' : 'accent-red-500'}`}
            />
          </div>
        </div>
      </div>
    )
  }

  // Mini player (normal view)
  return (
    <div className={`fixed bottom-0 left-0 right-0 border-t p-3 sm:p-4 ${
      activeIsLocal ? 'bg-gray-900 border-green-800' : 'bg-gray-900 border-gray-800'
    }`}>
      <div className="max-w-3xl mx-auto">
        {error && (
          <div className="text-red-500 text-sm text-center mb-2">{error}</div>
        )}

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Song info - clickable to expand */}
          <button
            onClick={() => setIsFullscreen(true)}
            className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 text-left"
          >
            {currentThumbnail ? (
              <img
                src={currentThumbnail}
                alt={currentTitle || ''}
                className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded"
              />
            ) : (
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded flex items-center justify-center ${
                activeIsLocal ? 'bg-green-800' : 'bg-gray-700'
              }`}>
                {activeIsLocal ? (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                  </svg>
                )}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="text-sm sm:text-base font-medium text-white truncate">{currentTitle}</h4>
              <p className="text-xs sm:text-sm text-gray-400 truncate">
                {activeIsLocal && <span className="text-green-400 mr-1">[Local]</span>}
                {currentArtist}
              </p>
            </div>
            {/* Expand icon */}
            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>

          {/* Controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Previous - hidden on small screens */}
            <button
              onClick={onPrevious}
              disabled={!hasPrevious}
              className="hidden sm:block p-1.5 text-white hover:text-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
              </svg>
            </button>

            {/* Play/Pause */}
            <button
              onClick={handleTogglePlay}
              disabled={isLoading}
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 ${
                activeIsLocal ? 'bg-green-500' : 'bg-white'
              }`}
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 sm:h-6 sm:w-6 text-gray-900" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : isPlaying ? (
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
              ) : (
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>

            {/* Next - hidden on small screens */}
            <button
              onClick={onNext}
              disabled={!hasNext}
              className="hidden sm:block p-1.5 text-white hover:text-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
              </svg>
            </button>
          </div>

          {/* Volume - hidden on mobile */}
          <div className="hidden md:flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className={`w-16 ${activeIsLocal ? 'accent-green-500' : 'accent-red-500'}`}
            />
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-gray-400 w-8 text-right">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={(e) => handleSeek(parseFloat(e.target.value))}
            className={`flex-1 h-1 ${activeIsLocal ? 'accent-green-500' : 'accent-red-500'}`}
          />
          <span className="text-xs text-gray-400 w-8">{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  )
}
