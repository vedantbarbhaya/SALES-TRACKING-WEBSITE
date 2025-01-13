import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Store, 
  Image, 
  Share,
  Printer,
  CheckCircle2
} from 'lucide-react';
import { Card, Button, Alert } from '@/components/ui';
import { getSaleById, updateSaleStatus } from '@/services/sales';
import { handleApiError } from '@/utils/errorHandler';

const SaleDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showImage, setShowImage] = useState(false);

  console.log("Component rendering, ID:", id);

  useEffect(() => {
    console.log("Fetching sale details for ID:", id);
    fetchSaleDetails();
  }, [id]);

  const fetchSaleDetails = async () => {
    try {
      setLoading(true);
      console.log("Making API call for ID:", id);
      const data = await getSaleById(id);
      console.log("Received data:", data);
      setSale(data);
    } catch (err) {
      console.error("API error:", err);
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  console.log("Current state:", { loading, error, sale });


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert type="error">{error}</Alert>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="p-4">
        <Alert type="error">Sale not found</Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-gray-50 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">Sale Details</h1>
          <button
            onClick={() => {/* Handle share/print */}}
            className="p-2 -mr-2 hover:bg-gray-50 rounded-full"
          >
            <Share className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4 pb-safe">
        {/* Sale Info */}
        <Card className="p-4">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold">{sale?.saleNumber}</h2>
                <p className="text-sm text-gray-500">
                  {new Date(sale?.createdAt).toLocaleString()}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                sale?.status === 'completed' 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {sale?.status}
              </span>
            </div>

            <div className="flex items-center gap-2 text-gray-600">
              <User className="h-4 w-4" />
              <span>{sale?.customerName || 'Walk-in Customer'}</span>
            </div>

            <div className="flex items-center gap-2 text-gray-600">
              <Store className="h-4 w-4" />
              <span>{sale?.store?.name}</span>
            </div>
          </div>
        </Card>

        {/* Products List */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Products</h3>
          <div className="space-y-3">
            {sale?.items.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div className="flex-1">
                  <div className="font-medium">{item.product.name}</div>
                  <div className="text-sm text-gray-500">
                    {item.quantity} × ${item.price.toFixed(2)}
                  </div>
                </div>
                <div className="font-medium">
                  ${(item.quantity * item.price).toFixed(2)}
                </div>
              </div>
            ))}

            <div className="flex justify-between items-center pt-3 font-bold">
              <span>Total</span>
              <span>${sale?.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </Card>

        {/* Bill Photo */}
        {sale?.billPhoto && (
          <Card 
            className="p-4 cursor-pointer"
            onClick={() => setShowImage(true)}
          >
            <div className="flex items-center gap-3">
              <Image className="h-5 w-5 text-gray-600" />
              <span className="text-gray-600">View Bill Photo</span>
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            type="button"
            className="flex-1 h-12"
            onClick={() => {/* Handle print */}}
          >
            <Printer className="h-5 w-5 mr-2" />
            Print Receipt
          </Button>
          
          <Button
            type="button"
            variant="secondary"
            className="flex-1 h-12"
            onClick={() => navigate(`/sales/${id}/edit`)}
          >
            Edit Sale
          </Button>
        </div>
      </div>

      {/* Bill Photo Modal */}
      {showImage && sale?.billPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={() => setShowImage(false)}
        >
          <img
            src={sale.billPhoto}
            alt="Bill"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  );
};

export default SaleDetailsPage;