import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import DashboardOverview from '@/components/sales/DashboardOverview';
import SalesTableView from '@/components/sales/SalesTableView';
import ExcelUploadModal from '@/components/uploads/ExcelUploadModal';
import StoreInventoryMapping from '@/components/admin/StoreInventoryMapping';
import InventoryLevels from '@/components/inventory/InventoryLevels';
import { Button, Tabs, Tab, Box, Grid } from '@mui/material';
import { Upload, FileText } from 'lucide-react';
import SalesAnalytics from '@/components/dashboard/SalesAnalytics';
import InventoryStatus from '@/components/dashboard/InventoryStatus';
import StorePerformance from '@/components/dashboard/StorePerformance';
import RecentSales from '@/components/dashboard/RecentSales';
import LowStockAlerts from '@/components/dashboard/LowStockAlerts';
import { Link } from 'react-router-dom';
import SalesReportGenerator from '@/components/reports/SalesReportGenerator';

const DashboardPage = () => {
  const { user } = useAuth();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Enhanced dashboard content
  const renderEnhancedDashboard = () => (
    <Grid container spacing={4}>
      {/* Main analytics dashboard */}
      <Grid item xs={12}>
        <SalesAnalytics />
      </Grid>
      
      {/* Store Performance Comparison (Admin only) */}
      {user?.role === 'admin' && (
        <Grid item xs={12}>
          <StorePerformance />
        </Grid>
      )}
      
      {/* Inventory Status */}
      <Grid item xs={12}>
        <InventoryStatus />
      </Grid>
      
      {/* Recent Sales and Low Stock Alerts side by side */}
      <Grid item xs={12} md={6}>
        <RecentSales />
      </Grid>
      
      <Grid item xs={12} md={6}>
        <LowStockAlerts />
      </Grid>
    </Grid>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Welcome Section */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
          <p className="text-gray-600 mt-1">Here's what's happening with your store today.</p>
        </div>
  
        <div className="flex gap-2">
          {user?.role === 'admin' && (
            <Button
              variant="outlined"
              startIcon={<FileText />}
              component={Link}
              to="/reports"
            >
              Reports
            </Button>
          )}
    
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
      </div>
  
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab label="Dashboard" />
          <Tab label="Sales" />
          <Tab label="Inventory" />
          {user?.role === 'admin' && <Tab label="Store Mappings" />}
          {user?.role === 'admin' && <Tab label="Reports" />}
        </Tabs>
      </Box>
  
      {/* Tab Content */}
      <div role="tabpanel" hidden={currentTab !== 0}>
        {currentTab === 0 && (
          <>
            {/* Original dashboard overview for backward compatibility */}
            <DashboardOverview />
            
            {/* Enhanced dashboard with new components */}
            {renderEnhancedDashboard()}
          </>
        )}
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
  
      {user?.role === 'admin' && (
        <div role="tabpanel" hidden={currentTab !== 4}>
          {currentTab === 4 && <SalesReportGenerator />}
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