import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Grid, Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getStores } from '@/services/stores';
import { getSalesStats } from '@/services/sales';

const StorePerformance = () => {
  const [stores, setStores] = useState([]);
  const [storePerformance, setStorePerformance] = useState([]);
  const [timeRange, setTimeRange] = useState('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const storesData = await getStores();
        setStores(storesData);
      } catch (error) {
        console.error('Error fetching stores:', error);
      }
    };
    
    fetchStores();
  }, []);

  useEffect(() => {
    const fetchStorePerformance = async () => {
      if (stores.length === 0) return;
      
      try {
        setLoading(true);
        
        const endDate = new Date();
        const startDate = new Date();
        
        switch(timeRange) {
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
            startDate.setDate(startDate.getDate() - 30);
        }
        
        // Fetch performance data for each store
        const performanceData = await Promise.all(
          stores.map(async (store) => {
            try {
              const stats = await getSalesStats({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                storeId: store._id
              });
              
              return {
                name: store.name,
                totalSales: stats.summary.totalSales || 0,
                totalAmount: stats.summary.totalAmount || 0,
                averageAmount: stats.summary.averageAmount || 0,
                uniqueCustomers: stats.summary.uniqueCustomers || 0
              };
            } catch (error) {
              console.error(`Error fetching performance for ${store.name}:`, error);
              return {
                name: store.name,
                totalSales: 0,
                totalAmount: 0,
                averageAmount: 0,
                uniqueCustomers: 0
              };
            }
          })
        );
        
        setStorePerformance(performanceData);
      } catch (error) {
        console.error('Error fetching store performance:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStorePerformance();
  }, [stores, timeRange]);

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Store Performance</Typography>
        
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            label="Time Range"
            onChange={(e) => setTimeRange(e.target.value)}
            size="small"
          >
            <MenuItem value="week">Last Week</MenuItem>
            <MenuItem value="month">Last Month</MenuItem>
            <MenuItem value="year">Last Year</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Revenue by Store</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={storePerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="totalAmount" fill="#8884d8" name="Total Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Sales Count by Store</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={storePerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalSales" fill="#82ca9d" name="Total Orders" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Average Order Value</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={storePerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="averageAmount" fill="#ffc658" name="Avg Order Value" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Customer Reach</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={storePerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="uniqueCustomers" fill="#ff8042" name="Unique Customers" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StorePerformance;