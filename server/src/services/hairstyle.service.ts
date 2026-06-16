import { Hairstyle, IHairstyle } from '../models/Hairstyle';
import { UserHairstyleResult } from '../models/UserHairstyleResult';
import { UserFavorites } from '../models/UserFavorites';
import { ApiError } from '../utils/apiError';

type HairstyleFilters = {
  category?: string;
  gender?: string;
  active?: boolean;
};

export const getHairstyles = async (filters?: HairstyleFilters): Promise<IHairstyle[]> => {
  const query: Record<string, unknown> = {};

  if (filters?.category) {
    query.category = filters.category;
  }

  if (filters?.gender) {
    query.gender = filters.gender;
  }

  query.active = filters?.active !== undefined ? filters.active : true;

  return Hairstyle.find(query).sort({ name: 1 });
};

export const getHairstyleById = async (id: string): Promise<IHairstyle> => {
  const hairstyle = await Hairstyle.findById(id);

  if (!hairstyle) {
    throw new ApiError(404, 'Hairstyle not found');
  }

  return hairstyle;
};

export const getHairstyleBySlug = async (slug: string): Promise<IHairstyle | null> => {
  return Hairstyle.findOne({ slug, active: true });
};

export const createResult = async (data: {
  userId: string;
  originalImage: string;
  generatedImage?: string;
  hairstyleId: string;
}) => {
  return UserHairstyleResult.create({
    userId: data.userId,
    originalImage: data.originalImage,
    generatedImage: data.generatedImage,
    hairstyleId: data.hairstyleId
  });
};

export const getUserResults = async (userId: string) => {
  return UserHairstyleResult.find({ userId })
    .populate('hairstyleId', 'name slug category previewImage')
    .sort({ createdAt: -1 });
};

export const getResultById = async (id: string, userId: string) => {
  const result = await UserHairstyleResult.findOne({ _id: id, userId })
    .populate('hairstyleId', 'name slug category previewImage');

  if (!result) {
    throw new ApiError(404, 'Result not found');
  }

  return result;
};

export const toggleFavorite = async (userId: string, resultId: string) => {
  const result = await UserHairstyleResult.findOne({ _id: resultId, userId });

  if (!result) {
    throw new ApiError(404, 'Result not found');
  }

  result.favorite = !result.favorite;
  await result.save();

  if (result.favorite) {
    await UserFavorites.findOneAndUpdate(
      { userId, hairstyleResultId: resultId },
      { userId, hairstyleResultId: resultId },
      { upsert: true }
    );
  } else {
    await UserFavorites.findOneAndDelete({ userId, hairstyleResultId: resultId });
  }

  return result;
};

export const getFavorites = async (userId: string) => {
  const favorites = await UserFavorites.find({ userId })
    .populate({
      path: 'hairstyleResultId',
      populate: { path: 'hairstyleId', select: 'name slug category previewImage' }
    })
    .sort({ createdAt: -1 });

  return favorites.map(f => f.hairstyleResultId);
};

export const removeResult = async (id: string, userId: string) => {
  const result = await UserHairstyleResult.findOneAndDelete({ _id: id, userId });

  if (!result) {
    throw new ApiError(404, 'Result not found');
  }

  await UserFavorites.findOneAndDelete({ userId, hairstyleResultId: id });

  return result;
};
