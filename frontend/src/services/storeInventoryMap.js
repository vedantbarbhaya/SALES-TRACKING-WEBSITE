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
    const { data } = await api.get(`/stores/inventory-mapping/${storeId}`);
    return data;
  } catch (error) {
    console.error('Get mapping by store error:', error);
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