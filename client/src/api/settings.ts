import api from './axios';

export const getMyStylistSettings = async () => {
  const { data } = await api.get('/settings');
  return data.data.settings;
};

export const updateMyStylistSettings = async (payload: any) => {
  const { data } = await api.put('/settings', payload);
  return data.data.settings;
};
