import React, { useState, useEffect } from 'react';
import Dashboard from './Dashboard';
import SavedVehicles from './SavedVehicles';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Simple client-side routing based on pathname
  useEffect(() => {
    const handlePathChange = () => {
      const path = window.location.pathname;
      console.log('Current pathname:', path); // Debug log
      
      // Check if path includes 'saved'
      if (path.includes('saved')) {
        setCurrentPage('saved');
      } else {
        setCurrentPage('dashboard');
      }
    };

    handlePathChange();
    window.addEventListener('popstate', handlePathChange);
    return () => window.removeEventListener('popstate', handlePathChange);
  }, []);

  // Simple navigation helper
  const navigateTo = (page) => {
    if (page === 'saved') {
      window.history.pushState({}, '', '/saved');
      setCurrentPage('saved');
    } else {
      window.history.pushState({}, '', '/');
      setCurrentPage('dashboard');
    }
  };

  // Pass navigate function as context or prop
  if (currentPage === 'saved') {
    return <SavedVehicles onNavigate={navigateTo} />;
  }

  return <Dashboard onNavigate={navigateTo} />;
}
