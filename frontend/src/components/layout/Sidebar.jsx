import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { 
  LayoutDashboard, 
  Plus, 
  History, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';

const Sidebar = ({ isCollapsed, toggleCollapse }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const navItems = [
    {
      path: '/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      label: 'Dashboard',
      adminOnly: true
    },
    {
      path: '/sales/new',
      icon: <Plus className="h-5 w-5" />,
      label: 'New Sale',
      adminOnly: false
    },
    {
      path: '/sales/history',
      icon: <History className="h-5 w-5" />,
      label: 'Sales History',
      adminOnly: false
    }
  ];

  return (
    <div className="h-full bg-white border-r border-gray-200">
      {/* Header with toggle */}
      <div className="flex items-center justify-between p-4">
        {!isCollapsed && (
          <span className="text-lg font-semibold text-blue-600">
            Sales Tracker
          </span>
        )}
        <button
          onClick={toggleCollapse}
          className="p-1.5 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {isCollapsed ? 
            <ChevronRight className="h-5 w-5 text-gray-500" /> : 
            <ChevronLeft className="h-5 w-5 text-gray-500" />
          }
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="mt-4 px-3 space-y-1">
        {navItems.map((item) => {
          if (item.adminOnly && !isAdmin) return null;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center px-3 py-2 rounded-lg transition-colors duration-150
                ${isActive 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                }
              `}
            >
              <div className="flex items-center">
                {item.icon}
                {!isCollapsed && (
                  <span className="ml-3 text-sm font-medium">
                    {item.label}
                  </span>
                )}
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* User Info */}
      {!isCollapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex flex-col space-y-1">
            <span className="text-sm font-medium text-gray-900">
              {user?.name}
            </span>
            <span className="text-xs text-gray-500">
              {user?.store?.name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;