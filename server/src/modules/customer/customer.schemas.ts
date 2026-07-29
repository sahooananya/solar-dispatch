import { z } from 'zod';

const trimmedString = (min = 1) => z.string().trim().min(min);
const optionalTrim = z
  .string()
  .trim()
  .transform((v) => (v === '' ? undefined : v))
  .optional();
const optionalNonNegativeDecimal = z
  .union([z.string(), z.number()])
  .transform((v) => (v === '' || v === null || v === undefined ? undefined : Number(v)))
  .refine((v) => v === undefined || (typeof v === 'number' && !isNaN(v) && v >= 0), 'Must be a non-negative number')
  .optional();

export const customerCreateSchema = z.object({
  customerName: trimmedString(2),
  mobileNumber: trimmedString(6),
  email: z
    .string()
    .trim()
    .email('Enter a valid email')
    .transform((v) => v.toLowerCase())
    .optional()
    .or(z.literal('').transform(() => undefined)),
  businessName: optionalTrim,
  gstNumber: optionalTrim,
  customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']).default('RETAIL'),
  address: trimmedString(2),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).default('LEAD'),
  followUpDate: z.coerce.date().optional().nullable(),
  notes: optionalTrim,
  propertyType: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL']).optional().nullable(),
  averageMonthlyElectricityBill: optionalNonNegativeDecimal,
  estimatedSystemCapacityKw: optionalNonNegativeDecimal,
  roofType: optionalTrim,
  siteSurveyDate: z.coerce.date().optional().nullable(),
  installationAddress: optionalTrim,
  leadSource: optionalTrim,
});

export const customerUpdateSchema = customerCreateSchema.partial();

export const customerListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']).optional(),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).optional(),
});

export const followUpCreateSchema = z.object({
  note: trimmedString(1),
  followUpType: optionalTrim,
  nextFollowUpDate: z.coerce.date().optional().nullable(),
});

export type CustomerCreateInput = z.infer<typeof customerCreateSchema>;
export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>;
export type CustomerListQuery = z.infer<typeof customerListQuerySchema>;
export type FollowUpCreateInput = z.infer<typeof followUpCreateSchema>;
