import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Box,
  Typography,
  LinearProgress
} from '@mui/material';
import { Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

const ALLOWED_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel'
];

const MODEL_TEMPLATES = {
  products: {
    required: ['itemCode', 'name', 'price'],
    optional: ['description', 'category', 'isActive']
  },
  stores: {
    required: ['name', 'location'],
    optional: ['contactNumber', 'isActive']
  },
  users: {
    required: ['name', 'email', 'password', 'store'],
    optional: ['role']
  }
};

const ExcelUploadModal = ({ open, onClose }) => {
  const [selectedModel, setSelectedModel] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationResults, setValidationResults] = useState(null);

  const validateExcelData = (data, modelType) => {
    const template = MODEL_TEMPLATES[modelType];
    const missingColumns = [];
    const invalidRows = [];

    // Check for required columns
    template.required.forEach(column => {
      if (!data[0].hasOwnProperty(column)) {
        missingColumns.push(column);
      }
    });

    if (missingColumns.length > 0) {
      return {
        valid: false,
        error: `Missing required columns: ${missingColumns.join(', ')}`
      };
    }

    // Validate each row
    data.forEach((row, index) => {
      const rowErrors = [];
      template.required.forEach(column => {
        if (!row[column]) {
          rowErrors.push(`Missing ${column}`);
        }
      });

      if (rowErrors.length > 0) {
        invalidRows.push({
          rowIndex: index + 1,
          errors: rowErrors
        });
      }
    });

    return {
      valid: invalidRows.length === 0,
      invalidRows
    };
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Please upload only Excel files (.xlsx or .xls)');
      return;
    }

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        setError('The Excel file is empty');
        return;
      }

      const validation = validateExcelData(jsonData, selectedModel);
      if (!validation.valid) {
        setValidationResults(validation);
        return;
      }

      setFile(file);
      setValidationResults(null);
      setError('');
    } catch (err) {
      setError('Error reading Excel file');
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedModel) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('model', selectedModel);

    try {
      setLoading(true);
      const response = await fetch('/api/upload/excel', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      // Handle success
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Upload Excel Data</DialogTitle>
      <DialogContent>
        <Box sx={{ my: 2 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Select Data Type</InputLabel>
            <Select
              value={selectedModel}
              label="Select Data Type"
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              <MenuItem value="products">Products</MenuItem>
              <MenuItem value="stores">Stores</MenuItem>
              <MenuItem value="users">Users</MenuItem>
            </Select>
          </FormControl>

          {selectedModel && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Required columns:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {MODEL_TEMPLATES[selectedModel].required.join(', ')}
              </Typography>
            </Box>
          )}

          <Button
            variant="outlined"
            component="label"
            startIcon={<Upload />}
            disabled={!selectedModel}
            fullWidth
          >
            Choose Excel File
            <input
              type="file"
              hidden
              accept=".xlsx,.xls"
              onChange={handleFileChange}
            />
          </Button>

          {file && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Selected file: {file.name}
            </Typography>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {validationResults && !validationResults.valid && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {validationResults.error || `Invalid data in ${validationResults.invalidRows.length} rows`}
            </Alert>
          )}

          {loading && <LinearProgress sx={{ mt: 2 }} />}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleUpload} 
          variant="contained" 
          disabled={!file || loading || (validationResults && !validationResults.valid)}
        >
          Upload
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export { ExcelUploadModal as default };