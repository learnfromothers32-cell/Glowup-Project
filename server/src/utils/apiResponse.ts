import { Response } from 'express';
import { ApiResponse } from '../types/api';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200
) => {
  const body: ApiResponse<T> = {
    success: true,
    message,
    data
  };

  return res.status(statusCode).json(body);
};

export const sendPaginated = <T>(
  res: Response,
  data: T,
  total: number,
  page: number,
  limit: number,
  message = 'Success'
) => {
  const body = {
    success: true,
    message,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total
    }
  };

  return res.status(200).json(body);
};
