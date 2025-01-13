import React, { useState, useEffect } from 'react';
import { Search, Scan, X } from 'lucide-react';
import { searchProducts, getProductByBarcode } from '../../services/product';
import { handleApiError } from '@/utils/errorHandler';

const ProductSearch = ({ onProductSelect, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (searchTerm.length > 2) {
      const delayDebounceFn = setTimeout(async () => {
        try {
          setLoading(true);
          const data = await searchProducts(searchTerm);
          setProducts(data.products);
          setError('');
        } catch (err) {
          setError(handleApiError(err));
        } finally {
          setLoading(false);
        }
      }, 300);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [searchTerm]);

  const handleBarcodeScanner = async () => {
    try {
      // In a real app, this would use a barcode scanning library
      const barcode = prompt('Enter barcode (simulated scanner):');
      if (barcode) {
        setLoading(true);
        const product = await getProductByBarcode(barcode);
        if (product) {
          onProductSelect(product);
          onClose();
        }
      }
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
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
                placeholder="Search products..."
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
                    onProductSelect(product);
                    onClose();
                  }}
                  className="w-full p-3 text-left border rounded-lg hover:bg-gray-50"
                >
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-gray-500">
                    Code: {product.itemCode} | Price: ${product.price.toFixed(2)}
                  </div>
                </button>
              ))}
              {!loading && products.length === 0 && searchTerm.length > 2 && (
                <div className="text-center py-4 text-gray-500">
                  No products found
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