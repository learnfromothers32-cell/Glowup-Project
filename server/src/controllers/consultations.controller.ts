import { Request, Response } from 'express';
import { ConsultationForm, ConsultationResponse } from '../models/Waitlist';
import { Stylist } from '../models/Stylist';
import { asyncHandler } from '../middleware/asyncHandler';
import { ApiError } from '../utils/apiError';
import { sendSuccess } from '../utils/apiResponse';

export const getMyForms = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findOne({ userId: req.user?.id });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const forms = await ConsultationForm.find({ stylistId: stylist.id }).sort({ createdAt: -1 });
  return sendSuccess(res, { forms });
});

export const createForm = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findOne({ userId: req.user?.id });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const { name, description, questions } = req.body;
  if (!name) throw new ApiError(400, 'Form name is required');

  const form = await ConsultationForm.create({
    stylistId: stylist.id, name, description: description || '',
    questions: questions || []
  });

  return sendSuccess(res, { form }, 'Form created', 201);
});

export const updateForm = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findOne({ userId: req.user?.id });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const form = await ConsultationForm.findOne({ _id: req.params.id, stylistId: stylist.id });
  if (!form) throw new ApiError(404, 'Form not found');

  const { name, description, questions, isActive } = req.body;
  if (name !== undefined) form.name = name;
  if (description !== undefined) form.description = description;
  if (questions !== undefined) form.questions = questions;
  if (isActive !== undefined) form.isActive = isActive;

  await form.save();
  return sendSuccess(res, { form }, 'Form updated');
});

export const deleteForm = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findOne({ userId: req.user?.id });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const form = await ConsultationForm.findOneAndDelete({ _id: req.params.id, stylistId: stylist.id });
  if (!form) throw new ApiError(404, 'Form not found');

  return sendSuccess(res, null, 'Form deleted');
});

export const submitFormResponse = asyncHandler(async (req: Request, res: Response) => {
  const { formId } = req.params;
  const { answers, bookingId } = req.body;
  const clientId = req.user?.id;

  const form = await ConsultationForm.findById(formId);
  if (!form) throw new ApiError(404, 'Form not found');
  if (!form.isActive) throw new ApiError(400, 'This form is no longer active');

  const existing = await ConsultationResponse.findOne({ formId, clientId });
  if (existing) throw new ApiError(409, 'You have already submitted this form');

  const response = await ConsultationResponse.create({
    formId,
    stylistId: form.stylistId,
    clientId,
    bookingId: bookingId || undefined,
    answers: answers || []
  });

  return sendSuccess(res, { response }, 'Form submitted', 201);
});

export const getFormResponses = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findOne({ userId: req.user?.id });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const { formId } = req.params;
  const form = await ConsultationForm.findOne({ _id: formId, stylistId: stylist.id });
  if (!form) throw new ApiError(404, 'Form not found');

  const responses = await ConsultationResponse.find({ formId, stylistId: stylist.id })
    .populate('clientId', 'name email avatar')
    .sort({ createdAt: -1 });

  return sendSuccess(res, { form, responses });
});
