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

// New endpoints for department and subcategories
export const getDepartments = async () => {
  const { data } = await api.get('/products/departments');
  return data;
};

export const getSubcategories = async (category) => {
  const { data } = await api.get('/products/subcategories', {
    params: { category }
  });
  return data;
};

export const searchProducts = async (query, filters = {}) => {
  const { data } = await api.get('/products/search', {
    params: {
      keyword: query,
      department: filters.department,
      category: filters.category,
      subcategory: filters.subcategory,
      ...filters
    }
  });
  return data;
};

export const getProductById = async (id) => {
  const { data } = await api.get(`/products/${id}`);
  return data;
};

// Optional: Advanced search with variant support
export const searchProductsByVariant = async (query, variantName) => {
  const { data } = await api.get('/products/search', {
    params: {
      keyword: query,
      variantName
    }
  });
  return data;
};