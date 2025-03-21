import mongoose from 'mongoose';

const saleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  itemCode: {
    type: String,
    default: 'Unknown Code'
  },
  productName: {
    type: String,
    default: 'Unknown Product'
  },
  variantName: {
    type: String,
    default: ''
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  }
});

const saleSchema = new mongoose.Schema({
  billPhoto: {
    data: Buffer,
    contentType: String
  },
  salesmanName: {
    type: String,
    required: true
  },
  saleNumber: {
    type: String,
    unique: true
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  salesperson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerName: {
    type: String
  },
  items: [saleItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['completed', 'cancelled', 'refunded'],
    default: 'completed'
  },
  cancelReason: {
    type: String
  },
  cancelledAt: {
    type: Date
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // For refunds
  refundReason: {
    type: String
  },
  refundedAt: {
    type: Date
  },
  refundedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  refundAmount: {
    type: Number
  },
  refundedItems: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    },
    total: {
      type: Number,
      required: true
    }
  }],
}, {
  timestamps: true
});

// Generate sale number before saving with retry mechanism
saleSchema.pre('save', async function(next) {
  if (this.isNew && !this.saleNumber) {
    const maxRetries = 5;
    let retryCount = 0;
    let uniqueNumberFound = false;

    while (!uniqueNumberFound && retryCount < maxRetries) {
      try {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        
        // Add a small random offset to reduce collision probability
        const offset = retryCount > 0 ? Math.floor(Math.random() * 10) : 0;
        
        // Get the current count for this month, including any attempts in progress
        const count = await this.constructor.countDocuments({
          createdAt: {
            $gte: new Date(date.getFullYear(), date.getMonth(), 1),
            $lt: new Date(date.getFullYear(), date.getMonth() + 1, 1)
          }
        });
        
        // Generate the sale number with padding
        const saleNumber = `SALE${year}${month}${(count + 1 + offset).toString().padStart(4, '0')}`;
        
        // Check if this sale number already exists
        const existingWithNumber = await this.constructor.findOne({ saleNumber });
        
        if (!existingWithNumber) {
          this.saleNumber = saleNumber;
          uniqueNumberFound = true;
        } else {
          console.log(`Sale number ${saleNumber} already exists, retrying...`);
          retryCount++;
        }
      } catch (error) {
        console.error('Error generating sale number:', error);
        retryCount++;
      }
    }
    
    // If we couldn't generate a unique number after retries, use timestamp as fallback
    if (!uniqueNumberFound) {
      const timestamp = new Date().getTime().toString().slice(-8);
      this.saleNumber = `SALE-EMERG-${timestamp}`;
      console.warn(`Using emergency sale number format: ${this.saleNumber}`);
    }
  }
  next();
});

const Sale = mongoose.model('Sale', saleSchema);
export default Sale;