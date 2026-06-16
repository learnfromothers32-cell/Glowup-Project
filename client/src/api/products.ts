import api from './axios';

export const getStylistProducts = async (stylistId: string) => {
  const { data } = await api.get(`/products/stylist/${stylistId}`);
  return data.data.products;
};

export const getMyProducts = async (params?: { category?: string; search?: string; lowStock?: string }) => {
  const { data } = await api.get('/products', { params });
  return data.data.products;
};

export const createProduct = async (payload: any) => {
  const { data } = await api.post('/products', payload);
  return data.data.product;
};

export const updateProduct = async (id: string, payload: any) => {
  const { data } = await api.put(`/products/${id}`, payload);
  return data.data.product;
};

export const deleteProduct = async (id: string) => {
  await api.delete(`/products/${id}`);
};

export const adjustProductStock = async (id: string, quantity: number, operation: 'add' | 'remove' | 'set') => {
  const { data } = await api.patch(`/products/${id}/stock`, { quantity, operation });
  return data.data.product;
};
