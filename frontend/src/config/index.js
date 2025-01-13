export const config = {
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
    appName: import.meta.env.VITE_APP_NAME || 'Sales Tracker',
    uploadUrl: import.meta.env.VITE_UPLOAD_URL || 'http://localhost:5001/uploads',
    maxUploadSize: 5 * 1024 * 1024, // 5MB
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/heic']
  };