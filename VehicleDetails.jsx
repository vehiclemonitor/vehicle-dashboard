import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, DollarSign, Calendar, Gauge, Zap } from 'lucide-react';

export default function VehicleDetails({ vin, onNavigate }) {
  const [vehicle, setVehicle] = useState(null);
  const [priceHistory, setPriceHistory] = useState(null);
  const [loading, setLoading] = useState(true);

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
          <div className="space-y-6">
            <div className="bg-slate-800/50 rounded p-4 border border-slate-700">
              <p className="text-slate-400 text-sm mb-3">Coming Soon</p>
              <p className="text-slate-500 text-xs leading-relaxed">
                Comprehensive TCO analysis including insurance estimates, maintenance costs, depreciation projections, and financing scenarios will be available here.
              </p>
            </div>
            <div className="space-y-2 text-xs text-slate-400">
              <p>📊 Insurance Cost Estimates</p>
              <p>🔧 Maintenance & Repair Costs</p>
              <p>📉 Depreciation Projection</p>
              <p>💳 Financing Options</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
