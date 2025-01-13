import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  BarChart 
} from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    {
      path: '/',
      icon: LayoutDashboard,
      label: 'Dashboard'
    },
    {
      path: '/sales/new',
      icon: PlusCircle,
      label: 'New Sale'
    },
    {
      path: '/sales',
      icon: History,
      label: 'Sales History'
    }
  ];

  return (
    <aside className="w-64 bg-white shadow-sm h-[calc(100vh-4rem)]">
      <nav className="p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;