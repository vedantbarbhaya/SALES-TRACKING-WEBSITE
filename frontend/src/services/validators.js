export const validateFilters = (filters = {}) => {
    return {
      department: filters.department?.trim(),
      category: filters.category?.trim(),
      subcategory: filters.subcategory?.trim(),
      minPrice: Number(filters.minPrice) || undefined,
      maxPrice: Number(filters.maxPrice) || undefined,
      sortBy: filters.sortBy || 'createdAt',
      sortOrder: filters.sortOrder || -1,
      page: Number(filters.page) || 1,
      limit: Number(filters.limit) || 20
    };
  };
  
  export const validateSaleData = (saleData) => {
    if (!saleData.items || !Array.isArray(saleData.items)) {
      throw new Error('Items must be an array');
    }
  
    return {
      ...saleData,
      items: saleData.items.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        price: Number(item.price),
        total: Number(item.quantity) * Number(item.price)
      }))
    };
  };