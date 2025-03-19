import mongoose from 'mongoose';

const storeInventoryMapSchema = new mongoose.Schema({
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
    unique: true
  },
  inventoryCollection: {
    type: String,
    required: true,
    unique: true
  }
}, {
  timestamps: true
});

// Create the model
const StoreInventoryMap = mongoose.model('StoreInventoryMap', storeInventoryMapSchema);

// Make sure to properly export the model as default
export default StoreInventoryMap;