import React, { useState, useEffect } from 'react';
import { Camera, Plus, Trash2, Save, Search, Scan } from 'lucide-react';
import ProductSearch from './ProductSearch';
import { createSale, getStores, getSalespeople } from '@/services/sales';
import { useAuth } from '@/contexts/AuthContext';
import { handleApiError } from '@/utils/errorHandler';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const SalesRecorder = () => {
  const { user } = useAuth();
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [stores, setStores] = useState([]);
  const [salespeople, setSalespeople] = useState([]);
  const [saleData, setSaleData] = useState({
    storeId: '',
    salesPersonId: '',
    customerName: '',
    date: new Date().toISOString().split('T')[0],
    items: [],
    billPhoto: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedProductIndex, setSelectedProductIndex] = useState(null);

  // Fetch stores and salespeople on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [storesData, salesPeopleData] = await Promise.all([
          getStores(),
          getSalespeople()
        ]);
        setStores(storesData);
        setSalespeople(salesPeopleData);
      } catch (err) {
        setError(handleApiError(err));
      }
    };

    fetchInitialData();
  }, []);

  const handleDataChange = (e) => {
    const { name, value } = e.target;
    setSaleData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddProduct = (product) => {
    setSaleData(prev => ({
      ...prev,
      items: [...prev.items, {
        product: product._id,
        productDetails: {
          itemCode: product.itemCode,
          name: product.name,
          variantName: product.variantName,
          department: product.department,
          category: product.category,
          subcategory: product.subcategory
        },
        quantity: 1,
        price: product.price
      }]
    }));
    setShowProductSearch(false);
  };

  const handleQuantityChange = (index, quantity) => {
    setSaleData(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        quantity: Number(quantity),
      };
      return { ...prev, items: newItems };
    });
  };

  const handleRemoveItem = (index) => {
    setSaleData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSaleData(prev => ({
        ...prev,
        billPhoto: file
      }));
    }
  };

  const calculateTotal = () => {
    return saleData.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0).toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      
      if (!saleData.storeId || !saleData.salesPersonId) {
        throw new Error('Please select store and salesperson');
      }

      if (saleData.items.length === 0) {
        throw new Error('Please add at least one product');
      }

      const formData = new FormData();
      if (saleData.billPhoto) {
        formData.append('billPhoto', saleData.billPhoto);
      }

      const salePayload = {
        storeId: saleData.storeId,
        salesPersonId: saleData.salesPersonId,
        customerName: saleData.customerName,
        date: saleData.date,
        items: saleData.items.map(item => ({
          product: item.product,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount: calculateTotal()
      };

      formData.append('data', JSON.stringify(salePayload));
      const response = await createSale(formData);

      setSuccess('Sale recorded successfully!');
      setSaleData({
        storeId: '',
        salesPersonId: '',
        customerName: '',
        date: new Date().toISOString().split('T')[0],
        items: [],
        billPhoto: null
      });

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="px-4 py-3">
        <CardTitle className="text-xl font-bold text-center">New Sale</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sale Details Section */}
          <div className="space-y-3">
            {/* Store Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">Store *</label>
              <select
                name="storeId"
                value={saleData.storeId}
                onChange={handleDataChange}
                className="w-full h-12 px-3 border rounded-lg text-base"
                required
              >
                <option value="">Select Store</option>
                {stores.map(store => (
                  <option key={store._id} value={store._id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Salesperson Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">Salesperson *</label>
              <select
                name="salesPersonId"
                value={saleData.salesPersonId}
                onChange={handleDataChange}
                className="w-full h-12 px-3 border rounded-lg text-base"
                required
              >
                <option value="">Select Salesperson</option>
                {salespeople.map(person => (
                  <option key={person._id} value={person._id}>
                    {person.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Customer Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">Customer Name</label>
              <input
                type="text"
                name="customerName"
                value={saleData.customerName}
                onChange={handleDataChange}
                className="w-full h-12 px-3 border rounded-lg text-base"
                placeholder="Enter customer name"
              />
            </div>

            {/* Date Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">Date</label>
              <input
                type="date"
                name="date"
                value={saleData.date}
                onChange={handleDataChange}
                className="w-full h-12 px-3 border rounded-lg text-base"
              />
            </div>

            {/* Bill Photo Upload */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">Bill Photo</label>
              <div className="flex items-center gap-2">
                <label className="flex-1">
                  <div className="flex items-center justify-center h-12 px-3 border rounded-lg text-base bg-gray-50 cursor-pointer hover:bg-gray-100">
                    <Camera className="h-5 w-5 mr-2" />
                    <span>{saleData.billPhoto ? 'Change Photo' : 'Upload Photo'}</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    capture="environment"
                  />
                </label>
                {saleData.billPhoto && (
                  <span className="text-sm text-green-600">
                    ✓ Photo added
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Products Section */}
          <div className="space-y-4 pt-2">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Products</h3>
              <button
                type="button"
                onClick={() => setShowProductSearch(true)}
                className="flex items-center gap-1 bg-green-600 text-white py-2 px-3 rounded-lg text-sm"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>

            <div className="space-y-4">
              {saleData.items.map((item, index) => (
                <div key={index} className="p-3 border rounded-lg space-y-3 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Item {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-600 p-1"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* Product Code */}
                    <div>
                      <label className="block text-sm font-medium">Product Code</label>
                      <input
                        type="text"
                        value={item.productDetails.itemCode || ''}
                        readOnly
                        className="w-full h-12 px-3 border rounded-lg text-base bg-gray-50"
                      />
                    </div>

                    {/* Product Name */}
                    <div>
                      <label className="block text-sm font-medium">Product Name</label>
                      <input
                        type="text"
                        value={item.productDetails.name || ''}
                        readOnly
                        className="w-full h-12 px-3 border rounded-lg text-base bg-gray-50"
                      />
                    </div>

                    {/* Variant Name */}
                    <div>
                      <label className="block text-sm font-medium">Variant</label>
                      <input
                        type="text"
                        value={item.productDetails.variantName || ''}
                        readOnly
                        className="w-full h-12 px-3 border rounded-lg text-base bg-gray-50"
                      />
                    </div>

                    {/* Department */}
                    <div>
                      <label className="block text-sm font-medium">Department</label>
                      <input
                        type="text"
                        value={item.productDetails.department || ''}
                        readOnly
                        className="w-full h-12 px-3 border rounded-lg text-base bg-gray-50"
                      />
                    </div>

                    {/* Category & Subcategory */}
                    <div className="flex gap-3">
                      <div className="space-y-2 flex-1">
                        <label className="block text-sm font-medium">Category</label>
                        <input
                          type="text"
                          value={item.productDetails.category || ''}
                          readOnly
                          className="w-full h-12 px-3 border rounded-lg text-base bg-gray-50"
                        />
                      </div>
                      <div className="space-y-2 flex-1">
                        <label className="block text-sm font-medium">Subcategory</label>
                        <input
                          type="text"
                          value={item.productDetails.subcategory || ''}
                          readOnly
                          className="w-full h-12 px-3 border rounded-lg text-base bg-gray-50"
                        />
                      </div>
                    </div>

                    {/* Quantity and Price */}
                    <div className="flex gap-3">
                      <div className="space-y-2 flex-1">
                        <label className="block text-sm font-medium">Quantity</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(index, e.target.value)}
                          className="w-full h-12 px-3 border rounded-lg text-base"
                          min="1"
                        />
                      </div>
                      <div className="space-y-2 flex-1">
                        <label className="block text-sm font-medium">Price</label>
                        <input
                          type="number"
                          value={item.price}
                          readOnly
                          className="w-full h-12 px-3 border rounded-lg text-base bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {saleData.items.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No products added yet
                </div>
              )}
            </div>

            {/* Total Amount */}
            {saleData.items.length > 0 && (
              <div className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded-lg text-lg font-semibold">
                <span>Total:</span>
                <span>${calculateTotal()}</span>
              </div>
            )}
          </div>

          {/* Status Messages */}
          {error && (
            <Alert className="bg-red-50">
              <AlertDescription className="text-red-600">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50">
              <AlertDescription className="text-green-600">{success}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || saleData.items.length === 0}
            className="w-full h-12 bg-blue-600 text-white rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                Processing...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Save className="h-5 w-5" />
                Record Sale
              </div>
            )}
          </button>
        </form>
      </CardContent>

      {/* Product Search Modal */}
      {showProductSearch && (
        <ProductSearch
          onProductSelect={handleAddProduct}
          onClose={() => setShowProductSearch(false)}
        />
      )}
    </Card>
  );
};

export default SalesRecorder;