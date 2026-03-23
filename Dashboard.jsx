import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Heart, MapPin, DollarSign, Globe, ChevronDown } from 'lucide-react';

export default function VehicleDashboard() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [lastScan, setLastScan] = useState(null);

  // Search form state
  const [searchMake, setSearchMake] = useState('Porsche');
  const [searchModel, setSearchModel] = useState('911');
  const [yearMin, setYearMin] = useState('2020');
  const [yearMax, setYearMax] = useState('2026');
  const [zipCode, setZipCode] = useState('84098');
  const [radius, setRadius] = useState('100');
  const [carType, setCarType] = useState('all'); // new, used, certified, all
  const [makeOptions, setMakeOptions] = useState([]);
  const [modelOptions, setModelOptions] = useState([]);
  const [showMakeDropdown, setShowMakeDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [autocompleting, setAutocompleting] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, []);

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

  const fetchAutoComplete = async (query, field = 'make') => {
    if (query.length < 1) {
      if (field === 'make') setMakeOptions([]);
      else setModelOptions([]);
      return;
    }

    try {
      setAutocompleting(true);
      const params = new URLSearchParams({
        input: query,
        field: field
      });
      
      // Add contextual make filter when searching for models
      if (field === 'model' && searchMake) {
        params.append('make', searchMake);
      }

      const response = await fetch(
        `https://vehicle-monitor-bay-area-a782b1271cca.herokuapp.com/api/autocomplete?${params}`
      );
      const data = await response.json();
      
      if (field === 'make') {
        setMakeOptions(data.suggestions || []);
        setShowMakeDropdown(true);
      } else {
        setModelOptions(data.suggestions || []);
        setShowModelDropdown(true);
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
    if (searchMake && value) {
      fetchAutoComplete(value, 'model');
    }
  };

  const handleSelectMake = (make) => {
    setSearchMake(make);
    setMakeOptions([]);
    setShowMakeDropdown(false);
    setSearchModel('');
    setModelOptions([]);
  };

  const handleSelectModel = (model) => {
    setSearchModel(model);
    setModelOptions([]);
    setShowModelDropdown(false);
  };

  const handleSearch = async () => {
    if (!searchMake || !searchModel) {
      alert('Please select both make and model');
      return;
    }
    try {
      setScanning(true);
      const params = new URLSearchParams({
        make: searchMake,
        model: searchModel,
        year_min: yearMin,
        year_max: yearMax,
        zip: zipCode,
        radius: radius
      });
      
      // Only add car_type if not "all"
      if (carType !== 'all') {
        params.append('car_type', carType);
      }

      const response = await fetch(
        `https://vehicle-monitor-bay-area-a782b1271cca.herokuapp.com/api/scan?${params}`
      );
      const data = await response.json();
      
      if (response.ok) {
        const typeLabel = carType === 'all' ? 'New & Used' : carType.charAt(0).toUpperCase() + carType.slice(1);
        alert(`✅ Scan completed!\n\nFound ${data.total || 0} ${searchMake} ${searchModel} vehicles\n\nCriteria:\n• Type: ${typeLabel}\n• Years: ${yearMin}-${yearMax}\n• Location: ${zipCode} (${radius}mi radius)`);
        await fetchVehicles();
      } else {
        alert(`❌ Error: ${data.message}`);
      }
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setScanning(false);
    }
  };

  const toggleFavorite = (vin) => {
    setFavorites(prev => {
      const updated = prev.includes(vin) ? prev.filter(fav => fav !== vin) : [...prev, vin];
      // Save to localStorage
      localStorage.setItem('savedVehicleVINs', JSON.stringify(updated));
      return updated;
    });
  };

  // Load saved vehicles on mount
  useEffect(() => {
    const saved = localStorage.getItem('savedVehicleVINs');
    if (saved) {
      setFavorites(JSON.parse(saved));
    }
  }, []);

  // Filter vehicles
  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.dealerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.dealerLocation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.vin?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by seller
  const groupedBySeller = filteredVehicles.reduce((acc, vehicle) => {
    const sellerKey = vehicle.dealerName || 'Unknown Dealer';
    if (!acc[sellerKey]) {
      acc[sellerKey] = [];
    }
    acc[sellerKey].push(vehicle);
    return acc;
  }, {});

  // Sort sellers by number of vehicles
  const sortedSellers = Object.entries(groupedBySeller).sort((a, b) => b[1].length - a[1].length);

  const vehicleTitle = `${searchMake} ${searchModel}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white">🚗 Vehicle Tracker</h1>
              <p className="text-slate-400 mt-1">Real-time inventory monitoring</p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/saved"
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition flex items-center gap-2 font-semibold"
              >
                <Heart size={20} className="fill-current" />
                Saved ({favorites.length})
              </a>
              <button 
                onClick={fetchVehicles}
                disabled={scanning}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw size={20} className={scanning ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>

          {/* Dynamic Search Form */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-6">
            <h3 className="text-white font-semibold mb-4">Search Vehicles</h3>
            <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
              {/* Make Input */}
              <div className="relative md:col-span-2">
                <label className="block text-slate-400 text-sm mb-2">Make</label>
                <input
                  type="text"
                  placeholder="e.g., Porsche, BMW..."
                  value={searchMake}
                  onChange={handleMakeChange}
                  onFocus={() => searchMake && setShowMakeDropdown(true)}
                  className="w-full px-3 py-2 bg-slate-700 text-white placeholder-slate-500 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
                />
                {showMakeDropdown && makeOptions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-700 border border-slate-600 rounded-lg shadow-lg max-h-40 overflow-y-auto z-50">
                    {makeOptions.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectMake(option)}
                        className="w-full text-left px-3 py-2 hover:bg-slate-600 text-white text-sm transition"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Model Input */}
              <div className="relative md:col-span-2">
                <label className="block text-slate-400 text-sm mb-2">Model</label>
                <input
                  type="text"
                  placeholder={searchMake ? `Search ${searchMake} models...` : 'Select make first'}
                  value={searchModel}
                  onChange={handleModelChange}
                  disabled={!searchMake}
                  onFocus={() => searchModel && setShowModelDropdown(true)}
                  className="w-full px-3 py-2 bg-slate-700 text-white placeholder-slate-500 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                />
                {showModelDropdown && modelOptions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-700 border border-slate-600 rounded-lg shadow-lg max-h-40 overflow-y-auto z-50">
                    {modelOptions.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectModel(option)}
                        className="w-full text-left px-3 py-2 hover:bg-slate-600 text-white text-sm transition"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Year Min */}
              <div>
                <label className="block text-slate-400 text-sm mb-2">Year From</label>
                <input
                  type="number"
                  min="1990"
                  max="2030"
                  value={yearMin}
                  onChange={(e) => setYearMin(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Year Max */}
              <div>
                <label className="block text-slate-400 text-sm mb-2">Year To</label>
                <input
                  type="number"
                  min="1990"
                  max="2030"
                  value={yearMax}
                  onChange={(e) => setYearMax(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Zip Code */}
              <div>
                <label className="block text-slate-400 text-sm mb-2">Zip Code</label>
                <input
                  type="text"
                  placeholder="84098"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  maxLength="5"
                  className="w-full px-3 py-2 bg-slate-700 text-white placeholder-slate-500 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Radius */}
              <div>
                <label className="block text-slate-400 text-sm mb-2">Radius (mi)</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Car Type */}
              <div>
                <label className="block text-slate-400 text-sm mb-2">Condition</label>
                <select
                  value={carType}
                  onChange={(e) => setCarType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">All</option>
                  <option value="new">New</option>
                  <option value="used">Used</option>
                  <option value="certified">Certified</option>
                </select>
              </div>

              {/* Search Button */}
              <div className="flex items-end md:col-span-2">
                <button 
                  onClick={handleSearch}
                  disabled={!searchMake || !searchModel || scanning}
                  className="w-full px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg transition font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Search size={18} />
                  {scanning ? 'Scanning...' : 'Search Now'}
                </button>
              </div>
            </div>
          </div>

          {/* Current Results Info */}
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-sm">
              <div>
                <p className="text-slate-400">Viewing</p>
                <p className="text-white font-semibold">{vehicleTitle}</p>
              </div>
              <div>
                <p className="text-slate-400">Condition</p>
                <p className="text-white font-semibold">{carType === 'all' ? 'All' : carType.charAt(0).toUpperCase() + carType.slice(1)}</p>
              </div>
              <div>
                <p className="text-slate-400">Year Range</p>
                <p className="text-white font-semibold">{yearMin}-{yearMax}</p>
              </div>
              <div>
                <p className="text-slate-400">Results</p>
                <p className="text-white font-semibold">{filteredVehicles.length} vehicles</p>
              </div>
              <div>
                <p className="text-slate-400">Location</p>
                <p className="text-white font-semibold">{zipCode} ({radius}mi)</p>
              </div>
              <div>
                <p className="text-slate-400">Last Updated</p>
                <p className="text-white font-semibold text-xs">{lastScan || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Filter Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Filter by dealer name, location, or VIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 text-white placeholder-slate-400 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="text-slate-400 mt-4">Loading vehicles...</p>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg mb-4">No {vehicleTitle} vehicles found</p>
            <p className="text-slate-500 mb-6">Try searching for a different make/model</p>
            <button 
              onClick={handleSearch}
              disabled={!searchMake || !searchModel}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition inline-flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={20} />
              Search Again
            </button>
          </div>
        ) : (
          <div>
            <p className="text-slate-400 mb-6">Found {filteredVehicles.length} {vehicleTitle} vehicles from {sortedSellers.length} dealers</p>
            
            {/* Grouped by Seller */}
            <div className="space-y-8">
              {sortedSellers.map(([sellerName, sellerVehicles]) => (
                <div key={sellerName}>
                  {/* Seller Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-white">{sellerName}</h2>
                        <p className="text-blue-100 mt-1">{sellerVehicles.length} vehicle{sellerVehicles.length !== 1 ? 's' : ''} available</p>
                      </div>
                      {sellerVehicles[0]?.dealerPhone && (
                        <div className="text-right">
                          <p className="text-blue-100 text-sm">Contact</p>
                          <p className="text-white font-semibold">{sellerVehicles[0].dealerPhone}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Seller Website */}
                  {sellerVehicles[0]?.url && sellerVehicles[0].url !== 'N/A' && (
                    <div className="bg-slate-800 rounded-lg p-3 mb-4 border border-slate-700 flex items-center gap-2">
                      <Globe size={18} className="text-blue-500" />
                      <a 
                        href={sellerVehicles[0].url.split('/inventory')[0]} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 truncate"
                      >
                        Visit Dealer Website →
                      </a>
                    </div>
                  )}

                  {/* Vehicles Cards */}
                  <div className="space-y-3">
                    {sellerVehicles.map(vehicle => {
                      // Determine price trend arrow (placeholder for now)
                      const getPriceTrendArrow = () => {
                        // TODO: Implement actual price change detection
                        // For now, return flat arrow
                        return '→';
                      };

                      return (
                        <div
                          key={vehicle.vin}
                          className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-blue-500 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-10 gap-4">
                            {/* Make */}
                            <div>
                              <p className="text-slate-400 text-sm">Make</p>
                              <p className="text-white font-semibold">{vehicle.make || 'N/A'}</p>
                            </div>

                            {/* Model */}
                            <div>
                              <p className="text-slate-400 text-sm">Model</p>
                              <p className="text-white font-semibold">{vehicle.model || 'N/A'}</p>
                            </div>

                            {/* Trim */}
                            <div>
                              <p className="text-slate-400 text-sm">Trim</p>
                              <p className="text-white font-semibold text-sm">{vehicle.trim && vehicle.trim !== 'N/A' ? vehicle.trim : 'N/A'}</p>
                            </div>

                            {/* Year */}
                            <div>
                              <p className="text-slate-400 text-sm">Year</p>
                              <p className="text-white font-semibold">{vehicle.year}</p>
                            </div>

                            {/* Color */}
                            <div>
                              <p className="text-slate-400 text-sm">Color</p>
                              <p className="text-white font-semibold text-sm">{vehicle.color || 'N/A'}</p>
                            </div>

                            {/* Mileage */}
                            <div>
                              <p className="text-slate-400 text-sm">Mileage</p>
                              <p className="text-white font-semibold">{vehicle.mileage?.toLocaleString() || 'N/A'} mi</p>
                            </div>

                            {/* Transmission */}
                            <div>
                              <p className="text-slate-400 text-sm">Trans</p>
                              <p className="text-white font-semibold text-sm">{vehicle.transmission || 'N/A'}</p>
                            </div>

                            {/* Days on Market */}
                            <div>
                              <p className="text-slate-400 text-sm">DOM</p>
                              <p className="text-white font-semibold">{vehicle.daysOnMarket !== null ? `${vehicle.daysOnMarket}d` : 'N/A'}</p>
                            </div>

                            {/* Price Trend */}
                            <div>
                              <p className="text-slate-400 text-sm">Trend</p>
                              <p className="text-white font-semibold text-lg">{getPriceTrendArrow()}</p>
                            </div>

                            {/* Price */}
                            <div className="bg-green-900/30 rounded p-2 border border-green-700 flex flex-col justify-center">
                              <p className="text-slate-400 text-xs">Price</p>
                              <p className="text-lg font-bold text-green-500">${vehicle.price?.toLocaleString()}</p>
                            </div>
                          </div>

                          {/* Condition & VIN & Save Button & Listing URL */}
                          <div className="mt-3 pt-3 border-t border-slate-700 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <span className={`text-xs font-semibold px-2 py-1 rounded ${vehicle.condition === 'New' ? 'bg-green-900/30 text-green-400' : 'bg-blue-900/30 text-blue-400'}`}>
                                {vehicle.condition}
                              </span>
                              <span className="text-slate-500 text-xs font-mono">{vehicle.vin}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleFavorite(vehicle.vin)}
                                className="p-2 hover:bg-slate-700 rounded transition flex items-center gap-1"
                              >
                                <Heart
                                  size={16}
                                  className={favorites.includes(vehicle.vin) ? 'fill-red-500 text-red-500' : 'text-slate-400'}
                                />
                                <span className="text-xs text-slate-400">
                                  {favorites.includes(vehicle.vin) ? 'Saved' : 'Save'}
                                </span>
                              </button>
                              {vehicle.url && vehicle.url !== 'N/A' && (
                                <a
                                  href={vehicle.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300 text-sm"
                                >
                                  View →
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Footer */}
        {filteredVehicles.length > 0 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <p className="text-slate-400 text-sm">Total Vehicles</p>
              <p className="text-3xl font-bold text-white">{filteredVehicles.length}</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <p className="text-slate-400 text-sm">Dealers</p>
              <p className="text-3xl font-bold text-white">{sortedSellers.length}</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <p className="text-slate-400 text-sm">Avg Price</p>
              <p className="text-3xl font-bold text-green-500">
                ${filteredVehicles.length > 0 ? Math.round(filteredVehicles.reduce((sum, v) => sum + (v.price || 0), 0) / filteredVehicles.length).toLocaleString() : '0'}
              </p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <p className="text-slate-400 text-sm">Favorites</p>
              <p className="text-3xl font-bold text-red-500">{favorites.length}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
