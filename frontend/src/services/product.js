import api from './api';

export const getProducts = async (params) => {
  const { data } = await api.get('/products', { params });
  return data;
};

export const getProductByBarcode = async (barcode) => {
  const { data } = await api.get(`/products/barcode/${barcode}`);
  return data;
};

export const getCategories = async () => {
  const { data } = await api.get('/products/categories');
  return data;
};

export const searchProducts = async (query) => {
  const { data } = await api.get('/products/search', { 
    params: { keyword: query }
  });
  return data;
};

export const getProductById = async (id) => {
  const { data } = await api.get(`/products/${id}`);
  return data;
};