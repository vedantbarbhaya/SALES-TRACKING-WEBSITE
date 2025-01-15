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
  CircularProgress,
  Collapse,
  IconButton,
  Chip
} from '@mui/material';
import {
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon
} from '@mui/icons-material';
import { getSales } from '@/services/sales';
import { getStores } from '@/services/stores';
import { handleApiError } from '@/utils/errorHandler';

// Row component to handle expandable details
const SaleRow = ({ sale }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{sale.saleNumber}</TableCell>
        <TableCell>{new Date(sale.createdAt).toLocaleString()}</TableCell>
        <TableCell>{sale.store?.name}</TableCell>
        <TableCell>{sale.salesperson?.name}</TableCell>
        <TableCell>{sale.customerName || 'N/A'}</TableCell>
        <TableCell>${sale.totalAmount.toFixed(2)}</TableCell>
        <TableCell>
          <Chip
            label={sale.status}
            color={
              sale.status === 'completed' ? 'success' :
              sale.status === 'cancelled' ? 'error' :
              'default'
            }
            size="small"
          />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Products
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product Code</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Variant</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Subcategory</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sale.items.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell>{item.product?.itemCode}</TableCell>
                      <TableCell>{item.product?.name}</TableCell>
                      <TableCell>{item.product?.variantName || '-'}</TableCell>
                      <TableCell>{item.product?.department || '-'}</TableCell>
                      <TableCell>{item.product?.category || '-'}</TableCell>
                      <TableCell>{item.product?.subcategory || '-'}</TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">${Number(item.price).toFixed(2)}</TableCell>
                      <TableCell align="right">${(item.price * item.quantity).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={8} align="right" sx={{ fontWeight: 'bold' }}>
                      Total Amount:
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      ${sale.totalAmount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const SalesTableView = () => {
  // States
  const [selectedStore, setSelectedStore] = useState('all'); // Changed default to 'all'
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
            <MenuItem value="all">All Stores</MenuItem>
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
                <TableCell />  {/* For expand/collapse */}
                <TableCell>Sale Number</TableCell>
                <TableCell>Date & Time</TableCell>
                <TableCell>Store</TableCell>
                <TableCell>Salesperson</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Total Amount</TableCell>
                <TableCell>Status</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {salesData.map((sale) => (
                <SaleRow key={sale._id} sale={sale} />
                ))}
                {salesData.length === 0 && (
                <TableRow>
                    <TableCell colSpan={8} align="center">
                    <Typography color="text.secondary">No sales data available</Typography>
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