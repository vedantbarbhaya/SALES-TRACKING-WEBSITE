import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Grid, Box, Button } from '@mui/material';
import { Alert, CircularProgress } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getInventoryStats, getInventoryCollectionName } from '@/services/inventory';
import { getStores } from '@/services/stores';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const InventoryStatus = () => {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState('');
  const [inventoryData, setInventoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const storesData = await getStores();
        setStores(storesData);
        if (storesData.length > 0) {
          setSelectedStore(storesData[0]._id);
        }
      } catch (err) {
        setError('Failed to load stores');
      }
    };
    
    fetchStores();
  }, []);

  useEffect(() => {
    const fetchInventoryData = async () => {
      if (!selectedStore) return;
      
      try {
        setLoading(true);
        // First get the inventory collection name for this store
        const collectionName = await getInventoryCollectionName(selectedStore);
        
        // Then get inventory stats
        const stats = await getInventoryStats(collectionName);
        setInventoryData(stats);
        setError('');
      } catch (err) {
        setError(`Failed to load inventory data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    if (selectedStore) {
      fetchInventoryData();
    }
  }, [selectedStore]);

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!inventoryData) {
    return <Typography>Select a store to view inventory data</Typography>;
  }

  // Prepare data for category chart
  const categoryData = inventoryData.topCategories.map(cat => ({
    name: cat.category || 'Uncategorized',
    value: cat.totalValue
  }));

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Inventory Status</Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          {stores.map(store => (
            <Button 
              key={store._id}
              variant={selectedStore === store._id ? "contained" : "outlined"}
              onClick={() => setSelectedStore(store._id)}
              size="small"
            >
              {store.name}
            </Button>
          ))}
        </Box>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Products</Typography>
              <Typography variant="h5" component="div">
                {inventoryData.totalItems.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Out of Stock</Typography>
              <Typography variant="h5" component="div" color="error">
                {inventoryData.outOfStock.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {((inventoryData.outOfStock / inventoryData.totalItems) * 100).toFixed(1)}% of inventory
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Low Stock</Typography>
              <Typography variant="h5" component="div" color="warning.main">
                {inventoryData.lowStock.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {((inventoryData.lowStock / inventoryData.totalItems) * 100).toFixed(1)}% of inventory
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Inventory Value</Typography>
              <Typography variant="h5" component="div">
                ${inventoryData.inventoryValue.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Inventory by Category</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Top Categories by Value</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={inventoryData.topCategories}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  <Bar dataKey="totalValue" fill="#8884d8" name="Total Value" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default InventoryStatus;