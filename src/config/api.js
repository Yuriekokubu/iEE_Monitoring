const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  billingDates: `${API_URL}/api/billing-dates`,
  meterExceptions: `${API_URL}/api/meter-exceptions`,
};

export default API_URL;

// Debug
console.log('🔧 API URL:', API_URL);
console.log('🌍 Mode:', import.meta.env.MODE);