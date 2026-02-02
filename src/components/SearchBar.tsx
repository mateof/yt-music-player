import { useState, useEffect, FormEvent } from 'react'
import { SearchType } from '../services/api'

interface SearchBarProps {
  onSearch: (query: string, type: SearchType) => void
  isLoading: boolean
  initialQuery?: string
  initialType?: SearchType
}

const GENRES = ['Pop', 'Rock', 'Hip Hop', 'Electronic', 'Jazz', 'Classical', 'Reggaeton', 'Latin']

const SEARCH_TYPES: { value: SearchType; label: string }[] = [
  { value: 'songs', label: 'Canciones' },
  { value: 'podcasts', label: 'Podcasts' },
]

export function SearchBar({ onSearch, isLoading, initialQuery = '', initialType = 'songs' }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  const [searchType, setSearchType] = useState<SearchType>(initialType)

  useEffect(() => {
    setQuery(initialQuery)
    setSearchType(initialType)
  }, [initialQuery, initialType])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim(), searchType)
    }
  }

  const handleGenreClick = (genre: string) => {
    setSearchType('songs')
    onSearch(genre, 'songs')
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Tabs de tipo de búsqueda */}
      <div className="flex gap-2 mb-4">
        {SEARCH_TYPES.map((type) => (
          <button
            key={type.value}
            onClick={() => setSearchType(type.value)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              searchType === type.value
                ? 'bg-red-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Barra de búsqueda */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchType === 'songs' ? 'Buscar canciones, artistas...' : 'Buscar podcasts...'}
          className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500 transition-colors"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            'Buscar'
          )}
        </button>
      </form>

      {/* Géneros (solo para canciones) */}
      {searchType === 'songs' && (
        <div className="flex flex-wrap gap-2">
          {GENRES.map((genre) => (
            <button
              key={genre}
              onClick={() => handleGenreClick(genre)}
              disabled={isLoading}
              className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm hover:bg-gray-700 hover:text-white disabled:opacity-50 transition-colors"
            >
              {genre}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
