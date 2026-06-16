import { Request, Response } from 'express';
import { PromoCode, GiftCard } from '../models/PromoCode';
import { Stylist } from '../models/Stylist';
import { asyncHandler } from '../middleware/asyncHandler';
import { ApiError } from '../utils/apiError';
import { sendSuccess } from '../utils/apiResponse';
import crypto from 'crypto';

// ─── Promo Codes ───

export const getMyPromoCodes = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findOne({ userId: req.user?.id });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const promos = await PromoCode.find({ stylistId: stylist.id }).sort({ createdAt: -1 });
  return sendSuccess(res, { promos });
});

export const createPromoCode = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findOne({ userId: req.user?.id });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const { code, description, discountType, discountValue, minBookingValue, maxUses, maxUsesPerClient, applicableServices, startsAt, expiresAt } = req.body;
  if (!code || !discountType || discountValue === undefined) {
    throw new ApiError(400, 'Code, discount type, and discount value are required');
  }

  const existing = await PromoCode.findOne({ stylistId: stylist.id, code: code.toUpperCase() });
  if (existing) throw new ApiError(409, 'A promo code with this code already exists');

  const promo = await PromoCode.create({
    stylistId: stylist.id, code: code.toUpperCase(), description,
    discountType, discountValue, minBookingValue: minBookingValue || 0,
    maxUses: maxUses || 0, maxUsesPerClient: maxUsesPerClient || 1,
    applicableServices: applicableServices || [],
    startsAt: startsAt || new Date(), expiresAt: expiresAt || null
  });

  return sendSuccess(res, { promo }, 'Promo code created', 201);
});

export const updatePromoCode = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findOne({ userId: req.user?.id });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const promo = await PromoCode.findOne({ _id: req.params.id, stylistId: stylist.id });
  if (!promo) throw new ApiError(404, 'Promo code not found');

  const { description, discountType, discountValue, minBookingValue, maxUses, maxUsesPerClient, applicableServices, startsAt, expiresAt, isActive } = req.body;
  if (description !== undefined) promo.description = description;
  if (discountType !== undefined) promo.discountType = discountType;
  if (discountValue !== undefined) promo.discountValue = discountValue;
  if (minBookingValue !== undefined) promo.minBookingValue = minBookingValue;
  if (maxUses !== undefined) promo.maxUses = maxUses;
  if (maxUsesPerClient !== undefined) promo.maxUsesPerClient = maxUsesPerClient;
  if (applicableServices !== undefined) promo.applicableServices = applicableServices;
  if (startsAt !== undefined) promo.startsAt = startsAt;
  if (expiresAt !== undefined) promo.expiresAt = expiresAt;
  if (isActive !== undefined) promo.isActive = isActive;

  await promo.save();
  return sendSuccess(res, { promo }, 'Promo code updated');
});

export const deletePromoCode = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findOne({ userId: req.user?.id });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const promo = await PromoCode.findOneAndDelete({ _id: req.params.id, stylistId: stylist.id });
  if (!promo) throw new ApiError(404, 'Promo code not found');

  return sendSuccess(res, null, 'Promo code deleted');
});

// ─── Gift Cards ───

export const getMyGiftCards = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findOne({ userId: req.user?.id });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const giftCards = await GiftCard.find({ stylistId: stylist.id })
    .populate('purchasedBy', 'name email')
    .populate('claimedBy', 'name email')
    .sort({ createdAt: -1 });

  return sendSuccess(res, { giftCards });
});

export const createGiftCard = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findOne({ userId: req.user?.id });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const { initialBalance, senderName, recipientEmail, message, expiresAt } = req.body;
  if (!initialBalance || initialBalance <= 0) {
    throw new ApiError(400, 'Valid initial balance is required');
  }

  const code = `GIFT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  const giftCard = await GiftCard.create({
    stylistId: stylist.id, code, initialBalance, remainingBalance: initialBalance,
    senderName: senderName || '', recipientEmail: recipientEmail || '',
    message: message || '', purchasedBy: req.user?.id,
    expiresAt: expiresAt || null
  });

  return sendSuccess(res, { giftCard }, 'Gift card created', 201);
});
