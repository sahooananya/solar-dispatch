import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listAllMovements } from '../api/products';
import { format } from 'date-fns';

export default function StockMovements() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['stock-movements', page],
    queryFn: () => listAllMovements(page, 20),
  });
  return (
    <>
      <div className="page-header"><div><h1>Stock Movements</h1><p>All inbound and outbound equipment movements across the warehouse.</p></div></div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead><tr><th>Timestamp</th><th>Product</th><th>Type</th><th className="num">Qty</th><th>Reason</th><th>Ref</th><th>By</th></tr></thead>
          <tbody>
            {isLoading ? <tr><td colSpan={7} className="empty-state">Loading…</td></tr> :
              data && data.data.length === 0 ? <tr><td colSpan={7} className="empty-state">No movements yet.</td></tr> :
              data?.data.map((m) => (
                <tr key={m.id}>
                  <td className="tiny">{format(new Date(m.createdAt), 'dd MMM, HH:mm')}</td>
                  <td><strong>{m.product?.productName}</strong><div className="tiny muted mono">{m.product?.sku}</div></td>
                  <td><span className={`badge ${m.movementType === 'IN' ? 'badge-success' : 'badge-warning'}`}>{m.movementType}</span></td>
                  <td className="num">{m.quantityChanged}</td>
                  <td className="tiny">{m.reason}</td>
                  <td className="tiny muted">{m.referenceType || '—'}</td>
                  <td className="tiny">{m.createdBy?.name}</td>
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
