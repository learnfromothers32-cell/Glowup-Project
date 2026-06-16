import api from './axios';

export interface Area {
  _id: string;
  name: string;
  lat: number;
  lng: number;
  tag: string;
  city: string;
  region: string;
  order: number;
}

export const getAreas = async (city?: string): Promise<Area[]> => {
  const { data } = await api.get('/areas', { params: city ? { city } : {} });
  return data.data.areas;
};

export const getCities = async (): Promise<string[]> => {
  const { data } = await api.get('/areas/cities');
  return data.data;
};
