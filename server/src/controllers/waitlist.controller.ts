import { Request, Response } from 'express';
import { WaitlistEntry } from '../models/Waitlist';
import { Stylist } from '../models/Stylist';
import { asyncHandler } from '../middleware/asyncHandler';
import { ApiError } from '../utils/apiError';
import { sendSuccess } from '../utils/apiResponse';

export const createWaitlistEntry = asyncHandler(async (req: Request, res: Response) => {
  const { stylistId, serviceId, preferredDate, preferredTime, notes } = req.body;
  const clientId = req.user?.id;

  if (!stylistId || !serviceId || !preferredDate) {
    throw new ApiError(400, 'Stylist ID, Service ID, and preferred date are required');
  }

  const stylist = await Stylist.findById(stylistId);
  if (!stylist) throw new ApiError(404, 'Stylist not found');

  const entry = await WaitlistEntry.create({
    stylistId,
    clientId,
    serviceId,
    preferredDate: new Date(preferredDate),
    preferredTime: preferredTime || '',
    notes: notes || '',
    status: 'waiting'
  });

  return sendSuccess(res, { entry }, 'Added to waitlist', 201);
});

export const getMyWaitlist = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findOne({ userId: req.user?.id });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const { status } = req.query;
  const filter: any = { stylistId: stylist.id };
  if (status) filter.status = status;

  const entries = await WaitlistEntry.find(filter)
    .populate('clientId', 'name email avatar phone')
    .populate('serviceId', 'name duration price')
    .sort({ createdAt: -1 });

  return sendSuccess(res, { entries });
});

export const notifyWaitlistEntry = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findOne({ userId: req.user?.id });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const entry = await WaitlistEntry.findOne({ _id: req.params.id, stylistId: stylist.id });
  if (!entry) throw new ApiError(404, 'Waitlist entry not found');

  entry.notified = true;
  entry.notifiedAt = new Date();
  entry.status = 'notified';
  await entry.save();

  return sendSuccess(res, { entry }, 'Client notified');
});

export const removeWaitlistEntry = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findOne({ userId: req.user?.id });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const entry = await WaitlistEntry.findOneAndDelete({ _id: req.params.id, stylistId: stylist.id });
  if (!entry) throw new ApiError(404, 'Waitlist entry not found');

  return sendSuccess(res, null, 'Entry removed');
});
