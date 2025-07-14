import React from 'react';
import { Zap, Search, Plane, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SustainLabsHeaderProps {
  notificationCount?: number;
  userInitial?: string;
}

const SustainLabsHeader: React.FC<SustainLabsHeaderProps> = ({ 
  notificationCount = 0, 
  userInitial = 'A' 
}) => {
  return (
    <header className="bg-gray-900 p-4 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2">
        <Zap className="h-6 w-6 text-green-400" />
        <span className="text-xl font-semibold text-green-400">SusTainLabs</span>
      </Link>
      
      <div className="flex items-center gap-3">
        <button className="p-2 text-gray-400 hover:text-gray-200">
          <Search className="h-5 w-5" />
        </button>
        
        <button className="p-2 text-gray-400 hover:text-gray-200">
          <Plane className="h-5 w-5" />
        </button>
        
        <button className="relative p-2 text-gray-400 hover:text-gray-200">
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 bg-green-400 rounded-full"></span>
          )}
        </button>
        
        <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full h-8 w-8 flex items-center justify-center text-white font-medium">
          {userInitial}
        </button>
      </div>
    </header>
  );
};

export default SustainLabsHeader; 