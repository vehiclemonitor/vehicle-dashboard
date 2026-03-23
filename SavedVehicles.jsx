import React, { useState, useEffect } from 'react';
import { Heart, TrendingUp, TrendingDown, Minus, ExternalLink, Sparkles, Download } from 'lucide-react';

export default function SavedVehicles() {
  const [savedVehicles, setSavedVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [priceHistory, setPriceHistory] = useState({});
  const [selectedVehicleForDossier, setSelectedVehicleForDossier] = useState(null);
  const [dossierLoading, setDossierLoading] = useState(false);
  const [dossier, setDossier] = useState(null);
  const [showDossier, setShowDossier] = useState(false);

  useEffect(() => {
    // Get saved VINs from localStorage
    const saved = localStorage.getItem('savedVehicleVINs');
    if (saved) {
      const vins = JSON.parse(saved);
      fetchSavedVehiclesData(vins);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchSavedVehiclesData = async (vins) => {
    try {
      setLoading(true);
      // Fetch all vehicles
      const response = await fetch('https://vehicle-monitor-bay-area-a782b1271cca.herokuapp.com/api/vehicles');
      const data = await response.json();
      const vehicles = data.vehicles || [];

      // Filter to only saved VINs
      const saved = vehicles.filter(v => vins.includes(v.vin));
      setSavedVehicles(saved);

      // Fetch price history for each vehicle
      const historyData = {};
      for (const vin of vins) {
        try {
          const histResponse = await fetch(`https://vehicle-monitor-bay-area-a782b1271cca.herokuapp.com/api/price-history/${vin}`);
          const histData = await histResponse.json();
          historyData[vin] = histData.history || [];
        } catch (err) {
          console.error(`Error fetching history for ${vin}:`, err);
          historyData[vin] = [];
        }
      }
      setPriceHistory(historyData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const removeSaved = (vin) => {
    const saved = localStorage.getItem('savedVehicleVINs');
    if (saved) {
      let vins = JSON.parse(saved);
      vins = vins.filter(v => v !== vin);
      localStorage.setItem('savedVehicleVINs', JSON.stringify(vins));
      setSavedVehicles(savedVehicles.filter(v => v.vin !== vin));
    }
  };

  const getPriceTrend = (vin) => {
    const history = priceHistory[vin];
    if (!history || history.length < 2) {
      return { trend: 'flat', change: 0, icon: Minus };
    }

    // Compare oldest and newest prices
    const oldest = history[0];
    const newest = history[history.length - 1];
    const change = newest.price - oldest.price;
    const percentChange = ((change / oldest.price) * 100).toFixed(2);

    if (change > 0) {
      return { trend: 'up', change, percentChange, icon: TrendingUp };
    } else if (change < 0) {
      return { trend: 'down', change, percentChange, icon: TrendingDown };
    } else {
      return { trend: 'flat', change: 0, percentChange: 0, icon: Minus };
    }
  };

  const generateDossier = async (vehicle) => {
    if (!vehicle) return;

    setDossierLoading(true);
    setDossier(null);

    try {
      // Format vehicle data for Claude
      const vehicleInfo = `
Vehicle Details:
- Year: ${vehicle.year}
- Make: ${vehicle.make}
- Model: ${vehicle.model}
- Trim: ${vehicle.trim || 'N/A'}
- Current Price: $${vehicle.price?.toLocaleString()}
- Mileage: ${vehicle.mileage?.toLocaleString()} miles
- Condition: ${vehicle.condition}
- Color: ${vehicle.color}
- Transmission: ${vehicle.transmission}
- Dealer: ${vehicle.dealerName}

Price History: ${priceHistory[vehicle.vin]?.length || 0} data points available
Days on Market: ${vehicle.daysOnMarket || 'N/A'}
`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.REACT_APP_CLAUDE_API_KEY || 'sk-ant-d01_20250322_830de00_13_minutes_ago_a782b1271cca',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2000,
          messages: [
            {
              role: 'user',
              content: `You are an expert vehicle negotiator and researcher. Based on the following vehicle information, create a comprehensive Vehicle Research & Negotiation Dossier following this structure:

${vehicleInfo}

Please generate a dossier with these sections:

1. MARKET DYNAMICS & INVENTORY
   - Current market pricing context
   - Days of supply analysis (is this car sitting long or selling fast?)
   - Expected depreciation for this model
   - Notable market trends for this vehicle

2. RELIABILITY & RISK FACTORS
   - Common issues for this year/make/model
   - Typical maintenance costs
   - Any known technical service bulletins (TSBs)

3. DEPRECIATION & TCO (3-Year Horizon)
   - Estimated residual value after 36 months
   - Depreciation curve projection
   - Monthly payment estimate at 5.0% APR for 60 months
   - 3-year total cost of ownership breakdown

4. FINANCIAL STRATEGY: LEASE VS. BUY
   - Recommendation for this specific vehicle
   - Tax advantages if applicable

5. NEGOTIATION STRATEGY
   - Data-first talking points based on days on market
   - Pricing leverage points
   - Closing recommendations

Format the response as clear, actionable bullet points. Be specific with numbers and percentages where possible.`
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate dossier');
      }

      const data = await response.json();
      const dossierText = data.content[0].text;
      setDossier(dossierText);
      setShowDossier(true);
    } catch (err) {
      console.error('Error generating dossier:', err);
      setDossier('Failed to generate dossier. Please try again.');
    } finally {
      setDossierLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-slate-400">Loading saved vehicles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-4">
            <a
              href="/"
              className="text-blue-400 hover:text-blue-300 text-sm font-semibold"
            >
              ← Back to Dashboard
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Heart size={32} className="text-red-500 fill-red-500" />
            <div>
              <h1 className="text-4xl font-bold text-white">Saved Vehicles</h1>
              <p className="text-slate-400 mt-1">Track price changes and monitor your favorite vehicles</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-400">Error: {error}</p>
          </div>
        )}

        {savedVehicles.length === 0 ? (
          <div className="text-center py-12">
            <Heart size={48} className="text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg mb-4">No saved vehicles yet</p>
            <p className="text-slate-500">Click the "Save" button on any vehicle to track its price</p>
          </div>
        ) : (
          <div>
            <p className="text-slate-400 mb-6">Tracking {savedVehicles.length} vehicle{savedVehicles.length !== 1 ? 's' : ''}</p>

            {/* Dossier Generator Section */}
            {!showDossier && (
              <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg p-6 border border-purple-700/50 mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles size={24} className="text-purple-400" />
                  <h2 className="text-xl font-bold text-white">AI Research & Negotiation Dossier</h2>
                </div>
                <p className="text-slate-300 mb-4">Generate a comprehensive vehicle research dossier using Claude AI to help negotiate the best deal.</p>
                <select
                  value={selectedVehicleForDossier?.vin || ''}
                  onChange={(e) => {
                    const vehicle = savedVehicles.find(v => v.vin === e.target.value);
                    setSelectedVehicleForDossier(vehicle);
                  }}
                  className="w-full md:w-1/2 px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-purple-500 focus:outline-none mb-4"
                >
                  <option value="">Select a vehicle to analyze...</option>
                  {savedVehicles.map(vehicle => (
                    <option key={vehicle.vin} value={vehicle.vin}>
                      {vehicle.year} {vehicle.make} {vehicle.model} - ${vehicle.price?.toLocaleString()}
                    </option>
                  ))}
                </select>
                {selectedVehicleForDossier && (
                  <button
                    onClick={() => {
                      const vehicle = savedVehicles.find(v => v.vin === selectedVehicleForDossier);
                      if (vehicle) generateDossier(vehicle);
                    }}
                    disabled={dossierLoading}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition font-semibold flex items-center gap-2 disabled:opacity-50"
                  >
                    {dossierLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        Generate Dossier
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Dossier Display Section */}
            {showDossier && dossier && (
              <div className="bg-slate-800 rounded-lg p-6 border border-purple-600/50 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Sparkles size={24} className="text-purple-400" />
                    Vehicle Research Dossier
                  </h2>
                  <button
                    onClick={() => setShowDossier(false)}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition text-sm"
                  >
                    Close
                  </button>
                </div>
                <div className="bg-slate-900 rounded p-4 border border-slate-700 overflow-y-auto max-h-96 text-slate-300 whitespace-pre-wrap text-sm leading-relaxed">
                  {dossier}
                </div>
                <button
                  onClick={() => {
                    // Copy to clipboard
                    navigator.clipboard.writeText(dossier);
                    alert('Dossier copied to clipboard!');
                  }}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2"
                >
                  <Download size={16} />
                  Copy to Clipboard
                </button>
              </div>
            )}

            {/* Saved Vehicles Table */}
            <div className="space-y-4">
              {savedVehicles.map(vehicle => {
                const trend = getPriceTrend(vehicle.vin);
                const TrendIcon = trend.icon;
                const history = priceHistory[vehicle.vin] || [];
                const firstPrice = history.length > 0 ? history[0].price : vehicle.price;
                const priceChange = vehicle.price - firstPrice;

                return (
                  <div
                    key={vehicle.vin}
                    className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-blue-500 transition-all duration-300"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-center">
                      {/* Vehicle Info */}
                      <div className="lg:col-span-4">
                        <h3 className="text-white font-semibold text-lg">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                          {vehicle.trim && vehicle.trim !== 'N/A' && ` ${vehicle.trim}`}
                        </h3>
                        <p className="text-slate-500 text-xs font-mono mt-1">{vehicle.vin}</p>
                        <span className={`text-xs font-semibold px-2 py-1 rounded inline-block mt-2 ${vehicle.condition === 'New' ? 'bg-green-900/30 text-green-400' : 'bg-blue-900/30 text-blue-400'}`}>
                          {vehicle.condition}
                        </span>
                      </div>

                      {/* Current Price */}
                      <div className="bg-green-900/30 rounded p-3 border border-green-700 lg:col-span-2">
                        <p className="text-slate-400 text-xs">Current Price</p>
                        <p className="text-lg font-bold text-green-500">${vehicle.price?.toLocaleString()}</p>
                      </div>

                      {/* Price Change */}
                      <div className="bg-slate-900/50 rounded p-3 border border-slate-600 lg:col-span-2">
                        <p className="text-slate-400 text-xs">Change</p>
                        <div className="flex items-center gap-2 mt-1">
                          <TrendIcon
                            size={20}
                            className={
                              trend.trend === 'up'
                                ? 'text-red-500'
                                : trend.trend === 'down'
                                ? 'text-green-500'
                                : 'text-slate-500'
                            }
                          />
                          <span className={`font-semibold ${
                            trend.trend === 'up'
                              ? 'text-red-500'
                              : trend.trend === 'down'
                              ? 'text-green-500'
                              : 'text-slate-400'
                          }`}>
                            {priceChange > 0 ? '+' : ''}{priceChange !== 0 ? `$${Math.abs(priceChange).toLocaleString()}` : 'No change'}
                          </span>
                        </div>
                      </div>

                      {/* Specs */}
                      <div className="lg:col-span-2">
                        <p className="text-slate-400 text-xs mb-1">Mileage / DOM</p>
                        <p className="text-white text-sm font-semibold">{vehicle.mileage?.toLocaleString()} mi</p>
                        <p className="text-slate-500 text-xs mt-1">{vehicle.daysOnMarket || 'N/A'} days on market</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 lg:col-span-2">
                        {vehicle.url && vehicle.url !== 'N/A' && (
                          <a
                            href={vehicle.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition flex items-center justify-center gap-1"
                          >
                            <ExternalLink size={14} />
                            View
                          </a>
                        )}
                        <button
                          onClick={() => removeSaved(vehicle.vin)}
                          className="px-3 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-sm rounded transition flex items-center gap-1"
                        >
                          <Heart size={14} className="fill-current" />
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Price History Chart (simple) */}
                    {history.length > 1 && (() => {
                      const minPrice = Math.min(...history.map(h => h.price));
                      const maxPrice = Math.max(...history.map(h => h.price));
                      const range = maxPrice - minPrice || 1;
                      return (
                        <div className="mt-3 pt-3 border-t border-slate-700">
                          <p className="text-slate-400 text-xs mb-2">Price History ({history.length} snapshots)</p>
                          <div className="flex items-end gap-1 h-16">
                            {history.map((entry, idx) => {
                              const heightPercent = ((entry.price - minPrice) / range) * 100;
                              return (
                                <div
                                  key={idx}
                                  className="flex-1 bg-blue-500/60 rounded-t hover:bg-blue-400/80 transition cursor-pointer"
                                  style={{ height: `${Math.max(heightPercent, 10)}%` }}
                                  title={`$${entry.price.toLocaleString()}`}
                                />
                              );
                            })}
                          </div>
                          <div className="flex justify-between text-xs text-slate-500 mt-1">
                            <span>${minPrice.toLocaleString()}</span>
                            <span>${maxPrice.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
