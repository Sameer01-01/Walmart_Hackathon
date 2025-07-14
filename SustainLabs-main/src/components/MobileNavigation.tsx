import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Activity, Menu, ArrowLeft } from 'lucide-react';

const MobileNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 h-14 bg-gray-800 border-t border-gray-700 flex items-center justify-around px-4 z-50">
      <button 
        className="p-2 flex flex-col items-center justify-center"
        onClick={() => navigate('/')}
      >
        <Menu className="h-6 w-6 text-gray-400" />
      </button>
      
      <button 
        className="p-2 h-10 w-10 rounded-full border-2 border-gray-700 flex items-center justify-center"
        onClick={() => navigate('/dashboard')}
      >
        <Home className="h-5 w-5 text-gray-400" />
      </button>
      
      <button 
        className="p-2 flex items-center justify-center"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-6 w-6 text-gray-400" />
      </button>
    </div>
  );
};

export default MobileNavigation; 