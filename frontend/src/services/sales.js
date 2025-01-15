import api from './api';

// Existing createSale function remains the same
export const createSale = async (saleData) => {
  try {
    const { data } = await api.post('/sales', saleData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return data;
  } catch (error) {
    console.error('Create sale error:', error);
    throw error;
  }
};

// Existing basic functions remain the same
export const getSales = async (params) => {
  try {
    console.log('Calling getSales API with params:', params);
    const { data } = await api.get('/sales', { params });
    console.log('API response:', data);
    return data;
  } catch (error) {
    console.error('getSales error:', error);
    throw error;
  }
};

export const getSaleById = async (id) => {
  try {
    console.log("Making API request for sale:", id);
    const { data } = await api.get(`/sales/${id}`);
    console.log("API response:", data);
    return data;
  } catch (error) {
    console.error("API error:", error);
    throw error;
  }
};

// Add new analytics endpoints
export const getSalesByDepartment = async (params) => {
  const { data } = await api.get('/sales/by-department', { params });
  return data;
};

export const getSalesByCategory = async (params) => {
  const { data } = await api.get('/sales/by-category', { params });
  return data;
};

export const getSalesByVariant = async (params) => {
  const { data } = await api.get('/sales/by-variant', { params });
  return data;
};

// Enhanced getSalesStats to include new fields
export const getSalesStats = async (params) => {
  const { data } = await api.get('/sales/stats', { 
    params: {
      ...params,
      includeDepartments: true,
      includeVariants: true
    }
  });
  return data;
};

// Existing time-based reports remain the same
export const getDailySales = async (date) => {
  const { data } = await api.get('/sales/daily', { 
    params: { date } 
  });
  return data;
};

export const getMonthlyReport = async (month, year) => {
  const { data } = await api.get('/sales/monthly', { 
    params: { month, year } 
  });
  return data;
};

// Existing sale status management functions remain the same
export const updateSaleStatus = async (id, status) => {
  const { data } = await api.put(`/sales/${id}/status`, { status });
  return data;
};

export const cancelSale = async (id, reason) => {
  const { data } = await api.post(`/sales/${id}/cancel`, { reason });
  return data;
};

export const issueSaleRefund = async (id, refundData) => {
  const { data } = await api.post(`/sales/${id}/refund`, refundData);
  return data;
};

// Store management remains the same
export const getStores = async () => {
  const { data } = await api.get('/stores');
  return data;
};

// Add enhanced search function
export const searchSales = async (params) => {
  const { data } = await api.get('/sales/search', {
    params: {
      ...params,
      department: params.department,
      category: params.category,
      subcategory: params.subcategory,
      variantName: params.variantName
    }
  });
  return data;
};

export const getSalespeople = async () => {
  const { data } = await api.get('/users/salespeople');
  return data;
};