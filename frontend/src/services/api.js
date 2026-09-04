import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

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

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
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
  return response.data;
};
export const addProduct = (productData) => API.post('/products', productData);
export const updateProduct = (id, data) => API.put(`/products/${id}`, data);
export const deleteProduct = (id) => API.delete(`/products/${id}`);

// ORDERS MANAGEMENT
export const getOrders = () => API.get('/orders');
export const addOrder = (orderData) => API.post('/orders', orderData);
export const getOrderDetails = async (id) => {
  const response = await API.get(`/orders/${id}`);
  return response.data;
};
export const updateOrderDetails = (id, formData) => API.put(`/orders/${id}`, formData);
export const getOrderById = (id) => API.get(`/orders/${id}`);
export const deleteOrder = (id) => API.delete(`/orders/${id}`);
export const getDeletedOrders = () => API.get('/orders/deleted');

// CUSTOMERS MANAGEMENT
export const getCustomers = () => API.get('/customers');
export const createCustomer = async (customerData) => {
  const response = await API.post('/customers', customerData);
  return response.data;
};
export const deleteCustomer = (id) => API.delete(`/customers/${id}`);
export const updateCustomer = (id, data) => API.put(`/customers/${id}`, data);
export const getCustomerById = (id) => API.get(`/customers/${id}`);
export const getCustomerDetails = async (id) => {
  const response = await API.get(`/customers/${id}`);
  return response.data;
};

export default API;