// Updated version of src/models/User.js with debugging
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'salesperson'],
    default: 'salesperson'
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  // Only hash the password if it's modified
  if (!this.isModified('password')) {
    return next();
  }
  
  console.log(`Hashing password for user: ${this.email}`);
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    console.log(`Password hashed successfully: ${this.password.substring(0, 15)}...`);
    next();
  } catch (error) {
    console.error(`Error hashing password: ${error.message}`);
    next(error);
  }
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  console.log(`In matchPassword method for user: ${this.email}`);
  console.log(`Comparing entered password with hash: ${this.password.substring(0, 15)}...`);
  
  try {
    const isMatch = await bcrypt.compare(enteredPassword, this.password);
    console.log(`Password match result: ${isMatch}`);
    return isMatch;
  } catch (error) {
    console.error(`Error in matchPassword: ${error.message}`);
    return false;
  }
};

const User = mongoose.model('User', userSchema);
export default User;