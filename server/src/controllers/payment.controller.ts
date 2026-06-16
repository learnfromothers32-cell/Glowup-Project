import crypto from 'crypto';
import { Request, Response } from 'express';
import Paystack from 'paystack-sdk';
import { Booking } from '../models/Booking';
import { Transaction } from '../models/Transaction';
import { Stylist } from '../models/Stylist';
import { asyncHandler } from '../middleware/asyncHandler';
import { ApiError } from '../utils/apiError';
import { sendSuccess } from '../utils/apiResponse';
import { isProduction, appConfig } from '../config/app';
import logger from '../utils/logger';

const paystackSecret = appConfig.paystackSecretKey;
const paystack = new Paystack(paystackSecret);

const PLATFORM_FEE_PERCENT = 0.13;

export const initializePayment = asyncHandler(async (req: Request, res: Response) => {
  const { bookingId, paymentMethod } = req.body;
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
  const method: 'card' | 'mobile-money' | 'cash' = paymentMethod || 'card';

  if (!paystackSecret) {
    if (isProduction) {
      throw new ApiError(503, 'Payment service is not configured');
    }
    // Dev mode — simulate successful payment initialization
    const devRef = `DEV-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
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
      paymentRef: devRef,
      paymentMethod: method,
    });
    booking.paymentId = devRef;
    await booking.save();
    return sendSuccess(res, {
      authorization_url: null,
      access_code: null,
      reference: devRef,
    });
  }

  let paymentData: any;
  try {
    paymentData = await (paystack.transaction.initialize as any)({
      email: (user as any).email || 'customer@example.com',
      amount: String(amountInKobo),
      currency: 'GHS',
      callback_url: `${appConfig.clientUrl}/payment/callback`,
      metadata: {
        bookingId: booking.id,
        clientId: booking.clientId.toString(),
        stylistId: booking.stylistId.toString(),
        paymentMethod: method,
        platform_fee: platformFee,
      },
    });
  } catch (error) {
    logger.error('Payment initialization failed', { error: (error as Error).message });
    throw new ApiError(503, 'Payment service is temporarily unavailable');
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
    paymentMethod: method,
  });

  booking.paymentId = paymentData.data.reference;
  await booking.save();

  return sendSuccess(res, {
    authorization_url: paymentData.data.authorization_url,
    access_code: paymentData.data.access_code || null,
    reference: paymentData.data.reference,
  });
});

export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  const { reference } = req.params;

  let verification: any;
  try {
    verification = await (paystack.transaction.verify as any)(reference);
  } catch (error) {
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
  if (!paystackSecret) {
    logger.warn('Paystack webhook received but PAYSTACK_SECRET_KEY is not configured');
    return res.status(200).json({ status: 'ok' });
  }

  const signature = req.headers['x-paystack-signature'] as string;
  if (!signature) {
    return res.status(401).json({ status: 'unauthorized' });
  }
  const hash = crypto
    .createHmac('sha512', paystackSecret)
    .update(JSON.stringify(req.body))
    .digest('hex');
  if (hash !== signature) {
    return res.status(401).json({ status: 'invalid signature' });
  }

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

export const chargeCard = asyncHandler(async (req: Request, res: Response) => {
  const { bookingId, token, cardInfo } = req.body;
  const clientId = req.user?.id;

  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.clientId.toString() !== clientId) throw new ApiError(403, 'You can only pay for your own bookings');
  if (booking.paymentStatus === 'paid') throw new ApiError(400, 'This booking has already been paid');

  const amount = booking.totalPrice;
  const platformFee = Math.round(amount * PLATFORM_FEE_PERCENT);
  const stylistPayout = amount - platformFee;

  if (!paystackSecret) {
    if (isProduction) throw new ApiError(503, 'Payment service is not configured');
    const devRef = `DEV-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    await Transaction.create({
      bookingId: booking.id,
      clientId: booking.clientId,
      stylistId: booking.stylistId,
      amount,
      platformFee,
      stylistPayout,
      currency: 'GHS',
      status: 'paid',
      paymentProvider: 'paystack',
      paymentRef: devRef,
      paymentMethod: 'card',
      paymentDetails: cardInfo || {},
    });
    booking.paymentId = devRef;
    booking.paymentStatus = 'paid';
    await booking.save();
    return sendSuccess(res, { status: 'paid', reference: devRef });
  }

  const amountInKobo = amount * 100;
  let chargeResult: any;
  try {
    chargeResult = await (paystack as any).transaction.charge({
      token,
      email: (req.user as any).email || 'customer@example.com',
      amount: String(amountInKobo),
      currency: 'GHS',
      metadata: {
        bookingId: booking.id,
        clientId: booking.clientId.toString(),
        stylistId: booking.stylistId.toString(),
      },
    });
  } catch (error) {
    logger.error('Card charge failed', { error: (error as Error).message });
    throw new ApiError(503, 'Payment processing failed. Please try again.');
  }

  if (chargeResult.data.status === 'success') {
    await Transaction.create({
      bookingId: booking.id,
      clientId: booking.clientId,
      stylistId: booking.stylistId,
      amount,
      platformFee,
      stylistPayout,
      currency: 'GHS',
      status: 'paid',
      paymentProvider: 'paystack',
      paymentRef: chargeResult.data.reference,
      paymentMethod: 'card',
      paymentDetails: { ...cardInfo, authorization: chargeResult.data.authorization },
    });
    booking.paymentId = chargeResult.data.reference;
    booking.paymentStatus = 'paid';
    await booking.save();
    return sendSuccess(res, { status: 'paid', reference: chargeResult.data.reference });
  }

  await Transaction.create({
    bookingId: booking.id,
    clientId: booking.clientId,
    stylistId: booking.stylistId,
    amount,
    platformFee,
    stylistPayout,
    currency: 'GHS',
    status: 'failed',
    paymentProvider: 'paystack',
    paymentRef: chargeResult.data.reference || 'FAILED',
    paymentMethod: 'card',
    paymentDetails: { gateway_response: chargeResult.data.gateway_response },
  });

  throw new ApiError(
    402,
    `Payment failed: ${chargeResult.data.gateway_response || 'Transaction declined'}`,
  );
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
      paymentMethod: transaction.paymentMethod,
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
