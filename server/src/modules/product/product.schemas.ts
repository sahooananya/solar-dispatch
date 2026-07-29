import { z } from 'zod';

const trimmedString = (min = 1) => z.string().trim().min(min);
const optionalTrim = z
  .string()
  .trim()
  .transform((v) => (v === '' ? undefined : v))
  .optional();

export const productCategoryEnum = z.enum([
  'SOLAR_PANEL',
  'INVERTER',
  'BATTERY',
  'MOUNTING_STRUCTURE',
  'DC_CABLE',
  'AC_CABLE',
  'COMBINER_BOX',
  'PROTECTION_DEVICE',
  'CONNECTOR',
  'METER',
  'OTHER',
]);

export const productCreateSchema = z.object({
  productName: trimmedString(2),
  sku: trimmedString(2).transform((v) => v.toUpperCase()),
  category: productCategoryEnum,
  unitPrice: z.coerce.number().nonnegative(),
  currentStock: z.coerce.number().int().nonnegative().default(0),
  minimumStockAlertQuantity: z.coerce.number().int().nonnegative().default(0),
  warehouseLocation: trimmedString(1),
  brand: optionalTrim,
  modelNumber: optionalTrim,
  wattage: z.coerce.number().int().nonnegative().optional().nullable(),
  equipmentType: optionalTrim,
  warrantyYears: z.coerce.number().int().nonnegative().optional().nullable(),
});

export const productUpdateSchema = productCreateSchema.partial().omit({ currentStock: true });

export const productListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  category: productCategoryEnum.optional(),
  lowStock: z.enum(['true', 'false']).optional(),
});

export const movementCreateSchema = z.object({
  movementType: z.enum(['IN', 'OUT']),
  quantity: z.coerce.number().int().positive(),
  reason: z.string().trim().min(2),
});

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type ProductListQuery = z.infer<typeof productListQuerySchema>;
export type MovementCreateInput = z.infer<typeof movementCreateSchema>;
