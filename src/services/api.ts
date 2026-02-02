import axios, { AxiosInstance } from 'axios'

const STORAGE_KEY = 'yt-music-backend-url'
const DEFAULT_URL = 'http://localhost:8000'

let api: AxiosInstance = createApiInstance(getBackendUrl())

function createApiInstance(baseURL: string): AxiosInstance {
  return axios.create({
    baseURL: baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL,
  })
}

export function getBackendUrl(): string {
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_URL
}

export function setBackendUrl(url: string): void {
  const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url
  localStorage.setItem(STORAGE_KEY, cleanUrl)
  api = createApiInstance(cleanUrl)
}

export async function testConnection(url: string): Promise<boolean> {
  try {
    const testApi = createApiInstance(url)
    await testApi.get('/', { timeout: 5000 })
    return true
  } catch {
    return false
  }
}

export type SearchType = 'songs' | 'podcasts' | 'episodes'

export interface Song {
  videoId: string
  podcastId?: string
  title: string
  artist: string
  thumbnail: string | null
  duration: string | null
  durationSeconds: number
  type?: string
  date?: string
  description?: string
}

export interface Podcast {
  podcastId: string
  title: string
  author: string
  description: string
  thumbnail: string | null
  episodes: Song[]
  type: string
}

export interface SearchResponse {
  results: Song[]
  query?: string
  genre?: string
  type?: SearchType
}

export interface StreamInfo {
  url: string
  contentType: string
  duration: number
  title: string
}

export interface AuthStatus {
  authenticated: boolean
  message: string
}

export interface AuthResponse {
  success: boolean
  message: string
}

export interface Playlist {
  playlistId: string
  title: string
  thumbnail: string | null
  trackCount: number
}

export interface PlaylistDetail {
  playlistId: string
  title: string
  description: string
  trackCount: number
  thumbnail: string | null
  tracks: Song[]
}

export interface LikedSongs {
  title: string
  trackCount: number
  tracks: Song[]
}

export async function searchSongs(query: string, type: SearchType = 'songs'): Promise<Song[]> {
  const response = await api.get<SearchResponse>('/api/search', {
    params: { q: query, type },
  })
  return response.data.results
}

export async function searchByGenre(genre: string): Promise<Song[]> {
  const response = await api.get<SearchResponse>(`/api/search/genre/${genre}`)
  return response.data.results
}

export async function getHome(): Promise<Song[]> {
  const response = await api.get<SearchResponse>('/api/home')
  return response.data.results
}

export async function getPodcastDetails(podcastId: string): Promise<Podcast> {
  const response = await api.get<Podcast>(`/api/podcast/${podcastId}`)
  return response.data
}

export async function getStreamInfo(videoId: string): Promise<StreamInfo> {
  const response = await api.get<StreamInfo>(`/api/stream-info/${videoId}`)
  return response.data
}

export function getStreamUrl(videoId: string): string {
  return `${getBackendUrl()}/api/stream/${videoId}`
}

// ============ Autenticación ============

export async function getAuthStatus(): Promise<AuthStatus> {
  const response = await api.get<AuthStatus>('/api/auth/status')
  return response.data
}

export async function login(headersRaw: string): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/api/auth/login', {
    headers_raw: headersRaw,
  })
  return response.data
}

export async function logout(): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/api/auth/logout')
  return response.data
}

// ============ Biblioteca (requiere autenticación) ============

export async function getLibraryPlaylists(): Promise<Playlist[]> {
  const response = await api.get<{ playlists: Playlist[] }>('/api/library/playlists')
  return response.data.playlists
}

export async function getLikedSongs(limit: number = 100): Promise<LikedSongs> {
  const response = await api.get<LikedSongs>('/api/library/liked-songs', {
    params: { limit },
  })
  return response.data
}

export async function getPlaylistDetail(playlistId: string): Promise<PlaylistDetail> {
  const response = await api.get<PlaylistDetail>(`/api/library/playlist/${playlistId}`)
  return response.data
}

export interface DownloadPlaylistResponse {
  success: boolean
  message: string
  details: {
    total: number
    success: number
    failed: number
    skipped: number
    folder: string
    errors: Array<{ track: string; error: string }>
  }
}

export async function downloadPlaylistToServer(
  playlistName: string,
  tracks: Array<{ videoId: string; title: string }>
): Promise<DownloadPlaylistResponse> {
  const response = await api.post<DownloadPlaylistResponse>('/api/library/download-playlist', {
    playlist_name: playlistName,
    tracks: tracks,
  })
  return response.data
}

// ============ Archivos Locales ============

export interface LocalTrack {
  filename: string
  title: string
  size: number
  sizeFormatted: string
  path: string
  extension: string
}

export interface LocalPlaylist {
  name: string
  folder: string
  trackCount: number
  totalSize: number
  totalSizeFormatted: string
}

export interface LocalPlaylistDetail {
  name: string
  folder: string
  tracks: LocalTrack[]
  trackCount: number
  totalSize: number
  totalSizeFormatted: string
}

export async function getLocalPlaylists(): Promise<LocalPlaylist[]> {
  const response = await api.get<{ playlists: LocalPlaylist[] }>('/api/local/playlists')
  return response.data.playlists
}

export async function getLocalPlaylistDetail(playlistName: string): Promise<LocalPlaylistDetail> {
  const response = await api.get<LocalPlaylistDetail>(`/api/local/playlist/${encodeURIComponent(playlistName)}`)
  return response.data
}

export function getLocalStreamUrl(playlistName: string, filename: string): string {
  return `${getBackendUrl()}/api/local/stream/${encodeURIComponent(playlistName)}/${encodeURIComponent(filename)}`
}

export function getLocalDownloadUrl(playlistName: string, filename: string): string {
  return `${getBackendUrl()}/api/local/download/${encodeURIComponent(playlistName)}/${encodeURIComponent(filename)}`
}

export function getLocalZipUrl(playlistName: string): string {
  return `${getBackendUrl()}/api/local/download-zip/${encodeURIComponent(playlistName)}`
}

export async function deleteLocalPlaylist(playlistName: string): Promise<{ success: boolean; message: string }> {
  const response = await api.delete(`/api/local/playlist/${encodeURIComponent(playlistName)}`)
  return response.data
}

export async function deleteLocalFile(playlistName: string, filename: string): Promise<{ success: boolean; message: string }> {
  const response = await api.delete(`/api/local/playlist/${encodeURIComponent(playlistName)}/${encodeURIComponent(filename)}`)
  return response.data
}

// ============ Gestión de Playlists de YouTube ============

export interface CreatePlaylistResponse {
  success: boolean
  message: string
  playlist: {
    playlistId: string
    title: string
    description: string
    privacy: string
  }
}

export async function createPlaylist(
  title: string,
  description: string = '',
  privacy: 'PRIVATE' | 'PUBLIC' | 'UNLISTED' = 'PRIVATE'
): Promise<CreatePlaylistResponse> {
  const response = await api.post<CreatePlaylistResponse>('/api/library/playlist', {
    title,
    description,
    privacy,
  })
  return response.data
}

export async function addSongToPlaylist(
  playlistId: string,
  videoId: string
): Promise<{ success: boolean; message: string }> {
  const response = await api.post(`/api/library/playlist/${playlistId}/add`, {
    videoId,
  })
  return response.data
}

export async function deletePlaylist(playlistId: string): Promise<{ success: boolean; message: string }> {
  const response = await api.delete(`/api/library/playlist/${playlistId}`)
  return response.data
}

// ============ Podcasts y Canales ============

export interface LibraryPodcast {
  podcastId: string
  title: string
  author: string
  thumbnail: string | null
  type: string
}

export interface LibraryChannel {
  channelId: string
  title: string
  thumbnail: string | null
  type: string
}

export interface ChannelInfo {
  channelId: string
  title: string
  description: string
  thumbnail: string | null
  episodeCount: number
}

export interface ChannelEpisodesResponse {
  episodes: Song[]
  continuation: string | null
  hasMore: boolean
}

export async function getLibraryPodcasts(limit: number = 100): Promise<LibraryPodcast[]> {
  const response = await api.get<{ podcasts: LibraryPodcast[] }>('/api/podcasts/library', {
    params: { limit },
  })
  return response.data.podcasts
}

export async function getLibraryChannels(limit: number = 100): Promise<LibraryChannel[]> {
  const response = await api.get<{ channels: LibraryChannel[] }>('/api/podcasts/channels', {
    params: { limit },
  })
  return response.data.channels
}

export async function getChannelInfo(channelId: string): Promise<ChannelInfo> {
  const response = await api.get<ChannelInfo>(`/api/podcasts/channel/${channelId}`)
  return response.data
}

export async function getChannelEpisodes(
  channelId: string,
  continuation?: string
): Promise<ChannelEpisodesResponse> {
  const response = await api.get<ChannelEpisodesResponse>(
    `/api/podcasts/channel/${channelId}/episodes`,
    { params: continuation ? { continuation } : {} }
  )
  return response.data
}

// ============ Cache ============

export interface CacheSettings {
  retention_days: number
  enabled: boolean
}

export interface CacheStats {
  file_count: number
  total_size: number
  total_size_formatted: string
  settings: CacheSettings
}

export async function getCacheSettings(): Promise<CacheSettings> {
  const response = await api.get<CacheSettings>('/api/cache/settings')
  return response.data
}

export async function saveCacheSettings(settings: CacheSettings): Promise<{ success: boolean; settings: CacheSettings }> {
  const response = await api.post('/api/cache/settings', settings)
  return response.data
}

export async function getCacheStats(): Promise<CacheStats> {
  const response = await api.get<CacheStats>('/api/cache/stats')
  return response.data
}

export async function cleanupCache(): Promise<{ success: boolean; deleted: number; freed_formatted: string }> {
  const response = await api.post('/api/cache/cleanup')
  return response.data
}

export async function clearCache(): Promise<{ success: boolean; deleted: number; freed_formatted: string }> {
  const response = await api.delete('/api/cache/clear')
  return response.data
}
