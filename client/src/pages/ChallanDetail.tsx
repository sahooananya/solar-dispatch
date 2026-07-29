import { useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Printer, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { getChallan, confirmChallan, cancelChallan } from '../api/challans';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { apiErrorMessage } from '../api/client';

export default function ChallanDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { user } = useAuth();
  const { push } = useToast();
  const qc = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState<'confirm' | 'cancel' | null>(null);
  const confirmDialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(confirmDialogRef, confirmOpen !== null, () => setConfirmOpen(null));

  const { data: c, isLoading } = useQuery({ queryKey: ['challan', id], queryFn: () => getChallan(id!), enabled: !!id });
  const confirmMut = useMutation({
    mutationFn: () => confirmChallan(id!),
    onSuccess: () => { push('Challan confirmed and inventory updated.', 'success'); qc.invalidateQueries({ queryKey: ['challan', id] }); qc.invalidateQueries({ queryKey: ['products'] }); setConfirmOpen(null); },
    onError: (e) => { push(apiErrorMessage(e), 'error'); setConfirmOpen(null); },
  });
  const cancelMut = useMutation({
    mutationFn: () => cancelChallan(id!),
    onSuccess: (r) => { push(r.status === 'CANCELLED' && r.confirmedAt ? 'Challan cancelled and stock restored.' : 'Challan cancelled.', 'success'); qc.invalidateQueries({ queryKey: ['challan', id] }); qc.invalidateQueries({ queryKey: ['products'] }); setConfirmOpen(null); },
    onError: (e) => { push(apiErrorMessage(e), 'error'); setConfirmOpen(null); },
  });

  if (isLoading || !c) return <div className="skeleton" style={{ height: 300 }} />;
  const canAct = user?.role === 'ADMIN' || user?.role === 'SALES';
  const total = c.items.reduce((sum, it) => sum + it.quantity * Number(it.unitPriceSnapshot), 0);
  const badge = c.status === 'CONFIRMED' ? 'badge-success' : c.status === 'CANCELLED' ? 'badge-danger' : 'badge-neutral';

  return (
    <>
      <Link to="/challans" className="btn btn-subtle btn-sm mb-md"><ArrowLeft size={14} /> Back to challans</Link>
      <div className="page-header">
        <div>
          <h1 className="mono" style={{ fontFamily: 'var(--font-heading)' }}>{c.challanNumber}</h1>
          <p><span className={`badge ${badge}`} data-testid="challan-status">{c.status}</span> · Created {format(new Date(c.createdAt), 'dd MMM yyyy, HH:mm')} by {c.createdBy?.name}</p>
        </div>
        <div className="row gap-sm">
          <button className="btn btn-secondary" onClick={() => nav(`/challans/${id}/print`)} data-testid="print-challan-btn"><Printer size={16} /> Print / PDF</button>
          {canAct && c.status === 'DRAFT' && <button className="btn btn-sun" onClick={() => setConfirmOpen('confirm')} data-testid="confirm-challan-btn"><CheckCircle2 size={16} /> Confirm</button>}
          {canAct && c.status !== 'CANCELLED' && <button className="btn btn-danger" onClick={() => setConfirmOpen('cancel')} data-testid="cancel-challan-btn"><XCircle size={16} /> Cancel</button>}
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-body">
            <h2 className="card-title">Line items</h2>
            <table className="data-table">
              <thead><tr><th>Product</th><th>SKU</th><th className="num">Qty</th><th className="num">Unit ₹</th><th className="num">Subtotal</th></tr></thead>
              <tbody>
                {c.items.map((it) => (
                  <tr key={it.id} data-testid={`item-${it.id}`}>
                    <td><strong>{it.productNameSnapshot}</strong><div className="tiny muted">{it.categorySnapshot.replace(/_/g, ' ')}</div></td>
                    <td className="mono tiny">{it.skuSnapshot}</td>
                    <td className="num">{it.quantity}</td>
                    <td className="num">₹{Number(it.unitPriceSnapshot).toLocaleString()}</td>
                    <td className="num">₹{(it.quantity * Number(it.unitPriceSnapshot)).toLocaleString()}</td>
                  </tr>
                ))}
                <tr><td colSpan={2}></td><td className="num"><strong>{c.totalQuantity}</strong></td><td className="num muted">Total</td><td className="num"><strong>₹{total.toLocaleString()}</strong></td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <div className="card mb-md">
            <div className="card-body">
              <h2 className="card-title">Customer</h2>
              <div><strong>{c.customer?.businessName || c.customer?.customerName}</strong></div>
              <div className="tiny muted">{c.customer?.mobileNumber}</div>
              {c.customer?.gstNumber && <div className="tiny mt-sm"><strong>GST:</strong> <span className="mono">{c.customer.gstNumber}</span></div>}
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <h2 className="card-title">Dispatch</h2>
              <div className="tiny muted">Delivery address</div>
              <div>{c.deliveryAddress}</div>
              {c.installationSiteName && <div className="mt-sm"><div className="tiny muted">Installation site</div><div>{c.installationSiteName}</div></div>}
              {c.projectReference && <div className="mt-sm"><div className="tiny muted">Project ref</div><div>{c.projectReference}</div></div>}
              {c.proposedSystemCapacityKw && <div className="mt-sm"><div className="tiny muted">System capacity</div><div>{Number(c.proposedSystemCapacityKw).toFixed(1)} kW</div></div>}
              {c.expectedDispatchDate && <div className="mt-sm"><div className="tiny muted">Expected dispatch</div><div>{format(new Date(c.expectedDispatchDate), 'dd MMM yyyy')}</div></div>}
              {c.dispatchNotes && <div className="mt-sm"><div className="tiny muted">Notes</div><div>{c.dispatchNotes}</div></div>}
              {c.confirmedAt && <div className="mt-sm tiny muted">Confirmed: {format(new Date(c.confirmedAt), 'dd MMM yyyy, HH:mm')}</div>}
              {c.cancelledAt && <div className="mt-sm tiny muted">Cancelled: {format(new Date(c.cancelledAt), 'dd MMM yyyy, HH:mm')}</div>}
            </div>
          </div>
        </div>
      </div>

      {confirmOpen && (
        <div className="dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title" onClick={() => setConfirmOpen(null)}>
          <div ref={confirmDialogRef} className="dialog" onClick={(e) => e.stopPropagation()} tabIndex={-1} style={{ maxWidth: 460 }}>
            <div className="dialog-header"><h2 id="confirm-dialog-title">{confirmOpen === 'confirm' ? 'Confirm challan?' : 'Cancel challan?'}</h2></div>
            <div className="dialog-body">
              {confirmOpen === 'confirm' ? (
                <p>This will deduct the requested quantities from equipment stock atomically and generate OUT movement records. This cannot be undone easily — proceed only if the goods are ready for dispatch.</p>
              ) : (
                <p>{c.status === 'CONFIRMED' ? 'Cancelling a CONFIRMED challan will restore each product\'s stock and create IN reversal movements.' : 'Cancelling a draft removes it from active dispatch.'}</p>
              )}
            </div>
            <div className="dialog-footer">
              <button type="button" className="btn btn-subtle" onClick={() => setConfirmOpen(null)}>Back</button>
              {confirmOpen === 'confirm'
                ? <button type="button" className="btn btn-sun" onClick={() => confirmMut.mutate()} disabled={confirmMut.isPending} data-testid="confirm-yes">Yes, confirm</button>
                : <button type="button" className="btn btn-danger" onClick={() => cancelMut.mutate()} disabled={cancelMut.isPending} data-testid="cancel-yes">Yes, cancel</button>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
