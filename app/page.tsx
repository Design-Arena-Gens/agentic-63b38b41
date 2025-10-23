'use client'

import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import { Search, Download, Upload, ChevronLeft, ChevronRight, X } from 'lucide-react'

type MediaType = 'movie' | 'tv'
type Category = 'watching' | 'planning' | 'watched' | 'dropped'
type FilterType = 'all' | 'movies' | 'tv'

interface WatchlistItem {
  id: string
  title: string
  poster: string
  type: MediaType
  score?: number
  notes?: string
}

interface WatchlistData {
  watching: WatchlistItem[]
  planning: WatchlistItem[]
  watched: WatchlistItem[]
  dropped: WatchlistItem[]
}

const sampleData: WatchlistData = {
  watching: [
    { id: '1', title: 'Breaking Bad', poster: 'https://static.tvmaze.com/uploads/images/medium_portrait/0/2400.jpg', type: 'tv', score: 10 },
    { id: '2', title: 'The Shawshank Redemption', poster: 'https://is1-ssl.mzstatic.com/image/thumb/Video116/v4/88/d3/a9/88d3a9c4-ee0e-5e93-a06e-e0e837b637e6/source/200x200bb.jpg', type: 'movie', score: 9 },
    { id: '3', title: 'Stranger Things', poster: 'https://static.tvmaze.com/uploads/images/medium_portrait/200/501942.jpg', type: 'tv', score: 8 },
  ],
  planning: [
    { id: '4', title: 'The Dark Knight', poster: 'https://is1-ssl.mzstatic.com/image/thumb/Video115/v4/88/87/e7/8887e7e8-fd2d-fe2a-e8b5-c85c8e03748f/source/200x200bb.jpg', type: 'movie' },
    { id: '5', title: 'The Office', poster: 'https://static.tvmaze.com/uploads/images/medium_portrait/481/1204342.jpg', type: 'tv' },
    { id: '6', title: 'Inception', poster: 'https://is1-ssl.mzstatic.com/image/thumb/Video115/v4/e6/16/75/e61675b3-3f3e-d9f1-cf0d-1c9b1a3e1c5c/source/200x200bb.jpg', type: 'movie' },
    { id: '7', title: 'Game of Thrones', poster: 'https://static.tvmaze.com/uploads/images/medium_portrait/498/1245274.jpg', type: 'tv' },
  ],
  watched: [
    { id: '8', title: 'Pulp Fiction', poster: 'https://is1-ssl.mzstatic.com/image/thumb/Video125/v4/5d/ce/3e/5dce3e27-f4e0-7d9f-4f72-12e662f52e22/source/200x200bb.jpg', type: 'movie', score: 10 },
    { id: '9', title: 'Friends', poster: 'https://static.tvmaze.com/uploads/images/medium_portrait/163/408316.jpg', type: 'tv', score: 9 },
    { id: '10', title: 'The Godfather', poster: 'https://is1-ssl.mzstatic.com/image/thumb/Video115/v4/60/38/7c/60387c44-0b8a-2e28-d31c-2d3e9b618c3e/source/200x200bb.jpg', type: 'movie', score: 10 },
  ],
  dropped: [
    { id: '11', title: 'Lost', poster: 'https://static.tvmaze.com/uploads/images/medium_portrait/0/1389.jpg', type: 'tv', score: 5 },
  ],
}

export default function Home() {
  const [watchlist, setWatchlist] = useState<WatchlistData>(sampleData)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)
  const [filters, setFilters] = useState<Record<Category, FilterType>>({
    watching: 'all',
    planning: 'all',
    watched: 'all',
    dropped: 'all',
  })
  const [editingItem, setEditingItem] = useState<{ item: WatchlistItem; category: Category } | null>(null)
  const [manualTitle, setManualTitle] = useState('')
  const [manualPoster, setManualPoster] = useState('')
  const [manualType, setManualType] = useState<MediaType>('movie')

  useEffect(() => {
    const savedData = localStorage.getItem('watchlist')
    if (savedData) {
      setWatchlist(JSON.parse(savedData))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('watchlist', JSON.stringify(watchlist))
  }, [watchlist])

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery.length > 2) {
        searchMedia(searchQuery)
      } else {
        setSearchResults([])
        setShowResults(false)
      }
    }, 300)
    return () => clearTimeout(debounce)
  }, [searchQuery])

  const searchMedia = async (query: string) => {
    try {
      const moviePromise = fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=movie&limit=5`)
      const tvPromise = fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`)

      const [movieRes, tvRes] = await Promise.all([moviePromise, tvPromise])
      const movieData = await movieRes.json()
      const tvData = await tvRes.json()

      const movies = movieData.results?.slice(0, 5).map((item: any) => ({
        id: `movie-${item.trackId}`,
        title: item.trackName,
        poster: item.artworkUrl100?.replace('100x100', '200x200') || '',
        type: 'movie' as MediaType,
      })) || []

      const shows = tvData.slice(0, 5).map((item: any) => ({
        id: `tv-${item.show.id}`,
        title: item.show.name,
        poster: item.show.image?.medium || '',
        type: 'tv' as MediaType,
      }))

      setSearchResults([...movies, ...shows])
      setShowResults(true)
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    }
  }

  const addItem = (item: WatchlistItem, category: Category = 'planning') => {
    const newItem = { ...item, id: `${Date.now()}-${Math.random()}` }
    setWatchlist(prev => ({
      ...prev,
      [category]: [...prev[category], newItem],
    }))
    setSearchQuery('')
    setShowResults(false)
    setManualTitle('')
    setManualPoster('')
  }

  const addManualItem = () => {
    if (!manualTitle) return
    const newItem: WatchlistItem = {
      id: `manual-${Date.now()}`,
      title: manualTitle,
      poster: manualPoster || 'https://via.placeholder.com/200x300/333/fff?text=No+Poster',
      type: manualType,
    }
    addItem(newItem, 'planning')
  }

  const deleteItem = (category: Category, itemId: string) => {
    setWatchlist(prev => ({
      ...prev,
      [category]: prev[category].filter(item => item.id !== itemId),
    }))
    setEditingItem(null)
  }

  const updateItem = (category: Category, itemId: string, updates: Partial<WatchlistItem>) => {
    setWatchlist(prev => ({
      ...prev,
      [category]: prev[category].map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      ),
    }))
  }

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result
    if (!destination) return

    const sourceCategory = source.droppableId as Category
    const destCategory = destination.droppableId as Category

    if (sourceCategory === destCategory) {
      const items = Array.from(watchlist[sourceCategory])
      const [reorderedItem] = items.splice(source.index, 1)
      items.splice(destination.index, 0, reorderedItem)
      setWatchlist(prev => ({ ...prev, [sourceCategory]: items }))
    } else {
      const sourceItems = Array.from(watchlist[sourceCategory])
      const destItems = Array.from(watchlist[destCategory])
      const [movedItem] = sourceItems.splice(source.index, 1)
      destItems.splice(destination.index, 0, movedItem)
      setWatchlist(prev => ({
        ...prev,
        [sourceCategory]: sourceItems,
        [destCategory]: destItems,
      }))
    }
  }

  const exportData = () => {
    const dataStr = JSON.stringify(watchlist, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'watchlist.json'
    link.click()
  }

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string)
          setWatchlist(data)
        } catch (error) {
          alert('Invalid file format')
        }
      }
      reader.readAsText(file)
    }
  }

  const filterItems = (items: WatchlistItem[], filter: FilterType) => {
    if (filter === 'all') return items
    if (filter === 'movies') return items.filter(item => item.type === 'movie')
    if (filter === 'tv') return items.filter(item => item.type === 'tv')
    return items
  }

  const CategorySection = ({ title, category, items }: { title: string; category: Category; items: WatchlistItem[] }) => {
    const filteredItems = filterItems(items, filters[category])

    return (
      <div className="glass rounded-2xl p-6 smooth-transition">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setFilters(prev => ({ ...prev, [category]: 'all' }))}
              className={`px-3 py-1 rounded-lg text-xs smooth-transition ${
                filters[category] === 'all' ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilters(prev => ({ ...prev, [category]: 'movies' }))}
              className={`px-3 py-1 rounded-lg text-xs smooth-transition ${
                filters[category] === 'movies' ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              Movies
            </button>
            <button
              onClick={() => setFilters(prev => ({ ...prev, [category]: 'tv' }))}
              className={`px-3 py-1 rounded-lg text-xs smooth-transition ${
                filters[category] === 'tv' ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              TV
            </button>
          </div>
        </div>
        <Droppable droppableId={category}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`grid grid-cols-4 gap-4 min-h-[200px] p-2 rounded-lg smooth-transition ${
                snapshot.isDraggingOver ? 'bg-white/5' : ''
              }`}
            >
              {filteredItems.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`smooth-transition ${snapshot.isDragging ? 'opacity-50' : ''}`}
                    >
                      <div
                        onClick={() => setEditingItem({ item, category })}
                        className="glass glass-hover rounded-lg overflow-hidden cursor-pointer smooth-transition transform hover:scale-105"
                      >
                        <img
                          src={item.poster}
                          alt={item.title}
                          className="w-full aspect-[2/3] object-cover"
                        />
                        <div className="p-2">
                          <div className="text-sm font-medium truncate">{item.title}</div>
                          {item.score && (
                            <div className="text-xs text-white/60 mt-1">Score: {item.score}/10</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    )
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <div
          className={`glass smooth-transition ${
            sidebarOpen ? 'w-80' : 'w-0'
          } overflow-hidden flex flex-col border-r border-white/10`}
        >
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            <h1 className="text-2xl font-bold">Watchlist</h1>

            {/* Search */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-white/80">Search</h3>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowResults(true)}
                  placeholder="Search movies & TV shows..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-white/30 smooth-transition"
                />
                {showResults && searchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 glass rounded-lg overflow-hidden max-h-96 overflow-y-auto fade-in">
                    {searchResults.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => addItem(item)}
                        className="flex items-center gap-3 p-3 hover:bg-white/10 cursor-pointer smooth-transition border-b border-white/5 last:border-b-0"
                      >
                        <img src={item.poster} alt={item.title} className="w-12 h-16 object-cover rounded" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{item.title}</div>
                          <div className="text-xs text-white/40">{item.type === 'movie' ? 'Movie' : 'TV Show'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Manual Add */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-white/80">Add Manually</h3>
              <input
                type="text"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="Title"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-white/30 smooth-transition"
              />
              <input
                type="text"
                value={manualPoster}
                onChange={(e) => setManualPoster(e.target.value)}
                placeholder="Poster URL (optional)"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-white/30 smooth-transition"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setManualType('movie')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm smooth-transition ${
                    manualType === 'movie' ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  Movie
                </button>
                <button
                  onClick={() => setManualType('tv')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm smooth-transition ${
                    manualType === 'tv' ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  TV
                </button>
              </div>
              <button
                onClick={addManualItem}
                disabled={!manualTitle}
                className="w-full bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/90 disabled:bg-white/20 disabled:text-white/40 smooth-transition"
              >
                Add
              </button>
            </div>

            {/* Import/Export */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-white/80">Data</h3>
              <div className="flex gap-2">
                <button
                  onClick={exportData}
                  className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm smooth-transition"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <label className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm smooth-transition cursor-pointer">
                  <Upload className="w-4 h-4" />
                  Import
                  <input type="file" accept=".json" onChange={importData} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-50 glass rounded-r-lg p-2 smooth-transition hover:bg-white/10"
          style={{ left: sidebarOpen ? '320px' : '0' }}
        >
          {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-2 gap-6 max-w-[1800px] mx-auto">
            <CategorySection title="Currently Watching" category="watching" items={watchlist.watching} />
            <CategorySection title="Planning to Watch" category="planning" items={watchlist.planning} />
            <CategorySection title="Watched" category="watched" items={watchlist.watched} />
            <CategorySection title="Dropped" category="dropped" items={watchlist.dropped} />
          </div>
        </div>

        {/* Edit Panel */}
        {editingItem && (
          <div
            onClick={() => setEditingItem(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-2xl p-8 max-w-md w-full mx-4 fade-in"
            >
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold">{editingItem.item.title}</h3>
                <button
                  onClick={() => setEditingItem(null)}
                  className="hover:bg-white/10 p-2 rounded-lg smooth-transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <img
                src={editingItem.item.poster}
                alt={editingItem.item.title}
                className="w-full aspect-[2/3] object-cover rounded-lg mb-6"
              />

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-white/60 mb-2 block">Title</label>
                  <input
                    type="text"
                    value={editingItem.item.title}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        item: { ...editingItem.item, title: e.target.value },
                      })
                    }
                    onBlur={() =>
                      updateItem(editingItem.category, editingItem.item.id, { title: editingItem.item.title })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-white/30 smooth-transition"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-2 block">Poster URL</label>
                  <input
                    type="text"
                    value={editingItem.item.poster}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        item: { ...editingItem.item, poster: e.target.value },
                      })
                    }
                    onBlur={() =>
                      updateItem(editingItem.category, editingItem.item.id, { poster: editingItem.item.poster })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-white/30 smooth-transition"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-2 block">Score</label>
                  <div className="grid grid-cols-10 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                      <button
                        key={score}
                        onClick={() => {
                          const newItem = { ...editingItem.item, score }
                          setEditingItem({ ...editingItem, item: newItem })
                          updateItem(editingItem.category, editingItem.item.id, { score })
                        }}
                        className={`aspect-square rounded-lg text-sm font-medium smooth-transition ${
                          editingItem.item.score === score
                            ? 'bg-white text-black'
                            : 'bg-white/10 hover:bg-white/20'
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-2 block">Notes</label>
                  <textarea
                    value={editingItem.item.notes || ''}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        item: { ...editingItem.item, notes: e.target.value },
                      })
                    }
                    onBlur={() =>
                      updateItem(editingItem.category, editingItem.item.id, { notes: editingItem.item.notes })
                    }
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-white/30 smooth-transition resize-none"
                    placeholder="Add notes..."
                  />
                </div>

                <button
                  onClick={() => deleteItem(editingItem.category, editingItem.item.id)}
                  className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-lg text-sm font-medium smooth-transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DragDropContext>
  )
}
