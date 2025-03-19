// src/components/admin/StoreInventoryMapping.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  IconButton
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { getInventoryMappings, createMapping, updateMapping, deleteMapping } from '@/services/storeInventoryMap';
import { getStores } from '@/services/stores';
import { handleApiError } from '@/utils/errorHandler';

const StoreInventoryMapping = () => {
  const [mappings, setMappings] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create' or 'edit'
  const [currentMapping, setCurrentMapping] = useState({
    storeId: '',
    inventoryCollection: ''
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchMappings();
    fetchStores();
  }, []);

  const fetchMappings = async () => {
    try {
      setLoading(true);
      const data = await getInventoryMappings();
      setMappings(data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    try {
      const data = await getStores();
      setStores(data);
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handleOpenCreateDialog = () => {
    setCurrentMapping({
      storeId: '',
      inventoryCollection: ''
    });
    setDialogMode('create');
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (mapping) => {
    setCurrentMapping({
      id: mapping._id,
      storeId: mapping.store._id,
      inventoryCollection: mapping.inventoryCollection
    });
    setDialogMode('edit');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentMapping(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!currentMapping.storeId || !currentMapping.inventoryCollection) {
        setError('All fields are required');
        return;
      }
      
      if (dialogMode === 'create') {
        await createMapping({
          storeId: currentMapping.storeId,
          inventoryCollection: currentMapping.inventoryCollection
        });
        setSuccess('Mapping created successfully');
      } else {
        await updateMapping(currentMapping.id, {
          inventoryCollection: currentMapping.inventoryCollection
        });
        setSuccess('Mapping updated successfully');
      }
      
      fetchMappings();
      handleCloseDialog();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
      
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this mapping?')) {
      return;
    }

    try {
      setLoading(true);
      await deleteMapping(id);
      setSuccess('Mapping deleted successfully');
      fetchMappings();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
      
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Store Inventory Mappings</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenCreateDialog}
        >
          Create Mapping
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {loading && !openDialog ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Store</TableCell>
                <TableCell>Inventory Collection</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mappings.length > 0 ? (
                mappings.map((mapping) => (
                  <TableRow key={mapping._id}>
                    <TableCell>{mapping.store?.name || 'Unknown Store'}</TableCell>
                    <TableCell>{mapping.inventoryCollection}</TableCell>
                    <TableCell align="right">
                      <IconButton 
                        color="primary" 
                        onClick={() => handleOpenEditDialog(mapping)}
                        size="small"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton 
                        color="error" 
                        onClick={() => handleDelete(mapping._id)}
                        size="small"
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    No mappings found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {dialogMode === 'create' ? 'Create Mapping' : 'Edit Mapping'}
        </DialogTitle>
        <DialogContent sx={{ minWidth: 400 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Store</InputLabel>
              <Select
                name="storeId"
                value={currentMapping.storeId}
                onChange={handleInputChange}
                label="Store"
                disabled={dialogMode === 'edit'}
              >
                {stores.map((store) => (
                  <MenuItem key={store._id} value={store._id}>
                    {store.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Inventory Collection"
              name="inventoryCollection"
              value={currentMapping.inventoryCollection}
              onChange={handleInputChange}
              fullWidth
              placeholder="e.g., INV_KR1"
              helperText="Collection name where inventory for this store is stored"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StoreInventoryMapping;