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
  InputAdornment
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
      
      // Custom endpoint to get inventory by collection name
      const { data } = await api.get('/inventory', {
        params: {
          collection: collectionName,
          search: searchTerm
        }
      });
      
      setInventory(data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

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
              {inventory.length > 0 ? (
                inventory.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell>{item.itemCode}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.variantName || '-'}</TableCell>
                    <TableCell>{item.department}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>${item.price.toFixed(2)}</TableCell>
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
      )}
    </Box>
  );
};

export default InventoryLevels;