export type BookingStatus =
  | "pending"
  | "confirmed"
  | "in-progress"
  | "completed"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PaymentMethod = "card" | "mobile-money" | "cash";

export interface BookingStylist {
  _id: string;
  name: string;
  image?: string;
  category?: string;
}

export interface BookingService {
  _id: string;
  name: string;
  duration: number;
  price: number;
}

export interface BookingClient {
  _id: string;
  name: string;
  email?: string;
  avatar?: string;
}

export interface Booking {
  _id: string;
  id: string;
  clientId: BookingClient | string;
  stylistId: BookingStylist | string;
  serviceId: BookingService | string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  totalPrice: number;
  notes?: string;
  paymentId?: string;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingData {
  stylistId: string;
  serviceId: string;
  startTime: string;
  notes?: string;
  paymentMethod?: PaymentMethod;
}
