import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { DiscountPrediction } from "./DiscountPrediction"



interface PriceHistoryData {
  title: string;
  history: {
    date: string;
    price: number;
    store: string;
  }[];
  lowest_price: {
    price: number;
    store: string;
    date: string;
  };
  fallback?: boolean;
  note?: string;
}

interface PriceHistoryChartProps {
  gameId: number;
  currentPrice?: number;
}

export function PriceHistoryChart({ gameId, currentPrice }: PriceHistoryChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  // Ref for the tooltip element
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Add state for data, loading, and error
  const [priceHistoryData, setPriceHistoryData] = useState<PriceHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPriceHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        // Fetch data from the price history endpoint
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000'; // Fallback for local development
        const response = await fetch(`${backendUrl}/price-history/${gameId}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: PriceHistoryData = await response.json();
        setPriceHistoryData(data);
      } catch (err) {
        console.error("Error fetching price history:", err);
        setError("Failed to load price history.");
      } finally {
        setLoading(false);
      }
    };

    if (gameId) {
      fetchPriceHistory();
    } else {
      setLoading(false);
      setError("No game ID provided.");
    }

  }, [gameId]); // Refetch if gameId changes

  useEffect(() => {
    if (!svgRef.current || !priceHistoryData) return

    // Clear any existing chart
    d3.select(svgRef.current).selectAll("*").remove()

    // Set up dimensions
    const margin = { top: 60, right: 30, bottom: 40, left: 40 }
    const width = 1200 - margin.left - margin.right
    const height = 400 - margin.top - margin.bottom

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    // Create scales
    const x = d3.scalePoint()
      .domain(priceHistoryData.history.map(d => d.date))
      .range([0, width])
      .padding(0.5)

    const maxPrice = d3.max(priceHistoryData.history, d => d.price)!
    const y = d3.scaleLinear()
      .domain([0, maxPrice])
      .range([height, 0])

    // Add X axis
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end")
      .style("fill", "#9ca3af")

    // Add Y axis
    svg.append("g")
      .call(d3.axisLeft(y).ticks(5))
      .style("color", "#9ca3af")

    // Add the line
    const line = d3.line<typeof priceHistoryData.history[0]>()
      .x(d => x(d.date)!)
      .y(d => y(d.price))
      .curve(d3.curveMonotoneX)

    svg.append("path")
      .datum(priceHistoryData.history)
      .attr("fill", "none")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2)
      .attr("d", line)

    // Add dots
    svg.selectAll("circle")
      .data(priceHistoryData.history)
      .enter()
      .append("circle")
      .attr("cx", d => x(d.date)!)
      .attr("cy", d => y(d.price))
      .attr("r", 5) 
      .attr("fill", "#ffffff")
      .attr("cursor", "pointer") // Indicate interactivity
      .on("mouseover", (event, d) => { //d is our point
        // Show tooltip on hover
        const tooltip = d3.select(tooltipRef.current);
        tooltip.style("opacity", 1).style("display", "block")
          .html(`
            <div className="text-sm font-semibold">${d.store}</div>
            <div className="text-xs text-gray-400">${d.date}: $${d.price.toFixed(2)}</div>
          `)
          // Position near cursor, relative to the container
          .style("left", (event.offsetX + 10) + "px") 
          .style("top", (event.offsetY - 20) + "px");
      })
      .on("mouseout", () => {
        // Hide tooltip on mouse out
        d3.select(tooltipRef.current).style("opacity", 0).style("display", "none"); // Hide by setting display to none
      });

    // Add price labels
    svg.selectAll("text.price-label")
      .data(priceHistoryData.history)
      .enter()
      .append("text")
      .attr("class", "price-label")
      .attr("x", d => x(d.date)!)
      .attr("y", d => y(d.price) - (maxPrice * 0.25))
      .attr("text-anchor", "middle")
      .attr("fill", "#ffffff")
      .text(d => `$${d.price}`)
  }, [priceHistoryData]) // Redraw chart when data changes

  // Calculate discount percentage relative to the original price (currentPrice)
  const originalPriceForLowestDiscount = currentPrice !== undefined && currentPrice !== null && currentPrice > 0 ? currentPrice : null;

  let lowestDiscountDisplay = 'N/A';
  if (priceHistoryData && priceHistoryData.lowest_price && originalPriceForLowestDiscount !== null) {
     const discountFromOriginal = ((originalPriceForLowestDiscount - priceHistoryData.lowest_price.price) / originalPriceForLowestDiscount) * 100;
     if (!isNaN(discountFromOriginal)) {
        lowestDiscountDisplay = `${discountFromOriginal.toFixed(0)}% off from ($${currentPrice})`;
     }
  }

  const [year, month] = priceHistoryData ? priceHistoryData.lowest_price.date.split('-') : ['', ''];
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  const lowestMonthYear = priceHistoryData && month ? `${monthNames[parseInt(month, 10) - 1]} ${year}` : 'N/A';

  if (loading) {
    return <div className="mt-8 text-white text-center">Loading price history...</div>;
  }

  if (error) {
    return <div className="mt-8 text-red-400 text-center">Error: {error}</div>;
  }

  if (!priceHistoryData || priceHistoryData.history.length === 0) {
    return <div className="mt-8 text-gray-400 text-center">No price history data available.</div>;
  }

  if (priceHistoryData.history.length === 1) {
    return <div className="mt-8 text-gray-400 text-center">Insufficient historical data to display a chart.</div>;
  }

  return (
    // this is the divs structure
    // [OUTER flex flex-col] 
    // |
    // |-- [Title: "Price History"]
    // |
    // |-- [INNER flex-row: chart | indicator]
    <div className="mt-8 flex flex-col items-center w-full">
      <h2 className="text-xl font-semibold mb-4 text-white">{priceHistoryData.title} Price History</h2>
      <div className="flex flex-col md:flex-row w-full justify-center gap-8 relative"> {/* Added relative positioning */}
        {/* Chart on the left */}
        <div className="rounded-lg p-4 bg-transparent w-full md:w-auto overflow-x-auto">
          <svg ref={svgRef}></svg>
          {priceHistoryData.fallback && (
            <p className="text-xs text-gray-500 mt-1 text-center">
              {priceHistoryData.note ?? 'Sample data — live price API unavailable'}
            </p>
          )}
        </div>
        {/* Indicator and prediction stacked on the right */}
        <div className="flex flex-col items-start gap-1 w-full md:w-[320px] mt-4 md:mt-[-50px]">
          <div className="rounded-lg p-8 w-full shadow-lg border">
            <div className="text-lg font-semibold mb-2 text-white">Lowest Price</div>
            {/* Use lowest_price from API */}
            <div className="text-3xl font-bold text-green-400 mb-2">${priceHistoryData.lowest_price.price.toFixed(2)}</div>
            {/* Show discount relative to original price if available */}
            <div className="text-md text-gray-300 mb-2">{lowestDiscountDisplay}</div>
            <div className="text-md text-gray-400">Occurred: <span className="font-semibold text-white">{lowestMonthYear}</span></div>
          </div>
          <div className="w-full">
            <DiscountPrediction gameId={gameId} currentPrice={currentPrice} />
          </div>
        </div>

        {/* Tooltip element */}
        <div 
          ref={tooltipRef}
          className="tooltip absolute bg-zinc-800 text-white p-2 rounded-md shadow-lg opacity-0 pointer-events-none transition-opacity duration-200"
          style={{ zIndex: 100, display: 'none' }} 
        ></div>

      </div>
    </div>
  )
} 