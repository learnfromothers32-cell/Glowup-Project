import api from './axios';

export interface InitPaymentResponse {
  success: boolean;
  data: {
    authorization_url: string | null;
    access_code: string | null;
    reference: string;
    mock: boolean;
    message?: string;
  };
}

export interface VerifyPaymentResponse {
  success: boolean;
  data: {
    status: string;
    transaction?: any;
  };
}

export const initializePayment = async (
  bookingId: string,
  paymentMethod?: string,
): Promise<InitPaymentResponse> => {
  const { data } = await api.post<InitPaymentResponse>('/payments/initialize', {
    bookingId,
    paymentMethod,
  });
  return data;
};

export const verifyPayment = async (reference: string): Promise<VerifyPaymentResponse> => {
  const { data } = await api.get<VerifyPaymentResponse>(`/payments/verify/${reference}`);
  return data;
};

export const getPaymentStatus = async (bookingId: string) => {
  const { data } = await api.get(`/payments/status/${bookingId}`);
  return data;
};

export const chargeCard = async (payload: {
  bookingId: string;
  token: string;
  cardInfo: { last4: string; brand: string; expMonth: number; expYear: number };
}) => {
  const { data } = await api.post('/payments/charge', payload);
  return data;
};

export const getMyTransactions = async () => {
  const { data } = await api.get('/payments/transactions');
  return data.data.transactions;
};
