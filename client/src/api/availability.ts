import api from './axios';

export interface DaySchedule {
  enabled: boolean;
  start: string;
  end: string;
  breaks: { start: string; end: string }[];
}

export interface AvailabilityData {
  schedule: Record<string, DaySchedule>;
  timezone: string;
  bufferMinutes: number;
  dateOverrides: { date: string; available: boolean; start?: string; end?: string }[];
}

export const getMyAvailability = async () => {
  const { data } = await api.get('/availability');
  return data.data.availability;
};

export const updateMyAvailability = async (payload: Partial<AvailabilityData>) => {
  const { data } = await api.put('/availability', payload);
  return data.data.availability;
};
