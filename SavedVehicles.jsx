import React, { useState, useEffect } from 'react';
import { Heart, TrendingUp, TrendingDown, Minus, Calendar, DollarSign, Zap, X } from 'lucide-react';

export default function SavedVehicles({ onNavigate }) {
  const [savedVehicles, setSavedVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [priceHistoryMap, setPriceHistoryMap] = useState({});
  const [tcoAnalysisMap, setTcoAnalysisMap] = useState({});
  const [tcoLoadingMap, setTcoLoadingMap] = useState({});

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

        // Fetch vehicles by specific VINs from our database
        const vinQuery = vins.map(v => `vins=${encodeURIComponent(v)}`).join('&');
        const response = await fetch(`https://vehicle-monitor-bay-area-a782b1271cca.herokuapp.com/api/vehicles?${vinQuery}`);
        const data = await response.json();
        let savedVehiclesList = data.vehicles || [];
        
        // If we're missing some vehicles, fetch them from MarketCheck
        const foundVins = savedVehiclesList.map(v => v.vin);
        const missingVins = vins.filter(v => !foundVins.includes(v));
        
        if (missingVins.length > 0) {
          for (const vin of missingVins) {
            try {
              const vehicleResponse = await fetch(`https://vehicle-monitor-bay-area-a782b1271cca.herokuapp.com/api/vehicle-by-vin/${vin}`);
              if (vehicleResponse.ok) {
                const vehicle = await vehicleResponse.json();
                savedVehiclesList.push(vehicle);
              }
            } catch (err) {
              console.error(`Error fetching vehicle from MarketCheck for ${vin}:`, err);
            }
          }
        }
        
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
        
        // Auto-generate TCO analysis for all vehicles
        generateAllTCOAnalyses(savedVehiclesList);
      } else {
        setLoading(false);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateAllTCOAnalyses = async (vehicles) => {
    const analyses = {};
    
    for (const vehicle of vehicles) {
      try {
        await generateTCOAnalysis(vehicle, analyses);
      } catch (err) {
        console.error(`Error generating TCO for ${vehicle.vin}:`, err);
      }
    }
    
    setTcoAnalysisMap(analyses);
  };

  const generateTCOAnalysis = async (vehicle, analyses) => {
    if (!vehicle || !vehicle.price) return;

    const vin = vehicle.vin;
    setTcoLoadingMap(prev => ({ ...prev, [vin]: true }));

    try {
      const downPayment = Math.round(vehicle.price * 0.1);
      const loanAmount = vehicle.price - downPayment;

      const tcoPrompt = `Generate a 5-year Total Cost of Ownership analysis for this vehicle:

${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim || ''}
Purchase Price: $${vehicle.price?.toLocaleString()}
Current Mileage: ${vehicle.mileage?.toLocaleString()} miles
Transmission: ${vehicle.transmission || 'Unknown'}

Assumptions:
- 5-year loan at 5% APR
- 10% down payment ($${downPayment.toLocaleString()})
- 12,000 miles per year
- Loan amount: $${loanAmount.toLocaleString()}

Please provide a year-by-year breakdown including:
1. Monthly and annual loan payments (include total interest)
2. Annual depreciation estimates
3. Annual maintenance and repair costs
4. Estimated resale value after 5 years
5. Insurance and fuel cost estimates

End with a "Bottom Line" showing effective monthly cost (total 5-year costs / 60 months).`;

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
      analyses[vin] = data.dossier;
    } catch (err) {
      console.error('Error generating TCO analysis:', err);
      analyses[vin] = `Failed to generate TCO analysis: ${err.message}`;
    } finally {
      setTcoLoadingMap(prev => ({ ...prev, [vin]: false }));
    }
  };

  const getPriceTrend = (vehicle) => {
    const history = priceHistoryMap[vehicle.vin];
    if (!history || history.priceHistory.length < 2) {
      return { trend: 'flat', change: 0, icon: Minus, percent: 0 };
    }

    const change = history.priceChange;
    const startPrice = history.startPrice;
    const percentChange = startPrice ? ((change / startPrice) * 100).toFixed(1) : 0;

    if (change > 0) {
      return { trend: 'up', change, icon: TrendingUp, percent: percentChange };
    } else if (change < 0) {
      return { trend: 'down', change, icon: TrendingDown, percent: percentChange };
    } else {
      return { trend: 'flat', change: 0, icon: Minus, percent: 0 };
    }
  };

  const removeVehicle = (vinToRemove) => {
    const saved = localStorage.getItem('savedVehicleVINs');
    if (saved) {
      let vins = JSON.parse(saved);
      vins = vins.filter(v => v !== vinToRemove);
      localStorage.setItem('savedVehicleVINs', JSON.stringify(vins));
      setSavedVehicles(savedVehicles.filter(v => v.vin !== vinToRemove));
    }
  };

  const handleViewDetails = (vin) => {
    onNavigate('vehicle', vin);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-slate-400">Loading saved vehicles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <p className="text-red-400">Error: {error}</p>
      </div>
    );
  }

  if (savedVehicles.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <h1 className="text-3xl font-bold text-white mb-4">Saved Vehicles</h1>
        <p className="text-slate-400">No vehicles saved yet. Search and heart vehicles to compare!</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Saved Vehicles</h1>

      {/* Price Tracking Section */}
      {savedVehicles.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <DollarSign size={24} className="text-green-400" />
            Price Tracking
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedVehicles.map((vehicle) => {
              const history = priceHistoryMap[vehicle.vin];
              const trend = getPriceTrend(vehicle);
              const TrendIcon = trend.icon;

              return (
                <div key={vehicle.vin} className="bg-slate-800 rounded-lg border border-slate-700 p-4 hover:border-blue-500/50 transition">
                  <h3 className="text-white font-bold mb-2">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-slate-400 text-xs mb-1">Current Price</p>
                      <p className="text-xl font-bold text-green-400">${vehicle.price?.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="text-slate-400 text-xs mb-1">Price Trend</p>
                        <div className="flex items-center gap-1">
                          <TrendIcon
                            size={18}
                            className={
                              trend.trend === 'up'
                                ? 'text-red-500'
                                : trend.trend === 'down'
                                ? 'text-green-500'
                                : 'text-slate-500'
                            }
                          />
                          <span className={`font-bold ${
                            trend.trend === 'up'
                              ? 'text-red-500'
                              : trend.trend === 'down'
                              ? 'text-green-500'
                              : 'text-slate-400'
                          }`}>
                            {trend.change > 0 ? '+' : ''}{trend.change !== 0 ? `$${Math.abs(trend.change).toLocaleString()}` : 'No change'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs mb-1">Original Price</p>
                      <p className="text-white font-semibold">${history?.startPrice?.toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => handleViewDetails(vehicle.vin)}
                      className="w-full mt-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition font-semibold"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TCO Comparison Section */}
      {savedVehicles.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Zap size={24} className="text-purple-400" />
            5 Year Total Cost of Ownership Comparison
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {savedVehicles.map((vehicle) => {
              const analysis = tcoAnalysisMap[vehicle.vin];
              const isLoading = tcoLoadingMap[vehicle.vin];

              // Extract TCO values from analysis
              const downPayment = Math.round(vehicle.price * 0.1);
              const loanAmount = vehicle.price - downPayment;
              const monthlyRate = 0.05 / 12;
              const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, 60)) / (Math.pow(1 + monthlyRate, 60) - 1);
              const totalLoanPayments = monthlyPayment * 60;
              
              const maintenanceValue = analysis ? 
                parseInt(analysis.match(/(?:maintenance|Maintenance)[^\n]*(\d+,?\d+)/i)?.[1]?.replace(/,/g, '') || 8000)
                : 8000;
              const insuranceValue = analysis ?
                parseInt(analysis.match(/(?:insurance|Insurance)[^\n]*(\d+,?\d+)/i)?.[1]?.replace(/,/g, '') || 6000)
                : 6000;
              const depreciationValue = analysis ?
                parseInt(analysis.match(/(?:depreciation|Depreciation)[^\n]*(\d+,?\d+)/i)?.[1]?.replace(/,/g, '') || 0)
                : 0;

              const totalCosts = downPayment + totalLoanPayments + maintenanceValue + insuranceValue;
              const resaleValue = vehicle.price - depreciationValue;
              const totalCOO = resaleValue - totalCosts;

              return (
                <div key={vehicle.vin} className="bg-slate-800 rounded-lg border border-slate-700 p-6 hover:border-purple-500/50 transition">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-white font-bold text-lg">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </h3>
                      <p className="text-slate-400 text-sm font-mono">{vehicle.vin}</p>
                    </div>
                    <button
                      onClick={() => removeVehicle(vehicle.vin)}
                      className="p-2 hover:bg-slate-700 rounded transition"
                    >
                      <X size={20} className="text-slate-400 hover:text-red-400" />
                    </button>
                  </div>

                  {isLoading ? (
                    <div className="flex items-center gap-2 text-slate-400">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      <span>Analyzing...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      <div className="bg-slate-900/50 rounded p-3 border border-slate-600">
                        <p className="text-slate-400 text-xs font-semibold mb-1">Down Payment</p>
                        <p className="text-green-400 font-bold">${downPayment.toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-900/50 rounded p-3 border border-slate-600">
                        <p className="text-slate-400 text-xs font-semibold mb-1">Loan Payments</p>
                        <p className="text-green-400 font-bold">${totalLoanPayments.toLocaleString('en-US', {maximumFractionDigits: 0})}</p>
                      </div>
                      <div className="bg-slate-900/50 rounded p-3 border border-slate-600">
                        <p className="text-slate-400 text-xs font-semibold mb-1">Maintenance</p>
                        <p className="text-green-400 font-bold">${maintenanceValue.toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-900/50 rounded p-3 border border-slate-600">
                        <p className="text-slate-400 text-xs font-semibold mb-1">Insurance</p>
                        <p className="text-green-400 font-bold">${insuranceValue.toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-900/50 rounded p-3 border border-slate-600">
                        <p className="text-slate-400 text-xs font-semibold mb-1">Total Costs</p>
                        <p className="text-blue-400 font-bold">${totalCosts.toLocaleString('en-US', {maximumFractionDigits: 0})}</p>
                      </div>
                      <div className="bg-slate-900/50 rounded p-3 border border-slate-600">
                        <p className="text-slate-400 text-xs font-semibold mb-1">Purchase Price</p>
                        <p className="text-green-400 font-bold">${vehicle.price?.toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-900/50 rounded p-3 border border-slate-600">
                        <p className="text-slate-400 text-xs font-semibold mb-1">Depreciation</p>
                        <p className="text-red-400 font-bold">-${depreciationValue.toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-700/50 rounded p-3 border border-slate-500">
                        <p className="text-slate-300 text-xs font-semibold mb-1">Resale Value</p>
                        <p className="text-blue-400 font-bold">${resaleValue.toLocaleString('en-US', {maximumFractionDigits: 0})}</p>
                      </div>
                      <div className="md:col-span-2 bg-gradient-to-r from-purple-900/40 to-blue-900/40 rounded p-3 border border-purple-700">
                        <p className="text-purple-300 text-xs font-semibold mb-1">Total Cost of Ownership</p>
                        <p className={`text-lg font-bold ${totalCOO > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ${Math.abs(totalCOO).toLocaleString('en-US', {maximumFractionDigits: 0})}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
