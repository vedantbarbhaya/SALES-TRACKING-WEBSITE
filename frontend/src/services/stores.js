import api from './api';

export const getStores = async () => {
  const { data } = await api.get('/stores');
  return data;
};

export const getStoreById = async (id) => {
  const { data } = await api.get(`/stores/${id}`);
  return data;
};

export const createStore = async (storeData) => {
  const { data } = await api.post('/stores', storeData);
  return data;
};

export const updateStore = async (id, storeData) => {
  const { data } = await api.put(`/stores/${id}`, storeData);
  return data;
};

export const deleteStore = async (id) => {
  const { data } = await api.delete(`/stores/${id}`);
  return data;
};