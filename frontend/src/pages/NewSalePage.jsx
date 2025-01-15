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
  QrCodeScanner as ScanIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import ProductSearch from '@/components/sales/ProductSearch';
import { useAuth } from '@/hooks/useAuth';
import { handleApiError } from '@/utils/errorHandler';
import { createSale, getStores} from '@/services/sales';
import { searchProducts } from '@/services/product';

const NewSalePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [saleData, setSaleData] = useState({
    storeId: user?.store?._id || '', // Set default store ID from user
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
        if (user.role === 'admin') {
          const storesData = await getStores();
          setStores(storesData);
        } else {
          // For non-admin users, just set their assigned store
          setStores([user.store]);
        }
      } catch (err) {
        setError(handleApiError(err));
      }
    };
  
    fetchInitialData();
  }, [user]);

  const handleDataChange = (e) => {
    const { name, value } = e.target;
    setSaleData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddProduct = (product) => {
    setSaleData(prev => ({
      ...prev,
      items: [...prev.items, {
        product: product._id,  // You were setting this to empty string
        productDetails: {
          itemCode: product.itemCode,
          name: product.name,
          variantName: product.variantName,
          department: product.department,
          category: product.category,
          subcategory: product.subcategory
        },
        quantity: 1,
        price: product.price  // You were setting this to empty string
      }]
    }));
    setShowProductSearch(false);
  };

  const handleProductSearch = async (index, searchTerm, searchField) => {
    try {
      setSearchLoading(prev => ({ ...prev, [index]: true }));
      const results = await searchProducts(searchTerm);
      
      // Auto-select if searching by code and exactly one product is found
      if (searchField === 'itemCode' && results.products?.length === 1) {
        const product = results.products[0];
        handleProductSelect(index, product, searchField);
        return;
      }
      
      // Filter results based on the current variant if searching by name
      if (searchField === 'name' && item.productDetails.variantName) {
        results.products = results.products.filter(p => 
          p.variantName === item.productDetails.variantName
        );
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
      const existingItem = newItems[index] || {};
      
      newItems[index] = {
        ...existingItem,
        product: product._id,
        productDetails: {
          itemCode: product.itemCode,
          name: product.name,
          variantName: product.variantName,
          department: product.department,
          category: product.category,
          subcategory: product.subcategory,
          // Lock fields based on search type
          isCodeLocked: searchField === 'name' || searchField === 'variantName',
          isNameLocked: searchField === 'itemCode',
          isVariantLocked: searchField === 'itemCode'
        }
      };
  
      return { ...prev, items: newItems };
    });
  
    setSearchResults(prev => {
      const newResults = { ...prev };
      delete newResults[index];
      return newResults;
    });
  
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
      try {
        // Check file size
        if (file.size > 5 * 1024 * 1024) {
          setError('Photo size should be less than 5MB');
          return;
        }
  
        // Check file type
        if (!file.type.startsWith('image/')) {
          setError('Please upload an image file');
          return;
        }
  
        // Update state
        setSaleData(prev => ({
          ...prev,
          billPhoto: file
        }));
        
        // Clear any existing errors
        setError('');
        
      } catch (err) {
        console.error('Error handling photo:', err);
        setError('Failed to process photo');
        setSaleData(prev => ({
          ...prev,
          billPhoto: null
        }));
      }
    } else {
      // Reset photo if no file selected
      setSaleData(prev => ({
        ...prev,
        billPhoto: null
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
  
      // Use user's store ID if not admin
      const storeId = user.role === 'admin' ? saleData.storeId : user.store._id;
  
      if (!storeId) {
        throw new Error('Store ID is required');
      }
      
      if (saleData.items.length === 0) {
        throw new Error('Please add at least one product');
      }
  
      // Clean and validate items
      const cleanedItems = saleData.items.map(item => {
        if (!item.product || !item.quantity || !item.price) {
          throw new Error('Invalid product data');
        }
        return {
          product: item.product,
          quantity: item.quantity,
          price: item.price
        };
      });
  
      const formData = new FormData();
    
      const payload = {
        customerName: saleData.customerName || '',
        items: cleanedItems,
        totalAmount: calculateTotal(),
        store: storeId, // Use the determined store ID
        salesman: user?.name || ''
      };
  
      // Append items as a JSON string
      formData.append('items', JSON.stringify(payload.items));
      formData.append('customerName', payload.customerName);
      formData.append('totalAmount', payload.totalAmount);
      formData.append('store', payload.store);
      formData.append('salesman', payload.salesman);
      
      if (saleData.billPhoto) {
        formData.append('billPhoto', saleData.billPhoto);
      }
  
      const response = await createSale(formData);
  
      if (!response || !response._id) {
        throw new Error('Invalid response from server');
      }
  
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
              value={user.role === 'admin' ? saleData.storeId : user.store._id}
              onChange={handleDataChange}
              required
              SelectProps={{
                native: true,
              }}
              disabled={user.role !== 'admin'} // Disable for non-admin users
            >
              <option value="">Select Store</option>
              {user.role === 'admin' ? (
                // Show all stores for admin
                stores.map(store => (
                  <option key={store._id} value={store._id}>
                    {store.name}
                  </option>
                ))
              ) : (
                // Show only user's store for non-admin
                <option value={user.store._id}>
                  {user.store.name}
                </option>
              )}
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

        {/* Variant Name - New Field */}
        <TextField
          label="Variant Name"
          value={item.productDetails.variantName || ''}
          onChange={(e) => {
            if (item.productDetails.isVariantLocked) return;
            handleProductChange(index, 'productDetails.variantName', e.target.value);
          }}
          placeholder="Enter variant name"
          fullWidth
          disabled={item.productDetails.isVariantLocked}
          InputProps={{
            endAdornment: (
              <IconButton 
                size="small"
                onClick={() => handleProductSearch(index, item.productDetails.variantName, 'variantName')}
                disabled={!item.productDetails.variantName || searchLoading[index]}
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
              top: '100%',
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
                onClick={() => handleProductSelect(
                  index, 
                  product, 
                  item.productDetails.name?.length >= 3 ? 'name' : 
                  item.productDetails.variantName?.length >= 3 ? 'variantName' : 
                  'itemCode'
                )}
              >
                <Typography variant="body1" fontWeight="medium">
                  {item.productDetails.name?.length >= 3 ? product.name :
                  item.productDetails.variantName?.length >= 3 ? product.variantName :
                  product.itemCode}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {product.name}
                  {product.variantName && ` - ${product.variantName}`}
                  {` (${product.itemCode})`}
                </Typography>
                {/* Display additional product information */}
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}>
                  {[product.department, product.category, product.subcategory]
                    .filter(Boolean)
                    .join(' > ')}
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