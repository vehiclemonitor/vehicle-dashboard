import React, { useState, useEffect } from 'react';
import { Search, Filter, Heart, MapPin, Zap, DollarSign } from 'lucide-react';

export default function VehicleDashboard() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/vehicles');
      const data = await response.json();
      setVehicles(data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      // Use mock data if API fails
      setVehicles([
        {
          id: 'bmw-m2-001',
          year: 2024,
          type: 'BMW M2',
          model: 'M2 Competition',
          dealer: 'Stevens Creek BMW',
          price: 78999,
          mileage: 5,
          color: 'Alpine White',
          transmission: 'Automatic',
          driveType: '4WD',
          vin: 'WBS0V9105FP123456',
          url: 'https://www.stevenscreekbmw.com',
          image: 'https://images.unsplash.com/photo-1617469767537-b85894b34f95?w=500&h=400&fit=crop'
        },
        {
          id: 'porsche-911-001',
          year: 2024,
          type: 'Porsche 911',
          model: 'Carrera T',
          dealer: 'Porsche Redwood City',
          price: 119999,
          mileage: 10,
          color: 'Jet Black',
          transmission: 'Manual',
          driveType: 'RWD',
          vin: 'WP0AA2992RK123456',
          url: 'https://www.porscheredwoodcity.com',
          image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=500&h=400&fit=crop'
        },
        {
          id: 'bmw-m2-002',
          year: 2023,
          type: 'BMW M2',
          model: 'M2',
          dealer: 'BMW of San Francisco',
          price: 75500,
          mileage: 15000,
          color: 'Black Sapphire',
          transmission: 'Manual',
          driveType: '4WD',
          vin: 'WBS0V9105GP654321',
          url: 'https://www.bmwsf.com',
          image: 'https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=500&h=400&fit=crop'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (id) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fav => fav !== id) : [...prev, id]
    );
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.dealer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || vehicle.type.includes(filterType);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white">🚗 Vehicle Monitor</h1>
              <p className="text-slate-400 mt-1">Bay Area BMW M2 & Porsche 911 Tracker</p>
            </div>
            <button 
              onClick={fetchVehicles}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search by model, dealer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 text-white placeholder-slate-400 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-slate-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Vehicles</option>
                <option value="BMW">BMW M2</option>
                <option value="Porsche">Porsche 911</option>
              </select>
            </div>
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
            <p className="text-slate-400 text-lg">No vehicles found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map(vehicle => (
              <div
                key={vehicle.id}
                className="group bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-blue-500 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20"
              >
                {/* Image Container */}
                <div className="relative h-64 overflow-hidden bg-slate-700">
                  <img
                    src={vehicle.image}
                    alt={`${vehicle.year} ${vehicle.type}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = `https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=500&h=400&fit=crop`;
                    }}
                  />
                  {/* Favorite Button */}
                  <button
                    onClick={() => toggleFavorite(vehicle.id)}
                    className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/75 rounded-full transition"
                  >
                    <Heart
                      size={20}
                      className={favorites.includes(vehicle.id) ? 'fill-red-500 text-red-500' : 'text-white'}
                    />
                  </button>
                  {/* Badge */}
                  <div className="absolute top-3 left-3 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {vehicle.year} {vehicle.type}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Title */}
                  <h3 className="text-xl font-bold text-white mb-1">{vehicle.model}</h3>
                  <p className="text-slate-400 text-sm mb-4 flex items-center gap-1">
                    <MapPin size={16} />
                    {vehicle.dealer}
                  </p>

                  {/* Price */}
                  <div className="bg-slate-700/50 rounded-lg p-3 mb-4 border border-slate-600">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign size={18} className="text-green-500" />
                      <span className="text-slate-400 text-sm">Price</span>
                    </div>
                    <p className="text-3xl font-bold text-green-500">${vehicle.price.toLocaleString()}</p>
                  </div>

                  {/* VIN */}
                  <div className="bg-slate-700/50 rounded-lg p-3 mb-4 border border-slate-600">
                    <p className="text-slate-400 text-sm mb-1">VIN</p>
                    <p className="text-white font-mono text-sm break-all">{vehicle.vin || 'N/A'}</p>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-slate-700/50 rounded p-2 border border-slate-600">
                      <p className="text-slate-400 text-xs">Mileage</p>
                      <p className="text-white font-semibold">{vehicle.mileage.toLocaleString()} mi</p>
                    </div>
                    <div className="bg-slate-700/50 rounded p-2 border border-slate-600">
                      <p className="text-slate-400 text-xs">Color</p>
                      <p className="text-white font-semibold">{vehicle.color}</p>
                    </div>
                    <div className="bg-slate-700/50 rounded p-2 border border-slate-600">
                      <p className="text-slate-400 text-xs">Trans.</p>
                      <p className="text-white font-semibold">{vehicle.transmission}</p>
                    </div>
                    <div className="bg-slate-700/50 rounded p-2 border border-slate-600 flex items-center gap-2">
                      <Zap size={14} className="text-yellow-500" />
                      <div>
                        <p className="text-slate-400 text-xs">Drive</p>
                        <p className="text-white font-semibold text-sm">{vehicle.driveType}</p>
                      </div>
                    </div>
                  </div>

                  {/* View Button */}
                  <a
                    href={vehicle.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition text-center block"
                  >
                    View on Dealer Site →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Footer */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <p className="text-slate-400 text-sm">Total Vehicles</p>
            <p className="text-3xl font-bold text-white">{filteredVehicles.length}</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <p className="text-slate-400 text-sm">Favorites</p>
            <p className="text-3xl font-bold text-red-500">{favorites.length}</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <p className="text-slate-400 text-sm">Average Price</p>
            <p className="text-3xl font-bold text-green-500">
              ${Math.round(filteredVehicles.reduce((sum, v) => sum + v.price, 0) / filteredVehicles.length).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
