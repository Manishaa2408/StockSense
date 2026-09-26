const API_BASE = '/api/v1';

async function request(endpoint, options = {}, role = 'ADMIN') {
  const headers = {
    'Content-Type': 'application/json',
    'X-User-Role': role,
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText || response.statusText}`);
  }

  return response.json();
}

export const api = {
  getSummary: (role = 'ADMIN', params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.warehouse_id) searchParams.append('warehouse_id', params.warehouse_id);
    if (params.category_id) searchParams.append('category_id', params.category_id);
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request(`/dashboard/summary${qs}`, {}, role);
  },

  getInventory: (role = 'ADMIN', params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.warehouse_id) searchParams.append('warehouse_id', params.warehouse_id);
    if (params.category_id) searchParams.append('category_id', params.category_id);
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request(`/dashboard/inventory${qs}`, {}, role);
  },

  getWarehouses: (role = 'ADMIN', warehouse_id = null) => {
    const qs = warehouse_id ? `?warehouse_id=${warehouse_id}` : '';
    return request(`/dashboard/warehouses${qs}`, {}, role);
  },

  getMovements: (period = '30d', warehouse_id = null) => {
    const searchParams = new URLSearchParams({ period });
    if (warehouse_id) searchParams.append('warehouse_id', warehouse_id);
    return request(`/dashboard/movements?${searchParams.toString()}`);
  },

  getLowStock: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.warehouse_id) searchParams.append('warehouse_id', params.warehouse_id);
    if (params.category_id) searchParams.append('category_id', params.category_id);
    if (params.status) searchParams.append('status', params.status);
    if (params.limit) searchParams.append('limit', params.limit);
    if (params.offset) searchParams.append('offset', params.offset);
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request(`/dashboard/low-stock${qs}`);
  },

  getActivity: (role = 'ADMIN', warehouse_id = null, limit = 15) => {
    const searchParams = new URLSearchParams({ limit });
    if (warehouse_id) searchParams.append('warehouse_id', warehouse_id);
    return request(`/dashboard/activity?${searchParams.toString()}`, {}, role);
  },

  getCategories: (warehouse_id = null) => {
    const qs = warehouse_id ? `?warehouse_id=${warehouse_id}` : '';
    return request(`/dashboard/categories${qs}`);
  },

  getFilterOptions: () => {
    return request('/filters/options');
  },

  getRoleContext: (role = 'ADMIN') => {
    return request('/dashboard/role-context', {}, role);
  },

  getExportUrl: (type = 'inventory', warehouse_id = null) => {
    const searchParams = new URLSearchParams({ type });
    if (warehouse_id) searchParams.append('warehouse_id', warehouse_id);
    return `${API_BASE}/dashboard/export?${searchParams.toString()}`;
  },

  // -------------------------------------------------------------
  // Suppliers & Vendors API
  // -------------------------------------------------------------
  getSuppliers: (role = 'ADMIN', params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page);
    if (params.limit) searchParams.append('limit', params.limit);
    if (params.search) searchParams.append('search', params.search);
    if (params.status) searchParams.append('status', params.status);
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request(`/suppliers${qs}`, {}, role);
  },

  getSupplier: (role = 'ADMIN', id) => {
    return request(`/suppliers/${id}`, {}, role);
  },

  createSupplier: (role = 'ADMIN', data) => {
    return request('/suppliers', {
      method: 'POST',
      body: JSON.stringify(data)
    }, role);
  },

  updateSupplier: (role = 'ADMIN', id, data) => {
    return request(`/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }, role);
  },

  updateSupplierStatus: (role = 'ADMIN', id, status) => {
    return request(`/suppliers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }, role);
  },

  deleteSupplier: (role = 'ADMIN', id) => {
    return request(`/suppliers/${id}`, {
      method: 'DELETE'
    }, role);
  },

  getSupplierProducts: (role = 'ADMIN', supplierId) => {
    return request(`/suppliers/${supplierId}/products`, {}, role);
  },

  addSupplierProduct: (role = 'ADMIN', supplierId, data) => {
    return request(`/suppliers/${supplierId}/products`, {
      method: 'POST',
      body: JSON.stringify(data)
    }, role);
  },

  updateSupplierProduct: (role = 'ADMIN', supplierId, productId, data) => {
    return request(`/suppliers/${supplierId}/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }, role);
  },

  removeSupplierProduct: (role = 'ADMIN', supplierId, productId) => {
    return request(`/suppliers/${supplierId}/products/${productId}`, {
      method: 'DELETE'
    }, role);
  },

  getProductsLookup: (role = 'ADMIN', search = '') => {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return request(`/suppliers/lookup/products${qs}`, {}, role);
  }
};
