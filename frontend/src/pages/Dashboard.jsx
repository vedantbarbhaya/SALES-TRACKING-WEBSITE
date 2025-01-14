import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import DashboardOverview from '@/components/sales/DashboardOverview';
import SalesTableView from '@/components/sales/SalesTableView';

const DashboardPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
        <p className="text-gray-600 mt-1">Here's what's happening with your store today.</p>
      </div>

      {/* Dashboard Overview Component */}
      <DashboardOverview />

      {/* Sales Table View */}
      <div className="mt-8">
        <SalesTableView />
      </div>
    </div>
  );
};

export default DashboardPage;