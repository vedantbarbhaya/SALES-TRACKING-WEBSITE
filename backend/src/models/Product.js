import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  itemCode: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  variantName: {  // New field
    type: String,
    default: ''  // Optional, if you want a default empty string
  },
  department: {   // New field
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  subcategory: {
    type: String,
    default: ''  // Optional, if you want a default empty string
  },
  description: {
    type: String
  },
  price: {
    type: Number,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Product = mongoose.model('Product', productSchema);
export default Product;