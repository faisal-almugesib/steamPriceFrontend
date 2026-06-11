import { useEffect, useState } from "react";

interface PredictionData {
  predicted_price: number;
  predicted_date: string;
  old_price: number; //the price in the latest month in the data
  original_price: number;
  confidence: number | string; // Added confidence field
  fallback?: boolean;
  note?: string;
}

interface DiscountPredictionProps {
  gameId: number; // Add gameId prop
  currentPrice?: number; // Add currentPrice prop
}

export function DiscountPrediction({ gameId, currentPrice }: DiscountPredictionProps) {
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        setLoading(true);
        setError(null);
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000'; // Fallback for local development
        const response = await fetch(`${backendUrl}/predict-discount/${gameId}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: PredictionData = await response.json();
        setPrediction(data);
      } catch (err) {
        console.error("Error fetching prediction:", err);
        setError("Failed to load prediction.");
      } finally {
        setLoading(false);
      }
    };

    if (gameId) {
      fetchPrediction();
    } else {
      setLoading(false);
      setError("No game ID provided.");
    }

  }, [gameId]); // Refetch if gameId changes

  if (loading) {
    return (
      <div className="flex flex-col items-center border border-zinc-700/50 rounded-xl shadow-lg p-6 w-full">
        <div className="text-xl font-semibold text-white">Loading Prediction...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center border border-zinc-700/50 rounded-xl shadow-lg p-6 w-full text-red-400">
        <div className="text-xl font-semibold mb-2">Error</div>
        <div>{error}</div>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="flex flex-col items-center border border-zinc-700/50 rounded-xl shadow-lg p-6 w-full text-gray-400">
        <div className="text-xl font-semibold">No prediction available.</div>
      </div>
    );
  }

  // Calculate the new price based on the fetched old price and predicted discount
  const newPrice = prediction.predicted_price !== undefined && prediction.predicted_price !== null
    ? prediction.predicted_price.toFixed(2)
    : null; // Use null if price is invalid
  
  //we either use the original price passed from props if defined (we get it from steam) or else we use the highest price in historical data passed from historical data endpoint
  const originalPriceToUse = currentPrice !== undefined && currentPrice !== null ? currentPrice : prediction.original_price;
  
  const originalPriceValid = originalPriceToUse !== undefined && originalPriceToUse !== null && originalPriceToUse > 0;
  const oldPriceValid = prediction.old_price !== undefined && prediction.old_price !== null;
  
  let discountDisplay = 'N/A';
  if (originalPriceValid && newPrice !== null) {
    const discount = ((originalPriceToUse - prediction.predicted_price) / originalPriceToUse) * 100;
    if (!isNaN(discount)) {
      discountDisplay = `${discount.toFixed(0)}% off from ($${originalPriceToUse?.toFixed(2) ?? 'N/A'})`;
    }
  } else if (oldPriceValid) { //if we couldn't get the discount we will just show the latest price in the historical data
     discountDisplay = `Price was ${prediction.old_price?.toFixed(2)}`
  }

  // Format the predicted date
  const formatDate = (dateStr: string) => {
    if (!dateStr || typeof dateStr !== 'string') return 'Unknown';
    const [year, month] = dateStr.split('-');
    if (!year || !month) return 'Unknown';
    const monthNames = ["January", "February", "March", "April", "May", "June", 
                       "July", "August", "September", "October", "November", "December"];
    const monthIndex = parseInt(month, 10) - 1;
    if (isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) return 'Unknown';
    return `${monthNames[monthIndex]} ${year}`;
  };
  
  const formattedPredictedDate = formatDate(prediction.predicted_date);

  return (
    <div className="rounded-lg p-8 w-full shadow-lg border">
      <div className="text-lg font-semibold mb-2 text-white">Next Discount Prediction</div>
      {prediction.fallback && (
        <div className="text-xs text-gray-500 mb-2">
          {prediction.note ?? 'Sample estimate — AI prediction API unavailable'}
        </div>
      )}

      {prediction.confidence === "Low - Insufficient data" ? (
        <div className="text-md text-gray-400 mb-2">
          Insufficient data to provide a prediction.
        </div>
      ) : (
        <>
          {newPrice !== null ? (
            <div className="text-3xl font-bold text-green-400 mb-2">
              ${newPrice}
            </div>
          ) : (
            <div className="text-3xl font-bold text-gray-400 mb-2">
              Price unavailable
            </div>
          )}

          <div className="text-md text-gray-300 mb-2">
            {discountDisplay}
          </div>

          {/* Only show predicted date if a percentage discount or predicted price is shown */}
          {discountDisplay !== 'N/A' && !discountDisplay.startsWith('Price was ') && formattedPredictedDate !== 'Unknown' && (
            <div className="text-md text-gray-400">
              Expected around: <span className="font-semibold text-white">{formattedPredictedDate}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
} 