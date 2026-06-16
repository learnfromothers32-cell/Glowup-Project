import api from './axios';

export const getMyPosTransactions = async (params?: { status?: string; paymentMethod?: string }) => {
  const { data } = await api.get('/pos', { params });
  return data.data.transactions;
};

export const createPosTransaction = async (payload: {
  clientName: string;
  clientId?: string;
  items: { type: string; itemId: string; name: string; quantity: number; unitPrice: number }[];
  discount?: number;
  paymentMethod?: string;
  paymentRef?: string;
  notes?: string;
}) => {
  const { data } = await api.post('/pos', payload);
  return data.data.transaction;
};

export const voidPosTransaction = async (id: string) => {
  const { data } = await api.patch(`/pos/${id}/void`);
  return data.data.transaction;
};
