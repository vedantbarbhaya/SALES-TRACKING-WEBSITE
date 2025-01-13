import api from './api';

export const createSale = async (saleData) => {
  // If there's no billPhoto, send as JSON
  if (!saleData.billPhoto) {
    const { data } = await api.post('/sales', saleData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return data;
  }

  // If there is a billPhoto, use FormData
  const formData = new FormData();
  
  // Append all data fields to FormData
  Object.keys(saleData).forEach(key => {
    if (key === 'items') {
      formData.append(key, JSON.stringify(saleData[key]));
    } else if (key === 'billPhoto') {
      formData.append(key, saleData[key]);
    } else if (saleData[key] !== undefined && saleData[key] !== null) {
      formData.append(key, saleData[key]);
    }
  });

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