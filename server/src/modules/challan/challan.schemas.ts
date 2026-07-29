import { z } from 'zod';

const trimmedString = (min = 1) => z.string().trim().min(min);
const optionalTrim = z
  .string()
  .trim()
  .transform((v) => (v === '' ? undefined : v))
  .optional();

export const challanCreateSchema = z.object({
  customerId: trimmedString(1),
  deliveryAddress: trimmedString(2),
  dispatchNotes: optionalTrim,
  installationSiteName: optionalTrim,
  projectReference: optionalTrim,
  proposedSystemCapacityKw: z.coerce.number().nonnegative().optional().nullable(),
  expectedDispatchDate: z.coerce.date().optional().nullable(),
  items: z
    .array(
      z.object({
        productId: trimmedString(1),
        quantity: z.coerce.number().int().positive(),
      }),
    )
    .min(1, 'Challan must contain at least one line item'),
});

export const challanUpdateSchema = challanCreateSchema.partial();

export const challanListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(['DRAFT', 'CONFIRMED', 'CANCELLED']).optional(),
  customerId: z.string().optional(),
  search: z.string().trim().optional(),
});

export type ChallanCreateInput = z.infer<typeof challanCreateSchema>;
export type ChallanUpdateInput = z.infer<typeof challanUpdateSchema>;
export type ChallanListQuery = z.infer<typeof challanListQuerySchema>;
