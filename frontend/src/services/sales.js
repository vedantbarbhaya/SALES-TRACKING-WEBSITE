import api from './api';

export const createSale = async (saleData) => {
  // Handle FormData case (when saleData is already FormData)
  if (saleData instanceof FormData) {
    const { data } = await api.post('/sales', saleData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return data;
  }

  // Handle JSON case (when no billPhoto)
  if (!saleData.billPhoto) {
    const { data } = await api.post('/sales', saleData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return data;
  }

  // Handle object with billPhoto case
  const formData = new FormData();
  
  // Append fields correctly
  for (let pair of saleData.entries()) {
    if (pair[0] === 'items') {
      // items is already stringified in your form data
      formData.append('items', pair[1]);
    } else if (pair[0] === 'billPhoto') {
      formData.append('billPhoto', pair[1], pair[1].name);
    } else {
      formData.append(pair[0], pair[1]);
    }
  }

  const { data } = await api.post('/sales', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return data;
};

export const getSales = async (params) => {
  const { data } = await api.get('/sales', { params });
  return data;
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

export const getSalesStats = async (params) => {
  const { data } = await api.get('/sales/stats', { params });
  return data;
};

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

export const getStores = async () => {
  const { data } = await api.get('/stores');
  return data;
};