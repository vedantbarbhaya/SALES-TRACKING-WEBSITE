import mongoose from 'mongoose';

const saleItemSchema = new mongoose.Schema({
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
});

const saleSchema = new mongoose.Schema({
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
  billPhoto: {
    type: String // URL or path to stored image
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

// Generate sale number before saving
saleSchema.pre('save', async function(next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(date.getFullYear(), date.getMonth(), 1),
        $lt: new Date(date.getFullYear(), date.getMonth() + 1, 1)
      }
    });
    this.saleNumber = `SALE${year}${month}${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

const Sale = mongoose.model('Sale', saleSchema);
export default Sale;