import { Calendar, DollarSign, Building2, BookOpen } from "lucide-react"
import { PriceHistoryChart } from "./PriceHistoryChart";

interface GameResult {
  id: number;
  name: string;
  tiny_image: string;
  image: string;
  description?: string;
  genres?: string[];
  price?: number;
  release_date?: string;
  developer?: string;
  publisher?: string;
  is_free?: boolean;
  age?: number;
}

interface GameDetailsProps {
  game: GameResult;
  onBack: () => void;
  detailsLoading: boolean;
}

export function GameDetails({ game, onBack, detailsLoading }: GameDetailsProps) {
  const showLoadingState = detailsLoading || !game.description;

  return (
    <div className="min-h-screen text-white p-8">
      <button 
        onClick={onBack}
        className="mb-6 text-gray-400 hover:text-white transition-colors"
      >
        ← Back to Search
      </button>
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <img 
            src={game.image || '/default-game-image.png'}
            alt={`${game.name} image`}
            className={`w-full md:w-68 h-34 rounded-lg ${game.image ? 'object-cover' : 'object-contain'}`}
          />
          <div className="w-full">
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-3xl font-bold">{game.name}</h1>
              {game.age !== undefined && (
                <span className="px-1 py-1 bg-blue-500/20 text-blue-400 rounded-md text-sm font-medium">
                  +{game.age}
                </span>
              )}
            </div>

            {showLoadingState ? (
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-zinc-700 rounded w-1/4"></div>
                <div className="h-4 bg-zinc-700 rounded w-3/4"></div>
                <div className="h-4 bg-zinc-700 rounded w-1/2"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="h-16 bg-zinc-700 rounded-xl"></div>
                  <div className="h-16 bg-zinc-700 rounded-xl"></div>
                  <div className="h-16 bg-zinc-700 rounded-xl"></div>
                  <div className="h-16 bg-zinc-700 rounded-xl"></div>
                </div>
              </div>
            ) : (
              <>
                {game.genres && (
                  <div className="flex gap-2 mb-4">
                    {game.genres.map(genre => (
                      <span key={genre} className="px-3 py-1 bg-zinc-800 rounded-full text-sm">
                        {genre}
                      </span>
                    ))}
                  </div>
                )}
                {game.description && (
                  <p className="text-gray-300 mb-6">{game.description}</p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {!game.is_free && game.price !== undefined && (
                    <div className="flex items-center gap-3 p-4 rounded-xl shadow-lg border border-zinc-700/50 backdrop-blur-sm bg-zinc-800/30">
                      <DollarSign className="w-5 h-5 text-green-400" />
                      <div>
                        <div className="text-sm text-gray-400">Price</div>
                        <div className="font-medium">${game.price.toFixed(2)}</div>
                      </div>
                    </div>
                  )}
                  {game.is_free && (
                    <div className="flex items-center gap-3 p-4 rounded-xl shadow-lg border border-zinc-700/50 backdrop-blur-sm bg-zinc-800/30">
                      <DollarSign className="w-5 h-5 text-green-400" />
                      <div>
                        <div className="text-sm text-gray-400">Price</div>
                        <div className="font-medium">Free to Play</div>
                      </div>
                    </div>
                  )}
                  {game.release_date && (
                    <div className="flex items-center gap-3 p-4 rounded-xl shadow-lg border border-zinc-700/50 backdrop-blur-sm bg-zinc-800/30">
                      <Calendar className="w-5 h-5 text-blue-400" />
                      <div>
                        <div className="text-sm text-gray-400">Release Date</div>
                        <div className="font-medium">{game.release_date}</div>
                      </div>
                    </div>
                  )}
                  {game.developer && (
                    <div className="flex items-center gap-3 p-4 rounded-xl shadow-lg border border-zinc-700/50 backdrop-blur-sm bg-zinc-800/30">
                      <Building2 className="w-5 h-5 text-purple-400" />
                      <div>
                        <div className="text-sm text-gray-400">Developer</div>
                        <div className="font-medium">{game.developer}</div>
                      </div>
                    </div>
                  )}
                  {game.publisher && (
                    <div className="flex items-center gap-3 p-4 rounded-xl shadow-lg border border-zinc-700/50 backdrop-blur-sm bg-zinc-800/30">
                      <BookOpen className="w-5 h-5 text-orange-400" />
                      <div>
                        <div className="text-sm text-gray-400">Publisher</div>
                        <div className="font-medium">{game.publisher}</div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {!game.is_free && !showLoadingState && (
        <>
          <hr className="my-8" />
          <PriceHistoryChart gameId={game.id} currentPrice={game.price} />
        </>
      )}
    </div>
  )
} 