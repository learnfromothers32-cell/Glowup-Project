import { Request, Response } from 'express';
import { Product } from '../models/Product';
import { Stylist } from '../models/Stylist';
import { asyncHandler } from '../middleware/asyncHandler';
import { ApiError } from '../utils/apiError';
import { sendSuccess } from '../utils/apiResponse';

export const getStylistProducts = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findById(req.params.stylistId);
  if (!stylist) throw new ApiError(404, 'Stylist not found');

  const products = await Product.find({ stylistId: stylist.id, isActive: true }).sort({ name: 1 });
  return sendSuccess(res, { products });
});

export const getMyProducts = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findOne({ userId: req.user?.id });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const { category, search, lowStock } = req.query;
  const filter: any = { stylistId: stylist.id };

  if (category) filter.category = category;
  if (search) filter.name = { $regex: search, $options: 'i' };
  if (lowStock === 'true') {
    filter.$expr = { $lte: ['$stock', '$lowStockThreshold'] };
  }

  const products = await Product.find(filter).sort({ name: 1 });
  return sendSuccess(res, { products });
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findOne({ userId: req.user?.id });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const { name, description, price, costPrice, sku, stock, lowStockThreshold, category, taxable } = req.body;
  if (!name || price === undefined) throw new ApiError(400, 'Product name and price are required');

  const product = await Product.create({
    stylistId: stylist.id,
    name, description, price,
    costPrice: costPrice ?? 0,
    sku: sku || '',
    stock: stock ?? 0,
    lowStockThreshold: lowStockThreshold ?? 5,
    category: category || 'General',
    taxable: taxable ?? true
  });

  return sendSuccess(res, { product }, 'Product added', 201);
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findOne({ userId: req.user?.id });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const product = await Product.findOne({ _id: req.params.id, stylistId: stylist.id });
  if (!product) throw new ApiError(404, 'Product not found');

  const { name, description, price, costPrice, sku, stock, lowStockThreshold, category, isActive, taxable } = req.body;
  if (name !== undefined) product.name = name;
  if (description !== undefined) product.description = description;
  if (price !== undefined) product.price = price;
  if (costPrice !== undefined) product.costPrice = costPrice;
  if (sku !== undefined) product.sku = sku;
  if (stock !== undefined) product.stock = stock;
  if (lowStockThreshold !== undefined) product.lowStockThreshold = lowStockThreshold;
  if (category !== undefined) product.category = category;
  if (isActive !== undefined) product.isActive = isActive;
  if (taxable !== undefined) product.taxable = taxable;

  await product.save();
  return sendSuccess(res, { product }, 'Product updated');
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findOne({ userId: req.user?.id });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const product = await Product.findOneAndDelete({ _id: req.params.id, stylistId: stylist.id });
  if (!product) throw new ApiError(404, 'Product not found');

  return sendSuccess(res, null, 'Product deleted');
});

export const adjustStock = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findOne({ userId: req.user?.id });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const { quantity, operation } = req.body;
  if (!quantity || !['add', 'remove', 'set'].includes(operation)) {
    throw new ApiError(400, 'Valid quantity and operation (add/remove/set) required');
  }

  const product = await Product.findOne({ _id: req.params.id, stylistId: stylist.id });
  if (!product) throw new ApiError(404, 'Product not found');

  if (operation === 'add') product.stock += quantity;
  else if (operation === 'remove') product.stock = Math.max(0, product.stock - quantity);
  else product.stock = Math.max(0, quantity);

  await product.save();
  return sendSuccess(res, { product }, 'Stock updated');
});
