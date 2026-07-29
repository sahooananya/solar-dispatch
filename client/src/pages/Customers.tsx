import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { listCustomers, createCustomer, updateCustomer } from '../api/customers';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { apiErrorMessage } from '../api/client';
import CustomerFormDialog from '../components/CustomerFormDialog';
import type { Customer, CustomerStatus, CustomerType } from '../types';

const statusBadgeClass = (s: CustomerStatus) =>
  s === 'ACTIVE' ? 'badge-success' : s === 'LEAD' ? 'badge-info' : 'badge-neutral';

export default function Customers() {
  const { user } = useAuth();
  const { push } = useToast();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [customerType, setCustomerType] = useState<CustomerType | ''>('');
  const [status, setStatus] = useState<CustomerStatus | ''>('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', { page, search, customerType, status }],
    queryFn: () => listCustomers({ page, limit: 10, search: search || undefined, customerType: customerType || undefined, status: status || undefined }),
  });

  const createMut = useMutation({
    mutationFn: (payload: Partial<Customer>) => createCustomer(payload),
    onSuccess: () => { push('Customer added successfully.', 'success'); qc.invalidateQueries({ queryKey: ['customers'] }); setOpen(false); },
    onError: (e) => push(apiErrorMessage(e), 'error'),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Customer> }) => updateCustomer(id, payload),
    onSuccess: () => { push('Customer updated.', 'success'); qc.invalidateQueries({ queryKey: ['customers'] }); setOpen(false); setEditing(null); },
    onError: (e) => push(apiErrorMessage(e), 'error'),
  });

  const canManage = user?.role === 'ADMIN' || user?.role === 'SALES';

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Customers & Solar Leads</h1>
          <p>Manage rooftop solar prospects, active customers and CRM follow-ups.</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={() => { setEditing(null); setOpen(true); }} data-testid="add-customer-btn">
            <Plus size={16} /> Add customer
          </button>
        )}
      </div>

      <div className="filters" data-testid="customer-filters">
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--slate-400)' }} />
          <input placeholder="Search name, mobile, email…" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} style={{ paddingLeft: 30 }} data-testid="customer-search" />
        </div>
        <select value={customerType} onChange={(e) => { setPage(1); setCustomerType(e.target.value as CustomerType | ''); }} data-testid="filter-type">
          <option value="">All types</option>
          <option value="RETAIL">Retail</option>
          <option value="WHOLESALE">Wholesale</option>
          <option value="DISTRIBUTOR">Distributor</option>
        </select>
        <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value as CustomerStatus | ''); }} data-testid="filter-status">
          <option value="">All statuses</option>
          <option value="LEAD">Lead</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <div className="table-wrapper" data-testid="customer-table">
        <table className="data-table">
          <thead>
            <tr><th>Customer</th><th>Mobile</th><th>Type</th><th>Status</th><th className="num">Capacity (kW)</th><th>Next follow-up</th><th></th></tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="empty-state">Loading customers…</td></tr>
            ) : data && data.data.length === 0 ? (
              <tr><td colSpan={7} className="empty-state"><h3>No customers found</h3>Try adjusting filters or add a new solar lead.</td></tr>
            ) : data?.data.map((c) => (
              <tr key={c.id} data-testid={`customer-row-${c.id}`}>
                <td>
                  <Link to={`/customers/${c.id}`} style={{ color: 'var(--navy-800)', fontWeight: 500 }}>
                    {c.businessName || c.customerName}
                  </Link>
                  {c.businessName && <div className="tiny muted">{c.customerName}</div>}
                </td>
                <td className="mono tiny">{c.mobileNumber}</td>
                <td><span className="badge badge-neutral">{c.customerType}</span></td>
                <td><span className={`badge ${statusBadgeClass(c.status)}`}>{c.status}</span></td>
                <td className="num">{c.estimatedSystemCapacityKw ? Number(c.estimatedSystemCapacityKw).toFixed(1) : '—'}</td>
                <td className="tiny">{c.followUpDate ? new Date(c.followUpDate).toLocaleDateString() : <span className="muted">—</span>}</td>
                <td>
                  <div className="row gap-sm">
                    <Link to={`/customers/${c.id}`} className="btn btn-subtle btn-sm">View</Link>
                    {canManage && <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(c); setOpen(true); }} data-testid={`edit-customer-${c.id}`}>Edit</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.pagination.totalPages > 1 && (
        <div className="row gap-sm mt-md" data-testid="customer-pagination">
          <button className="btn btn-subtle btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
          <span className="tiny muted">Page {data.pagination.page} of {data.pagination.totalPages}</span>
          <button className="btn btn-subtle btn-sm" disabled={page >= data.pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}

      {open && (
        <CustomerFormDialog
          initial={editing}
          onClose={() => { setOpen(false); setEditing(null); }}
          onSubmit={(payload) => editing ? updateMut.mutate({ id: editing.id, payload }) : createMut.mutate(payload)}
          submitting={createMut.isPending || updateMut.isPending}
        />
      )}
    </>
  );
}
