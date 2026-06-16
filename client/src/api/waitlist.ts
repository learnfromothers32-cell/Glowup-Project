import api from './axios';

export const getMyWaitlist = async (status?: string) => {
  const { data } = await api.get('/waitlist', { params: { status } });
  return data.data.entries;
};

export const notifyWaitlistEntry = async (id: string) => {
  const { data } = await api.post(`/waitlist/${id}/notify`);
  return data.data.entry;
};

export const removeWaitlistEntry = async (id: string) => {
  await api.delete(`/waitlist/${id}`);
};

export const joinWaitlist = async (payload: { stylistId: string; serviceId: string; preferredDate: string; preferredTime?: string; notes?: string }) => {
  const { data } = await api.post('/waitlist', payload);
  return data.data.entry;
};
