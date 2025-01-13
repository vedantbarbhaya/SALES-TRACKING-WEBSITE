import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Card,
  CardContent,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  PhotoCamera as CameraIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Search as SearchIcon,
  QrCodeScanner as ScanIcon
} from '@mui/icons-material';
import ProductSearch from '@/components/sales/ProductSearch';
import { useAuth } from '@/hooks/useAuth';
import { handleApiError } from '@/utils/errorHandler';
import { createSale, getStores} from '@/services/sales';
import { searchProducts } from '@/services/product';

const NewSalePage = () => {
  const navigate = useNavigate();
  const { user, store } = useAuth();

  const [saleData, setSaleData] = useState({
    storeId: '',
    salesPersonId: '',
    customerName: '',
    date: new Date().toISOString().split('T')[0],
    items: [],
    billPhoto: null
  });


  // API Calls
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [stores, setStores] = useState([]);
  const [searchResults, setSearchResults] = useState({});  // Object to store search results for each item
  const [searchLoading, setSearchLoading] = useState({}); // Object to track loading state for each search
  // Add a new state to track if selection was just made
  const [preventSearch, setPreventSearch] = useState({});


// UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

// debounced search effect 
useEffect(() => {
  
  const debouncedSearch = async (index, field, value) => {
    if (preventSearch[index]) {
      return;
    }
  
    if (!value || value.length < 3) {
      setSearchResults(prev => {
        const newResults = { ...prev };
        delete newResults[index];
        return newResults;
      });
      return;
    }
  
    try {
      setSearchLoading(prev => ({ ...prev, [index]: true }));
      const results = await searchProducts(value);
  
      // Format results to show only relevant field
      const formattedResults = results.products?.map(product => ({
        ...product,
        displayValue: field === 'itemCode' ? product.itemCode : product.name
      }));
  
      if (formattedResults?.length > 0) {
        setSearchResults(prev => ({ ...prev, [index]: formattedResults }));
      } else {
        setSearchResults(prev => {
          const newResults = { ...prev };
          delete newResults[index];
          return newResults;
        });
      }
    } catch (err) {
      console.error('Search failed:', err);
      setError('Failed to search products');
    } finally {
      setSearchLoading(prev => ({ ...prev, [index]: false }));
    }
  };

  const timeouts = {};

  saleData.items.forEach((item, index) => {
    // Only check product code and name fields
    const codeLength = item.productDetails?.itemCode?.length || 0;
    const nameLength = item.productDetails?.name?.length || 0;

    // Only proceed if either code or name has 3+ characters
    if (codeLength >= 3 || nameLength >= 3) {
      if (timeouts[index]) clearTimeout(timeouts[index]);
      
      timeouts[index] = setTimeout(() => {
        // Only search if one of the fields has content but not both
        if ((codeLength >= 3 && !nameLength) || (nameLength >= 3 && !codeLength)) {
          debouncedSearch(
            index,
            nameLength >= 3 ? 'name' : 'itemCode',
            nameLength >= 3 ? item.productDetails.name : item.productDetails.itemCode
          );
        }
      }, 300);
    }
  });

  return () => {
    Object.values(timeouts).forEach(timeout => clearTimeout(timeout));
  };
}, [saleData.items]);

  // Fetch stores and salespeople on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [storesData] = await Promise.all([
          getStores(),
        ]);
        setStores(storesData);
      } catch (err) {
        setError(handleApiError(err));
      }
    };

    fetchInitialData();
  }, []);

  const handleDataChange = (e) => {
    const { name, value } = e.target;
    setSaleData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Keep all the handler functions the same
  const handleAddProduct = (product) => {
    setSaleData(prev => ({
      ...prev,
      items: [...prev.items, {
        product: product._id,
        productDetails: product,
        quantity: 1,
        price: product.price
      }]
    }));
    setShowProductSearch(false);
  };

  const handleProductSearch = async (index, searchTerm, searchField) => {
    try {
      setSearchLoading(prev => ({ ...prev, [index]: true }));
      const results = await searchProducts(searchTerm);
      
      // If searching by code and exactly one product is found, auto-populate
      if (searchField === 'itemCode' && results.products?.length === 1) {
        const product = results.products[0];
        handleProductSelect(index, product, searchField);
        return; // Exit early since we've handled the selection
      }
      
      setSearchResults(prev => ({ ...prev, [index]: results.products }));
    } catch (err) {
      console.error('Search failed:', err);
      setError('Failed to search products');
    } finally {
      setSearchLoading(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleProductSelect = (index, product, searchField = 'name') => {
    setPreventSearch(prev => ({ ...prev, [index]: true }));
    
    setSaleData(prev => {
      const newItems = [...prev.items];
      // Keep existing values and update both name and code
      const existingItem = newItems[index] || {};
      
      newItems[index] = {
        ...existingItem,
        product: product._id,
        productDetails: {
          itemCode: product.itemCode,
          name: product.name,
          isCodeLocked: searchField === 'name', // Lock code field if name was searched
          isNameLocked: searchField === 'itemCode' // Lock name field if code was searched
        }
      };
  
      return { ...prev, items: newItems };
    });
  
    setSearchResults(prev => {
      const newResults = { ...prev };
      delete newResults[index];
      return newResults;
    });
  
    // Reset prevent search after a delay
    setTimeout(() => {
      setPreventSearch(prev => {
        const newPrevent = { ...prev };
        delete newPrevent[index];
        return newPrevent;
      });
    }, 500);
  };

  const handleProductChange = (index, field, value) => {
    setSaleData(prev => {
      const newItems = [...prev.items];
      if (field.includes('.')) {
        // For nested fields like productDetails.itemCode
        const [parent, child] = field.split('.');
        newItems[index][parent] = {
          ...newItems[index][parent],
          [child]: value
        };
  
        // Reset locks and clear other field when value is emptied
        if (!value) {
          newItems[index][parent] = {
            ...newItems[index][parent],
            isCodeLocked: false,
            isNameLocked: false
          };
          // Clear the other field if this field is emptied
          if (child === 'name') {
            newItems[index][parent].itemCode = '';
          } else if (child === 'itemCode') {
            newItems[index][parent].name = '';
          }
        }
      } else {
        newItems[index][field] = value;
      }
      return { ...prev, items: newItems };
    });
  
    // Clear search results when field is emptied
    if (!value) {
      setSearchResults(prev => {
        const newResults = { ...prev };
        delete newResults[index];
        return newResults;
      });
    }
  };

  const handleQuantityChange = (index, quantity) => {
    setSaleData(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        quantity: Number(quantity),
      };
      return { ...prev, items: newItems };
    });
  };

  const handleRemoveItem = (index) => {
    setSaleData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handlePhotoCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Photo size should be less than 5MB');
        return;
      }
      setSaleData(prev => ({
        ...prev,
        billPhoto: file
      }));
    }
  };

  const calculateTotal = () => {
    return saleData.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0).toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
  
      if (!saleData.storeId) {
        throw new Error('Please select store');
      }
      
      if (saleData.items.length === 0) {
        throw new Error('Please add at least one product');
      }
  
      const cleanedItems = saleData.items.map(item => ({
        product: item.product,
        quantity: item.quantity || 1,
        price: item.price
      }));

      const formData = new FormData();
      const user = JSON.parse(localStorage.getItem('user'));
      
      // Debug logging
      console.log("Current saleData:", saleData);
      console.log("Cleaned Items:", cleanedItems);

      // Be explicit with the values and add some validation
      const customerName = saleData.customerName || '';
      const totalAmount = calculateTotal();
      const storeId = saleData.storeId;
      const salesmanName = user?.name || '';

      // Append with validation
      formData.append('customerName', customerName);
      formData.append('items', JSON.stringify(cleanedItems));
      formData.append('totalAmount', totalAmount);
      formData.append('store', storeId);
      formData.append('salesman', salesmanName);

      // Add bill photo if exists
      if (saleData.billPhoto) {
        formData.append('billPhoto', saleData.billPhoto);
      }

      // Debug: Log FormData contents
      console.log("FormData contents:");
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      const response = await createSale(formData);

      setSuccess('Sale recorded successfully!');
      setSaleData({
        storeId: '',
        customerName: '',
        date: new Date().toISOString().split('T')[0],
        items: [],
        billPhoto: null
      });
      
      setTimeout(() => {
        navigate(`/sales/${response._id}`);
      }, 3000);

    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
};

const handleSuccess = (response) => {
  setSuccess('Sale recorded successfully!');
  setSaleData({
    storeId: '',
    customerName: '',
    date: new Date().toISOString().split('T')[0],
    items: [],
    billPhoto: null
  });
  
  setTimeout(() => {
    navigate(`/sales/${response._id}`);
  }, 3000);
};

  return (
    <Paper elevation={2} sx={{ maxWidth: '600px', mx: 'auto', mt: 2, mb: 4 }}>
      <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h5" align="center" fontWeight="bold">
          New Sale
        </Typography>
      </Box>
  
      <Box component="form" onSubmit={handleSubmit} sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Sale Details Section */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            select
            fullWidth
            label="Store *"
            name="storeId"
            value={saleData.storeId}
            onChange={handleDataChange}
            required
            SelectProps={{
              native: true,
            }}
          >
            <option value="">Select Store</option>
            {stores.map(store => (
              <option key={store._id} value={store._id}>
                {store.name}
              </option>
            ))}
          </TextField>
  

  
          <TextField
            fullWidth
            label="Customer Name"
            name="customerName"
            value={saleData.customerName}
            onChange={handleDataChange}
            placeholder="Enter customer name"
          />
  
          <TextField
            fullWidth
            type="date"
            label="Date"
            name="date"
            value={saleData.date}
            onChange={handleDataChange}
            InputLabelProps={{ shrink: true }}
          />
  
          {/* Bill Photo Upload */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Bill Photo
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                component="label"
                variant="outlined"
                startIcon={<CameraIcon />}
                sx={{ flex: 1 }}
              >
                {saleData.billPhoto ? 'Change Photo' : 'Upload Photo'}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handlePhotoCapture}
                  capture="environment"
                />
              </Button>
              {saleData.billPhoto && (
                <Box sx={{ display: 'flex', alignItems: 'center', color: 'success.main' }}>
                  <CheckCircleIcon sx={{ mr: 0.5 }} fontSize="small" />
                  <Typography variant="body2">Photo added</Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
  
        {/* Products Section */}
        <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Products</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => {
            setSaleData(prev => ({
              ...prev,
              items: [...prev.items, {
                product: '',
                productDetails: { itemCode: '', name: '' },
                quantity: 1,
                price: ''
              }]
            }));
          }}
        >
          Add
        </Button>
      </Box>

  
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {saleData.items.map((item, index) => (
          <Card key={index} variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="medium">
                  Item {index + 1}
                </Typography>
                <IconButton 
                  color="error" 
                  onClick={() => handleRemoveItem(index)}
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Product Code with Scanner */}
        {/* Product Code */}
        <TextField
          label="Product Code *"
          value={item.productDetails.itemCode || ''}
          onChange={(e) => {
            if (item.productDetails.isCodeLocked) return;
            handleProductChange(index, 'productDetails.itemCode', e.target.value);
          }}
          placeholder="Enter code"
          fullWidth
          disabled={item.productDetails.isCodeLocked}
          InputProps={{
            endAdornment: (
              <IconButton 
                size="small" 
                sx={{ bgcolor: 'primary.50' }}
                onClick={() => handleProductSearch(index, item.productDetails.itemCode, 'itemCode')}
                disabled={!item.productDetails.itemCode || searchLoading[index]}
              >
                {searchLoading[index] ? (
                  <CircularProgress size={20} />
                ) : (
                  <ScanIcon />
                )}
              </IconButton>
            ),
          }}
        />

        {/* Product Name */}
        <TextField
          label="Product Name *"
          value={item.productDetails.name || ''}
          onChange={(e) => {
            if (item.productDetails.isNameLocked) return;
            handleProductChange(index, 'productDetails.name', e.target.value);
          }}
          placeholder="Enter product name"
          fullWidth
          disabled={item.productDetails.isNameLocked}
          InputProps={{
            endAdornment: (
              <IconButton 
                size="small"
                onClick={() => handleProductSearch(index, item.productDetails.name, 'name')}
                disabled={!item.productDetails.name || searchLoading[index]}
              >
                {searchLoading[index] ? (
                  <CircularProgress size={20} />
                ) : (
                  <SearchIcon />
                )}
              </IconButton>
            ),
          }}
        />
    
        {/* Search Results Dropdown - Move outside of specific fields so it works for both */}
        {/* Search Results Dropdown - Move outside of specific fields so it works for both */}
        {searchResults[index] && Array.isArray(searchResults[index]) && searchResults[index].length > 0 && (
        <Box sx={{ position: 'relative' }}>
          <Paper 
            elevation={3} 
            sx={{ 
              position: 'absolute',
              zIndex: 1000,
              width: '100%',
              maxHeight: '200px',
              overflow: 'auto',
              mt: 1,
              backgroundColor: 'white',
              border: '1px solid',
              borderColor: 'divider',
              top: '100%',  // Position below the parent element
              left: 0,
              right: 0
            }}
            >
            {searchResults[index].map((product) => (
              <Box
                key={product._id}
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  '&:hover': { 
                    bgcolor: 'action.hover',
                    transition: 'all 0.2s'
                  },
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&:last-child': {
                    borderBottom: 'none'
                  }
                }}
                onClick={() => handleProductSelect(index, product, item.productDetails.name?.length >= 3 ? 'name' : 'itemCode')}
                >
                <Typography variant="body1" fontWeight="medium">
                  {item.productDetails.name?.length >= 3 ? product.name : product.itemCode}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.productDetails.name?.length >= 3 
                    ? `Code: ${product.itemCode}` 
                    : `Name: ${product.name}`
                  }
                </Typography>
            </Box>
            ))}
        </Paper>
  </Box>
)}

            {/* Quantity and Price in same row */}
            <Box sx={{ display: 'flex', gap: 2 }}>
    <TextField
      label="Quantity"
      type="number"
      value={item.quantity}
      onChange={(e) => handleProductChange(index, 'quantity', Number(e.target.value))}
      InputProps={{ inputProps: { min: 1 } }}
      sx={{ flex: 1 }}
    />

    <TextField
      label="Price *"
      type="number"
      value={item.price || ''}
      onChange={(e) => handleProductChange(index, 'price', Number(e.target.value))}
      InputProps={{ inputProps: { min: 0 } }}
      sx={{ flex: 1 }}
    />
  </Box>
</Box>
        </CardContent>
      </Card>
    ))}

    {saleData.items.length === 0 && (
      <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
        <Typography>No products added yet</Typography>
      </Box>
    )}
  </Box>
</Box>
        {/* Status Messages */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
  
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}
  
        {/* Submit Button */}
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={loading || saleData.items.length === 0}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          sx={{ mt: 2, height: 48 }}
          fullWidth
        >
          {loading ? 'Processing...' : 'Record Sale'}
        </Button>
      </Box>
  
    </Paper>
    );
  };

export default NewSalePage;