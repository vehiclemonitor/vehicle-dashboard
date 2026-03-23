import React, { useState, useEffect } from 'react';
import Dashboard from './Dashboard';
import SavedVehicles from './SavedVehicles';
import VehicleDetails from './VehicleDetails';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedVin, setSelectedVin] = useState(null);

  useEffect(() => {
    const handlePathChange = () => {
      const path = window.location.pathname;
      console.log('Current pathname:', path);
      
      if (path.includes('/vehicle/')) {
        const vin = path.split('/vehicle/')[1];
        setSelectedVin(vin);
        setCurrentPage('details');
      } else if (path.includes('saved')) {
        setCurrentPage('saved');
      } else {
        setCurrentPage('dashboard');
      }
    };

    handlePathChange();
    window.addEventListener('popstate', handlePathChange);
    return () => window.removeEventListener('popstate', handlePathChange);
  }, []);

  const navigateTo = (page, vin = null) => {
    if (page === 'saved') {
      window.history.pushState({}, '', '/saved');
      setCurrentPage('saved');
    } else if (page === 'details' && vin) {
      window.history.pushState({}, '', `/vehicle/${vin}`);
      setSelectedVin(vin);
      setCurrentPage('details');
    } else {
      window.history.pushState({}, '', '/');
      setCurrentPage('dashboard');
    }
  };

  if (currentPage === 'details') {
    return <VehicleDetails vin={selectedVin} onNavigate={navigateTo} />;
  }

  if (currentPage === 'saved') {
    return <SavedVehicles onNavigate={navigateTo} />;
  }

  return <Dashboard onNavigate={navigateTo} />;
}
