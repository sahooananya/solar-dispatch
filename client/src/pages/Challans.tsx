import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { listChallans } from '../api/challans';
import { useAuth } from '../hooks/useAuth';
import { format } from 'date-fns';
import type { ChallanStatus } from '../types';

const badgeCls = (s: ChallanStatus) => s === 'CONFIRMED' ? 'badge-success' : s === 'CANCELLED' ? 'badge-danger' : 'badge-neutral';

export default function Challans() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ChallanStatus | ''>('');
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['challans', { page, status, search }],
    queryFn: () => listChallans({ page, limit: 10, status: status || undefined, search: search || undefined }),
  });
  const canCreate = user?.role === 'ADMIN' || user?.role === 'SALES';

  return (
    <>
      <div className="page-header">
        <div><h1>Delivery Challans</h1><p>Solar equipment dispatch documents — drafts, confirmed and cancelled.</p></div>
        {canCreate && <Link to="/challans/new" className="btn btn-primary" data-testid="new-challan-page-btn"><Plus size={16} /> Create challan</Link>}
      </div>
      <div className="filters">
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--slate-400)' }} />
          <input placeholder="Search challan number, customer…" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} style={{ paddingLeft: 30 }} data-testid="challan-search" />
        </div>
        <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value as ChallanStatus | ''); }} data-testid="challan-status-filter">
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>
      <div className="table-wrapper" data-testid="challan-table">
        <table className="data-table">
          <thead><tr><th>Challan #</th><th>Customer</th><th>Status</th><th className="num">Items</th><th className="num">Qty</th><th>Created</th><th></th></tr></thead>
          <tbody>
            {isLoading ? <tr><td colSpan={7} className="empty-state">Loading…</td></tr> :
              data && data.data.length === 0 ? <tr><td colSpan={7} className="empty-state"><h3>No challans</h3>Create the first dispatch document.</td></tr> :
              data?.data.map((c) => (
                <tr key={c.id} data-testid={`challan-row-${c.id}`}>
                  <td className="mono"><Link to={`/challans/${c.id}`}>{c.challanNumber}</Link></td>
                  <td>{c.customer?.businessName || c.customer?.customerName}<div className="tiny muted">{c.customer?.mobileNumber}</div></td>
                  <td><span className={`badge ${badgeCls(c.status)}`}>{c.status}</span></td>
                  <td className="num">{c.items?.length ?? 0}</td>
                  <td className="num">{c.totalQuantity}</td>
                  <td className="tiny muted">{format(new Date(c.createdAt), 'dd MMM yyyy')}</td>
                  <td><Link to={`/challans/${c.id}`} className="btn btn-subtle btn-sm">Open</Link></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {data && data.pagination.totalPages > 1 && (
        <div className="row gap-sm mt-md">
          <button className="btn btn-subtle btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
          <span className="tiny muted">Page {data.pagination.page} of {data.pagination.totalPages}</span>
          <button className="btn btn-subtle btn-sm" disabled={page >= data.pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}
    </>
  );
}
