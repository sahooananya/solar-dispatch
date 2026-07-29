import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Trash2, Plus } from 'lucide-react';
import { listCustomers, getCustomer } from '../api/customers';
import { listProducts } from '../api/products';
import { createChallan, CreateChallanPayload } from '../api/challans';
import { useToast } from '../hooks/useToast';
import { apiErrorMessage } from '../api/client';

interface LineItem { productId: string; quantity: number; }

export default function ChallanCreate() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { push } = useToast();
  const [customerId, setCustomerId] = useState<string>(params.get('customerId') || '');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [installationSiteName, setInstallationSiteName] = useState('');
  const [projectReference, setProjectReference] = useState('');
  const [proposedSystemCapacityKw, setProposedSystemCapacityKw] = useState<string>('');
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [expectedDispatchDate, setExpectedDispatchDate] = useState('');
  const [items, setItems] = useState<LineItem[]>([]);
  const [error, setError] = useState('');

  const { data: customersData } = useQuery({ queryKey: ['customers', 'all'], queryFn: () => listCustomers({ limit: 100 }) });
  const { data: productsData } = useQuery({ queryKey: ['products', 'all'], queryFn: () => listProducts({ limit: 100 }) });
  const { data: selectedCustomer } = useQuery({
    queryKey: ['customer-address', customerId],
    queryFn: () => getCustomer(customerId),
    enabled: !!customerId,
  });

  useMemo(() => {
    if (selectedCustomer && !deliveryAddress) {
      setDeliveryAddress(selectedCustomer.installationAddress || selectedCustomer.address);
    }
  }, [selectedCustomer, deliveryAddress]);

  const productMap = useMemo(() => new Map((productsData?.data ?? []).map((p) => [p.id, p])), [productsData]);
  const total = useMemo(
    () => items.reduce((sum, it) => sum + it.quantity * Number(productMap.get(it.productId)?.unitPrice ?? 0), 0),
    [items, productMap],
  );

  const mut = useMutation({
    mutationFn: (payload: CreateChallanPayload) => createChallan(payload),
    onSuccess: (c) => { push('Challan saved as draft.', 'success'); nav(`/challans/${c.id}`); },
    onError: (e) => push(apiErrorMessage(e), 'error'),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!customerId) { setError('Select a customer'); return; }
    if (!deliveryAddress.trim()) { setError('Delivery address is required'); return; }
    const cleaned = items.filter((i) => i.productId && i.quantity > 0);
    if (cleaned.length === 0) { setError('Add at least one line item with a positive quantity'); return; }
    mut.mutate({
      customerId,
      deliveryAddress: deliveryAddress.trim(),
      dispatchNotes: dispatchNotes.trim() || undefined,
      installationSiteName: installationSiteName.trim() || undefined,
      projectReference: projectReference.trim() || undefined,
      proposedSystemCapacityKw: proposedSystemCapacityKw ? Number(proposedSystemCapacityKw) : null,
      expectedDispatchDate: expectedDispatchDate || null,
      items: cleaned,
    });
  };

  return (
    <>
      <div className="page-header"><div><h1>New Delivery Challan</h1><p>Saves as DRAFT — inventory is not affected until you confirm.</p></div></div>
      <form onSubmit={submit} className="card" data-testid="challan-form">
        <div className="card-body">
          <div className="form-grid">
            <div className="field">
              <label>Customer *</label>
              <select value={customerId} onChange={(e) => { setCustomerId(e.target.value); setDeliveryAddress(''); }} data-testid="challan-customer">
                <option value="">Select a customer…</option>
                {customersData?.data.map((c) => <option key={c.id} value={c.id}>{c.businessName || c.customerName} — {c.mobileNumber}</option>)}
              </select>
            </div>
            <div className="field"><label>Installation site name</label><input value={installationSiteName} onChange={(e) => setInstallationSiteName(e.target.value)} placeholder="Rooftop site" /></div>
            <div className="field full"><label>Delivery address *</label><textarea rows={2} value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} data-testid="challan-address" /></div>
            <div className="field"><label>Project reference</label><input value={projectReference} onChange={(e) => setProjectReference(e.target.value)} /></div>
            <div className="field"><label>Proposed capacity (kW)</label><input type="number" step="0.1" value={proposedSystemCapacityKw} onChange={(e) => setProposedSystemCapacityKw(e.target.value)} /></div>
            <div className="field"><label>Expected dispatch date</label><input type="date" value={expectedDispatchDate} onChange={(e) => setExpectedDispatchDate(e.target.value)} /></div>
            <div className="field full"><label>Dispatch notes</label><textarea rows={2} value={dispatchNotes} onChange={(e) => setDispatchNotes(e.target.value)} /></div>
          </div>

          <div className="mt-lg">
            <h3 className="mb-sm">Line items</h3>
            <div className="table-wrapper" data-testid="line-items-table">
              <table className="data-table">
                <thead><tr><th>Product</th><th className="num">Available</th><th className="num">Unit ₹</th><th style={{ width: 120 }}>Quantity</th><th className="num">Subtotal</th><th></th></tr></thead>
                <tbody>
                  {items.length === 0 && <tr><td colSpan={6} className="empty-state">No items yet. Add products below.</td></tr>}
                  {items.map((it, idx) => {
                    const p = productMap.get(it.productId);
                    return (
                      <tr key={idx}>
                        <td>
                          <select value={it.productId} onChange={(e) => setItems((prev) => prev.map((x, i) => i === idx ? { ...x, productId: e.target.value } : x))} data-testid={`line-product-${idx}`}>
                            <option value="">Select product…</option>
                            {productsData?.data.map((pp) => <option key={pp.id} value={pp.id}>{pp.productName} ({pp.sku})</option>)}
                          </select>
                        </td>
                        <td className="num">{p?.currentStock ?? '—'}</td>
                        <td className="num">{p ? `₹${Number(p.unitPrice).toLocaleString()}` : '—'}</td>
                        <td><input type="number" min={1} value={it.quantity} onChange={(e) => setItems((prev) => prev.map((x, i) => i === idx ? { ...x, quantity: Number(e.target.value) } : x))} data-testid={`line-qty-${idx}`} /></td>
                        <td className="num">{p ? `₹${(it.quantity * Number(p.unitPrice)).toLocaleString()}` : '—'}</td>
                        <td><button type="button" className="btn btn-subtle btn-sm" onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))} aria-label="Remove line"><Trash2 size={14} /></button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button type="button" className="btn btn-secondary btn-sm mt-md" onClick={() => setItems((p) => [...p, { productId: '', quantity: 1 }])} data-testid="add-line-btn"><Plus size={14} /> Add product</button>
          </div>

          <div className="row between mt-lg">
            <div><strong>Total value:</strong> <span className="mono">₹{total.toLocaleString()}</span> · <strong>Total qty:</strong> {items.reduce((s, i) => s + i.quantity, 0)}</div>
          </div>
          {error && <div className="field-error mt-md" data-testid="challan-error">{error}</div>}
        </div>
        <div className="dialog-footer">
          <button type="button" className="btn btn-subtle" onClick={() => nav('/challans')}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={mut.isPending} data-testid="challan-save-draft">{mut.isPending ? 'Saving…' : 'Save as draft'}</button>
        </div>
      </form>
    </>
  );
}
