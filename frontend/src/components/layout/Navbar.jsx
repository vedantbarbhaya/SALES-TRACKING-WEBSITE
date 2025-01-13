import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth'; 
import { Menu, Bell, LogOut } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-blue-600">
                Sales Tracker
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-gray-100">
              <Bell className="h-5 w-5 text-gray-500" />
            </button>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                {user?.name}
              </span>
              <span className="text-xs text-gray-500">
                {user?.store?.name}
              </span>
            </div>

            <button
              onClick={logout}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <LogOut className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;