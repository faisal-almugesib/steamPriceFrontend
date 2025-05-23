import { ThemeProvider } from "@/components/ui/ThemeProvider"
import { ModeToggle } from "@/components/ui/ModeToggle"
import {
  Command,
  CommandInput
} from "@/components/ui/command"
import { useState } from "react"
import { GameDetails } from "@/components/GameDetails"

// An interface in TypeScript is a way to define the shape or structure of an object.
interface GameResult {
  id: number;
  name: string;
  tiny_image: string;
  image: string;
  description?: string; // the optional info will be added when the game is selected
  genres?: string[];
  price?: number;
  release_date?: string;
  developer?: string;
  publisher?: string;
  is_free?: boolean;
  age?: number;
}


function App() {
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<GameResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedGame, setSelectedGame] = useState<GameResult | null>(null)

  const handleSearch = async (value: string) => {
    setSearch(value)
    if (value.length === 0) {
      setResults([])
      return
    }
    
    setLoading(true)
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000'; // Fallback for local development
      const response = await fetch(`${backendUrl}/search?query=${value}`)
      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error('Search failed:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const fetchGameDetails = async (gameId: number) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000'; // Fallback for local development
      const response = await fetch(`${backendUrl}/game-details/${gameId}`)
      const details = await response.json()
      return details
    } catch (error) {
      console.error('Failed to fetch game details:', error)
      return null
    }
  }

  const handleGameSelect = async (game: GameResult) => {
    const details = await fetchGameDetails(game.id)
    if (details) {
      setSelectedGame({ ...game, ...details })
    } else {
      setSelectedGame(game)
    }
  }

  if (selectedGame) {
    return <GameDetails game={selectedGame} onBack={() => setSelectedGame(null)} />
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="absolute top-4 right-4">
          <ModeToggle />
        </div>

        <div className="w-full max-w-2xl rounded-lg border border-gray-700 bg-zinc-900 text-white shadow-lg">
          <div className="border-b border-gray-700">
            <div className="flex items-center space-x-4 p-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search games..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="border-none focus:ring-0"
                />
              </div>
            </div>
          </div>
          {(search.length > 0 || results.length > 0) && (
            <div className="p-4 max-h-[400px] overflow-y-auto">
              {loading && <div className="text-gray-400">Loading...</div>}
              {!loading && results.length === 0 && search.length > 0 && (
                <div className="text-gray-400">No results found.</div>
              )}
              {results.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm text-gray-400 mb-2">Results</div>
                  {results.map((result) => (
                    <div 
                      key={result.id} 
                      className="flex items-center gap-3 p-2 hover:bg-zinc-800 rounded-md cursor-pointer transition-colors"
                      onClick={() => handleGameSelect(result)}
                    >
                      <div className="w-26 h-11">
                        <img src={result.tiny_image} className="w-full h-full rounded-md object-cover" />
                      </div>
                      <span className="text-base font-semibold">{result.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ThemeProvider>
  )
}
 
export default App