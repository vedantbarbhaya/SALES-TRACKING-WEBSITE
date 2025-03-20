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
  CircularProgress,
  Chip
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
import { createSale, getStores } from '@/services/sales';
import { searchProducts, getProductByBarcode } from '@/services/product';
import { getMappingByStore } from '@/services/storeInventoryMap';
import api from '@/services/api';

const NewSalePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [saleData, setSaleData] = useState({
    storeId: user?.store?._id || '', // Set default store ID from user
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
  const [preventSearch, setPreventSearch] = useState({});
  const [storeInventoryCollection, setStoreInventoryCollection] = useState('');

  // UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Get store inventory collection
  useEffect(() => {
    const fetchStoreInventoryMapping = async () => {
      try {
        if (user?.store?._id) {
          console.log('Fetching mapping for store ID:', user.store._id);
          const mapping = await getMappingByStore(user.store._id);
          console.log('Mapping response:', mapping);
          
          if (!mapping || !mapping.inventoryCollection) {
            throw new Error('No inventory collection found for this store');
          }
          
          setStoreInventoryCollection(mapping.inventoryCollection);
          console.log('Store inventory collection set to:', mapping.inventoryCollection);
        }
      } catch (err) {
        console.error('Error fetching store inventory mapping:', err);
        setError('No inventory mapping found for your store. Please contact an administrator.');
      }
    };
  
    fetchStoreInventoryMapping();
  }, [user]);

  // Fetch stores on component mount
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

  // Search for products based on input in product fields
  useEffect(() => {
    // Create a global object to track timeouts if it doesn't exist
    if (!window.searchTimeouts) {
      window.searchTimeouts = {};
    }
    
    // Create a debounced search function for each product field
    const debouncedSearch = async (index, searchTerm) => {
      // Don't search if term is too short or search is prevented
      if (!searchTerm || searchTerm.length < 3 || preventSearch[index] || !storeInventoryCollection) {
        return;
      }
    
      try {
        console.log(`Searching for '${searchTerm}' in collection: ${storeInventoryCollection}`);
        setSearchLoading(prev => ({ ...prev, [index]: true }));
        
        // Make the API request
        const response = await api.get('/inventory', {
          params: {
            collection: storeInventoryCollection,
            search: searchTerm
          }
        });
        
        console.log('Search response:', response.data);
        
        // Determine if response has items directly or in a nested property
        const items = response.data?.items || response.data;
        
        if (items && Array.isArray(items) && items.length > 0) {
          // Convert inventory items directly to products
          // WITHOUT making additional API calls that are failing
          const products = items.map(item => ({
            _id: item._id,
            itemCode: item.itemCode,
            name: item.name,
            variantName: item.variantName || '',
            department: item.department || '',
            category: item.category || '',
            subcategory: item.subcategory || '',
            price: item.price || 0,
            quantity: item.quantity || 0,
            availableQuantity: item.quantity || 0
          }));
          
          console.log('Processed products:', products);
          
          // Set the search results
          if (products.length > 0) {
            setSearchResults(prev => ({ ...prev, [index]: products }));
          } else {
            // Clear results if no products were found
            setSearchResults(prev => {
              const newResults = { ...prev };
              delete newResults[index];
              return newResults;
            });
          }
        } else {
          // Clear results if API returned no items
          setSearchResults(prev => {
            const newResults = { ...prev };
            delete newResults[index];
            return newResults;
          });
          console.log('No results found in the response');
        }
      } catch (err) {
        console.error('Error searching products:', err);
        
        // Show a specific error message
        setError(`Error searching for products: ${err.response?.data?.message || err.message}`);
        
        // Clear results on error
        setSearchResults(prev => {
          const newResults = { ...prev };
          delete newResults[index];
          return newResults;
        });
      } finally {
        setSearchLoading(prev => ({ ...prev, [index]: false }));
      }
    };
  
    // Check each product item for search terms
    saleData.items.forEach((item, index) => {
      // Clear any existing timeout for this index
      if (window.searchTimeouts[index]) {
        clearTimeout(window.searchTimeouts[index]);
        delete window.searchTimeouts[index];
      }
      
      // Don't search if this item has search prevention active
      if (preventSearch[index]) {
        return;
      }
      
      // Get search term - prioritize itemCode if it exists and is long enough
      let searchTerm = null;
      if (item.productDetails?.itemCode?.length >= 3) {
        searchTerm = item.productDetails.itemCode;
      } else if (item.productDetails?.name?.length >= 3) {
        searchTerm = item.productDetails.name;
      } else if (item.productDetails?.variantName?.length >= 3) {
        searchTerm = item.productDetails.variantName;
      }
      
      // If we have a search term, set a timeout to perform the search
      if (searchTerm) {
        window.searchTimeouts[index] = setTimeout(() => {
          debouncedSearch(index, searchTerm);
        }, 500); // 500ms debounce
      }
    });
  
    // Cleanup timeouts on unmount
    return () => {
      if (window.searchTimeouts) {
        Object.values(window.searchTimeouts).forEach(timeout => {
          if (timeout) clearTimeout(timeout);
        });
      }
    };
  }, [saleData.items, preventSearch, storeInventoryCollection]);

  const handleDataChange = (e) => {
    const { name, value } = e.target;
    setSaleData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddProduct = (product) => {
    // Check if there's inventory available
    if (product.quantity <= 0) {
      setError(`${product.name} ${product.variantName ? `(${product.variantName})` : ''} is out of stock at this store`);
      return;
    }

    setSaleData(prev => ({
      ...prev,
      items: [...prev.items, {
        product: product._id,
        productDetails: {
          itemCode: product.itemCode,
          name: product.name,
          variantName: product.variantName,
          department: product.department,
          category: product.category,
          subcategory: product.subcategory
        },
        quantity: 1,
        price: product.price,
        availableQuantity: product.quantity // Store the available quantity for reference
      }]
    }));
    setShowProductSearch(false);
  };

  const handleProductSelect = (index, product, searchField = 'name') => {
    console.log(`Selecting product at index ${index}:`, product);
    
    // Check if there's inventory available
    if (product.quantity <= 0) {
      setError(`${product.name} ${product.variantName ? `(${product.variantName})` : ''} is out of stock at this store`);
      return;
    }
  
    // Prevent additional searches
    setPreventSearch(prev => ({ ...prev, [index]: true }));
    
    // Clear any existing timeouts for this index
    if (window.searchTimeouts && window.searchTimeouts[index]) {
      clearTimeout(window.searchTimeouts[index]);
      delete window.searchTimeouts[index];
    }
    
    // Update the form data with the selected product
    setSaleData(prev => {
      const newItems = [...prev.items];
      const existingItem = newItems[index] || {};
      
      newItems[index] = {
        ...existingItem,
        product: product._id,
        productDetails: {
          itemCode: product.itemCode,
          name: product.name,
          variantName: product.variantName || '',
          department: product.department || '',
          category: product.category || '',
          subcategory: product.subcategory || '',
          // Only lock name and variant fields, not itemCode
          isCodeLocked: false, // Keep code editable
          isNameLocked: true,  // Lock name
          isVariantLocked: true // Lock variant
        },
        price: product.price,
        quantity: 1,
        availableQuantity: product.quantity || product.availableQuantity
      };
  
      return { ...prev, items: newItems };
    });
  
    // Clear search results
    setSearchResults(prev => {
      const newResults = { ...prev };
      delete newResults[index];
      return newResults;
    });
    
    // Note: We deliberately DON'T re-enable search here
    // Search will only be re-enabled when the user explicitly edits a field
  };
  

const handleItemCodeSearch = async (index, itemCode) => {
  if (!itemCode || itemCode.length < 3 || !storeInventoryCollection) {
    return;
  }

  try {
    setSearchLoading(prev => ({ ...prev, [index]: true }));
    console.log(`Searching for item code: ${itemCode} in collection: ${storeInventoryCollection}`);

    // Search in inventory collection
    const inventoryResponse = await api.get('/inventory', {
      params: {
        collection: storeInventoryCollection,
        search: itemCode
      }
    });

    console.log('Inventory search response:', inventoryResponse.data);

    // Get items array from response
    const items = inventoryResponse.data?.items || inventoryResponse.data;

    // Check if we got results
    if (items && Array.isArray(items) && items.length > 0) {
      // Find exact match for item code
      const exactMatch = items.find(i => 
        i.itemCode.toLowerCase() === itemCode.toLowerCase()
      );

      if (exactMatch) {
        console.log('Found exact match in inventory:', exactMatch);
        
        // Use inventory item directly instead of making another API call
        const product = {
          _id: exactMatch._id,
          itemCode: exactMatch.itemCode,
          name: exactMatch.name,
          variantName: exactMatch.variantName || '',
          department: exactMatch.department || '',
          category: exactMatch.category || '',
          subcategory: exactMatch.subcategory || '',
          price: exactMatch.price || 0,
          quantity: exactMatch.quantity || 0,
          availableQuantity: exactMatch.quantity || 0
        };
        
        // Set the product in the form
        handleProductSelect(index, product, 'itemCode');
      } else {
        console.log('No exact match found, showing search results dropdown');
        // If no exact match, process all results for the dropdown
        const products = items.map(item => ({
          _id: item._id,
          itemCode: item.itemCode,
          name: item.name,
          variantName: item.variantName || '',
          department: item.department || '',
          category: item.category || '',
          subcategory: item.subcategory || '',
          price: item.price || 0,
          quantity: item.quantity || 0,
          availableQuantity: item.quantity || 0
        }));
        
        if (products.length > 0) {
          setSearchResults(prev => ({ ...prev, [index]: products }));
        } else {
          setError(`No products found matching code: ${itemCode}`);
        }
      }
    } else {
      setError(`No product with code ${itemCode} found in this store's inventory`);
    }
  } catch (err) {
    console.error('Search error:', err);
    setError(`Error searching for product: ${err.response?.data?.message || err.message}`);
  } finally {
    setSearchLoading(prev => ({ ...prev, [index]: false }));
  }
};

const handleProductChange = (index, field, value) => {
  // Store the previous value for comparison
  const prevValue = field.includes('.') ? 
    saleData.items[index][field.split('.')[0]][field.split('.')[1]] : 
    saleData.items[index][field];
  
  setSaleData(prev => {
    const newItems = [...prev.items];
    if (field.includes('.')) {
      // For nested fields like productDetails.itemCode
      const [parent, child] = field.split('.');
      newItems[index][parent] = {
        ...newItems[index][parent],
        [child]: value
      };

      // Reset locks and clear other fields when value is emptied
      if (!value) {
        // If clearing the itemCode, reset ALL locks and clear ALL fields
        if (child === 'itemCode') {
          newItems[index][parent] = {
            ...newItems[index][parent],
            isCodeLocked: false,
            isNameLocked: false,
            isVariantLocked: false, // Also reset variant lock
            name: '',              // Clear name
            variantName: '',       // Clear variant name
            department: '',        // Clear other fields too
            category: '',
            subcategory: ''
          };
        } 
        // If clearing the name, reset some locks but not all
        else if (child === 'name') {
          newItems[index][parent] = {
            ...newItems[index][parent],
            isNameLocked: false,
            itemCode: ''           // Clear itemCode
          };
        }
        // If clearing the variant, just unlock that field
        else if (child === 'variantName') {
          newItems[index][parent] = {
            ...newItems[index][parent],
            isVariantLocked: false
          };
        }
      }
    } else {
      newItems[index][field] = value;
      
      // Validate quantity against available inventory
      if (field === 'quantity' && newItems[index].availableQuantity !== undefined) {
        if (value > newItems[index].availableQuantity) {
          setError(`Only ${newItems[index].availableQuantity} ${newItems[index].productDetails.name} available in stock`);
          newItems[index][field] = newItems[index].availableQuantity;
        }
      }
    }
    return { ...prev, items: newItems };
  });

  // Clear search results and prevent search when field is emptied
  if (!value) {
    setSearchResults(prev => {
      const newResults = { ...prev };
      delete newResults[index];
      return newResults;
    });
    
    // When a field is emptied, ensure no search happens
    setPreventSearch(prev => ({ ...prev, [index]: true }));
    
    // Clear any existing search timeouts for this index
    if (window.searchTimeouts && window.searchTimeouts[index]) {
      clearTimeout(window.searchTimeouts[index]);
      delete window.searchTimeouts[index];
    }
  }
  
  // If we're changing from a value to another value (not emptying), 
  // make sure to only show dropdown for deliberate user edits
  if (value && prevValue && value !== prevValue) {
    // This is an edit, not just a field being cleared
    // Allow normal search behavior
    setPreventSearch(prev => {
      const newPrevent = { ...prev };
      delete newPrevent[index];
      return newPrevent;
    });
  }
};

  const handleQuantityChange = (index, quantity) => {
    setSaleData(prev => {
      const newItems = [...prev.items];
      const availableQty = newItems[index].availableQuantity;
      
      // Validate against available inventory
      if (availableQty !== undefined && quantity > availableQty) {
        setError(`Only ${availableQty} ${newItems[index].productDetails.name} available in stock`);
        newItems[index].quantity = availableQty;
      } else {
        newItems[index].quantity = Number(quantity);
      }
      
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
      return sum + ((item.price || 0) * (item.quantity || 1));
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
        
        // Validate quantity against available inventory
        if (item.availableQuantity !== undefined && item.quantity > item.availableQuantity) {
          throw new Error(`Only ${item.availableQuantity} ${item.productDetails.name} available in stock`);
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
        storeId: storeId,
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

  // Function to render stock status chip
  const renderStockStatus = (item) => {
    if (!item.availableQuantity && item.availableQuantity !== 0) return null;
    
    let color, label;
    if (item.availableQuantity <= 0) {
      color = "error";
      label = "Out of Stock";
    } else if (item.availableQuantity < 5) {
      color = "warning";
      label = "Low Stock";
    } else {
      color = "success";
      label = "In Stock";
    }
    
    return (
      <Chip 
        size="small" 
        color={color} 
        label={`${label} (${item.availableQuantity})`} 
        sx={{ ml: 1 }}
      />
    );
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
                      onClick={() => handleItemCodeSearch(index, item.productDetails.itemCode)}
                      disabled={!item.productDetails.itemCode || searchLoading[index] || !storeInventoryCollection}
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
                    onClick={() => {
                      if (!storeInventoryCollection) {
                        setError('No inventory mapping found for your store');
                        return;
                      }
                      
                      // Add actual search functionality here
                      if (item.productDetails.name?.length >= 3) {
                        handleItemCodeSearch(index, item.productDetails.name);
                      } else {
                        setError('Please enter at least 3 characters to search');
                      }
                    }}
                    disabled={!item.productDetails.name || searchLoading[index] || !storeInventoryCollection}
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

            {/* Variant Name */}
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
            />
          
            {/* Search Results Dropdown */}
            {console.log('Search results for index', index, ':', searchResults[index])}
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
                        cursor: product.quantity > 0 ? 'pointer' : 'not-allowed',
                        opacity: product.quantity > 0 ? 1 : 0.6,
                        '&:hover': { 
                          bgcolor: product.quantity > 0 ? 'action.hover' : 'inherit',
                          transition: 'all 0.2s'
                        },
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        '&:last-child': {
                          borderBottom: 'none'
                        }
                      }}
                      onClick={() => {
                        if (product.quantity > 0) {
                          // Clear search results BEFORE calling handleProductSelect
                          setSearchResults(prev => {
                            const newResults = { ...prev };
                            delete newResults[index];
                            return newResults;
                          });
                          
                          // Then handle the product selection
                          handleProductSelect(
                            index, 
                            product, 
                            item.productDetails.name?.length >= 3 ? 'name' : 
                            item.productDetails.variantName?.length >= 3 ? 'variantName' : 
                            'itemCode'
                          );
                        } else {
                          setError(`${product.name} (${product.variantName || ''}) is out of stock`);
                        }
                      }}
                    >
                      <Typography variant="body1" fontWeight="medium">
                        {item.productDetails.name?.length >= 3 ? product.name :
                        item.productDetails.variantName?.length >= 3 ? product.variantName :
                        product.itemCode}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          {product.name}
                          {product.variantName && ` - ${product.variantName}`}
                          {` (${product.itemCode})`}
                        </Typography>
                        <Chip 
                          size="small" 
                          color={product.quantity <= 0 ? "error" : product.quantity < 5 ? "warning" : "success"} 
                          label={product.quantity <= 0 ? "Out of Stock" : product.quantity < 5 ? `Low Stock (${product.quantity})` : `In Stock (${product.quantity})`} 
                        />
                      </Box>
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
                onChange={(e) => handleQuantityChange(index, Number(e.target.value))}
                InputProps={{ 
                  inputProps: { 
                    min: 1,
                    max: item.availableQuantity 
                  }
                }}
                sx={{ flex: 1 }}
                helperText={item.availableQuantity !== undefined ? `Available: ${item.availableQuantity}` : ""}
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

            {/* Total Amount */}
            {saleData.items.length > 0 && (
              <Box sx={{ 
                mt: 2, 
                p: 2, 
                backgroundColor: '#f0f7ff', 
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontWeight: 'bold'
              }}>
                <Typography variant="h6">Total:</Typography>
                <Typography variant="h6">₹{calculateTotal()}</Typography>
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
  
      {/* Product Search Modal */}
      {showProductSearch && (
        <ProductSearch
          onProductSelect={handleAddProduct}
          onClose={() => setShowProductSearch(false)}
          storeInventoryCollection={storeInventoryCollection}
        />
      )}
    </Paper>
  );
};

export default NewSalePage;