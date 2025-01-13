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
  
  // Append each field separately to FormData to maintain proper data types
  if (saleData.customerName !== undefined) {
    formData.append('customerName', saleData.customerName);
  }
  if (saleData.store) {
    formData.append('store', saleData.store);
  }
  if (saleData.items) {
    formData.append('items', JSON.stringify(saleData.items));
  }
  if (saleData.totalAmount) {
    formData.append('totalAmount', saleData.totalAmount);
  }
  if (saleData.billPhoto) {
    formData.append('billPhoto', saleData.billPhoto);
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
  const { data } = await api.get(`/sales/${id}`);
  return data;
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