import { useState, useRef, useCallback, useEffect } from 'react'
import { LocalTrack, getLocalStreamUrl } from '../services/api'

export interface LocalPlayerState {
  currentTrack: LocalTrack | null
  currentPlaylist: string | null
  isPlaying: boolean
  isLoading: boolean
  currentTime: number
  duration: number
  volume: number
  error: string | null
}

export function useLocalPlayer(onEnded?: () => void) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const onEndedRef = useRef(onEnded)

  // Keep onEnded ref updated
  useEffect(() => {
    onEndedRef.current = onEnded
  }, [onEnded])

  const [state, setState] = useState<LocalPlayerState>({
    currentTrack: null,
    currentPlaylist: null,
    isPlaying: false,
    isLoading: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    error: null,
  })

  useEffect(() => {
    const audio = new Audio()
    audioRef.current = audio

    audio.addEventListener('timeupdate', () => {
      setState((prev) => ({ ...prev, currentTime: audio.currentTime }))
    })

    audio.addEventListener('loadedmetadata', () => {
      setState((prev) => ({ ...prev, duration: audio.duration, isLoading: false }))
    })

    audio.addEventListener('ended', () => {
      setState((prev) => ({ ...prev, isPlaying: false, currentTime: 0 }))
      // Call onEnded callback if provided
      if (onEndedRef.current) {
        onEndedRef.current()
      }
    })

    audio.addEventListener('error', () => {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isPlaying: false,
        error: 'Error al reproducir el archivo',
      }))
    })

    audio.addEventListener('canplay', () => {
      setState((prev) => ({ ...prev, isLoading: false }))
    })

    audio.addEventListener('play', () => {
      setState((prev) => ({ ...prev, isPlaying: true }))
    })

    audio.addEventListener('pause', () => {
      setState((prev) => ({ ...prev, isPlaying: false }))
    })

    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [])

  const play = useCallback((playlistName: string, track: LocalTrack) => {
    if (!audioRef.current) return

    setState((prev) => ({
      ...prev,
      currentTrack: track,
      currentPlaylist: playlistName,
      isLoading: true,
      error: null,
    }))

    const url = getLocalStreamUrl(playlistName, track.filename)
    audioRef.current.src = url
    audioRef.current.play().catch(() => {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Error al cargar el archivo',
      }))
    })
  }, [])

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return

    if (state.isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
  }, [state.isPlaying])

  const seek = useCallback((time: number) => {
    if (!audioRef.current) return
    audioRef.current.currentTime = time
    setState((prev) => ({ ...prev, currentTime: time }))
  }, [])

  const setVolume = useCallback((volume: number) => {
    if (!audioRef.current) return
    audioRef.current.volume = volume
    setState((prev) => ({ ...prev, volume }))
  }, [])

  const stop = useCallback(() => {
    if (!audioRef.current) return
    audioRef.current.pause()
    audioRef.current.src = ''
    setState((prev) => ({
      ...prev,
      currentTrack: null,
      currentPlaylist: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
    }))
  }, [])

  return {
    state,
    play,
    togglePlay,
    seek,
    setVolume,
    stop,
  }
}
