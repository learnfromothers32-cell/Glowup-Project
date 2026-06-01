import { Request, Response } from 'express';
import Paystack from 'paystack-sdk';
import { Booking } from '../models/Booking';
import { Transaction } from '../models/Transaction';
import { Stylist } from '../models/Stylist';
import { asyncHandler } from '../middleware/asyncHandler';
import { ApiError } from '../utils/apiError';
import { sendSuccess } from '../utils/apiResponse';

const paystackSecret = process.env.PAYSTACK_SECRET_KEY || '';

const paystack = new Paystack(paystackSecret);

const PLATFORM_FEE_PERCENT = 0.13;

export const initializePayment = asyncHandler(async (req: Request, res: Response) => {
  const { bookingId } = req.body;
  const clientId = req.user?.id;

  const booking = await Booking.findById(bookingId).populate('serviceId');
  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  if (booking.clientId.toString() !== clientId) {
    throw new ApiError(403, 'You can only pay for your own bookings');
  }

  if (booking.paymentStatus === 'paid') {
    throw new ApiError(400, 'This booking has already been paid');
  }

  const amount = booking.totalPrice;
  const platformFee = Math.round(amount * PLATFORM_FEE_PERCENT * 100);
  const amountInKobo = amount * 100;

  const user = req.user;

  let paymentData: any;
  try {
    paymentData = await (paystack.transaction.initialize as any)({
      email: (user as any).email || 'customer@example.com',
      amount: String(amountInKobo),
      currency: 'GHS',
      callback_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment/callback`,
      metadata: {
        bookingId: booking.id,
        clientId: booking.clientId.toString(),
        stylistId: booking.stylistId.toString(),
        platform_fee: platformFee,
      },
    });
  } catch {
    // Paystack not configured — fallback to mock payment
    const mockRef = `MOCK_${Date.now()}`;
    booking.paymentStatus = 'paid';
    booking.paymentId = mockRef;
    await booking.save();

    await Transaction.create({
      bookingId: booking.id,
      clientId: booking.clientId,
      stylistId: booking.stylistId,
      amount,
      platformFee: Math.round(amount * PLATFORM_FEE_PERCENT),
      stylistPayout: Math.round(amount * (1 - PLATFORM_FEE_PERCENT)),
      currency: 'GHS',
      status: 'paid',
      paymentProvider: 'paystack',
      paymentRef: mockRef,
      metadata: { mock: true },
    });

    return sendSuccess(res, {
      authorization_url: null,
      reference: mockRef,
      mock: true,
      message: 'Payment processed in mock mode',
    });
  }

  await Transaction.create({
    bookingId: booking.id,
    clientId: booking.clientId,
    stylistId: booking.stylistId,
    amount,
    platformFee: Math.round(amount * PLATFORM_FEE_PERCENT),
    stylistPayout: Math.round(amount * (1 - PLATFORM_FEE_PERCENT)),
    currency: 'GHS',
    status: 'pending',
    paymentProvider: 'paystack',
    paymentRef: paymentData.data.reference,
  });

  booking.paymentId = paymentData.data.reference;
  await booking.save();

  return sendSuccess(res, {
    authorization_url: paymentData.data.authorization_url,
    reference: paymentData.data.reference,
    mock: false,
  });
});

export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  const { reference } = req.params;

  let verification: any;
  try {
    verification = await (paystack.transaction.verify as any)(reference);
  } catch {
    // Mock fallback
    const transaction = await Transaction.findOne({ paymentRef: reference });
    if (!transaction) {
      throw new ApiError(404, 'Transaction not found');
    }
    return sendSuccess(res, { status: transaction.status, transaction });
  }

  if (verification.data.status === 'success') {
    const transaction = await Transaction.findOne({ paymentRef: reference });
    if (transaction) {
      transaction.status = 'paid';
      await transaction.save();
    }

    const booking = await Booking.findById(transaction?.bookingId);
    if (booking) {
      booking.paymentStatus = 'paid';
      await booking.save();
    }

    return sendSuccess(res, {
      status: 'paid',
      transaction,
    });
  }

  return sendSuccess(res, {
    status: verification.data.status || 'failed',
  });
});

export const paystackWebhook = asyncHandler(async (req: Request, res: Response) => {
  const event = req.body;

  if (event.event === 'charge.success') {
    const { reference } = event.data;
    const transaction = await Transaction.findOne({ paymentRef: reference });
    if (transaction && transaction.status === 'pending') {
      transaction.status = 'paid';
      await transaction.save();

      const booking = await Booking.findById(transaction.bookingId);
      if (booking) {
        booking.paymentStatus = 'paid';
        await booking.save();
      }
    }
  }

  return res.status(200).json({ status: 'ok' });
});

export const getPaymentStatus = asyncHandler(async (req: Request, res: Response) => {
  const { bookingId } = req.params;

  const transaction = await Transaction.findOne({ bookingId })
    .sort({ createdAt: -1 });

  if (!transaction) {
    return sendSuccess(res, { status: 'no_payment', transaction: null });
  }

  return sendSuccess(res, {
    status: transaction.status,
    transaction: {
      id: transaction.id,
      amount: transaction.amount,
      platformFee: transaction.platformFee,
      stylistPayout: transaction.stylistPayout,
      currency: transaction.currency,
      status: transaction.status,
      paymentRef: transaction.paymentRef,
      createdAt: transaction.createdAt,
    },
  });
});

export const getMyTransactions = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const stylist = await Stylist.findOne({ userId });

  let transactions;
  if (stylist) {
    transactions = await Transaction.find({ stylistId: stylist.id })
      .populate('bookingId')
      .sort({ createdAt: -1 });
  } else {
    transactions = await Transaction.find({ clientId: userId })
      .populate('bookingId')
      .sort({ createdAt: -1 });
  }

  return sendSuccess(res, { transactions });
});
