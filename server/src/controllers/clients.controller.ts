import { Request, Response } from 'express';
import { Client } from '../models/Client';
import { Stylist } from '../models/Stylist';
import { User } from '../models/User';
import { Booking } from '../models/Booking';
import { asyncHandler } from '../middleware/asyncHandler';
import { ApiError } from '../utils/apiError';
import { sendSuccess } from '../utils/apiResponse';

export const getMyClients = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findOne({ userId: req.user?.id });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const { search, sort } = req.query;

  const filter: any = { stylistId: stylist.id };
  if (search) {
    const users = await User.find({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }).select('_id');
    filter.userId = { $in: users.map(u => u._id) };
  }

  let sortOption: any = { totalVisits: -1 };
  if (sort === 'name') sortOption = { 'user.name': 1 };
  if (sort === 'recent') sortOption = { lastVisit: -1 };
  if (sort === 'spent') sortOption = { totalSpent: -1 };

  const clients = await Client.find(filter)
    .populate('userId', 'name email avatar phone location')
    .sort(sortOption);

  return sendSuccess(res, { clients });
});

export const getClientDetail = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findOne({ userId: req.user?.id });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const client = await Client.findOne({
    _id: req.params.id,
    stylistId: stylist.id
  }).populate('userId', 'name email avatar phone location');

  if (!client) throw new ApiError(404, 'Client not found');

  const bookings = await Booking.find({
    stylistId: stylist.id,
    clientId: client.userId
  })
    .populate('serviceId', 'name price duration')
    .sort({ startTime: -1 })
    .limit(50);

  return sendSuccess(res, { client, bookings });
});

export const updateClient = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findOne({ userId: req.user?.id });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const { tags, notes, favorite, preferences } = req.body;

  const client = await Client.findOneAndUpdate(
    { _id: req.params.id, stylistId: stylist.id },
    {
      ...(tags !== undefined && { tags }),
      ...(notes !== undefined && { notes }),
      ...(favorite !== undefined && { favorite }),
      ...(preferences !== undefined && { preferences })
    },
    { new: true }
  ).populate('userId', 'name email avatar phone location');

  if (!client) throw new ApiError(404, 'Client not found');

  return sendSuccess(res, { client }, 'Client updated');
});
