import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import DashboardOverview from '@/components/sales/DashboardOverview';
import SalesTableView from '@/components/sales/SalesTableView';
import ExcelUploadModal from '@/components/uploads/ExcelUploadModal';
import { Button } from '@mui/material';
import { Upload } from 'lucide-react';

const DashboardPage = () => {
  const { user } = useAuth();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Welcome Section */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
          <p className="text-gray-600 mt-1">Here's what's happening with your store today.</p>
        </div>
        
        {user?.role === 'admin' && (
          <Button
            variant="contained"
            startIcon={<Upload />}
            onClick={() => setUploadModalOpen(true)}
          >
            Upload Data
          </Button>
        )}
      </div>

      <DashboardOverview />

      <div className="mt-8">
        <SalesTableView />
      </div>

      <ExcelUploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
      />
    </div>
  );
};

export default DashboardPage;