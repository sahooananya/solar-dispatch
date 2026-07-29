import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { SunMedium, Printer, ArrowLeft } from 'lucide-react';
import { getChallan } from '../api/challans';

export default function ChallanPrint() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { data: c } = useQuery({ queryKey: ['challan', id], queryFn: () => getChallan(id!), enabled: !!id });

  useEffect(() => { document.title = c ? `${c.challanNumber} · SolarDispatch` : 'Challan · SolarDispatch'; }, [c]);

  if (!c) return <div style={{ padding: 40 }}>Loading challan…</div>;
  const total = c.items.reduce((s, it) => s + it.quantity * Number(it.unitPriceSnapshot), 0);

  return (
    <div style={{ background: 'var(--slate-100)', minHeight: '100vh', padding: 24 }}>
      <div className="no-print" style={{ maxWidth: 900, margin: '0 auto 16px', display: 'flex', gap: 8 }}>
        <button className="btn btn-subtle" onClick={() => nav(-1)}><ArrowLeft size={16} /> Back</button>
        <button className="btn btn-primary" onClick={() => window.print()} data-testid="print-btn"><Printer size={16} /> Print / Save as PDF</button>
      </div>
      <div className="print-page">
        <div className="print-header">
          <div>
            <h1><span className="brand-mark"><SunMedium size={22} /></span> SolarDispatch</h1>
            <div className="tiny muted">Rooftop Solar Sales, Inventory & Dispatch</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="tiny muted">Delivery Challan</div>
            <div className="mono" style={{ fontSize: '1.25rem' }}>{c.challanNumber}</div>
            <div className={`badge ${c.status === 'CONFIRMED' ? 'badge-success' : c.status === 'CANCELLED' ? 'badge-danger' : 'badge-neutral'}`} style={{ marginTop: 6 }}>{c.status}</div>
            <div className="tiny muted mt-sm">Date: {format(new Date(c.createdAt), 'dd MMM yyyy')}</div>
          </div>
        </div>

        <div className="print-meta">
          <div>
            <h4>Delivered To</h4>
            <div><strong>{c.customer?.businessName || c.customer?.customerName}</strong></div>
            {c.customer?.businessName && <div className="tiny">{c.customer.customerName}</div>}
            <div className="tiny">{c.customer?.mobileNumber}</div>
            {c.customer?.email && <div className="tiny">{c.customer.email}</div>}
            {c.customer?.gstNumber && <div className="tiny mt-sm"><strong>GSTIN:</strong> <span className="mono">{c.customer.gstNumber}</span></div>}
          </div>
          <div>
            <h4>Delivery / Installation Address</h4>
            <div>{c.deliveryAddress}</div>
            {c.installationSiteName && <div className="tiny mt-sm"><strong>Site:</strong> {c.installationSiteName}</div>}
            {c.projectReference && <div className="tiny"><strong>Project ref:</strong> {c.projectReference}</div>}
            {c.proposedSystemCapacityKw && <div className="tiny"><strong>Proposed capacity:</strong> {Number(c.proposedSystemCapacityKw).toFixed(1)} kW</div>}
            {c.expectedDispatchDate && <div className="tiny"><strong>Expected dispatch:</strong> {format(new Date(c.expectedDispatchDate), 'dd MMM yyyy')}</div>}
          </div>
        </div>

        <table className="data-table" style={{ marginBottom: 20 }}>
          <thead><tr><th>#</th><th>Solar Equipment</th><th>SKU</th><th>Category</th><th className="num">Qty</th><th className="num">Unit ₹</th><th className="num">Amount ₹</th></tr></thead>
          <tbody>
            {c.items.map((it, i) => (
              <tr key={it.id}>
                <td>{i + 1}</td>
                <td>{it.productNameSnapshot}</td>
                <td className="mono tiny">{it.skuSnapshot}</td>
                <td className="tiny">{it.categorySnapshot.replace(/_/g, ' ')}</td>
                <td className="num">{it.quantity}</td>
                <td className="num">{Number(it.unitPriceSnapshot).toLocaleString()}</td>
                <td className="num">{(it.quantity * Number(it.unitPriceSnapshot)).toLocaleString()}</td>
              </tr>
            ))}
            <tr><td colSpan={4} style={{ textAlign: 'right' }}><strong>Totals</strong></td><td className="num"><strong>{c.totalQuantity}</strong></td><td></td><td className="num"><strong>₹{total.toLocaleString()}</strong></td></tr>
          </tbody>
        </table>

        {c.dispatchNotes && <div><h4>Dispatch Notes</h4><p>{c.dispatchNotes}</p></div>}

        <div className="print-sign">
          <div>Prepared by<small>{c.createdBy?.name ?? ''}</small></div>
          <div>Warehouse<small>Signature</small></div>
          <div>Received by<small>Customer signature</small></div>
        </div>
        <div className="tiny muted" style={{ marginTop: 20, textAlign: 'center' }}>
          This is a system-generated delivery challan from SolarDispatch. Confirmed challans have already been dispatched from stock; cancelled challans have had their stock restored.
        </div>
      </div>
    </div>
  );
}
