import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, List, ListItem, ListItemText, Divider, Box, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { getSales } from '@/services/sales';

const RecentSales = () => {
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentSales = async () => {
      try {
        setLoading(true);
        const response = await getSales({
          storeId: 'all',
          page: 1,
          pageSize: 5,
        });
        
        setRecentSales(response.sales || []);
      } catch (error) {
        console.error('Error fetching recent sales:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecentSales();
  }, []);

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Recent Sales</Typography>
          <Button component={Link} to="/sales/history" size="small">
            View All
          </Button>
        </Box>
        
        {loading ? (
          <Typography variant="body2" color="text.secondary">Loading recent sales...</Typography>
        ) : recentSales.length > 0 ? (
          <List disablePadding>
            {recentSales.map((sale, index) => (
              <React.Fragment key={sale._id}>
                {index > 0 && <Divider />}
                <ListItem 
                  component={Link} 
                  to={`/sales/${sale._id}`}
                  sx={{ 
                    px: 0,
                    py: 1.5,
                    color: 'inherit',
                    textDecoration: 'none',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" fontWeight="medium">
                          {sale.saleNumber}
                        </Typography>
                        <Typography variant="body2">
                          ${sale.totalAmount.toFixed(2)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {sale.store?.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(sale.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">No recent sales found</Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentSales;