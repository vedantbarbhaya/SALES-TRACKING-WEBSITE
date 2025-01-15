import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { getSales } from '@/services/sales';
import { handleApiError } from '@/utils/errorHandler';
import { useAuth } from '@/hooks/useAuth';

const SalesHistoryPage = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    search: '',
    page: 1
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });

  useEffect(() => {
    fetchSales();
  }, [filters]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Create filter params
      const filterParams = {
        ...filters,
        // Only add storeId if user is not admin, or if admin has selected a specific store
        storeId: user.role !== 'admin' ? user.store._id : filters.storeId,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        search: filters.search || undefined,
        page: filters.page
      };
      
      // Remove undefined values
      Object.keys(filterParams).forEach(key => 
        filterParams[key] === undefined && delete filterParams[key]
      );

      console.log('Fetching sales with filters:', filterParams);
      const data = await getSales(filterParams);
      
      if (data && data.sales) {
        setSales(data.sales);
        setPagination({
          page: data.page,
          pages: data.pages,
          total: data.total
        });
      } else {
        console.error('Invalid sales data structure:', data);
        setError('Unable to load sales data');
      }
    } catch (err) {
      console.error('Error fetching sales:', err);
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [filters, user]);


  const handleDateChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1 // Reset to first page on filter change
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters(prev => ({
      ...prev,
      page: 1
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Sales History</h1>
        <Link
          to="/sales/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          New Sale
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    search: e.target.value
                  }))}
                  placeholder="Search by sale number..."
                  className="w-full p-2 pl-10 border rounded-lg"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Sales List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
  {loading ? (
    <div className="flex justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  ) : error ? (
    <div className="p-4 text-center text-red-600">
      {error}
    </div>
  ) : (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                Sale Number
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                Date
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                Products
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                Items
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                Total
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
          {sales.map((sale) => (
            <tr key={sale._id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <Link
                  to={`/sales/${sale._id}`}
                  className="text-blue-600 hover:underline"
                >
                  {sale.saleNumber || 'N/A'}
                </Link>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : 'N/A'}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {sale.customerName || '-'}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                <div className="max-w-xs">
                  {sale.items?.map((item, index) => (
                    <div key={index} className="text-xs mb-1">
                      {item.product?.name || 'Unknown Product'}
                      {item.product?.variantName && (
                        <span className="ml-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">
                          {item.product.variantName}
                        </span>
                      )}
                      {(item.product?.department || item.product?.category || item.product?.subcategory) && (
                        <div className="text-gray-500">
                          {[
                            item.product?.department,
                            item.product?.category,
                            item.product?.subcategory
                          ]
                            .filter(Boolean)
                            .join(' > ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-right text-gray-600">
                {sale.items?.length || 0}
              </td>
              <td className="px-4 py-3 text-sm text-right text-gray-600">
                ${(sale.totalAmount || 0).toFixed(2)}
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  sale.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : sale.status === 'cancelled'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {sale.status ? sale.status.charAt(0).toUpperCase() + sale.status.slice(1) : 'N/A'}
                </span>
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="text-sm text-gray-500">
                  Showing {((pagination.page - 1) * 10) + 1} to {Math.min(pagination.page * 10, pagination.total)} of {pagination.total} results
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SalesHistoryPage;