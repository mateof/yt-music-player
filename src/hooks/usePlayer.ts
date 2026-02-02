import { useState, useRef, useCallback, useEffect } from 'react'
import { Song, getStreamUrl } from '../services/api'

export interface PlayerState {
  currentSong: Song | null
  isPlaying: boolean
  isLoading: boolean
  currentTime: number
  duration: number
  volume: number
  error: string | null
}

export function usePlayer(onEnded?: () => void) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const onEndedRef = useRef(onEnded)

  // Keep onEnded ref updated
  useEffect(() => {
    onEndedRef.current = onEnded
  }, [onEnded])

  const [state, setState] = useState<PlayerState>({
    currentSong: null,
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
        error: 'Error al reproducir el audio',
      }))
    })

    audio.addEventListener('canplay', () => {
      setState((prev) => ({ ...prev, isLoading: false }))
    })

    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [])

  const play = useCallback(async (song: Song) => {
    if (!audioRef.current) return

    setState((prev) => ({
      ...prev,
      currentSong: song,
      isLoading: true,
      error: null,
    }))

    try {
      const streamUrl = getStreamUrl(song.videoId)
      audioRef.current.src = streamUrl
      await audioRef.current.play()
      setState((prev) => ({ ...prev, isPlaying: true, isLoading: false }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Error al cargar la cancion',
      }))
    }
  }, [])

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return

    if (state.isPlaying) {
      audioRef.current.pause()
      setState((prev) => ({ ...prev, isPlaying: false }))
    } else {
      audioRef.current.play()
      setState((prev) => ({ ...prev, isPlaying: true }))
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
      currentSong: null,
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
