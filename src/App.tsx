import { useState, useEffect, useCallback, useRef } from 'react'
import { Routes, Route, useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { SearchBar } from './components/SearchBar'
import { SongList } from './components/SongList'
import { Player } from './components/Player'
import { Settings } from './components/Settings'
import { PodcastView } from './components/PodcastView'
import { LoginModal } from './components/LoginModal'
import { LibraryView } from './components/LibraryView'
import { UserPlaylistView } from './components/UserPlaylistView'
import { LocalPlaylistsView } from './components/LocalPlaylistsView'
import { LocalPlaylistDetailView } from './components/LocalPlaylistDetailView'
import { AddToPlaylistModal } from './components/AddToPlaylistModal'
import { PodcastsLibraryView } from './components/PodcastsLibraryView'
import { ChannelView } from './components/ChannelView'
import { AllPodcastsView } from './components/AllPodcastsView'
import { AllChannelsView } from './components/AllChannelsView'
import { usePlayer } from './hooks/usePlayer'
import { useLocalPlayer } from './hooks/useLocalPlayer'
import { useQueue } from './hooks/useQueue'
import { Song, SearchType, searchSongs, getHome, getBackendUrl, getAuthStatus, logout, LocalTrack } from './services/api'

// Componente para la vista de Home/Search
function HomeView({
  onPlay,
  onPodcastClick,
  onAddToPlaylist,
  playerState,
  isAuthenticated,
}: {
  onPlay: (song: Song, songs: Song[], index: number) => void
  onPodcastClick: (podcastId: string) => void
  onAddToPlaylist: (song: Song) => void
  playerState: { currentSong: Song | null; isPlaying: boolean }
  isAuthenticated: boolean
}) {
  const [searchParams] = useSearchParams()
  const [songs, setSongs] = useState<Song[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const query = searchParams.get('q') || ''
  const type = (searchParams.get('type') as SearchType) || 'songs'

  useEffect(() => {
    const loadContent = async () => {
      setIsSearching(true)
      setError(null)
      try {
        if (query) {
          const results = await searchSongs(query, type)
          setSongs(results)
        } else {
          const results = await getHome()
          setSongs(results)
        }
      } catch {
        setError('Error al cargar contenido. Verifica la configuracion del servidor.')
      } finally {
        setIsSearching(false)
      }
    }
    loadContent()
  }, [query, type])

  const handlePlay = (song: Song) => {
    const index = songs.findIndex(s => s.videoId === song.videoId)
    onPlay(song, songs, index >= 0 ? index : 0)
  }

  const getResultsTitle = () => {
    if (!query) return 'Recomendaciones'
    const typeLabel = type === 'podcasts' ? 'podcasts' : type === 'episodes' ? 'episodios' : 'canciones'
    return `Resultados de ${typeLabel} para "${query}"`
  }

  const getEmptyMessage = () => {
    const typeLabel = type === 'podcasts' ? 'podcasts' : type === 'episodes' ? 'episodios' : 'canciones'
    return `No se encontraron ${typeLabel}. Intenta con otra busqueda.`
  }

  if (isSearching) {
    return (
      <div className="max-w-3xl mx-auto flex justify-center py-12">
        <svg className="animate-spin h-8 w-8 text-red-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
        {error}
      </div>
    )
  }

  return (
    <>
      <SongList
        songs={songs}
        currentSong={playerState.currentSong}
        isPlaying={playerState.isPlaying}
        onPlay={handlePlay}
        onPodcastClick={onPodcastClick}
        onAddToPlaylist={onAddToPlaylist}
        showAddToPlaylist={isAuthenticated}
        title={getResultsTitle()}
      />
      {songs.length === 0 && (
        <div className="max-w-3xl mx-auto text-center py-12 text-gray-500">
          {getEmptyMessage()}
        </div>
      )}
    </>
  )
}

// Wrapper para PodcastView con params
function PodcastViewWrapper({
  onPlay,
  onAddToPlaylist,
  playerState,
  isAuthenticated,
}: {
  onPlay: (song: Song) => void
  onAddToPlaylist: (song: Song) => void
  playerState: { currentSong: Song | null; isPlaying: boolean }
  isAuthenticated: boolean
}) {
  const { podcastId } = useParams<{ podcastId: string }>()
  const navigate = useNavigate()

  if (!podcastId) {
    navigate('/')
    return null
  }

  return (
    <PodcastView
      podcastId={podcastId}
      onBack={() => navigate(-1)}
      onPlay={onPlay}
      currentSong={playerState.currentSong}
      isPlaying={playerState.isPlaying}
      onAddToPlaylist={onAddToPlaylist}
      showAddToPlaylist={isAuthenticated}
    />
  )
}

// Wrapper para LibraryView
function LibraryViewWrapper() {
  const navigate = useNavigate()

  return (
    <LibraryView
      onPlaylistClick={(playlistId) => navigate(`/library/playlist/${playlistId}`)}
      onLikedSongsClick={() => navigate('/library/liked')}
      onBack={() => navigate('/')}
    />
  )
}

// Wrapper para UserPlaylistView
function PlaylistViewWrapper({
  onPlay,
  onAddToPlaylist,
  playerState,
  isAuthenticated,
}: {
  onPlay: (song: Song, songs?: Song[], index?: number) => void
  onAddToPlaylist: (song: Song) => void
  playerState: { currentSong: Song | null; isPlaying: boolean }
  isAuthenticated: boolean
}) {
  const { playlistId } = useParams<{ playlistId: string }>()
  const navigate = useNavigate()

  return (
    <UserPlaylistView
      playlistId={playlistId || null}
      onBack={() => navigate('/library')}
      onPlay={onPlay}
      currentSong={playerState.currentSong}
      isPlaying={playerState.isPlaying}
      onAddToPlaylist={onAddToPlaylist}
      showAddToPlaylist={isAuthenticated}
    />
  )
}

// Wrapper para LocalPlaylistsView
function LocalViewWrapper() {
  const navigate = useNavigate()

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/')}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-white">Descargas Locales</h1>
      </div>
      <LocalPlaylistsView onSelectPlaylist={(name) => navigate(`/local/${encodeURIComponent(name)}`)} />
    </div>
  )
}

// Wrapper para LocalPlaylistDetailView
function LocalPlaylistViewWrapper({
  onPlayLocal,
  localPlayerState,
}: {
  onPlayLocal: (playlistName: string, track: LocalTrack, tracks?: LocalTrack[], index?: number) => void
  localPlayerState: { currentTrack: LocalTrack | null; isPlaying: boolean }
}) {
  const { playlistName } = useParams<{ playlistName: string }>()
  const navigate = useNavigate()

  if (!playlistName) {
    navigate('/local')
    return null
  }

  const decodedName = decodeURIComponent(playlistName)

  return (
    <LocalPlaylistDetailView
      playlistName={decodedName}
      onBack={() => navigate('/local')}
      onPlayLocal={onPlayLocal}
      currentLocalTrack={localPlayerState.currentTrack}
      isPlaying={localPlayerState.isPlaying}
    />
  )
}

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const [showSettings, setShowSettings] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [backendUrl, setBackendUrl] = useState(getBackendUrl())

  // Estado de autenticacion
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // Estado para modal de anadir a playlist
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false)
  const [songToAdd, setSongToAdd] = useState<Song | null>(null)

  // Queue management
  const {
    state: queueState,
    setQueue,
    setLocalQueue,
    hasNext,
    hasPrevious,
    next,
    previous,
    toggleShuffle,
    cycleRepeatMode,
    autoNext,
  } = useQueue()

  // Refs for play functions to avoid circular dependencies
  const playRef = useRef<((song: Song) => void) | null>(null)
  const playLocalRef = useRef<((playlistName: string, track: LocalTrack) => void) | null>(null)

  // Handle song ended - auto advance to next
  const handleSongEnded = useCallback(() => {
    const nextItem = autoNext()
    if (nextItem?.song && playRef.current) {
      playRef.current(nextItem.song)
    } else if (nextItem?.localTrack && nextItem.playlistName && playLocalRef.current) {
      playLocalRef.current(nextItem.playlistName, nextItem.localTrack)
    }
  }, [autoNext])

  const { state: playerState, play, togglePlay, seek, setVolume, stop } = usePlayer(handleSongEnded)
  const {
    state: localPlayerState,
    play: playLocal,
    togglePlay: toggleLocalPlay,
    seek: seekLocal,
    setVolume: setLocalVolume,
    stop: stopLocal,
  } = useLocalPlayer(handleSongEnded)

  // Update refs
  useEffect(() => {
    playRef.current = play
    playLocalRef.current = playLocal
  }, [play, playLocal])

  // Verificar estado de autenticacion al inicio
  const checkAuth = useCallback(async () => {
    setCheckingAuth(true)
    try {
      const status = await getAuthStatus()
      setIsAuthenticated(status.authenticated)
    } catch {
      setIsAuthenticated(false)
    } finally {
      setCheckingAuth(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const handleSearch = (query: string, type: SearchType) => {
    navigate(`/?q=${encodeURIComponent(query)}&type=${type}`)
  }

  const handlePlay = useCallback((song: Song, songs?: Song[], index?: number) => {
    stopLocal()
    if (song.videoId) {
      // Set up queue if songs array is provided
      if (songs && songs.length > 0) {
        const songIndex = index ?? songs.findIndex(s => s.videoId === song.videoId)
        setQueue(songs, songIndex >= 0 ? songIndex : 0)
      }
      play(song)
    }
  }, [stopLocal, setQueue, play])

  const handlePlayLocal = useCallback((playlistName: string, track: LocalTrack, tracks?: LocalTrack[], index?: number) => {
    stop()
    if (localPlayerState.currentTrack?.filename === track.filename && localPlayerState.currentPlaylist === playlistName) {
      toggleLocalPlay()
      return
    }
    // Set up local queue if tracks array is provided
    if (tracks && tracks.length > 0) {
      const trackIndex = index ?? tracks.findIndex(t => t.filename === track.filename)
      setLocalQueue(playlistName, tracks, trackIndex >= 0 ? trackIndex : 0)
    }
    playLocal(playlistName, track)
  }, [stop, localPlayerState, toggleLocalPlay, setLocalQueue, playLocal])

  // Next/Previous handlers
  const handleNext = useCallback(() => {
    const nextItem = next()
    if (nextItem?.song) {
      play(nextItem.song)
    } else if (nextItem?.localTrack && nextItem.playlistName) {
      playLocal(nextItem.playlistName, nextItem.localTrack)
    }
  }, [next, play, playLocal])

  const handlePrevious = useCallback(() => {
    const prevItem = previous()
    if (prevItem?.song) {
      play(prevItem.song)
    } else if (prevItem?.localTrack && prevItem.playlistName) {
      playLocal(prevItem.playlistName, prevItem.localTrack)
    }
  }, [previous, play, playLocal])

  const handlePodcastClick = (podcastId: string) => {
    navigate(`/podcast/${podcastId}`)
  }

  const handleSettingsSave = () => {
    setBackendUrl(getBackendUrl())
    navigate('/')
    checkAuth()
  }

  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = async () => {
    try {
      await logout()
      setIsAuthenticated(false)
      if (location.pathname.startsWith('/library')) {
        navigate('/')
      }
    } catch {
      // Ignorar errores de logout
    }
  }

  const handleLibraryClick = () => {
    if (isAuthenticated) {
      navigate('/library')
    } else {
      setShowLogin(true)
    }
  }

  const handleAddToPlaylist = (song: Song) => {
    if (!isAuthenticated) {
      setShowLogin(true)
      return
    }
    setSongToAdd(song)
    setShowAddToPlaylist(true)
  }

  // Simple play handler for components that don't need queue
  const handleSimplePlay = useCallback((song: Song) => {
    handlePlay(song)
  }, [handlePlay])

  // Determinar vista actual para highlighting
  const isHome = location.pathname === '/'
  const isLibrary = location.pathname.startsWith('/library')
  const isLocal = location.pathname.startsWith('/local')
  const isPodcasts = location.pathname.startsWith('/podcasts') || location.pathname.startsWith('/channel')
  const showSearchBar = isHome

  return (
    <div className="min-h-screen bg-gray-900 pb-32">
      {/* Header */}
      <header className="bg-gradient-to-b from-red-900 to-gray-900 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1
              onClick={() => navigate('/')}
              className="text-3xl font-bold text-white cursor-pointer hover:text-red-400 transition-colors"
            >
              YouTube Music
            </h1>
            <div className="flex items-center gap-2">
              {/* Boton de descargas locales */}
              <button
                onClick={() => navigate('/local')}
                className={`p-2 transition-colors ${
                  isLocal ? 'text-green-400' : 'text-gray-400 hover:text-white'
                }`}
                title="Descargas Locales"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </button>

              {/* Boton de biblioteca */}
              <button
                onClick={handleLibraryClick}
                className={`p-2 transition-colors ${
                  isLibrary ? 'text-red-400' : 'text-gray-400 hover:text-white'
                }`}
                title={isAuthenticated ? 'Tu Biblioteca' : 'Iniciar sesion para ver tu biblioteca'}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </button>

              {/* Boton de podcasts/canales */}
              <button
                onClick={() => isAuthenticated ? navigate('/podcasts') : setShowLogin(true)}
                className={`p-2 transition-colors ${
                  isPodcasts ? 'text-purple-400' : 'text-gray-400 hover:text-white'
                }`}
                title={isAuthenticated ? 'Podcasts y Canales' : 'Iniciar sesion para ver podcasts'}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>

              {/* Boton de login/logout */}
              {!checkingAuth && (
                isAuthenticated ? (
                  <button
                    onClick={handleLogout}
                    className="p-2 text-green-400 hover:text-green-300 transition-colors"
                    title="Cerrar sesion"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowLogin(true)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    title="Iniciar sesion"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </button>
                )
              )}

              {/* Boton de configuracion */}
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title="Configuracion"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
            <span>Servidor: {backendUrl}</span>
            {isAuthenticated && (
              <span className="px-2 py-0.5 bg-green-900/50 text-green-400 rounded-full">
                Conectado
              </span>
            )}
          </div>

          {showSearchBar && (
            <SearchBar
              onSearch={handleSearch}
              isLoading={false}
              initialQuery={searchParams.get('q') || ''}
              initialType={(searchParams.get('type') as SearchType) || 'songs'}
            />
          )}
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-6">
        <Routes>
          <Route
            path="/"
            element={
              <HomeView
                onPlay={handlePlay}
                onPodcastClick={handlePodcastClick}
                onAddToPlaylist={handleAddToPlaylist}
                playerState={playerState}
                isAuthenticated={isAuthenticated}
              />
            }
          />
          <Route
            path="/podcast/:podcastId"
            element={
              <PodcastViewWrapper
                onPlay={handleSimplePlay}
                onAddToPlaylist={handleAddToPlaylist}
                playerState={playerState}
                isAuthenticated={isAuthenticated}
              />
            }
          />
          <Route path="/library" element={<LibraryViewWrapper />} />
          <Route
            path="/library/liked"
            element={
              <PlaylistViewWrapper
                onPlay={handlePlay}
                onAddToPlaylist={handleAddToPlaylist}
                playerState={playerState}
                isAuthenticated={isAuthenticated}
              />
            }
          />
          <Route
            path="/library/playlist/:playlistId"
            element={
              <PlaylistViewWrapper
                onPlay={handlePlay}
                onAddToPlaylist={handleAddToPlaylist}
                playerState={playerState}
                isAuthenticated={isAuthenticated}
              />
            }
          />
          <Route path="/local" element={<LocalViewWrapper />} />
          <Route
            path="/local/:playlistName"
            element={
              <LocalPlaylistViewWrapper
                onPlayLocal={handlePlayLocal}
                localPlayerState={localPlayerState}
              />
            }
          />
          {/* Podcasts y Canales */}
          <Route path="/podcasts" element={<PodcastsLibraryView />} />
          <Route path="/podcasts/all" element={<AllPodcastsView />} />
          <Route path="/channels/all" element={<AllChannelsView />} />
          <Route
            path="/channel/:channelId"
            element={
              <ChannelView
                onPlay={handleSimplePlay}
                onAddToPlaylist={handleAddToPlaylist}
                currentSong={playerState.currentSong}
                isPlaying={playerState.isPlaying}
                showAddToPlaylist={isAuthenticated}
              />
            }
          />
        </Routes>
      </main>

      {/* Player */}
      <Player
        state={playerState}
        onTogglePlay={togglePlay}
        onSeek={seek}
        onVolumeChange={setVolume}
        localState={localPlayerState}
        onLocalTogglePlay={toggleLocalPlay}
        onLocalSeek={seekLocal}
        onLocalVolumeChange={setLocalVolume}
        // Queue controls
        onNext={handleNext}
        onPrevious={handlePrevious}
        hasNext={hasNext}
        hasPrevious={hasPrevious}
        shuffle={queueState.shuffle}
        onToggleShuffle={toggleShuffle}
        repeatMode={queueState.repeatMode}
        onCycleRepeat={cycleRepeatMode}
      />

      {/* Settings Modal */}
      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={handleSettingsSave}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSuccess={handleLoginSuccess}
      />

      {/* Add to Playlist Modal */}
      <AddToPlaylistModal
        isOpen={showAddToPlaylist}
        onClose={() => {
          setShowAddToPlaylist(false)
          setSongToAdd(null)
        }}
        song={songToAdd}
      />
    </div>
  )
}

export default App
