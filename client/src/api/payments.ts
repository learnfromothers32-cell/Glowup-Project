import api from './axios';

export interface InitPaymentResponse {
  success: boolean;
  data: {
    authorization_url: string | null;
    reference: string;
    mock: boolean;
    message?: string;
  };
}

export const initializePayment = async (bookingId: string): Promise<InitPaymentResponse> => {
  const { data } = await api.post<InitPaymentResponse>('/payments/initialize', { bookingId });
  return data;
};

export const verifyPayment = async (reference: string) => {
  const { data } = await api.get(`/payments/verify/${reference}`);
  return data;
};

export const getPaymentStatus = async (bookingId: string) => {
  const { data } = await api.get(`/payments/status/${bookingId}`);
  return data;
};

export const getMyTransactions = async () => {
  const { data } = await api.get('/payments/transactions');
  return data.data.transactions;
};
