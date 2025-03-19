import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema({
  store_id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  contactNumber: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Store = mongoose.model('Store', storeSchema);
export default Store;
