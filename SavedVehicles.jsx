import React, { useState, useEffect } from 'react';
import { Heart, TrendingUp, TrendingDown, Minus, ExternalLink, Sparkles, Download, Calendar, DollarSign } from 'lucide-react';

export default function SavedVehicles({ onNavigate }) {
  const [savedVehicles, setSavedVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [priceHistoryMap, setPriceHistoryMap] = useState({});
  const [selectedVehicleForDossier, setSelectedVehicleForDossier] = useState(null);
  const [dossierLoading, setDossierLoading] = useState(false);
  const [dossier, setDossier] = useState(null);
  const [showDossier, setShowDossier] = useState(false);

  useEffect(() => {
    fetchSavedVehiclesData();
  }, []);

  const fetchSavedVehiclesData = async () => {
    try {
      setLoading(true);
      // Get saved VINs from localStorage
      const saved = localStorage.getItem('savedVehicleVINs');
      if (saved) {
        const vins = JSON.parse(saved);
        
        if (vins.length === 0) {
          setLoading(false);
          return;
        }

        // Fetch vehicles by specific VINs
        const vinQuery = vins.map(v => `vins=${encodeURIComponent(v)}`).join('&');
        const response = await fetch(`https://vehicle-monitor-bay-area-a782b1271cca.herokuapp.com/api/vehicles?${vinQuery}`);
        const data = await response.json();
        const savedVehiclesList = data.vehicles || [];
        
        console.log(`Fetched ${savedVehiclesList.length} saved vehicles`);
        setSavedVehicles(savedVehiclesList);

        // Fetch price history for each saved VIN
        const historyData = {};
        for (const vin of vins) {
          try {
            const histResponse = await fetch(`https://vehicle-monitor-bay-area-a782b1271cca.herokuapp.com/api/price-history-marketcheck/${vin}`);
            const hist = await histResponse.json();
            historyData[vin] = hist;
          } catch (err) {
            console.error(`Error fetching history for ${vin}:`, err);
            historyData[vin] = null;
          }
        }
        setPriceHistoryMap(historyData);
      } else {
        setLoading(false);
      }
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
      
      // Also remove from price history map
      const newHistoryMap = { ...priceHistoryMap };
      delete newHistoryMap[vin];
      setPriceHistoryMap(newHistoryMap);
    }
  };

  const getPriceTrend = (vin) => {
    const history = priceHistoryMap[vin];
    if (!history || !history.priceHistory || history.priceHistory.length < 2) {
      return { trend: 'flat', change: 0, icon: Minus, percentChange: 0 };
    }

    const change = history.priceChange;
    const percentChange = history.startPrice ? ((change / history.startPrice) * 100).toFixed(2) : 0;

    if (change > 0) {
      return { trend: 'up', change, icon: TrendingUp, percentChange };
    } else if (change < 0) {
      return { trend: 'down', change, icon: TrendingDown, percentChange };
    } else {
      return { trend: 'flat', change: 0, icon: Minus, percentChange: 0 };
    }
  };

  const generateDossier = async (vehicle) => {
    if (!vehicle) return;

    setDossierLoading(true);
    setDossier(null);

    try {
      console.log('Calling backend dossier endpoint...');
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
          daysOnMarket: vehicle.daysOnMarket
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', response.status, errorData);
        throw new Error(`API Error ${response.status}: ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('Dossier response:', data);
      const dossierText = data.dossier;
      setDossier(dossierText);
      setShowDossier(true);
      console.log('Dossier set and displayed');
    } catch (err) {
      console.error('Error generating dossier:', err);
      setDossier(`Failed to generate dossier: ${err.message}`);
      setShowDossier(true);
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
              onClick={(e) => {
                e.preventDefault();
                onNavigate('dashboard');
              }}
              className="text-blue-400 hover:text-blue-300 text-sm font-semibold"
            >
              ← Back to Dashboard
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Heart size={32} className="text-red-500 fill-red-500" />
            <h1 className="text-3xl font-bold text-white">Saved Vehicles</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {savedVehicles.length === 0 ? (
          <div className="text-center py-12">
            <Heart size={48} className="text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg mb-4">No saved vehicles yet</p>
            <p className="text-slate-500">Click the heart button on any vehicle to track its price</p>
          </div>
        ) : (
          <div>
            <p className="text-slate-400 mb-8">Tracking {savedVehicles.length} vehicle{savedVehicles.length !== 1 ? 's' : ''}</p>

            {/* PRICE TRACKING SECTION */}
            <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 rounded-lg p-6 border border-blue-700/50 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <DollarSign size={24} className="text-blue-400" />
                <h2 className="text-2xl font-bold text-white">Price Tracking</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedVehicles.map(vehicle => {
                  const trend = getPriceTrend(vehicle.vin);
                  const TrendIcon = trend.icon;
                  const history = priceHistoryMap[vehicle.vin];

                  return (
                    <div key={vehicle.vin} className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-blue-600 transition">
                      {/* Vehicle Name */}
                      <h3 className="text-white font-semibold mb-3">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </h3>

                      {/* Current Price */}
                      <div className="mb-3">
                        <p className="text-slate-400 text-xs mb-1">Current Price</p>
                        <p className="text-xl font-bold text-green-500">${vehicle.price?.toLocaleString()}</p>
                      </div>

                      {/* Price Trend */}
                      {history && history.priceHistory && history.priceHistory.length > 0 && (
                        <div className="mb-3 pb-3 border-b border-slate-700">
                          <p className="text-slate-400 text-xs mb-2">Price Trend</p>
                          <div className="flex items-center gap-2">
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
                            <div>
                              <p className={`font-bold ${
                                trend.trend === 'up'
                                  ? 'text-red-500'
                                  : trend.trend === 'down'
                                  ? 'text-green-500'
                                  : 'text-slate-400'
                              }`}>
                                {trend.change > 0 ? '+' : ''}{trend.change !== 0 ? `$${Math.abs(trend.change).toLocaleString()}` : 'No change'}
                              </p>
                              {trend.change !== 0 && (
                                <p className="text-slate-400 text-xs">{trend.percentChange}%</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Original Price */}
                      {history && history.startPrice && (
                        <div className="mb-3">
                          <p className="text-slate-400 text-xs mb-1">Original Listing Price</p>
                          <p className="text-white font-semibold">${history.startPrice.toLocaleString()}</p>
                        </div>
                      )}

                      {/* Price History Info */}
                      {history && history.priceHistory && history.priceHistory.length > 0 && (
                        <div className="text-xs text-slate-400 mb-3">
                          <p>📊 {history.priceHistory.length} price snapshots tracked</p>
                        </div>
                      )}

                      {/* Action Button */}
                      <button
                        onClick={() => onNavigate('details', vehicle.vin)}
                        className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition"
                      >
                        View Details
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* VEHICLE RESEARCH & NEGOTIATION DOSSIER SECTION */}
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
                      if (selectedVehicleForDossier && selectedVehicleForDossier.vin) {
                        generateDossier(selectedVehicleForDossier);
                      }
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

            {/* Saved Vehicles List */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white mt-8 mb-4">All Saved Vehicles</h2>
              {savedVehicles.map(vehicle => {
                return (
                  <div
                    key={vehicle.vin}
                    className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-blue-500 transition-all duration-300"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-white font-semibold text-lg">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </h3>
                        <p className="text-slate-500 text-xs font-mono">{vehicle.vin}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {vehicle.url && vehicle.url !== 'N/A' && (
                          <a
                            href={vehicle.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition flex items-center gap-1"
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

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-slate-400">Price</p>
                        <p className="text-white font-semibold">${vehicle.price?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Mileage</p>
                        <p className="text-white font-semibold">{vehicle.mileage?.toLocaleString()} mi</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Color</p>
                        <p className="text-white font-semibold">{vehicle.color || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Transmission</p>
                        <p className="text-white font-semibold">{vehicle.transmission || 'N/A'}</p>
                      </div>
                    </div>
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
