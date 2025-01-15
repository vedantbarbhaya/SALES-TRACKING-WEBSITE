export const handleApiError = (error) => {
    if (error.response) {
      // Server responded with error
      return error.response.data.message || 'An error occurred';
    } else if (error.request) {
      // Request made but no response
      return 'Unable to connect to server';
    } else {
      // Error setting up request
      return 'Error making request';
    }
  };

  export const apiHandler = async (apiCall) => {
    try {
      const { data } = await apiCall();
      return data;
    } catch (error) {
      console.error('API Error:', error?.response?.data || error.message);
      // You can add custom error processing here
      // For example, handling specific HTTP status codes
      if (error.response?.status === 401) {
        // Handle unauthorized access
        window.location.href = '/login';
      }
      throw error;
    }
  };