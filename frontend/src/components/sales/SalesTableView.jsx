import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TablePagination,
  Box,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { getSales } from '@/services/sales';
import { getStores } from '@/services/stores';
import { handleApiError } from '@/utils/errorHandler';

const SalesTableView = () => {
  // States
  const [selectedStore, setSelectedStore] = useState('');
  const [timeRange, setTimeRange] = useState('7days');
  const [salesData, setSalesData] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch stores on component mount
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const storesData = await getStores();
        setStores(storesData);
      } catch (err) {
        setError(handleApiError(err));
      }
    };
    fetchStores();
  }, []);

  // Fetch sales data when store, time range, or pagination changes
  useEffect(() => {
    const fetchSalesData = async () => {
      if (!selectedStore) return;

      try {
        setLoading(true);
        const response = await getSales({
          storeId: selectedStore,
          timeRange,
          page: page + 1,
          pageSize: rowsPerPage
        });
        setSalesData(response.sales);
        setTotalRows(response.total);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, [selectedStore, timeRange, page, rowsPerPage]);

  // Event Handlers
  const handleStoreChange = (event) => {
    setSelectedStore(event.target.value);
    setPage(0);
  };

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <Typography variant="h6" className="text-gray-900 mb-6">
        Sales Overview
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel>Store</InputLabel>
          <Select
            value={selectedStore}
            label="Store"
            onChange={handleStoreChange}
          >
            {stores.map((store) => (
              <MenuItem key={store._id} value={store._id}>
                {store.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            label="Time Range"
            onChange={handleTimeRangeChange}
          >
            <MenuItem value="7days">Last 7 Days</MenuItem>
            <MenuItem value="30days">Last 30 Days</MenuItem>
            <MenuItem value="all">All Time</MenuItem>
          </Select>
        </FormControl>
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
                <TableCell>Date</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Total Amount</TableCell>
                <TableCell>Salesperson</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {salesData.map((sale) => (
                <TableRow key={sale._id}>
                  <TableCell>
                    {new Date(sale.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{sale.customerName || 'N/A'}</TableCell>
                  <TableCell>{sale.items.length}</TableCell>
                  <TableCell>${sale.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>{sale.salesperson?.name}</TableCell>
                  <TableCell>
                    <Box
                      component="span"
                      sx={{
                        px: 2,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: '0.875rem',
                        bgcolor: 
                          sale.status === 'completed' ? 'success.50' :
                          sale.status === 'cancelled' ? 'error.50' :
                          'grey.100',
                        color:
                          sale.status === 'completed' ? 'success.700' :
                          sale.status === 'cancelled' ? 'error.700' :
                          'grey.700'
                      }}
                    >
                      {sale.status}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {salesData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">
                      No sales data available
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={totalRows}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </TableContainer>
      )}
    </Box>
  );
};

export default SalesTableView;