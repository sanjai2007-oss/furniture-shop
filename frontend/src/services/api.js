import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    return res.data;
  },
  register: async (userData) => {
    const res = await api.post('/api/auth/register', userData);
    return res.data;
  },
  getCurrentUser: async () => {
    const res = await api.get('/api/auth/me');
    return res.data;
  },
};

export const productsService = {
  getProducts: async (params = {}) => {
    const res = await api.get('/api/products', { params });
    return res.data;
  },
  getProduct: async (id) => {
    const res = await api.get(`/api/products/${id}`);
    return res.data;
  },
  createProduct: async (productData) => {
    const res = await api.post('/api/products', productData);
    return res.data;
  },
  updateProduct: async (id, productData) => {
    const res = await api.put(`/api/products/${id}`, productData);
    return res.data;
  },
  updateStock: async (id, stockData) => {
    const res = await api.put(`/api/products/${id}/stock`, stockData);
    return res.data;
  },
  deleteProduct: async (id) => {
    const res = await api.delete(`/api/products/${id}`);
    return res.data;
  },
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/api/products/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
};

export const categoriesService = {
  getCategories: async () => {
    const res = await api.get('/api/categories');
    return res.data;
  },
  createCategory: async (categoryData) => {
    const res = await api.post('/api/categories', categoryData);
    return res.data;
  },
  updateCategory: async (id, categoryData) => {
    const res = await api.put(`/api/categories/${id}`, categoryData);
    return res.data;
  },
  deleteCategory: async (id) => {
    const res = await api.delete(`/api/categories/${id}`);
    return res.data;
  },
};

export const ordersService = {
  getOrders: async (params = {}) => {
    const res = await api.get('/api/orders', { params });
    return res.data;
  },
  getOrder: async (id) => {
    const res = await api.get(`/api/orders/${id}`);
    return res.data;
  },
  createOrder: async (orderData) => {
    const res = await api.post('/api/orders', orderData);
    return res.data;
  },
  updateOrderStatus: async (id, statusData) => {
    const res = await api.put(`/api/orders/${id}/status`, statusData);
    return res.data;
  },
  deleteOrder: async (id) => {
    const res = await api.delete(`/api/orders/${id}`);
    return res.data;
  },
};

export const inventoryService = {
  getSummary: async () => {
    const res = await api.get('/api/inventory/summary');
    return res.data;
  },
  getProducts: async (params = {}) => {
    const res = await api.get('/api/inventory', { params });
    return res.data;
  },
  getLowStock: async () => {
    const res = await api.get('/api/inventory/low-stock');
    return res.data;
  },
  getOutOfStock: async () => {
    const res = await api.get('/api/inventory/out-of-stock');
    return res.data;
  },
  getTransactions: async (params = {}) => {
    const res = await api.get('/api/inventory/transactions', { params });
    return res.data;
  },
  adjustStock: async (productId, adjustData) => {
    const res = await api.put(`/api/inventory/${productId}`, adjustData);
    return res.data;
  },
};

export const customersService = {
  getCustomers: async (params = {}) => {
    const res = await api.get('/api/customers', { params });
    return res.data;
  },
  getCustomer: async (id) => {
    const res = await api.get(`/api/customers/${id}`);
    return res.data;
  },
  createCustomer: async (customerData) => {
    const res = await api.post('/api/customers', customerData);
    return res.data;
  },
  updateCustomer: async (id, customerData) => {
    const res = await api.put(`/api/customers/${id}`, customerData);
    return res.data;
  },
  deleteCustomer: async (id) => {
    const res = await api.delete(`/api/customers/${id}`);
    return res.data;
  },
};

export const suppliersService = {
  getSuppliers: async (params = {}) => {
    const res = await api.get('/api/suppliers', { params });
    return res.data;
  },
  getSupplier: async (id) => {
    const res = await api.get(`/api/suppliers/${id}`);
    return res.data;
  },
  createSupplier: async (supplierData) => {
    const res = await api.post('/api/suppliers', supplierData);
    return res.data;
  },
  updateSupplier: async (id, supplierData) => {
    const res = await api.put(`/api/suppliers/${id}`, supplierData);
    return res.data;
  },
  deleteSupplier: async (id) => {
    const res = await api.delete(`/api/suppliers/${id}`);
    return res.data;
  },
};

export const salesService = {
  getSales: async (params = {}) => {
    const res = await api.get('/api/sales', { params });
    return res.data;
  },
  getSummary: async () => {
    const res = await api.get('/api/sales/summary');
    return res.data;
  },
  getMonthlyTrend: async () => {
    const res = await api.get('/api/sales/monthly');
    return res.data;
  },
  getByCategory: async () => {
    const res = await api.get('/api/sales/by-category');
    return res.data;
  },
};

export const dashboardService = {
  getSummary: async () => {
    const res = await api.get('/api/dashboard/summary');
    return res.data;
  },
  getSalesChart: async (period = 'this_week') => {
    const res = await api.get('/api/dashboard/sales', { params: { period } });
    return res.data;
  },
  getTopProducts: async (limit = 5) => {
    const res = await api.get('/api/dashboard/top-products', { params: { limit } });
    return res.data;
  },
  getLowStock: async () => {
    const res = await api.get('/api/dashboard/low-stock');
    return res.data;
  },
};

export const reportsService = {
  getSummary: async () => {
    const res = await api.get('/api/reports/summary');
    return res.data;
  },
  getPdfExportUrl: () => `${API_BASE_URL}/api/reports/export/pdf`,
  getExcelExportUrl: () => `${API_BASE_URL}/api/reports/export/excel`,
};

export default api;
