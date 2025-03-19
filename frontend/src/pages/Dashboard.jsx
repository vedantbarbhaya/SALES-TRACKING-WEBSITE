import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import DashboardOverview from '@/components/sales/DashboardOverview';
import SalesTableView from '@/components/sales/SalesTableView';
import ExcelUploadModal from '@/components/uploads/ExcelUploadModal';
import StoreInventoryMapping from '@/components/admin/StoreInventoryMapping';
import InventoryLevels from '@/components/inventory/InventoryLevels';
import { Button, Tabs, Tab, Box } from '@mui/material';
import { Upload } from 'lucide-react';

const DashboardPage = () => {
  const { user } = useAuth();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

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

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab label="Dashboard" />
          <Tab label="Sales" />
          <Tab label="Inventory" />
          {user?.role === 'admin' && <Tab label="Store Mappings" />}
        </Tabs>
      </Box>

      {/* Tab Content */}
      <div role="tabpanel" hidden={currentTab !== 0}>
        {currentTab === 0 && <DashboardOverview />}
      </div>

      <div role="tabpanel" hidden={currentTab !== 1}>
        {currentTab === 1 && <SalesTableView />}
      </div>

      <div role="tabpanel" hidden={currentTab !== 2}>
        {currentTab === 2 && <InventoryLevels />}
      </div>

      {user?.role === 'admin' && (
        <div role="tabpanel" hidden={currentTab !== 3}>
          {currentTab === 3 && <StoreInventoryMapping />}
        </div>
      )}

      <ExcelUploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
      />
    </div>
  );
};

export default DashboardPage;