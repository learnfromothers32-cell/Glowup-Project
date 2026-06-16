import { Request, Response } from 'express';
import { Availability } from '../models/Availability';
import { Stylist } from '../models/Stylist';
import { asyncHandler } from '../middleware/asyncHandler';
import { ApiError } from '../utils/apiError';
import { sendSuccess } from '../utils/apiResponse';

export const getMyAvailability = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findOne({ userId: req.user?.id });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  let availability = await Availability.findOne({ stylistId: stylist.id });
  if (!availability) {
    availability = await Availability.create({ stylistId: stylist.id });
  }

  return sendSuccess(res, { availability });
});

export const updateAvailability = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findOne({ userId: req.user?.id });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const { schedule, timezone, bufferMinutes, dateOverrides } = req.body;

  let availability = await Availability.findOne({ stylistId: stylist.id });
  if (!availability) {
    availability = new Availability({ stylistId: stylist.id });
  }

  if (schedule) availability.schedule = schedule;
  if (timezone) availability.timezone = timezone;
  if (bufferMinutes !== undefined) availability.bufferMinutes = bufferMinutes;
  if (dateOverrides) availability.dateOverrides = dateOverrides;

  await availability.save();
  return sendSuccess(res, { availability }, 'Availability updated');
});
