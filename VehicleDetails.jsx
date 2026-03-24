import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, DollarSign, Calendar, Gauge, Zap } from 'lucide-react';

export default function VehicleDetails({ vin, onNavigate }) {
  const [vehicle, setVehicle] = useState(null);
  const [priceHistory, setPriceHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tcoAnalysis, setTcoAnalysis] = useState(null);
  const [tcoLoading, setTcoLoading] = useState(false);

  useEffect(() => {
    fetchVehicleDetails();
  }, [vin]);

  const fetchVehicleDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch vehicle data
      const vehiclesResponse = await fetch('https://vehicle-monitor-bay-area-a782b1271cca.herokuapp.com/api/vehicles');
      const vehiclesData = await vehiclesResponse.json();
      const foundVehicle = vehiclesData.vehicles.find(v => v.vin === vin);
      setVehicle(foundVehicle);

      // Fetch price history
      const historyResponse = await fetch(`https://vehicle-monitor-bay-area-a782b1271cca.herokuapp.com/api/price-history-marketcheck/${vin}`);
      const historyData = await historyResponse.json();
      setPriceHistory(historyData);
    } catch (error) {
      console.error('Error fetching details:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTCOAnalysis = async () => {
    if (!vehicle || !vehicle.price) return;

    setTcoLoading(true);
    setTcoAnalysis(null);

    try {
      const downPayment = Math.round(vehicle.price * 0.1);
      const loanAmount = vehicle.price - downPayment;

      const tcoPrompt = `### Request: Comprehensive Total Cost of Ownership (TCO) Analysis
**Vehicle Parameters:**
* **Year/Make/Model:** ${vehicle.year} ${vehicle.make} ${vehicle.model}
* **Trim:** ${vehicle.trim || 'N/A'}
* **Current Mileage:** ${vehicle.mileage?.toLocaleString() || 'Unknown'} miles
* **Transmission:** ${vehicle.transmission || 'Unknown'}
* **Purchase Price:** $${vehicle.price?.toLocaleString()}

**Financing Assumptions:**
* **Structure:** 5-year loan (60 months)
* **Interest Rate:** 5% APR
* **Down Payment:** 10% ($${downPayment.toLocaleString()})
* **Loan Amount:** $${loanAmount.toLocaleString()}

**Analysis Objective:**
Generate a detailed 5-year Total Cost of Ownership (TCO) report. Provide a year-by-year breakdown and a final summary. Please include the following specific categories:

1. **Financing Costs:** Calculate monthly and annual payments, including total interest paid over 60 months.
2. **Depreciation:** Estimate annual depreciation based on historical market data for this specific make, model, and trim.
3. **Maintenance & Repairs:** Estimate annual costs for routine service (oil, brakes, tires) and anticipated repairs for this vehicle's age/mileage.
4. **Resale Value:** Forecast the private party and trade-in value after 5 years and an additional 12,000 miles per year.
5. **Fuel/Insurance Estimates:** Include based on national averages for this vehicle class.

**Output Format:**
Please provide the results in a clean table format followed by a "Bottom Line" summary that calculates the **Effective Monthly Cost** (Total 5-year spend + Depreciation / 60 months).`;

      const response = await fetch('https://vehicle-monitor-bay-area-a782b1271cca.herokuapp.com/api/generate-dossier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          trim: vehicle.trim,
          price: vehicle.price,
          mileage: vehicle.mileage,
          condition: vehicle.condition,
          color: vehicle.color,
          transmission: vehicle.transmission,
          dealerName: vehicle.dealerName,
          daysOnMarket: vehicle.daysOnMarket,
          customPrompt: tcoPrompt
        })
      });

      if (!response.ok) {
        throw new Error(`API Error ${response.status}`);
      }

      const data = await response.json();
      setTcoAnalysis(data.dossier);
    } catch (err) {
      console.error('Error generating TCO analysis:', err);
      setTcoAnalysis(`Failed to generate TCO analysis: ${err.message}`);
    } finally {
      setTcoLoading(false);
    }
  };

  const getPriceTrend = () => {
    if (!priceHistory || priceHistory.priceHistory.length < 2) {
      return { trend: 'flat', change: 0, icon: Minus, percent: 0 };
    }

    const change = priceHistory.priceChange;
    const startPrice = priceHistory.startPrice;
    const percentChange = startPrice ? ((change / startPrice) * 100).toFixed(1) : 0;

    if (change > 0) {
      return { trend: 'up', change, icon: TrendingUp, percent: percentChange };
    } else if (change < 0) {
      return { trend: 'down', change, icon: TrendingDown, percent: percentChange };
    } else {
      return { trend: 'flat', change: 0, icon: Minus, percent: 0 };
    }
  };

  const getKeyPricePoints = () => {
    if (!priceHistory || !priceHistory.priceHistory || priceHistory.priceHistory.length === 0) {
      return [];
    }

    const entries = priceHistory.priceHistory;
    if (entries.length <= 2) {
      return entries;
    }

    // Get first, any middle points with changes, and last
    const keyPoints = [entries[0]];
    
    for (let i = 1; i < entries.length - 1; i++) {
      const prevPrice = entries[i - 1].price;
      const currentPrice = entries[i].price;
      if (prevPrice !== currentPrice) {
        keyPoints.push(entries[i]);
      }
    }
    
    // Add last entry if not already included
    if (keyPoints[keyPoints.length - 1].date !== entries[entries.length - 1].date) {
      keyPoints.push(entries[entries.length - 1]);
    }

    return keyPoints;
  };

  const renderSparkline = () => {
    if (!priceHistory || !priceHistory.priceHistory || priceHistory.priceHistory.length < 2) {
      return null;
    }

    const prices = priceHistory.priceHistory.map(entry => entry.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice || 1;

    const points = prices.map((price, idx) => {
      const normalized = (price - minPrice) / range;
      const x = (idx / (prices.length - 1)) * 100;
      const y = 100 - normalized * 80;
      return `${x},${y}`;
    });

    return (
      <svg viewBox="0 0 100 100" className="w-full h-12" preserveAspectRatio="none">
        <polyline
          points={points.join(' ')}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-slate-400">Loading vehicle details...</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <p className="text-slate-400">Vehicle not found</p>
      </div>
    );
  }

  const trend = getPriceTrend();
  const TrendIcon = trend.icon;
  const keyPoints = getKeyPricePoints();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      {/* Back Button */}
      <button
        onClick={() => onNavigate('dashboard')}
        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-8 font-semibold"
      >
        <ArrowLeft size={20} />
        Back to Dashboard
      </button>

      {/* Vehicle Header */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          {vehicle.year} {vehicle.make} {vehicle.model}
          {vehicle.trim && vehicle.trim !== 'N/A' && ` ${vehicle.trim}`}
        </h1>
        <p className="text-slate-500 text-sm font-mono mb-4">{vin}</p>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Current Price */}
          <div className="bg-green-900/30 rounded p-4 border border-green-700">
            <p className="text-slate-400 text-xs font-semibold mb-1">Current Price</p>
            <p className="text-2xl font-bold text-green-500">${vehicle.price?.toLocaleString()}</p>
          </div>

          {/* Price Trend */}
          <div className={`rounded p-4 border ${
            trend.trend === 'up'
              ? 'bg-red-900/30 border-red-700'
              : trend.trend === 'down'
              ? 'bg-green-900/30 border-green-700'
              : 'bg-slate-900/50 border-slate-600'
          }`}>
            <p className="text-slate-400 text-xs font-semibold mb-1">Price Trend</p>
            <div className="flex items-center gap-2">
              <TrendIcon
                size={24}
                className={
                  trend.trend === 'up'
                    ? 'text-red-500'
                    : trend.trend === 'down'
                    ? 'text-green-500'
                    : 'text-slate-500'
                }
              />
              <div>
                <p className={`font-bold text-lg ${
                  trend.trend === 'up'
                    ? 'text-red-500'
                    : trend.trend === 'down'
                    ? 'text-green-500'
                    : 'text-slate-400'
                }`}>
                  {trend.change > 0 ? '+' : ''}{trend.change !== 0 ? `$${Math.abs(trend.change).toLocaleString()}` : 'No change'}
                </p>
                <p className={`text-xs ${
                  trend.trend === 'up'
                    ? 'text-red-400'
                    : trend.trend === 'down'
                    ? 'text-green-400'
                    : 'text-slate-500'
                }`}>
                  {trend.percent > 0 ? '+' : ''}{trend.percent}%
                </p>
              </div>
            </div>
          </div>

          {/* Mileage */}
          <div className="bg-slate-900/50 rounded p-4 border border-slate-600">
            <p className="text-slate-400 text-xs font-semibold mb-1 flex items-center gap-1">
              <Gauge size={14} /> Mileage
            </p>
            <p className="text-2xl font-bold text-white">{vehicle.mileage?.toLocaleString()} mi</p>
          </div>

          {/* Days on Market */}
          <div className="bg-slate-900/50 rounded p-4 border border-slate-600">
            <p className="text-slate-400 text-xs font-semibold mb-1 flex items-center gap-1">
              <Calendar size={14} /> Days on Market
            </p>
            <p className="text-2xl font-bold text-white">{vehicle.daysOnMarket || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Vehicle Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Specs */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Vehicle Details</h2>
          <div className="space-y-4">
            <div>
              <p className="text-slate-400 text-xs font-semibold mb-1">Condition</p>
              <span className={`text-sm font-semibold px-3 py-1 rounded inline-block ${
                vehicle.condition === 'New' ? 'bg-green-900/30 text-green-400' : 'bg-blue-900/30 text-blue-400'
              }`}>
                {vehicle.condition}
              </span>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold mb-1">Color</p>
              <p className="text-white text-sm">{vehicle.color || 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold mb-1">Transmission</p>
              <p className="text-white text-sm">{vehicle.transmission || 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold mb-1">Year</p>
              <p className="text-white text-sm">{vehicle.year}</p>
            </div>
          </div>
        </div>

        {/* Seller & URL */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Seller Information</h2>
          <div className="space-y-4">
            <div>
              <p className="text-slate-400 text-xs font-semibold mb-1">Seller</p>
              <p className="text-white text-sm">{vehicle.dealerName || 'N/A'}</p>
            </div>
            {vehicle.url && vehicle.url !== 'N/A' && (
              <div>
                <p className="text-slate-400 text-xs font-semibold mb-2">View Listing</p>
                <a
                  href={vehicle.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition inline-block"
                >
                  Open on MarketCheck
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Price History Summary */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Price History Summary</h2>
          <div className="space-y-4">
            <div>
              <p className="text-slate-400 text-xs font-semibold mb-1">Original Price</p>
              <p className="text-white text-lg font-bold">${priceHistory?.startPrice?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold mb-1">Total Change</p>
              <p className={`text-lg font-bold ${
                trend.change > 0 ? 'text-red-500' : trend.change < 0 ? 'text-green-500' : 'text-slate-400'
              }`}>
                {trend.change > 0 ? '+' : ''}{trend.change !== 0 ? `$${Math.abs(trend.change).toLocaleString()}` : 'No change'}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold mb-1">Price Entries</p>
              <p className="text-white text-sm">{priceHistory?.priceHistory?.length || 0} recorded prices</p>
            </div>
          </div>
        </div>
      </div>

      {/* Price History Chart & TCO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Price History */}
        <div className="lg:col-span-2 bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h2 className="text-xl font-bold text-white mb-6">Price History by Tracking Point</h2>
          
          {priceHistory && priceHistory.priceHistory && priceHistory.priceHistory.length > 0 ? (
            <div>
              {/* Sparkline Chart */}
              <div className="mb-6">
                <p className="text-slate-400 text-xs font-semibold mb-2">Price Trend</p>
                <div className="text-blue-500">
                  {renderSparkline()}
                </div>
              </div>

              {/* Price Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left text-slate-400 font-semibold py-2">Date</th>
                      <th className="text-right text-slate-400 font-semibold py-2">Price</th>
                      <th className="text-right text-slate-400 font-semibold py-2">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keyPoints.map((point, idx) => {
                      const prevPrice = idx === 0 ? null : keyPoints[idx - 1].price;
                      const change = prevPrice ? point.price - prevPrice : null;
                      const date = new Date(point.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: '2-digit'
                      });

                      return (
                        <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                          <td className="text-slate-300 py-3">{date}</td>
                          <td className="text-right text-white font-semibold">${point.price?.toLocaleString()}</td>
                          <td className={`text-right font-semibold ${
                            change === null
                              ? 'text-slate-400'
                              : change > 0
                              ? 'text-red-500'
                              : change < 0
                              ? 'text-green-500'
                              : 'text-slate-400'
                          }`}>
                            {change === null ? '—' : (change > 0 ? '+' : '')}{change !== null && change !== 0 ? `$${Math.abs(change).toLocaleString()}` : 'Starting'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-slate-400">No price history available</p>
          )}
        </div>

        {/* Total Cost of Ownership */}
        <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-lg border border-purple-700/50 p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Zap size={20} className="text-purple-400" />
            Total Cost of Ownership
          </h2>
          
          {!tcoAnalysis ? (
            <div className="space-y-4">
              <button
                onClick={generateTCOAnalysis}
                disabled={tcoLoading}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {tcoLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap size={18} />
                    Generate AI Analysis
                  </>
                )}
              </button>
              <div className="bg-slate-800/50 rounded p-4 border border-slate-700">
                <p className="text-slate-400 text-sm mb-3">📊 AI-Powered Analysis</p>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Get a comprehensive 5-year TCO breakdown including financing costs, depreciation, maintenance, insurance, fuel, and resale value projections.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 overflow-y-auto max-h-96">
                <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                  {tcoAnalysis}
                </div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(tcoAnalysis);
                  alert('TCO analysis copied to clipboard!');
                }}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold text-sm"
              >
                📋 Copy Analysis
              </button>
              <button
                onClick={() => setTcoAnalysis(null)}
                className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition font-semibold text-sm"
              >
                Generate New Analysis
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
