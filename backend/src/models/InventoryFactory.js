import mongoose from 'mongoose';
import StoreInventoryMap from './StoreInventoryMap.js';

// Create a base schema definition that all inventory collections will use
const inventorySchemaDefinition = {
  itemCode: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  variantName: {
    type: String,
    default: '',
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  quantity: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
};

const schemaOptions = {
  timestamps: true
};

// Factory function to create a model for a specific collection
const createInventoryModel = (modelName, collectionName) => {
  // Check if the model already exists to prevent duplicate model error
  if (mongoose.models[modelName]) {
    return mongoose.model(modelName);
  }
  
  // Create a new schema
  const schema = new mongoose.Schema(inventorySchemaDefinition, schemaOptions);
  
  // Add the compound index
  schema.index({ itemCode: 1, variantName: 1 }, { unique: true });
  
  // Create and return the model
  return mongoose.model(modelName, schema, collectionName);
};

// Get inventory model for a specific store
const getInventoryModelForStore = async (storeId) => {
  try {
    // Find the mapping for this store
    const mapping = await StoreInventoryMap.findOne({ store: storeId });
    
    if (!mapping) {
      throw new Error(`No inventory mapping found for store ID: ${storeId}`);
    }
    
    // Create model name from collection name (e.g., INV_KR1 -> InventoryKR1)
    const modelName = `Inventory${mapping.inventoryCollection.replace('INV_', '')}`;
    
    // Create and return the model
    return createInventoryModel(modelName, mapping.inventoryCollection);
  } catch (error) {
    console.error('Error getting inventory model:', error);
    throw error;
  }
};

// Reduce inventory quantities based on a sale
const reduceInventoryFromSale = async (sale) => {
  try {
    if (!sale.store) {
      throw new Error('Sale must have a store ID');
    }

    // Get the inventory model for this store
    const InventoryModel = await getInventoryModelForStore(sale.store);
    
    // Track results of inventory updates
    const results = {
      successful: [],
      failed: []
    };

    // Process each item in the sale
    for (const item of sale.items) {
      try {
        // Find the product to get its details
        const product = await mongoose.model('Product').findById(item.product);
        
        if (!product) {
          throw new Error(`Product not found: ${item.product}`);
        }

        // Find the inventory item
        const inventoryItem = await InventoryModel.findOne({
          itemCode: product.itemCode,
          variantName: product.variantName || ''
        });

        if (!inventoryItem) {
          throw new Error(`Inventory item not found for product: ${product.itemCode} (${product.variantName || 'no variant'})`);
        }

        // Ensure there's enough inventory
        if (inventoryItem.quantity < item.quantity) {
          throw new Error(`Insufficient inventory for ${product.name} (${product.variantName || 'no variant'}). Available: ${inventoryItem.quantity}, Requested: ${item.quantity}`);
        }

        // Update the inventory quantity
        inventoryItem.quantity -= item.quantity;
        await inventoryItem.save();

        results.successful.push({
          itemCode: product.itemCode,
          variantName: product.variantName || '',
          quantityReduced: item.quantity,
          newQuantity: inventoryItem.quantity
        });
      } catch (error) {
        results.failed.push({
          product: item.product,
          quantity: item.quantity,
          error: error.message
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error reducing inventory:', error);
    throw error;
  }
};

// Create default models - these would typically be created dynamically based on store mappings
const Inventory = createInventoryModel('Inventory', 'INV_KR1');

// Export the models and the factory functions
export {
  Inventory as default,
  Inventory,
  createInventoryModel,
  getInventoryModelForStore,
  reduceInventoryFromSale
};