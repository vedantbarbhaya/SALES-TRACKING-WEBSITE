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