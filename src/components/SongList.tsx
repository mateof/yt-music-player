import { Song } from '../services/api'
import { SongCard } from './SongCard'

interface SongListProps {
  songs: Song[]
  currentSong: Song | null
  isPlaying: boolean
  onPlay: (song: Song) => void
  onPodcastClick?: (podcastId: string) => void
  onAddToPlaylist?: (song: Song) => void
  showAddToPlaylist?: boolean
  title?: string
}

export function SongList({ songs, currentSong, isPlaying, onPlay, onPodcastClick, onAddToPlaylist, showAddToPlaylist = false, title }: SongListProps) {
  if (songs.length === 0) {
    return null
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {title && (
        <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
      )}
      <div className="space-y-1">
        {songs.map((song, index) => (
          <SongCard
            key={song.videoId || song.podcastId || index}
            song={song}
            isPlaying={isPlaying}
            isCurrentSong={currentSong?.videoId === song.videoId}
            onPlay={onPlay}
            onPodcastClick={onPodcastClick}
            onAddToPlaylist={onAddToPlaylist}
            showAddToPlaylist={showAddToPlaylist}
          />
        ))}
      </div>
    </div>
  )
}
