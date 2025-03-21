import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, List, ListItem, ListItemText, Divider, Box, Chip } from '@mui/material';
import { getInventory } from '@/services/inventory';
import { getMappingByStore } from '@/services/storeInventoryMap';
import { getStores } from '@/services/stores';

const LowStockAlerts = () => {
  const [stores, setStores] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const storesData = await getStores();
        setStores(storesData);
      } catch (error) {
        console.error('Error fetching stores:', error);
      }
    };
    
    fetchStores();
  }, []);

  useEffect(() => {
    const fetchLowStockItems = async () => {
      if (stores.length === 0) return;
      
      try {
        setLoading(true);
        
        const allLowStockItems = [];
        
        // For each store, get low stock items
        for (const store of stores) {
          try {
            // Get inventory collection name for this store
            const mapping = await getMappingByStore(store._id);
            
            if (mapping && mapping.inventoryCollection) {
              const inventoryData = await getInventory(mapping.inventoryCollection, {
                maxQuantity: 5, // Consider items with 5 or fewer as low stock
                limit: 100
              });
              
              // Add store info to each item
              const storeItems = (inventoryData.items || []).map(item => ({
                ...item,
                storeName: store.name,
                storeId: store._id
              }));
              
              allLowStockItems.push(...storeItems);
            }
          } catch (error) {
            console.error(`Error fetching low stock for store ${store.name}:`, error);
          }
        }
        
        // Sort by quantity (lowest first)
        allLowStockItems.sort((a, b) => a.quantity - b.quantity);
        
        // Take top 10
        setLowStockItems(allLowStockItems.slice(0, 10));
      } catch (error) {
        console.error('Error fetching low stock items:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLowStockItems();
  }, [stores]);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>Low Stock Alerts</Typography>
        
        {loading ? (
          <Typography variant="body2" color="text.secondary">Loading low stock items...</Typography>
        ) : lowStockItems.length > 0 ? (
          <List disablePadding>
            {lowStockItems.map((item, index) => (
              <React.Fragment key={item._id}>
                {index > 0 && <Divider />}
                <ListItem sx={{ px: 0, py: 1.5 }}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" fontWeight="medium">
                          {item.name}
                          {item.variantName && (
                            <Typography 
                              component="span" 
                              variant="caption" 
                              sx={{ ml: 1, px: 1, py: 0.25, bgcolor: 'primary.50', borderRadius: 1 }}
                            >
                              {item.variantName}
                            </Typography>
                          )}
                        </Typography>
                        <Chip 
                          size="small" 
                          label={`Qty: ${item.quantity}`}
                          color={item.quantity <= 0 ? "error" : "warning"}
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {item.itemCode}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.storeName}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">No low stock items found</Typography>
        )}
      </CardContent>
    </Card>
  )};

  export default LowStockAlerts;