import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFocusTrap } from '../hooks/useFocusTrap';
import type { Customer } from '../types';

const schema = z.object({
  customerName: z.string().trim().min(2, 'Customer name is required'),
  mobileNumber: z.string().trim().min(6, 'Mobile number is required'),
  email: z.string().trim().email('Enter a valid email').optional().or(z.literal('')),
  businessName: z.string().trim().optional(),
  gstNumber: z.string().trim().optional(),
  customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']),
  address: z.string().trim().min(2, 'Address is required'),
  installationAddress: z.string().trim().optional(),
  propertyType: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL']).optional().or(z.literal('')),
  roofType: z.string().trim().optional(),
  leadSource: z.string().trim().optional(),
  averageMonthlyElectricityBill: z.coerce.number().nonnegative('Must be ≥ 0').optional().or(z.literal('')).or(z.nan()),
  estimatedSystemCapacityKw: z.coerce.number().nonnegative('Must be ≥ 0').optional().or(z.literal('')).or(z.nan()),
  notes: z.string().trim().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function CustomerFormDialog({
  initial, onClose, onSubmit, submitting,
}: {
  initial: Customer | null;
  onClose: () => void;
  onSubmit: (payload: Partial<Customer>) => void;
  submitting: boolean;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true, onClose);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerName: initial?.customerName ?? '',
      mobileNumber: initial?.mobileNumber ?? '',
      email: initial?.email ?? '',
      businessName: initial?.businessName ?? '',
      gstNumber: initial?.gstNumber ?? '',
      customerType: initial?.customerType ?? 'RETAIL',
      status: initial?.status ?? 'LEAD',
      address: initial?.address ?? '',
      installationAddress: initial?.installationAddress ?? '',
      propertyType: (initial?.propertyType ?? '') as FormValues['propertyType'],
      roofType: initial?.roofType ?? '',
      leadSource: initial?.leadSource ?? '',
      averageMonthlyElectricityBill: initial?.averageMonthlyElectricityBill ? Number(initial.averageMonthlyElectricityBill) as unknown as FormValues['averageMonthlyElectricityBill'] : '',
      estimatedSystemCapacityKw: initial?.estimatedSystemCapacityKw ? Number(initial.estimatedSystemCapacityKw) as unknown as FormValues['estimatedSystemCapacityKw'] : '',
      notes: initial?.notes ?? '',
    },
  });

  const submit = (v: FormValues) => {
    const payload: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v)) {
      if (val === '' || val === undefined || (typeof val === 'number' && isNaN(val))) continue;
      payload[k] = val;
    }
    onSubmit(payload as Partial<Customer>);
  };

  return (
    <div className="dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="customer-dialog-title" onClick={onClose} data-testid="customer-dialog">
      <div ref={dialogRef} className="dialog" onClick={(e) => e.stopPropagation()} tabIndex={-1}>
        <div className="dialog-header">
          <div>
            <h2 id="customer-dialog-title">{initial ? 'Edit customer' : 'Add solar customer'}</h2>
            <p>Capture contact, business and solar project details.</p>
          </div>
          <button type="button" className="btn btn-subtle btn-sm" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <form onSubmit={handleSubmit(submit)} noValidate>
          <div className="dialog-body">
            <div className="form-grid">
              <div className="field">
                <label>Customer name *</label>
                <input {...register('customerName')} data-testid="cust-name" />
                {errors.customerName && <div className="field-error">{errors.customerName.message}</div>}
              </div>
              <div className="field">
                <label>Mobile number *</label>
                <input {...register('mobileNumber')} data-testid="cust-mobile" />
                {errors.mobileNumber && <div className="field-error">{errors.mobileNumber.message}</div>}
              </div>
              <div className="field">
                <label>Email</label>
                <input type="email" {...register('email')} data-testid="cust-email" />
                {errors.email && <div className="field-error">{errors.email.message}</div>}
              </div>
              <div className="field">
                <label>Business name</label>
                <input {...register('businessName')} />
              </div>
              <div className="field">
                <label>GST number</label>
                <input {...register('gstNumber')} />
              </div>
              <div className="field">
                <label>Customer type *</label>
                <select {...register('customerType')}>
                  <option value="RETAIL">Retail</option>
                  <option value="WHOLESALE">Wholesale</option>
                  <option value="DISTRIBUTOR">Distributor</option>
                </select>
              </div>
              <div className="field">
                <label>Status *</label>
                <select {...register('status')}>
                  <option value="LEAD">Lead</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              <div className="field">
                <label>Property type</label>
                <select {...register('propertyType')}>
                  <option value="">Select</option>
                  <option value="RESIDENTIAL">Residential</option>
                  <option value="COMMERCIAL">Commercial</option>
                  <option value="INDUSTRIAL">Industrial</option>
                </select>
              </div>
              <div className="field full">
                <label>Billing address *</label>
                <textarea {...register('address')} data-testid="cust-address" />
                {errors.address && <div className="field-error">{errors.address.message}</div>}
              </div>
              <div className="field full">
                <label>Installation address (if different)</label>
                <textarea {...register('installationAddress')} />
              </div>
              <div className="field">
                <label>Roof type</label>
                <input {...register('roofType')} placeholder="RCC / Metal Sheet / Tile" />
              </div>
              <div className="field">
                <label>Lead source</label>
                <input {...register('leadSource')} placeholder="Website / Referral" />
              </div>
              <div className="field">
                <label>Avg. monthly bill (₹)</label>
                <input type="number" step="0.01" {...register('averageMonthlyElectricityBill')} />
                {errors.averageMonthlyElectricityBill && <div className="field-error">{errors.averageMonthlyElectricityBill.message as string}</div>}
              </div>
              <div className="field">
                <label>Est. system capacity (kW)</label>
                <input type="number" step="0.1" {...register('estimatedSystemCapacityKw')} data-testid="cust-capacity" />
                {errors.estimatedSystemCapacityKw && <div className="field-error">{errors.estimatedSystemCapacityKw.message as string}</div>}
              </div>
              <div className="field full">
                <label>Notes</label>
                <textarea {...register('notes')} rows={2} />
              </div>
            </div>
          </div>
          <div className="dialog-footer">
            <button type="button" className="btn btn-subtle" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting} data-testid="cust-submit">
              {submitting ? 'Saving…' : initial ? 'Save changes' : 'Add customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
