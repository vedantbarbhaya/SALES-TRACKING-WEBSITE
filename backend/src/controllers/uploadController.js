// controllers/uploadController.js
import asyncHandler from 'express-async-handler';
import XLSX from 'xlsx';
import Product from '../models/Product.js';
import Store from '../models/Store.js';
import User from '../models/User.js';

export const uploadExcelData = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  const { model } = req.body;
  const workbook = XLSX.read(req.file.buffer);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet);

  let result;
  switch (model) {
    case 'products':
      result = await Product.insertMany(data);
      break;
    case 'stores':
      result = await Store.insertMany(data);
      break;
    case 'users':
      // Hash passwords before inserting
      const usersWithHashedPasswords = await Promise.all(
        data.map(async (user) => ({
          ...user,
          password: await bcrypt.hash(user.password, 10)
        }))
      );
      result = await User.insertMany(usersWithHashedPasswords);
      break;
    default:
      res.status(400);
      throw new Error('Invalid model type');
  }

  res.status(201).json({
    message: `Successfully imported ${result.length} records`,
    count: result.length
  });
});