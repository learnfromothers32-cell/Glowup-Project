import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { ApiError } from '../utils/apiError';
import { sendSuccess } from '../utils/apiResponse';
import * as hairstyleService from '../services/hairstyle.service';
import { generateHairstylePreview } from '../services/hairstyleGeneration.service';
import { isCloudinaryConfigured, uploadToCloudinary } from '../config/cloudinary';
import { UserCredit } from '../models/UserCredit';
import fs from 'fs';
import logger from '../utils/logger';


export const getAllHairstyles = asyncHandler(async (req: Request, res: Response) => {
  const { category, gender } = req.query;

  const hairstyles = await hairstyleService.getHairstyles({
    category: category as string | undefined,
    gender: gender as string | undefined
  });

  return sendSuccess(res, { hairstyles });
});

export const getHairstyle = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const hairstyle = await hairstyleService.getHairstyleById(id);
  return sendSuccess(res, { hairstyle });
});

export const generateHairstyle = asyncHandler(async (req: Request, res: Response) => {
  const { hairstyleId } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  const imageFile = files?.image?.[0];
  const maskFile = files?.mask?.[0];

  if (!imageFile) {
    throw new ApiError(400, 'Image is required');
  }

  // Ensure credit document exists (safe — runs once per user lifetime)
  let credit = await UserCredit.findOne({ userId });
  if (!credit) {
    await UserCredit.create({ userId, balance: 5, lifetimeCredits: 5, transactions: [{ type: 'bonus', amount: 5, description: 'Welcome bonus – 5 free credits' }] });
  }

  // Atomic credit deduction — no race condition
  const updated = await UserCredit.findOneAndUpdate(
    { userId, balance: { $gte: 1 } },
    {
      $inc: { balance: -1 },
      $push: { transactions: { type: 'usage' as const, amount: -1, description: `Generated hairstyle: ${hairstyleId}`, createdAt: new Date() } }
    },
    { new: true }
  );

  if (!updated) {
    throw new ApiError(402, 'Not enough credits. Please purchase more credits.');
  }

  const hairstyle = await hairstyleService.getHairstyleById(hairstyleId);

  let originalImage: string;

  if (isCloudinaryConfigured) {
    originalImage = await uploadToCloudinary(imageFile.path, 'hairstyle-studio', {
      transformation: { width: 800, height: 800, crop: 'limit' }
    });
  } else {
    originalImage = `/uploads/${imageFile.filename}`;
  }

  const generation = await generateHairstylePreview({
    originalImage,
    hairstyleId,
    templateImage: hairstyle.templateImage,
    maskPath: maskFile?.path,
  });

  if (maskFile?.path) {
    fs.unlinkSync(maskFile.path);
  }

  const result = await hairstyleService.createResult({
    userId,
    originalImage,
    generatedImage: generation.imageUrl,
    hairstyleId
  });

  return sendSuccess(res, {
    result,
    credits: { balance: updated.balance },
    generation: {
      provider: generation.provider,
      imageUrl: generation.imageUrl
    }
  }, 'Hairstyle generated successfully', 201);
});

export const getUserResults = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, 'Authentication required');
  const results = await hairstyleService.getUserResults(userId);
  return sendSuccess(res, { results });
});

export const getResult = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, 'Authentication required');
  const result = await hairstyleService.getResultById(id, userId);
  return sendSuccess(res, { result });
});

export const saveFavorite = asyncHandler(async (req: Request, res: Response) => {
  const { resultId } = req.body;
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, 'Authentication required');

  const result = await hairstyleService.toggleFavorite(userId, resultId);

  return sendSuccess(res, { result }, result.favorite ? 'Added to favorites' : 'Removed from favorites');
});

export const getFavoriteResults = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, 'Authentication required');
  const results = await hairstyleService.getFavorites(userId);
  return sendSuccess(res, { results });
});

export const deleteResult = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, 'Authentication required');
  await hairstyleService.removeResult(id, userId);
  return sendSuccess(res, null, 'Result deleted');
});
