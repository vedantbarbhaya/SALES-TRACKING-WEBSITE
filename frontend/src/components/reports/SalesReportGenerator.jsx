// frontend/src/components/reports/SalesReportGenerator.jsx
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { 
  FileDown, 
  Filter,
  ChevronDown, 
  X,
  BarChart
} from 'lucide-react';
import { getStores } from '@/services/stores';
import { getCategories, getDepartments } from '@/services/product';
import { getSales } from '@/services/sales';
import { handleApiError } from '@/utils/errorHandler';

const SalesReportGenerator = () => {
  const [stores, setStores] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    storeIds: [],
    departments: [],
    categories: [],
    reportType: 'summary',
    groupBy: 'none',
  });
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportPreview, setReportPreview] = useState(null);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [storesData, departmentsData, categoriesData] = await Promise.all([
          getStores(),
          getDepartments(),
          getCategories()
        ]);
        
        setStores(storesData);
        setDepartments(departmentsData);
        setCategories(categoriesData);
      } catch (err) {
        setError(handleApiError(err));
      }
    };
    
    fetchFilterOptions();
  }, []);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayFilterChange = (name, value) => {
    setFilters(prev => {
      const currentValues = [...prev[name]];
      
      if (currentValues.includes(value)) {
        return {
          ...prev,
          [name]: currentValues.filter(v => v !== value)
        };
      } else {
        return {
          ...prev,
          [name]: [...currentValues, value]
        };
      }
    });
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      storeIds: [],
      departments: [],
      categories: [],
      reportType: 'summary',
      groupBy: 'none',
    });
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Prepare filter parameters
      const params = {
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        storeId: filters.storeIds.length === 1 ? filters.storeIds[0] : 'all',
        // Include other filters as needed by your API
      };
      
      // Fetch sales data based on filters
      const salesData = await getSales(params);
      
      // Process data based on report type and grouping
      let processedData = [];
      
      switch (filters.reportType) {
        case 'summary':
          processedData = processSummaryReport(salesData.sales, filters.groupBy);
          break;
        case 'detailed':
          processedData = processDetailedReport(salesData.sales, filters.groupBy);
          break;
        case 'product':
          processedData = processProductReport(salesData.sales, filters.groupBy);
          break;
        default:
          processedData = salesData.sales;
      }
      
      setReportPreview({
        reportType: filters.reportType,
        groupBy: filters.groupBy,
        data: processedData,
        totalItems: processedData.length,
        totalSales: salesData.total || 0
      });
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  // Process report data based on type and grouping
  const processSummaryReport = (sales, groupBy) => {
    // Default case - no grouping
    if (groupBy === 'none') {
      return sales.map(sale => ({
        saleNumber: sale.saleNumber,
        date: new Date(sale.createdAt).toLocaleDateString(),
        store: sale.store?.name || 'Unknown',
        salesperson: sale.salesperson?.name || 'Unknown',
        customer: sale.customerName || 'Walk-in',
        itemCount: sale.items?.length || 0,
        totalAmount: sale.totalAmount
      }));
    }
    
    // Group by logic
    const grouped = {};
    
    sales.forEach(sale => {
      let key;
      
      switch (groupBy) {
        case 'date':
          key = new Date(sale.createdAt).toLocaleDateString();
          break;
        case 'store':
          key = sale.store?.name || 'Unknown';
          break;
        case 'salesperson':
          key = sale.salesperson?.name || 'Unknown';
          break;
        default:
          key = 'all';
      }
      
      if (!grouped[key]) {
        grouped[key] = {
          groupKey: key,
          saleCount: 0,
          itemCount: 0,
          totalAmount: 0
        };
      }
      
      grouped[key].saleCount += 1;
      grouped[key].itemCount += sale.items?.length || 0;
      grouped[key].totalAmount += sale.totalAmount;
    });
    
    return Object.values(grouped);
  };

  const processDetailedReport = (sales, groupBy) => {
    // If no grouping, return flattened data
    if (groupBy === 'none') {
      let flattenedData = [];
      
      sales.forEach(sale => {
        // For each sale, expand its items into separate rows
        sale.items?.forEach(item => {
          flattenedData.push({
            saleNumber: sale.saleNumber,
            date: new Date(sale.createdAt).toLocaleDateString(),
            time: new Date(sale.createdAt).toLocaleTimeString(),
            store: sale.store?.name || 'Unknown',
            salesperson: sale.salesperson?.name || 'Unknown',
            customer: sale.customerName || 'Walk-in',
            itemCode: item.itemCode || '-',
            productName: item.productName || '-',
            variantName: item.variantName || '-',
            quantity: item.quantity,
            price: item.price,
            total: item.quantity * item.price
          });
        });
      });
      
      return flattenedData;
    }
    
    // For grouped detailed reports, first flatten then group
    let flattenedData = [];
    
    sales.forEach(sale => {
      sale.items?.forEach(item => {
        flattenedData.push({
          saleNumber: sale.saleNumber,
          date: new Date(sale.createdAt).toLocaleDateString(),
          time: new Date(sale.createdAt).toLocaleTimeString(),
          store: sale.store?.name || 'Unknown',
          salesperson: sale.salesperson?.name || 'Unknown',
          customer: sale.customerName || 'Walk-in',
          itemCode: item.itemCode || '-',
          productName: item.productName || '-',
          variantName: item.variantName || '-',
          quantity: item.quantity,
          price: item.price,
          total: item.quantity * item.price,
          createdAt: sale.createdAt
        });
      });
    });
    
    // Now group the flattened data
    const grouped = {};
    
    flattenedData.forEach(row => {
      let key;
      
      switch (groupBy) {
        case 'date':
          key = new Date(row.createdAt).toLocaleDateString();
          break;
        case 'store':
          key = row.store;
          break;
        case 'salesperson':
          key = row.salesperson;
          break;
        case 'product':
          key = row.itemCode;
          break;
        default:
          key = 'all';
      }
      
      if (!grouped[key]) {
        grouped[key] = {
          groupKey: key,
          totalQuantity: 0,
          totalSales: 0,
          itemCount: 0
        };
        
        // Add group-specific fields
        if (groupBy === 'date') grouped[key].date = key;
        if (groupBy === 'store') grouped[key].store = key;
        if (groupBy === 'salesperson') grouped[key].salesperson = key;
        if (groupBy === 'product') {
          grouped[key].itemCode = row.itemCode;
          grouped[key].productName = row.productName;
          grouped[key].variantName = row.variantName;
        }
      }
      
      grouped[key].totalQuantity += row.quantity;
      grouped[key].totalSales += row.total;
      grouped[key].itemCount += 1;
    });
    
    return Object.values(grouped);
  };

  const processProductReport = (sales, groupBy) => {
    // Get a list of all store names first
    const storeNames = new Set();
    sales.forEach(sale => {
      if (sale.store?.name) {
        storeNames.add(sale.store.name);
      }
    });
    const storesList = Array.from(storeNames);
    
    // Aggregate data by product
    const productMap = {};
    
    sales.forEach(sale => {
      const storeName = sale.store?.name || 'Unknown';
      
      sale.items?.forEach(item => {
        const productId = item.itemCode;
        
        if (!productMap[productId]) {
          // Initialize the product with base fields
          productMap[productId] = {
            itemCode: item.itemCode || '-',
            productName: item.productName || '-',
            variantName: item.variantName || '-',
            department: item.department || '-',
            category: item.category || '-',
            totalQuantity: 0,
            totalSales: 0,
            orderCount: 0
          };
          
          // Add store-specific fields
          storesList.forEach(store => {
            productMap[productId][`${store}_quantity`] = 0;
            productMap[productId][`${store}_sales`] = 0;
            productMap[productId][`${store}_orders`] = 0;
          });
        }
        
        // Update global totals
        productMap[productId].totalQuantity += item.quantity;
        productMap[productId].totalSales += (item.quantity * item.price);
        productMap[productId].orderCount += 1;
        
        // Update store-specific totals
        if (productMap[productId][`${storeName}_quantity`] !== undefined) {
          productMap[productId][`${storeName}_quantity`] += item.quantity;
          productMap[productId][`${storeName}_sales`] += (item.quantity * item.price);
          productMap[productId][`${storeName}_orders`] += 1;
        }
      });
    });
    
    // Calculate average prices and percentages
    Object.values(productMap).forEach(product => {
      // Global average price
      product.averagePrice = product.totalQuantity > 0 ? 
        (product.totalSales / product.totalQuantity).toFixed(2) : 0;
      
      // Store-specific metrics
      storesList.forEach(store => {
        // Average price per store
        if (product[`${store}_quantity`] > 0) {
          product[`${store}_avgPrice`] = (product[`${store}_sales`] / product[`${store}_quantity`]).toFixed(2);
        } else {
          product[`${store}_avgPrice`] = 0;
        }
        
        // Percentage of total sales from this store
        if (product.totalSales > 0) {
          product[`${store}_percent`] = ((product[`${store}_sales`] / product.totalSales) * 100).toFixed(1);
        } else {
          product[`${store}_percent`] = 0;
        }
      });
    });
    
    // If grouping is requested, apply it
    if (groupBy === 'category' || groupBy === 'department') {
      const groupedData = {};
      
      Object.values(productMap).forEach(product => {
        const groupKey = product[groupBy] || 'Uncategorized';
        
        if (!groupedData[groupKey]) {
          groupedData[groupKey] = {
            [groupBy]: groupKey,
            totalQuantity: 0,
            totalSales: 0,
            productCount: 0
          };
          
          // Initialize store-specific totals
          storesList.forEach(store => {
            groupedData[groupKey][`${store}_quantity`] = 0;
            groupedData[groupKey][`${store}_sales`] = 0;
          });
        }
        
        // Update group totals
        groupedData[groupKey].totalQuantity += product.totalQuantity;
        groupedData[groupKey].totalSales += product.totalSales;
        groupedData[groupKey].productCount += 1;
        
        // Update store-specific group totals
        storesList.forEach(store => {
          if (product[`${store}_quantity`] > 0) {
            groupedData[groupKey][`${store}_quantity`] += product[`${store}_quantity`];
            groupedData[groupKey][`${store}_sales`] += product[`${store}_sales`];
          }
        });
      });
      
      // Calculate percentages for groups
      Object.values(groupedData).forEach(group => {
        storesList.forEach(store => {
          if (group.totalSales > 0) {
            group[`${store}_percent`] = ((group[`${store}_sales`] / group.totalSales) * 100).toFixed(1);
          } else {
            group[`${store}_percent`] = 0;
          }
        });
      });
      
      return Object.values(groupedData);
    }
    
    return Object.values(productMap);
  };


  const downloadCSV = () => {
    if (!reportPreview || !reportPreview.data || reportPreview.data.length === 0) {
      setError('No data available to download');
      return;
    }
    
    try {
      // Convert report data to CSV
      const headerRow = Object.keys(reportPreview.data[0]);
      const csvContent = [
        headerRow.map(key => `"${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}"`).join(','),
        ...reportPreview.data.map(row => {
          return headerRow.map(key => {
            const value = row[key];
            // Handle different value types
            if (value === null || value === undefined) {
              return '""';
            } else if (typeof value === 'string') {
              // Escape quotes and wrap in quotes
              return `"${value.replace(/"/g, '""')}"`;
            } else if (typeof value === 'object') {
              // Convert objects to JSON string
              return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
            } else {
              return `"${value}"`;
            }
          }).join(',');
        })
      ].join('\n');
      
      // Create a download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `sales_report_${filters.reportType}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError(`Failed to download CSV: ${err.message}`);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" sx={{ mb: 3 }}>Sales Reports</Typography>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Report Options</Typography>
          
          <Grid container spacing={2}>
            {/* Report Type */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={filters.reportType}
                  label="Report Type"
                  onChange={(e) => handleFilterChange('reportType', e.target.value)}
                >
                  <MenuItem value="summary">Summary Report</MenuItem>
                  <MenuItem value="detailed">Detailed Sales Report</MenuItem>
                  <MenuItem value="product">Product Performance Report</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Group By */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Group By</InputLabel>
                <Select
                  value={filters.groupBy}
                  label="Group By"
                  onChange={(e) => handleFilterChange('groupBy', e.target.value)}
                >
                  <MenuItem value="none">No Grouping</MenuItem>
                  <MenuItem value="date">Date</MenuItem>
                  <MenuItem value="store">Store</MenuItem>
                  <MenuItem value="salesperson">Salesperson</MenuItem>
                  {filters.reportType === 'product' && (
                    <MenuItem value="category">Category</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Date Range */}
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  label="Start Date"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="End Date"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            </Grid>
          </Grid>
          
          {/* Advanced Filters Toggle */}
          <Box sx={{ mt: 2 }}>
            <Button
              variant="text"
              endIcon={advancedFiltersOpen ? <ChevronDown /> : <Filter />}
              onClick={() => setAdvancedFiltersOpen(!advancedFiltersOpen)}
            >
              {advancedFiltersOpen ? 'Hide' : 'Show'} Advanced Filters
            </Button>
          </Box>
          
          {/* Advanced Filters */}
          {advancedFiltersOpen && (
            <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>Advanced Filters</Typography>
              
              <Grid container spacing={2}>
                {/* Store Selection */}
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 1 }}>Stores</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {stores.map(store => (
                      <Chip
                        key={store._id}
                        label={store.name}
                        color={filters.storeIds.includes(store._id) ? "primary" : "default"}
                        onClick={() => handleArrayFilterChange('storeIds', store._id)}
                      />
                    ))}
                  </Box>
                </Grid>
                
                {/* Department Selection */}
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 1 }}>Departments</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {departments.map(dept => (
                      <Chip
                        key={dept}
                        label={dept}
                        color={filters.departments.includes(dept) ? "primary" : "default"}
                        onClick={() => handleArrayFilterChange('departments', dept)}
                      />
                    ))}
                  </Box>
                </Grid>
                
                {/* Category Selection */}
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 1 }}>Categories</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {categories.map(cat => (
                      <Chip
                        key={cat}
                        label={cat}
                        color={filters.categories.includes(cat) ? "primary" : "default"}
                        onClick={() => handleArrayFilterChange('categories', cat)}
                      />
                    ))}
                  </Box>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="outlined" startIcon={<X />} onClick={clearFilters}>
                  Clear Filters
                </Button>
              </Box>
            </Box>
          )}
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        {/* Generate Report Button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={generateReport}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <BarChart size={20} />}
          >
            Generate Report
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<FileDown />}
            onClick={downloadCSV}
            disabled={!reportPreview || loading}
          >
            Download CSV
          </Button>
        </Box>
        
        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ my: 2 }}>
            {error}
          </Alert>
        )}
        
        {/* Report Preview */}
        {reportPreview && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Report Preview</Typography>
            
            <Box sx={{ mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>Report Type:</strong> {filters.reportType.charAt(0).toUpperCase() + filters.reportType.slice(1)}
              </Typography>
              <Typography variant="body2">
                <strong>Group By:</strong> {filters.groupBy === 'none' ? 'No Grouping' : filters.groupBy.charAt(0).toUpperCase() + filters.groupBy.slice(1)}
              </Typography>
              <Typography variant="body2">
                <strong>Total Records:</strong> {reportPreview.totalItems}
              </Typography>
            </Box>
            
            {/* Table Preview - show first 5 rows */}
            {reportPreview.data.length > 0 && (
              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      {Object.keys(reportPreview.data[0]).map(key => (
                        <TableCell key={key}>
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportPreview.data.slice(0, 5).map((row, index) => (
                      <TableRow key={index}>
                        {Object.keys(row).map(key => (
                          <TableCell key={key}>
                            {typeof row[key] === 'object' ? JSON.stringify(row[key]) : row[key]}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            
            {reportPreview.data.length > 5 && (
              <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                Showing 5 of {reportPreview.data.length} records. Download report to see all data.
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default SalesReportGenerator;