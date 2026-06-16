import api from './axios';

export const getStylistPackages = async (stylistId: string) => {
  const { data } = await api.get(`/packages/stylist/${stylistId}`);
  return data.data.packages;
};

export const getMyPackages = async () => {
  const { data } = await api.get('/packages');
  return data.data.packages;
};

export const createPackage = async (payload: any) => {
  const { data } = await api.post('/packages', payload);
  return data.data;
};

export const updatePackage = async (id: string, payload: any) => {
  const { data } = await api.put(`/packages/${id}`, payload);
  return data.data;
};

export const deletePackage = async (id: string) => {
  const { data } = await api.delete(`/packages/${id}`);
  return data;
};

export const getPackagePurchases = async () => {
  const { data } = await api.get('/packages/purchases');
  return data.data.purchases;
};

export const purchasePackage = async (packageId: string) => {
  const { data } = await api.post('/packages/purchase', { packageId });
  return data.data;
};
