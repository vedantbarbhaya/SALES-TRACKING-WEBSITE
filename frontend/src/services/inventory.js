import api from './api';

export const getInventory = async (collectionName, filters = {}) => {
  try {
    const { data } = await api.get('/inventory', {
      params: {
        collection: collectionName,
        search: filters.search,
        department: filters.department,
        category: filters.category,
        minQuantity: filters.minQuantity,
        maxQuantity: filters.maxQuantity,
        sort: filters.sort,
        page: filters.page,
        limit: filters.limit
      }
    });
    return data;
  } catch (error) {
    console.error('Get inventory error:', error);
    throw error;
  }
};

export const updateInventoryItem = async (collectionName, itemId, itemData) => {
  try {
    const { data } = await api.put(`/inventory/${itemId}`, {
      ...itemData,
      collection: collectionName
    });
    return data;
  } catch (error) {
    console.error('Update inventory item error:', error);
    throw error;
  }
};

export const bulkUpdateInventory = async (collectionName, items) => {
  try {
    const { data } = await api.post('/inventory/bulk-update', {
      collection: collectionName,
      items
    });
    return data;
  } catch (error) {
    console.error('Bulk update inventory error:', error);
    throw error;
  }
};

export const getInventoryStats = async (collectionName) => {
  try {
    const { data } = await api.get('/inventory/stats', {
      params: {
        collection: collectionName
      }
    });
    return data;
  } catch (error) {
    console.error('Get inventory stats error:', error);
    throw error;
  }
};

// Helper function to get properly formatted inventory collection name for a store
export const getInventoryCollectionName = async (storeId) => {
  try {
    const { data } = await api.get(`/stores/inventory-mapping/${storeId}`);
    return data.inventoryCollection;
  } catch (error) {
    console.error('Get inventory collection name error:', error);
    throw error;
  }
};