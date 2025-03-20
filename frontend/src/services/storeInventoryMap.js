import api from './api';

export const getInventoryMappings = async () => {
  try {
    const { data } = await api.get('/stores/inventory-mapping');
    return data;
  } catch (error) {
    console.error('Get inventory mappings error:', error);
    throw error;
  }
};

export const getMappingByStore = async (storeId) => {
  try {
    console.log(`Fetching inventory mapping for store: ${storeId}`);
    const { data } = await api.get(`/stores/inventory-mapping/${storeId}`);
    console.log('Mapping data retrieved:', data);
    return data;
  } catch (error) {
    console.error(`Error fetching mapping for store ${storeId}:`, error);
    console.error('Response status:', error.response?.status);
    console.error('Response data:', error.response?.data);
    throw error;
  }
};

export const createMapping = async (mappingData) => {
  try {
    const { data } = await api.post('/stores/inventory-mapping', mappingData);
    return data;
  } catch (error) {
    console.error('Create mapping error:', error);
    throw error;
  }
};

export const updateMapping = async (id, mappingData) => {
  try {
    const { data } = await api.put(`/stores/inventory-mapping/id/${id}`, mappingData);
    return data;
  } catch (error) {
    console.error('Update mapping error:', error);
    throw error;
  }
};

export const deleteMapping = async (id) => {
  try {
    const { data } = await api.delete(`/stores/inventory-mapping/id/${id}`);
    return data;
  } catch (error) {
    console.error('Delete mapping error:', error);
    throw error;
  }
};