// frontend/src/pages/ReportsPage.jsx
import React from 'react';
import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import { useAuth } from '@/hooks/useAuth';
import SalesReportGenerator from '@/components/reports/SalesReportGenerator';
import { Home } from 'lucide-react';

const ReportsPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link 
          href="/dashboard" 
          underline="hover" 
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <Home className="h-4 w-4 mr-1" />
          Dashboard
        </Link>
        <Typography color="text.primary">Reports</Typography>
      </Breadcrumbs>
      
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1 }}>
          Reports
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Generate and download reports for your business
        </Typography>
      </Box>
      
      {/* Report Generator */}
      <SalesReportGenerator />
    </div>
  );
};

export default ReportsPage;