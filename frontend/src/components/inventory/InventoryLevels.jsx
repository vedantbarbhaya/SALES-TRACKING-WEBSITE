// src/components/inventory/InventoryLevels.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  InputAdornment,
  Button 
} from '@mui/material';
import { Search, FilterList } from '@mui/icons-material';
import api from '@/services/api';
import { getStores } from '@/services/stores';
import { useAuth } from '@/hooks/useAuth';
import { handleApiError } from '@/utils/errorHandler';
import { getMappingByStore } from '@/services/storeInventoryMap';

const InventoryLevels = () => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [collectionName, setCollectionName] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });
  

  // Fetch data on component mount
  useEffect(() => {
    if (user.role === 'admin') {
      fetchStores();
    } else if (user.store?._id) {
      setSelectedStore(user.store._id);
    }
  }, [user]);

  // When store selection changes, get the inventory collection name
  useEffect(() => {
    if (selectedStore) {
      fetchInventoryCollectionName();
    }
  }, [selectedStore]);

  // When collection name is available, fetch inventory
  useEffect(() => {
    if (collectionName) {
      fetchInventory();
    }
  }, [collectionName, searchTerm]);

  const fetchStores = async () => {
    try {
      const data = await getStores();
      setStores(data);
      if (data.length > 0) {
        setSelectedStore(data[0]._id);
      }
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const fetchInventoryCollectionName = async () => {
    try {
      const mapping = await getMappingByStore(selectedStore);
      setCollectionName(mapping.inventoryCollection);
    } catch (err) {
      setError(`No inventory mapping found for this store. Please create one first.`);
      setCollectionName('');
    }
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Add page and limit to params
      const { data } = await api.get('/inventory', {
        params: {
          collection: collectionName,
          search: searchTerm,
          page: pagination.page,
          limit: 20 // You can adjust this number based on your preference
        }
      });
      
      setInventory(data.items || []);
      
      // Update pagination state
      setPagination({
        page: data.page || 1,
        pages: data.pages || 1,
        total: data.total || 0
      });
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };
  
  // Add a function to handle page changes
  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };
  
  // Make sure fetchInventory is called when pagination changes
  useEffect(() => {
    if (collectionName) {
      fetchInventory();
    }
  }, [collectionName, searchTerm, pagination.page]); // Add pagination.page to dependencies

  const getStockLevelChip = (quantity) => {
    if (quantity <= 0) {
      return <Chip label="Out of Stock" color="error" size="small" />;
    } else if (quantity < 10) {
      return <Chip label="Low Stock" color="warning" size="small" />;
    } else {
      return <Chip label="In Stock" color="success" size="small" />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>Inventory Levels</Typography>
  
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        {user.role === 'admin' && (
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Store</InputLabel>
            <Select
              value={selectedStore}
              label="Store"
              onChange={(e) => setSelectedStore(e.target.value)}
            >
              {stores.map((store) => (
                <MenuItem key={store._id} value={store._id}>
                  {store.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
  
        <TextField
          label="Search Products"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          fullWidth
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton>
                  <Search />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>
  
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
  
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Variant</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {console.log('Rendering table with inventory:', inventory)}
                {inventory.length > 0 ? (
                  inventory.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell>{item.itemCode}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.variantName || '-'}</TableCell>
                      <TableCell>{item.department}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>INR {item.price?.toFixed(2)}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{getStockLevelChip(item.quantity)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      {collectionName ? 'No inventory items found' : 'Select a store with inventory mapping'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {inventory.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Showing {inventory.length} of {pagination.total} items
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button 
                  disabled={pagination.page === 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                  size="small"
                >
                  Previous
                </Button>
                
                <Typography variant="body2">
                  Page {pagination.page} of {pagination.pages}
                </Typography>
                
                <Button 
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                  size="small"
                >
                  Next
                </Button>
              </Box>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}; 

export default InventoryLevels;