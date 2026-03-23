import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Heart, MapPin, DollarSign, Globe, ChevronDown, TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';

export default function VehicleDashboard({ onNavigate }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [savedVINs, setSavedVINs] = useState([]);
  const [lastScan, setLastScan] = useState(null);
  const [priceHistoryMap, setPriceHistoryMap] = useState({});
  const [sortBy, setSortBy] = useState('price');
  const [sortDirection, setSortDirection] = useState('asc'); // asc or desc
  const [mileageFilter, setMileageFilter] = useState('all'); // all, 10k, 20k, 30k, 50k, 100k

  // Search form state
  const [searchMake, setSearchMake] = useState('Porsche');
  const [searchModel, setSearchModel] = useState('911');
  const [searchTrim, setSearchTrim] = useState('');
  const [yearMin, setYearMin] = useState('2020');
  const [yearMax, setYearMax] = useState('2026');
  const [zipCode, setZipCode] = useState('84098');
  const [radius, setRadius] = useState('100');
  const [carType, setCarType] = useState('all');
  const [makeOptions, setMakeOptions] = useState([]);
  const [modelOptions, setModelOptions] = useState([]);
  const [trimOptions, setTrimOptions] = useState([]);
  const [showMakeDropdown, setShowMakeDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showTrimDropdown, setShowTrimDropdown] = useState(false);
  const [autocompleting, setAutocompleting] = useState(false);

  useEffect(() => {
    fetchVehicles();
    loadSavedVINs();
  }, []);

  useEffect(() => {
    vehicles.forEach(vehicle => {
      fetchPriceHistory(vehicle.vin);
    });
  }, [vehicles]);

  const loadSavedVINs = () => {
    const saved = localStorage.getItem('savedVehicleVINs');
    if (saved) {
      setSavedVINs(JSON.parse(saved));
    }
  };

  const toggleSave = (vin) => {
    let updated = [...savedVINs];
    if (updated.includes(vin)) {
      updated = updated.filter(v => v !== vin);
    } else {
      updated.push(vin);
    }
    setSavedVINs(updated);
    localStorage.setItem('savedVehicleVINs', JSON.stringify(updated));
  };

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://vehicle-monitor-bay-area-a782b1271cca.herokuapp.com/api/vehicles');
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      const data = await response.json();
      setVehicles(data.vehicles || []);
      setLastScan(new Date().toLocaleString());
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPriceHistory = async (vin) => {
    try {
      const response = await fetch(`https://vehicle-monitor-bay-area-a782b1271cca.herokuapp.com/api/price-history-marketcheck/${vin}`);
      const data = await response.json();
      setPriceHistoryMap(prev => ({
        ...prev,
        [vin]: data
      }));
    } catch (err) {
      console.error(`Error fetching price history for ${vin}:`, err);
    }
  };

  const getPriceTrend = (vehicle) => {
    const history = priceHistoryMap[vehicle.vin];
    if (!history || history.priceHistory.length < 2) {
      return { trend: 'flat', change: 0, icon: Minus };
    }

    const change = history.priceChange;
    if (change > 0) {
      return { trend: 'up', change, icon: TrendingUp };
    } else if (change < 0) {
      return { trend: 'down', change, icon: TrendingDown };
    } else {
      return { trend: 'flat', change: 0, icon: Minus };
    }
  };

  const sortVehicles = (vehiclesToSort) => {
    // First filter by mileage
    let filtered = vehiclesToSort;
    if (mileageFilter !== 'all') {
      const mileageLimit = parseInt(mileageFilter) * 1000;
      filtered = vehiclesToSort.filter(v => (v.mileage || 0) <= mileageLimit);
    }

    const sorted = [...filtered];

    switch (sortBy) {
      case 'price':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'trend':
        sorted.sort((a, b) => {
          const trendA = getPriceTrend(a).change;
          const trendB = getPriceTrend(b).change;
          return trendB - trendA;
        });
        break;
      case 'dom':
        sorted.sort((a, b) => (a.daysOnMarket || 0) - (b.daysOnMarket || 0));
        break;
      case 'mileage':
        sorted.sort((a, b) => (a.mileage || 0) - (b.mileage || 0));
        break;
      case 'year':
        sorted.sort((a, b) => b.year - a.year);
        break;
      default:
        break;
    }

    // Apply sort direction
    if (sortDirection === 'desc') {
      sorted.reverse();
    }

    return sorted;
  };

  const fetchAutoComplete = async (query, field = 'make') => {
    if (query.length < 1) {
      if (field === 'make') setMakeOptions([]);
      else if (field === 'model') setModelOptions([]);
      else if (field === 'trim') setTrimOptions([]);
      return;
    }

    try {
      setAutocompleting(true);
      const params = new URLSearchParams({
        input: query,
        field: field
      });

      if (field === 'model' && searchMake) {
        params.append('make', searchMake);
      }

      if (field === 'trim' && searchMake && searchModel) {
        params.append('make', searchMake);
        params.append('model', searchModel);
      }

      const response = await fetch(
        `https://vehicle-monitor-bay-area-a782b1271cca.herokuapp.com/api/autocomplete?${params}`
      );
      const data = await response.json();

      if (field === 'make') {
        setMakeOptions(data.suggestions || []);
        setShowMakeDropdown(true);
      } else if (field === 'model') {
        setModelOptions(data.suggestions || []);
        setShowModelDropdown(true);
      } else if (field === 'trim') {
        setTrimOptions(data.suggestions || []);
        setShowTrimDropdown(true);
      }
    } catch (err) {
      console.error('Autocomplete error:', err);
    } finally {
      setAutocompleting(false);
    }
  };

  const handleMakeChange = (e) => {
    const value = e.target.value;
    setSearchMake(value);
    setSearchModel('');
    setModelOptions([]);
    fetchAutoComplete(value, 'make');
  };

  const handleModelChange = (e) => {
    const value = e.target.value;
    setSearchModel(value);
    setSearchTrim('');
    setTrimOptions([]);
    if (searchMake && value) {
      fetchAutoComplete(value, 'model');
    }
  };

  const handleTrimChange = (e) => {
    const value = e.target.value;
    setSearchTrim(value);
    if (searchMake && searchModel && value) {
      fetchAutoComplete(value, 'trim');
    }
  };

  const handleSearch = async () => {
    if (!searchMake || !searchModel) {
      alert('Please select both Make and Model');
      return;
    }

    try {
      setScanning(true);
      const params = new URLSearchParams({
        make: searchMake,
        model: searchModel,
        year_min: yearMin || null,
        year_max: yearMax || null,
        zip: zipCode,
        radius: radius,
        car_type: carType !== 'all' ? carType : null
      });

      const response = await fetch(
        `https://vehicle-monitor-bay-area-a782b1271cca.herokuapp.com/api/scan?${params}`
      );
      const data = await response.json();

      if (data.success) {
        await fetchVehicles();
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed: ' + error.message);
    } finally {
      setScanning(false);
    }
  };

  const filteredVehicles = vehicles.filter(vehicle =>
    searchTerm === '' || (vehicle.title && vehicle.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sortedVehicles = sortVehicles(filteredVehicles);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Globe className="text-blue-500" size={32} />
              <h1 className="text-3xl font-bold text-white">Vehicle Monitor</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => onNavigate('saved')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold"
              >
                Saved ({savedVINs.length})
              </button>
              <button
                onClick={fetchVehicles}
                disabled={loading}
                className="p-2 hover:bg-slate-700 rounded-lg transition disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {lastScan && (
            <p className="text-slate-400 text-sm">Last updated: {lastScan}</p>
          )}
        </div>
      </div>

      {/* Search Form */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Search Vehicles</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Make */}
            <div className="relative">
              <label className="block text-sm text-slate-400 mb-2">Make</label>
              <input
                type="text"
                value={searchMake}
                onChange={handleMakeChange}
                onFocus={() => searchMake && fetchAutoComplete(searchMake, 'make')}
                placeholder="Enter make..."
                className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 outline-none"
              />
              {showMakeDropdown && makeOptions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-700 border border-slate-600 rounded max-h-40 overflow-y-auto z-50">
                  {makeOptions.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSearchMake(option);
                        setShowMakeDropdown(false);
                        setModelOptions([]);
                      }}
                      className="w-full text-left px-3 py-2 text-white hover:bg-slate-600 text-sm"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Model */}
            <div className="relative">
              <label className="block text-sm text-slate-400 mb-2">Model</label>
              <input
                type="text"
                value={searchModel}
                onChange={handleModelChange}
                onFocus={() => searchModel && searchMake && fetchAutoComplete(searchModel, 'model')}
                placeholder="Enter model..."
                disabled={!searchMake}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 outline-none disabled:opacity-50"
              />
              {showModelDropdown && modelOptions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-700 border border-slate-600 rounded max-h-40 overflow-y-auto z-50">
                  {modelOptions.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSearchModel(option);
                        setShowModelDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-white hover:bg-slate-600 text-sm"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Trim */}
            <div className="relative">
              <label className="block text-sm text-slate-400 mb-2">Trim (Optional)</label>
              <input
                type="text"
                value={searchTrim}
                onChange={handleTrimChange}
                onFocus={() => searchTrim && searchMake && searchModel && fetchAutoComplete(searchTrim, 'trim')}
                placeholder="Enter trim..."
                disabled={!searchMake || !searchModel}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 outline-none disabled:opacity-50"
              />
              {showTrimDropdown && trimOptions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-700 border border-slate-600 rounded max-h-40 overflow-y-auto z-50">
                  {trimOptions.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSearchTrim(option);
                        setShowTrimDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-white hover:bg-slate-600 text-sm"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Year Min */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">Year From</label>
              <input
                type="number"
                value={yearMin}
                onChange={(e) => setYearMin(e.target.value)}
                placeholder="2020"
                className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Year Max */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">Year To</label>
              <input
                type="number"
                value={yearMax}
                onChange={(e) => setYearMax(e.target.value)}
                placeholder="2026"
                className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Zip Code */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">Zip Code</label>
              <input
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="84098"
                className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Radius */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">Radius (mi)</label>
              <input
                type="number"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                placeholder="100"
                className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Car Type */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">Condition</label>
              <select
                value={carType}
                onChange={(e) => setCarType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 outline-none"
              >
                <option value="all">All</option>
                <option value="new">New</option>
                <option value="used">Used</option>
                <option value="certified">Certified</option>
              </select>
            </div>

            {/* Mileage Filter */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">Max Mileage</label>
              <select
                value={mileageFilter}
                onChange={(e) => setMileageFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 outline-none"
              >
                <option value="all">All Mileages</option>
                <option value="10">Less than 10k mi</option>
                <option value="20">Less than 20k mi</option>
                <option value="30">Less than 30k mi</option>
                <option value="50">Less than 50k mi</option>
                <option value="100">Less than 100k mi</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={scanning || !searchMake || !searchModel}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {scanning ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search size={18} />
                Search Vehicles
              </>
            )}
          </button>
        </div>

        {/* Sort Controls */}
        {!loading && sortedVehicles.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <label className="text-slate-400 font-semibold">Sort by:</label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 'price', label: 'Price' },
                  { value: 'trend', label: 'Price Trend' },
                  { value: 'dom', label: 'Days on Market' },
                  { value: 'mileage', label: 'Mileage' },
                  { value: 'year', label: 'Year' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    className={`px-4 py-2 rounded-lg transition ${
                      sortBy === option.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Direction */}
            <div className="flex items-center gap-2">
              <label className="text-slate-400 font-semibold text-sm">Direction:</label>
              <button
                onClick={() => setSortDirection('asc')}
                className={`px-3 py-1 rounded-lg transition flex items-center gap-1 ${
                  sortDirection === 'asc'
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
                title="Lowest to Highest"
              >
                ↑ Low → High
              </button>
              <button
                onClick={() => setSortDirection('desc')}
                className={`px-3 py-1 rounded-lg transition flex items-center gap-1 ${
                  sortDirection === 'desc'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
                title="Highest to Lowest"
              >
                ↓ High → Low
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="space-y-4">
          {loading && (
            <div className="flex justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-slate-400">Loading vehicles...</p>
              </div>
            </div>
          )}

          {!loading && sortedVehicles.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-400">No vehicles found. Try adjusting your search.</p>
            </div>
          )}

          {sortedVehicles.map(vehicle => {
            const trend = getPriceTrend(vehicle);
            const TrendIcon = trend.icon;
            const isSaved = savedVINs.includes(vehicle.vin);

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
                    <div className="text-slate-400 text-sm mt-2 space-y-1">
                      <p><span className="text-slate-500">Seller:</span> {vehicle.dealerName || 'N/A'}</p>
                      <p><span className="text-slate-500">Color:</span> {vehicle.color || 'N/A'}</p>
                      <p><span className="text-slate-500">Trans:</span> {vehicle.transmission || 'N/A'}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded inline-block mt-2 ${
                      vehicle.condition === 'New' ? 'bg-green-900/30 text-green-400' : 'bg-blue-900/30 text-blue-400'
                    }`}>
                      {vehicle.condition}
                    </span>
                  </div>

                  {/* Current Price */}
                  <div className="bg-green-900/30 rounded p-3 border border-green-700 lg:col-span-2">
                    <p className="text-slate-400 text-xs">Current Price</p>
                    <p className="text-lg font-bold text-green-500">${vehicle.price?.toLocaleString()}</p>
                  </div>

                  {/* Price Trend */}
                  <div className="bg-slate-900/50 rounded p-3 border border-slate-600 lg:col-span-2">
                    <p className="text-slate-400 text-xs">Price Trend</p>
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
                        {trend.change > 0 ? '+' : ''}{trend.change !== 0 ? `$${Math.abs(trend.change).toLocaleString()}` : 'No change'}
                      </span>
                    </div>
                  </div>

                  {/* Specs */}
                  <div className="lg:col-span-2">
                    <p className="text-slate-400 text-xs mb-1">Mileage / DOM</p>
                    <p className="text-white text-sm font-semibold">{vehicle.mileage?.toLocaleString()} mi</p>
                    <p className="text-slate-500 text-xs mt-1">{vehicle.daysOnMarket || 'N/A'} days</p>
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
                      onClick={() => onNavigate('details', vehicle.vin)}
                      className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => toggleSave(vehicle.vin)}
                      className={`px-3 py-2 rounded transition ${
                        isSaved
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-400'
                      }`}
                      title={isSaved ? 'Remove from saved' : 'Add to saved'}
                    >
                      <Heart size={16} className={isSaved ? 'fill-current' : ''} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
