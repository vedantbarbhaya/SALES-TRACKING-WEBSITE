import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = () => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  // Handle responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  }, [location, isMobile]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <div
          className={`fixed md:relative z-20 transform transition-all duration-300 ease-in-out ${
            isSidebarCollapsed ? '-translate-x-full md:translate-x-0 md:w-16' : 'translate-x-0 w-64'
          }`}
        >
          <Sidebar 
            isCollapsed={isSidebarCollapsed} 
            toggleCollapse={() => setSidebarCollapsed(!isSidebarCollapsed)} 
          />
        </div>

        {/* Overlay for mobile */}
        {!isSidebarCollapsed && isMobile && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-10"
            onClick={() => setSidebarCollapsed(true)}
          />
        )}

        {/* Main Content */}
        <main 
          className={`flex-1 transition-all duration-300 ease-in-out ${
            isSidebarCollapsed ? 'md:pl-16' : 'md:pl-64'
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;