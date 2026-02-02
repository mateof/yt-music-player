import { useState, useCallback, useMemo } from 'react'
import { Song } from '../services/api'
import { LocalTrack } from '../services/api'

export type RepeatMode = 'off' | 'one' | 'all'

export interface QueueState {
  // Remote songs
  queue: Song[]
  currentIndex: number
  // Local tracks
  localQueue: LocalTrack[]
  localCurrentIndex: number
  localPlaylistName: string | null
  // Shared state
  shuffle: boolean
  repeatMode: RepeatMode
  shuffledIndices: number[]
  localShuffledIndices: number[]
}

export function useQueue() {
  const [state, setState] = useState<QueueState>({
    queue: [],
    currentIndex: -1,
    localQueue: [],
    localCurrentIndex: -1,
    localPlaylistName: null,
    shuffle: false,
    repeatMode: 'off',
    shuffledIndices: [],
    localShuffledIndices: [],
  })

  // Generate shuffled indices for a given length
  const generateShuffledIndices = useCallback((length: number, currentIndex: number): number[] => {
    const indices = Array.from({ length }, (_, i) => i)
    // Fisher-Yates shuffle, keeping current at position 0
    const current = indices.splice(currentIndex, 1)[0]
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]]
    }
    return [current, ...indices]
  }, [])

  // Set queue for remote songs
  const setQueue = useCallback((songs: Song[], startIndex: number = 0) => {
    const shuffledIndices = generateShuffledIndices(songs.length, startIndex)
    setState(prev => ({
      ...prev,
      queue: songs,
      currentIndex: startIndex,
      shuffledIndices,
      // Clear local queue when setting remote
      localQueue: [],
      localCurrentIndex: -1,
      localPlaylistName: null,
    }))
  }, [generateShuffledIndices])

  // Set queue for local tracks
  const setLocalQueue = useCallback((playlistName: string, tracks: LocalTrack[], startIndex: number = 0) => {
    const shuffledIndices = generateShuffledIndices(tracks.length, startIndex)
    setState(prev => ({
      ...prev,
      localQueue: tracks,
      localCurrentIndex: startIndex,
      localPlaylistName: playlistName,
      localShuffledIndices: shuffledIndices,
      // Clear remote queue when setting local
      queue: [],
      currentIndex: -1,
    }))
  }, [generateShuffledIndices])

  // Current song/track
  const currentSong = useMemo(() => {
    if (state.currentIndex < 0 || state.currentIndex >= state.queue.length) return null
    return state.queue[state.currentIndex]
  }, [state.queue, state.currentIndex])

  const currentLocalTrack = useMemo(() => {
    if (state.localCurrentIndex < 0 || state.localCurrentIndex >= state.localQueue.length) return null
    return state.localQueue[state.localCurrentIndex]
  }, [state.localQueue, state.localCurrentIndex])

  // Check if there's a next song
  const hasNext = useMemo(() => {
    const isLocal = state.localCurrentIndex >= 0
    const currentIdx = isLocal ? state.localCurrentIndex : state.currentIndex
    const length = isLocal ? state.localQueue.length : state.queue.length

    if (state.repeatMode === 'all') return length > 0
    if (state.repeatMode === 'one') return length > 0
    return currentIdx < length - 1
  }, [state])

  // Check if there's a previous song
  const hasPrevious = useMemo(() => {
    const isLocal = state.localCurrentIndex >= 0
    const currentIdx = isLocal ? state.localCurrentIndex : state.currentIndex
    const length = isLocal ? state.localQueue.length : state.queue.length

    if (state.repeatMode === 'all') return length > 0
    if (state.repeatMode === 'one') return length > 0
    return currentIdx > 0
  }, [state])

  // Next song
  const next = useCallback((): { song?: Song; localTrack?: LocalTrack; playlistName?: string } | null => {
    const isLocal = state.localCurrentIndex >= 0
    const currentIdx = isLocal ? state.localCurrentIndex : state.currentIndex
    const length = isLocal ? state.localQueue.length : state.queue.length

    if (length === 0) return null

    // Repeat one - return same song
    if (state.repeatMode === 'one') {
      if (isLocal) {
        return { localTrack: state.localQueue[currentIdx], playlistName: state.localPlaylistName || undefined }
      }
      return { song: state.queue[currentIdx] }
    }

    let nextIdx = currentIdx + 1

    // If at end
    if (nextIdx >= length) {
      if (state.repeatMode === 'all') {
        nextIdx = 0
        // Regenerate shuffle when starting over
        if (state.shuffle) {
          if (isLocal) {
            setState(prev => ({
              ...prev,
              localShuffledIndices: generateShuffledIndices(length, 0),
            }))
          } else {
            setState(prev => ({
              ...prev,
              shuffledIndices: generateShuffledIndices(length, 0),
            }))
          }
        }
      } else {
        return null
      }
    }

    const actualIdx = state.shuffle
      ? (isLocal ? state.localShuffledIndices[nextIdx] : state.shuffledIndices[nextIdx])
      : nextIdx

    if (isLocal) {
      setState(prev => ({ ...prev, localCurrentIndex: nextIdx }))
      return { localTrack: state.localQueue[actualIdx], playlistName: state.localPlaylistName || undefined }
    } else {
      setState(prev => ({ ...prev, currentIndex: nextIdx }))
      return { song: state.queue[actualIdx] }
    }
  }, [state, generateShuffledIndices])

  // Previous song
  const previous = useCallback((): { song?: Song; localTrack?: LocalTrack; playlistName?: string } | null => {
    const isLocal = state.localCurrentIndex >= 0
    const currentIdx = isLocal ? state.localCurrentIndex : state.currentIndex
    const length = isLocal ? state.localQueue.length : state.queue.length

    if (length === 0) return null

    // Repeat one - return same song
    if (state.repeatMode === 'one') {
      if (isLocal) {
        return { localTrack: state.localQueue[currentIdx], playlistName: state.localPlaylistName || undefined }
      }
      return { song: state.queue[currentIdx] }
    }

    let prevIdx = currentIdx - 1

    // If at beginning
    if (prevIdx < 0) {
      if (state.repeatMode === 'all') {
        prevIdx = length - 1
      } else {
        return null
      }
    }

    const actualIdx = state.shuffle
      ? (isLocal ? state.localShuffledIndices[prevIdx] : state.shuffledIndices[prevIdx])
      : prevIdx

    if (isLocal) {
      setState(prev => ({ ...prev, localCurrentIndex: prevIdx }))
      return { localTrack: state.localQueue[actualIdx], playlistName: state.localPlaylistName || undefined }
    } else {
      setState(prev => ({ ...prev, currentIndex: prevIdx }))
      return { song: state.queue[actualIdx] }
    }
  }, [state])

  // Toggle shuffle
  const toggleShuffle = useCallback(() => {
    setState(prev => {
      if (!prev.shuffle) {
        // Enabling shuffle - generate new shuffled indices
        const isLocal = prev.localCurrentIndex >= 0
        if (isLocal) {
          return {
            ...prev,
            shuffle: true,
            localShuffledIndices: generateShuffledIndices(prev.localQueue.length, prev.localCurrentIndex),
          }
        } else {
          return {
            ...prev,
            shuffle: true,
            shuffledIndices: generateShuffledIndices(prev.queue.length, prev.currentIndex),
          }
        }
      } else {
        return { ...prev, shuffle: false }
      }
    })
  }, [generateShuffledIndices])

  // Cycle repeat mode: off -> all -> one -> off
  const cycleRepeatMode = useCallback(() => {
    setState(prev => {
      const modes: RepeatMode[] = ['off', 'all', 'one']
      const currentModeIndex = modes.indexOf(prev.repeatMode)
      const nextMode = modes[(currentModeIndex + 1) % modes.length]
      return { ...prev, repeatMode: nextMode }
    })
  }, [])

  // Should repeat current song (for audio ended event)
  const shouldRepeat = useCallback((): boolean => {
    return state.repeatMode === 'one'
  }, [state.repeatMode])

  // Auto-next (for when song ends)
  const autoNext = useCallback((): { song?: Song; localTrack?: LocalTrack; playlistName?: string } | null => {
    if (state.repeatMode === 'one') {
      // Return current song to replay
      const isLocal = state.localCurrentIndex >= 0
      if (isLocal) {
        return {
          localTrack: state.localQueue[state.localCurrentIndex],
          playlistName: state.localPlaylistName || undefined
        }
      }
      return { song: state.queue[state.currentIndex] }
    }
    return next()
  }, [state, next])

  return {
    state,
    setQueue,
    setLocalQueue,
    currentSong,
    currentLocalTrack,
    hasNext,
    hasPrevious,
    next,
    previous,
    toggleShuffle,
    cycleRepeatMode,
    shouldRepeat,
    autoNext,
  }
}
