import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFocusTrap } from '../hooks/useFocusTrap';
import type { Product, ProductCategory } from '../types';

const CATS: ProductCategory[] = ['SOLAR_PANEL', 'INVERTER', 'BATTERY', 'MOUNTING_STRUCTURE', 'DC_CABLE', 'AC_CABLE', 'COMBINER_BOX', 'PROTECTION_DEVICE', 'CONNECTOR', 'METER', 'OTHER'];

const schema = z.object({
  productName: z.string().trim().min(2, 'Product name is required'),
  sku: z.string().trim().min(2, 'SKU is required'),
  category: z.enum(CATS as [ProductCategory, ...ProductCategory[]]),
  unitPrice: z.coerce.number().nonnegative('Must be ≥ 0'),
  currentStock: z.coerce.number().int().nonnegative('Must be ≥ 0').optional(),
  minimumStockAlertQuantity: z.coerce.number().int().nonnegative('Must be ≥ 0'),
  warehouseLocation: z.string().trim().min(1, 'Warehouse location is required'),
  brand: z.string().trim().optional(),
  modelNumber: z.string().trim().optional(),
  wattage: z.coerce.number().int().nonnegative().optional().or(z.literal('')).or(z.nan()),
  warrantyYears: z.coerce.number().int().nonnegative().optional().or(z.literal('')).or(z.nan()),
});

type FormValues = z.infer<typeof schema>;

export default function ProductFormDialog({
  initial, onClose, onSubmit, submitting,
}: {
  initial: Product | null;
  onClose: () => void;
  onSubmit: (payload: Partial<Product>) => void;
  submitting: boolean;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true, onClose);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      productName: initial?.productName ?? '',
      sku: initial?.sku ?? '',
      category: initial?.category ?? 'SOLAR_PANEL',
      unitPrice: initial ? Number(initial.unitPrice) : 0,
      currentStock: initial?.currentStock ?? 0,
      minimumStockAlertQuantity: initial?.minimumStockAlertQuantity ?? 0,
      warehouseLocation: initial?.warehouseLocation ?? '',
      brand: initial?.brand ?? '',
      modelNumber: initial?.modelNumber ?? '',
      wattage: (initial?.wattage ?? '') as FormValues['wattage'],
      warrantyYears: (initial?.warrantyYears ?? '') as FormValues['warrantyYears'],
    },
  });

  const submit = (v: FormValues) => {
    const payload: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v)) {
      if (val === '' || val === undefined || (typeof val === 'number' && isNaN(val))) continue;
      if (initial && k === 'currentStock') continue;
      payload[k] = val;
    }
    onSubmit(payload as Partial<Product>);
  };

  return (
    <div className="dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="product-dialog-title" onClick={onClose} data-testid="product-dialog">
      <div ref={dialogRef} className="dialog" onClick={(e) => e.stopPropagation()} tabIndex={-1}>
        <div className="dialog-header">
          <div><h2 id="product-dialog-title">{initial ? 'Edit product' : 'Add solar equipment'}</h2><p>Product will appear in the inventory list immediately.</p></div>
          <button type="button" className="btn btn-subtle btn-sm" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <form onSubmit={handleSubmit(submit)} noValidate>
          <div className="dialog-body">
            <div className="form-grid">
              <div className="field"><label>Product name *</label><input {...register('productName')} data-testid="prod-name" />{errors.productName && <div className="field-error">{errors.productName.message}</div>}</div>
              <div className="field"><label>SKU *</label><input {...register('sku')} data-testid="prod-sku" />{errors.sku && <div className="field-error">{errors.sku.message}</div>}</div>
              <div className="field"><label>Category *</label>
                <select {...register('category')}>{CATS.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}</select>
              </div>
              <div className="field"><label>Warehouse location *</label><input {...register('warehouseLocation')} placeholder="WH-A1" />{errors.warehouseLocation && <div className="field-error">{errors.warehouseLocation.message}</div>}</div>
              <div className="field"><label>Unit price (₹) *</label><input type="number" step="0.01" {...register('unitPrice')} data-testid="prod-price" />{errors.unitPrice && <div className="field-error">{errors.unitPrice.message}</div>}</div>
              {!initial && (
                <div className="field"><label>Initial stock</label><input type="number" {...register('currentStock')} data-testid="prod-stock" /></div>
              )}
              <div className="field"><label>Minimum stock alert *</label><input type="number" {...register('minimumStockAlertQuantity')} />{errors.minimumStockAlertQuantity && <div className="field-error">{errors.minimumStockAlertQuantity.message}</div>}</div>
              <div className="field"><label>Brand</label><input {...register('brand')} /></div>
              <div className="field"><label>Model number</label><input {...register('modelNumber')} /></div>
              <div className="field"><label>Wattage (W)</label><input type="number" {...register('wattage')} /></div>
              <div className="field"><label>Warranty (years)</label><input type="number" {...register('warrantyYears')} /></div>
            </div>
          </div>
          <div className="dialog-footer">
            <button type="button" className="btn btn-subtle" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting} data-testid="prod-submit">{submitting ? 'Saving…' : initial ? 'Save changes' : 'Add product'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
