import React, { useState, useEffect } from 'react';
import { 
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { DollarSign, ShoppingBag, TrendingUp, Users, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getSalesStats, getDailySales } from '@/services/sales';
import { getStores } from '@/services/stores';
import { handleApiError } from '@/utils/errorHandler';

const DashboardOverview = () => {
  // States
  const [selectedStore, setSelectedStore] = useState('all');
  const [period, setPeriod] = useState('week');
  const [stats, setStats] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch stores on mount
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const storesData = await getStores();
        setStores(storesData);
      } catch (err) {
        setError(handleApiError(err));
      }
    };
    fetchStores();
  }, []);

  // Fetch dashboard data when store or period changes
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError('');
        
        const endDate = new Date();
        const startDate = new Date();

        switch(period) {
          case 'week':
            startDate.setDate(startDate.getDate() - 7);
            break;
          case 'month':
            startDate.setDate(startDate.getDate() - 30);
            break;
          case 'year':
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
          default:
            startDate.setDate(startDate.getDate() - 7);
        }

        const params = {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        };

        if (selectedStore !== 'all') {
          params.storeId = selectedStore;
        }

        const [statsResponse, salesResponse] = await Promise.all([
          getSalesStats(params),
          getDailySales(params)
        ]);

        setStats(statsResponse);
        setSalesData(salesResponse);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedStore, period]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      {/* Filters */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h6" className="text-gray-900">
          Dashboard Overview
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Store</InputLabel>
            <Select
              value={selectedStore}
              label="Store"
              onChange={(e) => setSelectedStore(e.target.value)}
            >
              <MenuItem value="all">All Stores</MenuItem>
              {stores.map((store) => (
                <MenuItem key={store._id} value={store._id}>
                  {store.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={period}
              label="Period"
              onChange={(e) => setPeriod(e.target.value)}
            >
              <MenuItem value="week">Last 7 Days</MenuItem>
              <MenuItem value="month">Last 30 Days</MenuItem>
              <MenuItem value="year">Last Year</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Total Sales Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography color="textSecondary" variant="subtitle2" gutterBottom>
                    Total Sales
                  </Typography>
                  <Typography variant="h5" component="div">
                    ${stats?.summary.totalAmount?.toFixed(2) || '0.00'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {stats?.summary.totalSales || 0} orders
                  </Typography>
                </Box>
                <Box sx={{ p: 1, bgcolor: 'primary.50', borderRadius: 2 }}>
                  <DollarSign className="text-primary-600" size={24} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Average Order Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography color="textSecondary" variant="subtitle2" gutterBottom>
                    Average Order
                  </Typography>
                  <Typography variant="h5" component="div">
                    ${stats?.summary.averageAmount?.toFixed(2) || '0.00'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Per transaction
                  </Typography>
                </Box>
                <Box sx={{ p: 1, bgcolor: 'success.50', borderRadius: 2 }}>
                  <TrendingUp className="text-success-600" size={24} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Orders Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography color="textSecondary" variant="subtitle2" gutterBottom>
                    Total Orders
                  </Typography>
                  <Typography variant="h5" component="div">
                    {stats?.summary.totalSales || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    This period
                  </Typography>
                </Box>
                <Box sx={{ p: 1, bgcolor: 'warning.50', borderRadius: 2 }}>
                  <ShoppingBag className="text-warning-600" size={24} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Unique Customers Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography color="textSecondary" variant="subtitle2" gutterBottom>
                    Active Customers
                  </Typography>
                  <Typography variant="h5" component="div">
                    {stats?.summary.uniqueCustomers || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Unique buyers
                  </Typography>
                </Box>
                <Box sx={{ p: 1, bgcolor: 'info.50', borderRadius: 2 }}>
                  <Users className="text-info-600" size={24} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sales Chart */}
      <Card sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Sales Trend
        </Typography>
        <Box sx={{ height: 400, mt: 2 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                stroke="#6B7280"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                stroke="#6B7280"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  padding: '1rem'
                }}
                formatter={(value) => [`$${value}`, 'Sales']}
                labelFormatter={formatDate}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Card>
    </Box>
  );
};

export default DashboardOverview;