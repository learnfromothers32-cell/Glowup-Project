import { Request, Response } from 'express';
import { StylistSettings } from '../models/StylistSettings';
import { Stylist } from '../models/Stylist';
import { asyncHandler } from '../middleware/asyncHandler';
import { ApiError } from '../utils/apiError';
import { sendSuccess } from '../utils/apiResponse';

export const getMySettings = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findOne({ userId: req.user?.id });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  let settings = await StylistSettings.findOne({ stylistId: stylist.id });
  if (!settings) {
    settings = await StylistSettings.create({ stylistId: stylist.id });
  }

  return sendSuccess(res, { settings });
});

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findOne({ userId: req.user?.id });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const { notifications, privacy, business } = req.body;

  let settings = await StylistSettings.findOne({ stylistId: stylist.id });
  if (!settings) {
    settings = new StylistSettings({ stylistId: stylist.id });
  }

  if (notifications) {
    if (notifications.newBooking !== undefined) settings.notifications.newBooking = notifications.newBooking;
    if (notifications.cancellationAlert !== undefined) settings.notifications.cancellationAlert = notifications.cancellationAlert;
    if (notifications.reviewNotify !== undefined) settings.notifications.reviewNotify = notifications.reviewNotify;
    if (notifications.marketingEmails !== undefined) settings.notifications.marketingEmails = notifications.marketingEmails;
    if (notifications.reminderEmails !== undefined) settings.notifications.reminderEmails = notifications.reminderEmails;
  }

  if (privacy) {
    if (privacy.showInSearch !== undefined) settings.privacy.showInSearch = privacy.showInSearch;
    if (privacy.showEmailToClients !== undefined) settings.privacy.showEmailToClients = privacy.showEmailToClients;
    if (privacy.showPhoneToClients !== undefined) settings.privacy.showPhoneToClients = privacy.showPhoneToClients;
  }

  if (business) {
    if (business.defaultCurrency !== undefined) settings.business.defaultCurrency = business.defaultCurrency;
    if (business.taxRate !== undefined) settings.business.taxRate = business.taxRate;
    if (business.invoicePrefix !== undefined) settings.business.invoicePrefix = business.invoicePrefix;
    if (business.receiptPrefix !== undefined) settings.business.receiptPrefix = business.receiptPrefix;
    if (business.bookingLeadTime !== undefined) settings.business.bookingLeadTime = business.bookingLeadTime;
    if (business.maxFutureBookings !== undefined) settings.business.maxFutureBookings = business.maxFutureBookings;
  }

  await settings.save();
  return sendSuccess(res, { settings }, 'Settings updated');
});
