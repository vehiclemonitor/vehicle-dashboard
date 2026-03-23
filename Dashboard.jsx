import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Heart, MapPin, DollarSign, Globe } from 'lucide-react';

export default function VehicleDashboard() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [lastScan, setLastScan] = useState(null);

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

  const toggleFavorite = (vin) => {
    setFavorites(prev => 
      prev.includes(vin) ? prev.filter(fav => fav !== vin) : [...prev, vin]
    );
  };

  const scanNow = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://vehicle-monitor-bay-area-a782b1271cca.herokuapp.com/api/scan');
      const data = await response.json();
      
      if (response.ok) {
        alert(`✅ Scan completed!\n\nFound ${data.total} BMW M2 vehicles\n\nRefreshing dashboard...`);
        await fetchVehicles();
      } else {
        alert(`❌ Error: ${data.message}`);
        setLoading(false);
      }
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
      setLoading(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white">🏎️ Porsche 911 Tracker</h1>
              <p className="text-slate-400 mt-1">Real-time inventory from Bay Area dealers</p>
            </div>
            <button 
              onClick={scanNow}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              Scan Now
            </button>
          </div>

          {/* Search Criteria Display */}
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 mb-6">
            <h3 className="text-white font-semibold mb-3">Search Criteria</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-slate-400">Make/Model</p>
                <p className="text-white font-semibold">BMW M2</p>
              </div>
              <div>
                <p className="text-slate-400">Years</p>
                <p className="text-white font-semibold">2025-2026</p>
              </div>
              <div>
                <p className="text-slate-400">Transmission</p>
                <p className="text-white font-semibold">Manual</p>
              </div>
              <div>
                <p className="text-slate-400">Mileage</p>
                <p className="text-white font-semibold">&lt;10,000 miles</p>
              </div>
              <div>
                <p className="text-slate-400">Location</p>
                <p className="text-white font-semibold">94949</p>
              </div>
              <div>
                <p className="text-slate-400">Radius</p>
                <p className="text-white font-semibold">50 miles</p>
              </div>
              <div>
                <p className="text-slate-400">Condition</p>
                <p className="text-white font-semibold">New & Used</p>
              </div>
              <div>
                <p className="text-slate-400">Last Scan</p>
                <p className="text-white font-semibold text-xs">{lastScan || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by dealer name, location, or VIN..."
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
            <p className="text-slate-400 text-lg mb-4">No BMW M2 vehicles found</p>
            <button 
              onClick={scanNow}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition inline-flex items-center gap-2"
            >
              <RefreshCw size={20} />
              Scan for Vehicles
            </button>
          </div>
        ) : (
          <div>
            <p className="text-slate-400 mb-6">Found {filteredVehicles.length} BMW M2 vehicles from {sortedSellers.length} dealers</p>
            
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

                  {/* Vehicles Table */}
                  <div className="space-y-3">
                    {sellerVehicles.map(vehicle => (
                      <div
                        key={vehicle.vin}
                        className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-blue-500 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
                          {/* VIN & Price */}
                          <div>
                            <p className="text-slate-400 text-sm">VIN</p>
                            <p className="text-white font-mono text-sm font-semibold break-all">{vehicle.vin}</p>
                            <p className="text-slate-400 text-xs mt-1">
                              {vehicle.condition}
                            </p>
                          </div>

                          {/* Price */}
                          <div className="bg-green-900/30 rounded p-3 border border-green-700">
                            <p className="text-slate-400 text-sm">Price</p>
                            <p className="text-2xl font-bold text-green-500">${vehicle.price?.toLocaleString()}</p>
                          </div>

                          {/* Mileage */}
                          <div>
                            <p className="text-slate-400 text-sm">Mileage</p>
                            <p className="text-white font-semibold text-lg">{vehicle.mileage?.toLocaleString()} mi</p>
                          </div>

                          {/* Days on Market */}
                          <div>
                            <p className="text-slate-400 text-sm">Days on Market</p>
                            <p className="text-white font-semibold text-lg">
                              {vehicle.daysOnMarket !== null ? `${vehicle.daysOnMarket}d` : 'N/A'}
                            </p>
                          </div>

                          {/* Year */}
                          <div>
                            <p className="text-slate-400 text-sm">Year</p>
                            <p className="text-white font-semibold text-lg">{vehicle.year}</p>
                          </div>

                          {/* Model & Trim */}
                          <div>
                            <p className="text-slate-400 text-sm">Model & Trim</p>
                            <p className="text-white font-semibold text-sm">
                              {vehicle.model}
                              {vehicle.trim && vehicle.trim !== 'N/A' ? ` ${vehicle.trim}` : ''}
                            </p>
                            <p className={`text-xs mt-1 font-semibold ${vehicle.condition === 'New' ? 'text-green-400' : 'text-blue-400'}`}>
                              {vehicle.condition}
                            </p>
                          </div>

                          {/* Specs & Action */}
                          <div className="flex flex-col justify-between">
                            <div>
                              <p className="text-slate-400 text-sm">Specs</p>
                              <p className="text-white text-sm">
                                <span className="font-semibold">{vehicle.color}</span> • {vehicle.transmission} • {vehicle.driveType}
                              </p>
                            </div>
                            <button
                              onClick={() => toggleFavorite(vehicle.vin)}
                              className="mt-2 p-2 hover:bg-slate-700 rounded transition flex items-center gap-1 justify-center"
                            >
                              <Heart
                                size={18}
                                className={favorites.includes(vehicle.vin) ? 'fill-red-500 text-red-500' : 'text-slate-400'}
                              />
                              <span className="text-xs text-slate-400">
                                {favorites.includes(vehicle.vin) ? 'Saved' : 'Save'}
                              </span>
                            </button>
                          </div>
                        </div>

                        {/* Listing URL */}
                        {vehicle.url && vehicle.url !== 'N/A' && (
                          <div className="mt-3 pt-3 border-t border-slate-700">
                            <a
                              href={vehicle.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 text-sm break-all"
                            >
                              View listing →
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
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
