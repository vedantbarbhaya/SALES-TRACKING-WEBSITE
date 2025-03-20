import React, { useState, useEffect } from 'react';
import { Search, Scan, X } from 'lucide-react';
import { searchProducts, getProductByBarcode } from '../../services/product';
import { handleApiError } from '@/utils/errorHandler';


const ProductSearch = ({ onProductSelect, onClose, storeInventoryCollection }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

    useEffect(() => {
    if (searchTerm.length > 2 && storeInventoryCollection) {
      const delayDebounceFn = setTimeout(async () => {
        try {
          setLoading(true);
          
          // Use the storeInventoryCollection to search inventory
          const inventoryResponse = await api.get('/inventory', {
            params: {
              collection: storeInventoryCollection,
              search: searchTerm
            }
          });
          
          console.log('Inventory search response:', inventoryResponse.data);
          
          if (inventoryResponse.data?.items?.length > 0) {
            // Process inventory items to get full product details
            const productResults = [];
            
            for (const item of inventoryResponse.data.items) {
              try {
                const productResponse = await api.get(`/products/barcode/${item.itemCode}`);
                productResults.push({
                  ...productResponse.data,
                  quantity: item.quantity,
                  availableQuantity: item.quantity
                });
              } catch (err) {
                console.error(`Error getting product details for ${item.itemCode}:`, err);
              }
            }
            
            setProducts(productResults);
          } else {
            setProducts([]);
          }
          
          setError('');
        } catch (err) {
          console.error('Search error:', err);
          setError(handleApiError(err));
          setProducts([]);
        } finally {
          setLoading(false);
        }
      }, 300);

      return () => clearTimeout(delayDebounceFn);
    } else if (searchTerm.length <= 2) {
      setProducts([]);
    }
  }, [searchTerm, storeInventoryCollection]);

  const handleBarcodeScanner = async () => {
    try {
      // In a real app, this would use a barcode scanning library
      const barcode = prompt('Enter barcode (simulated scanner):');
      if (barcode && storeInventoryCollection) {
        setLoading(true);
        
        // First check if the product is in inventory for this store
        const inventoryResponse = await api.get('/inventory', {
          params: {
            collection: storeInventoryCollection,
            search: barcode
          }
        });
        
        if (inventoryResponse.data?.items?.length > 0) {
          // Find exact match
          const exactMatch = inventoryResponse.data.items.find(i => 
            i.itemCode.toLowerCase() === barcode.toLowerCase()
          );
          
          if (exactMatch) {
            // Get full product details
            const productResponse = await api.get(`/products/barcode/${exactMatch.itemCode}`);
            const fullProduct = {
              ...productResponse.data,
              quantity: exactMatch.quantity,
              availableQuantity: exactMatch.quantity
            };
            
            onProductSelect(fullProduct);
            onClose();
          } else {
            setError('No exact match found for this barcode');
          }
        } else {
          setError(`No product with barcode ${barcode} found in this store's inventory`);
        }
      }
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const renderProductInfo = (product) => {
    const details = [];
    if (product.variantName) details.push(product.variantName);
    if (product.department) details.push(product.department);
    if (product.category) details.push(product.category);
    if (product.subcategory) details.push(product.subcategory);

    return (
      <>
        <div className="font-medium flex items-center gap-2">
          <span>{product.name}</span>
          {product.variantName && (
            <span className="text-sm px-2 py-0.5 bg-gray-100 rounded">
              {product.variantName}
            </span>
          )}
        </div>
        <div className="text-sm text-gray-500 flex flex-wrap gap-2">
          <span>Code: {product.itemCode}</span>
          <span>|</span>
          <span>${product.price.toFixed(2)}</span>
        </div>
        {details.length > 0 && (
          <div className="text-xs text-gray-500 mt-1">
            {details.filter(d => d).join(' > ')}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-xl max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Select Product</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products by name, code, or category..."
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg"
              />
            </div>
            <button
              onClick={handleBarcodeScanner}
              className="p-2.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
            >
              <Scan className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="mt-2 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        <div className="p-4">
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <div className="space-y-2">
              {products.map((product) => (
                <button
                  key={product._id}
                  onClick={() => {
                    if (product.quantity > 0) {
                      onProductSelect(product);
                      onClose();
                    } else {
                      setError(`${product.name} (${product.variantName || ''}) is out of stock`);
                    }
                  }}
                  disabled={product.quantity <= 0}
                  className={`w-full p-3 text-left border rounded-lg ${
                    product.quantity > 0 ? 'hover:bg-gray-50' : 'opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="font-medium flex items-center gap-2">
                    <span>{product.name}</span>
                    {product.variantName && (
                      <span className="text-sm px-2 py-0.5 bg-gray-100 rounded">
                        {product.variantName}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center mt-1">
                    <div className="text-sm text-gray-500">
                      <span>Code: {product.itemCode}</span>
                      <span className="mx-1">|</span>
                      <span>₹{product.price?.toFixed(2)}</span>
                    </div>
                    
                    <div className={`text-xs px-2 py-0.5 rounded ${
                      product.quantity <= 0 ? 'bg-red-100 text-red-700' :
                      product.quantity < 5 ? 'bg-amber-100 text-amber-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {product.quantity <= 0 ? 'Out of Stock' :
                       product.quantity < 5 ? `Low Stock (${product.quantity})` :
                       `In Stock (${product.quantity})`}
                    </div>
                  </div>
                  
                  {(product.department || product.category || product.subcategory) && (
                    <div className="text-xs text-gray-500 mt-1">
                      {[product.department, product.category, product.subcategory]
                        .filter(Boolean)
                        .join(' > ')}
                    </div>
                  )}
                </button>
              ))}
              
              {!loading && products.length === 0 && searchTerm.length > 2 && (
                <div className="text-center py-4 text-gray-500">
                  No products found
                </div>
              )}
              
              {!loading && searchTerm.length <= 2 && (
                <div className="text-center py-4 text-gray-500">
                  Type at least 3 characters to search
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


export default ProductSearch;