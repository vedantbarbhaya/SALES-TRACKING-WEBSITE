import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Grid, Box } from '@mui/material';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowUpRight, ArrowDownRight, DollarSign, ShoppingCart, Users, TrendingUp } from 'lucide-react';
import { getSalesStats, getDailySales } from '@/services/sales';

const SalesAnalytics = () => {
  const [period, setPeriod] = useState('week');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
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
        
        const dailyData = await getDailySales({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          storeId: 'all'
        });
        
        setData(dailyData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [period]);

  if (loading || !data) {
    return <div>Loading dashboard data...</div>;
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>Sales Performance</Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Daily Sales Trend</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.dailySales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="amount" stroke="#8884d8" name="Sales Amount" />
                  <Line type="monotone" dataKey="totalSales" stroke="#82ca9d" name="Order Count" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Summary</Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ p: 1, borderRadius: 1, bgcolor: 'primary.light', mr: 2 }}>
                  <DollarSign size={24} color="#fff" />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
                  <Typography variant="h6">${data.summary.totalAmount.toLocaleString()}</Typography>
                </Box>
                <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', color: 'success.main' }}>
                  <ArrowUpRight size={16} />
                  <Typography variant="body2" sx={{ ml: 0.5 }}>
                    {data.summary.amountTrend > 0 ? `+${data.summary.amountTrend}%` : `${data.summary.amountTrend}%`}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ p: 1, borderRadius: 1, bgcolor: 'success.light', mr: 2 }}>
                  <ShoppingCart size={24} color="#fff" />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Total Orders</Typography>
                  <Typography variant="h6">{data.summary.totalSales}</Typography>
                </Box>
                <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', color: data.summary.salesTrend > 0 ? 'success.main' : 'error.main' }}>
                  {data.summary.salesTrend > 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                  <Typography variant="body2" sx={{ ml: 0.5 }}>
                    {data.summary.salesTrend > 0 ? `+${data.summary.salesTrend}%` : `${data.summary.salesTrend}%`}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ p: 1, borderRadius: 1, bgcolor: 'info.light', mr: 2 }}>
                  <TrendingUp size={24} color="#fff" />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Average Order Value</Typography>
                  <Typography variant="h6">${(data.summary.totalAmount / data.summary.totalSales || 0).toFixed(2)}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SalesAnalytics;