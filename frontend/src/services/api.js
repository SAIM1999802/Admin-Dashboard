import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// REQUEST INTERCEPTOR: Token attach karta hai
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// RESPONSE INTERCEPTOR: Unauthorized access manage karta hai
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      const currentPath = window.location.pathname;

      const isPublicRoute = 
        currentPath === '/market' || 
        currentPath === '/' ||
        currentPath.startsWith('/products/detail/');

      if (!isPublicRoute && currentPath !== '/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// AUTH MANAGEMENT
export const loginApi = (formData) => API.post('/auth/login', formData);
export const signupApi = (formData) => API.post('/auth/signup', formData);
export const updateCredentials = (formData) => API.put('/auth/update-credentials', formData);

// PRODUCTS MANAGEMENT 
export const getProducts = () => API.get('/products');
export const getProductDetails = async (id) => {
  const response = await API.get(`/products/${id}`);
  return response.data?.data || response.data;
};
export const addProduct = (productData) => API.post('/products', productData);
export const updateProduct = (id, data) => API.put(`/products/${id}`, data);
export const deleteProduct = (id) => API.delete(`/products/${id}`);

// PAYMENTS
export const verifyPaymentSession = (sessionId) => API.post('/payment/verify-session', { sessionId });

// ORDERS MANAGEMENT
export const getOrders = () => API.get('/orders');
export const addOrder = (orderData) => API.post('/orders', orderData);
export const getOrderDetails = async (id) => {
  const response = await API.get(`/orders/${id}`);
  return response.data?.data || response.data;
};
export const updateOrderDetails = (id, formData) => API.put(`/orders/${id}`, formData);
export const getOrderById = (id) => API.get(`/orders/${id}`);
export const deleteOrder = (id) => API.delete(`/orders/${id}`);
export const getDeletedOrders = () => API.get('/orders/deleted');

// CUSTOMERS MANAGEMENT
export const getCustomers = () => API.get('/customers');
export const createCustomer = async (customerData) => {
  const response = await API.post('/customers', customerData);
  return response.data?.data || response.data;
};
export const deleteCustomer = (id) => API.delete(`/customers/${id}`);
export const updateCustomer = (id, data) => API.put(`/customers/${id}`, data);
export const getCustomerById = (id) => API.get(`/customers/${id}`);

// 🔴 FIX: 304 Cache Bypass & Unwrapped Response
export const getCustomerDetails = async (id) => {
  const response = await API.get(`/customers/${id}`, {
    params: { _t: Date.now() }, // Browser caching aur 304 avoid karne ke liye timestamp query
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
    }
  });

  // Safe Unwrapping for both { success: true, data: {...} } and direct object formats
  return response.data?.data || response.data;
};

// CATEGORIES MANAGEMENT
export const getCategories = async () => {
  const response = await API.get('/category/get-all');
  return response.data?.data || response.data;
};
export const getCategoryDetails = (id) => API.get(`/category/${id}`);
export const createCategory = (data) => API.post('/category/add', data);
export const updateCategory = (id, data) => API.put(`/category/update/${id}`, data);
export const deleteCategory = (id) => API.delete(`/category/delete/${id}`);

export default API;