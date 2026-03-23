import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, DollarSign } from 'lucide-react';

export default function VehicleDetails({ vin, onNavigate }) {
  const [vehicle, setVehicle] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchVehicleDetails();
  }, [vin]);

  const fetchVehicleDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch current vehicle data
      const vehiclesResponse = await fetch('https://vehicle-monitor-bay-area-a782b1271cca.herokuapp.com/api/vehicles');
      const vehiclesData = await vehiclesResponse.json();
      const currentVehicle = vehiclesData.vehicles.find(v => v.vin === vin);
      setVehicle(currentVehicle);

      // Fetch price history from MarketCheck
      const historyResponse = await fetch(`https://vehicle-monitor-bay-area-a782b1271cca.herokuapp.com/api/price-history-marketcheck/${vin}`);
      const historyData = await historyResponse.json();
      
      if (historyData.priceHistory) {
        setPriceHistory(historyData.priceHistory);
      }
    } catch (err) {
      console.error('Error fetching vehicle details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPriceTrend = () => {
    if (priceHistory.length < 2 || !vehicle) return { trend: 'flat', change: 0, icon: Minus };

    const startPrice = priceHistory[priceHistory.length - 1].price;
    const currentPrice = vehicle.price;
    const change = currentPrice - startPrice;

    if (change > 0) {
      return { trend: 'up', change, icon: TrendingUp, percent: ((change / startPrice) * 100).toFixed(1) };
    } else if (change < 0) {
      return { trend: 'down', change, icon: TrendingDown, percent: ((change / startPrice) * 100).toFixed(1) };
    } else {
      return { trend: 'flat', change: 0, icon: Minus, percent: 0 };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-slate-400">Loading vehicle details...</p>
        </div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <button
          onClick={() => onNavigate('dashboard')}
          className="text-blue-400 hover:text-blue-300 text-sm font-semibold flex items-center gap-2 mb-6"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-red-400">
          {error || 'Vehicle not found'}
        </div>
      </div>
    );
  }

  const trend = getPriceTrend();
  const TrendIcon = trend.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <button
        onClick={() => onNavigate('dashboard')}
        className="text-blue-400 hover:text-blue-300 text-sm font-semibold flex items-center gap-2 mb-8"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </button>

      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h1>
            <p className="text-slate-400 text-sm font-mono mb-4">{vehicle.vin}</p>
            <div className="space-y-2">
              <p className="text-white"><span className="text-slate-400">Trim:</span> {vehicle.trim || 'N/A'}</p>
              <p className="text-white"><span className="text-slate-400">Condition:</span> {vehicle.condition}</p>
              <p className="text-white"><span className="text-slate-400">Mileage:</span> {vehicle.mileage?.toLocaleString()} miles</p>
              <p className="text-white"><span className="text-slate-400">Transmission:</span> {vehicle.transmission}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-green-900/30 rounded p-4 border border-green-700">
              <p className="text-slate-400 text-sm mb-1">Current Price</p>
              <p className="text-2xl font-bold text-green-500">${vehicle.price?.toLocaleString()}</p>
            </div>

            <div className={`rounded p-4 border ${trend.trend === 'up' ? 'bg-red-900/30 border-red-700' : trend.trend === 'down' ? 'bg-green-900/30 border-green-700' : 'bg-slate-900/30 border-slate-600'}`}>
              <p className="text-slate-400 text-sm mb-2">Price Trend</p>
              <div className="flex items-center gap-3">
                <TrendIcon size={24} className={
                  trend.trend === 'up' ? 'text-red-500' :
                  trend.trend === 'down' ? 'text-green-500' :
                  'text-slate-500'
                } />
                <div>
                  <p className={`text-lg font-bold ${
                    trend.trend === 'up' ? 'text-red-500' :
                    trend.trend === 'down' ? 'text-green-500' :
                    'text-slate-400'
                  }`}>
                    {trend.change > 0 ? '+' : ''}{trend.change !== 0 ? `$${Math.abs(trend.change).toLocaleString()}` : 'No change'}
                  </p>
                  {trend.change !== 0 && (
                    <p className="text-slate-400 text-xs">{trend.percent}%</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {priceHistory.length > 0 && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4">Price History by Week</h2>
          
          <div className="bg-slate-900 rounded p-4 h-64 flex items-end gap-1 overflow-x-auto mb-4">
            {priceHistory.map((entry, idx) => {
              const minPrice = Math.min(...priceHistory.map(p => p.price));
              const maxPrice = Math.max(...priceHistory.map(p => p.price));
              const range = maxPrice - minPrice || 1;
              const heightPercent = ((entry.price - minPrice) / range) * 100;
              
              return (
                <div key={idx} className="flex flex-col items-center flex-1">
                  <div
                    className="w-full bg-blue-500 hover:bg-blue-400 rounded-t transition cursor-pointer group relative"
                    style={{ height: `${Math.max(heightPercent, 5)}%` }}
                    title={`Week ${idx + 1}: $${entry.price.toLocaleString()}`}
                  >
                    <div className="hidden group-hover:block absolute bottom-full mb-2 bg-slate-950 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      ${entry.price.toLocaleString()}
                    </div>
                  </div>
                  <p className="text-slate-500 text-xs mt-2">W{idx + 1}</p>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between text-sm text-slate-400 mb-6">
            <span>Start: ${priceHistory[priceHistory.length - 1].price.toLocaleString()}</span>
            <span>Current: ${vehicle.price?.toLocaleString()}</span>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-slate-400 py-2">Week</th>
                <th className="text-left text-slate-400 py-2">Date</th>
                <th className="text-right text-slate-400 py-2">Price</th>
                <th className="text-right text-slate-400 py-2">Change</th>
              </tr>
            </thead>
            <tbody>
              {priceHistory.map((entry, idx) => {
                const startPrice = priceHistory[priceHistory.length - 1].price;
                const change = entry.price - startPrice;
                return (
                  <tr key={idx} className="border-b border-slate-700 hover:bg-slate-700/50">
                    <td className="text-white py-3">Week {idx + 1}</td>
                    <td className="text-slate-400 py-3">{new Date(entry.date).toLocaleDateString()}</td>
                    <td className="text-white text-right py-3 font-semibold">${entry.price.toLocaleString()}</td>
                    <td className={`text-right py-3 font-semibold ${
                      change > 0 ? 'text-red-500' :
                      change < 0 ? 'text-green-500' :
                      'text-slate-400'
                    }`}>
                      {change > 0 ? '+' : ''}{change !== 0 ? `$${Math.abs(change).toLocaleString()}` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
