import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, AlertTriangle } from 'lucide-react';
import { listProducts, createProduct, updateProduct, createMovement } from '../api/products';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { apiErrorMessage } from '../api/client';
import ProductFormDialog from '../components/ProductFormDialog';
import StockAdjustmentDialog from '../components/StockAdjustmentDialog';
import type { Product, ProductCategory } from '../types';

const CATEGORIES: ProductCategory[] = ['SOLAR_PANEL', 'INVERTER', 'BATTERY', 'MOUNTING_STRUCTURE', 'DC_CABLE', 'AC_CABLE', 'COMBINER_BOX', 'PROTECTION_DEVICE', 'CONNECTOR', 'METER', 'OTHER'];

export default function Products() {
  const { user } = useAuth();
  const { push } = useToast();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ProductCategory | ''>('');
  const [lowStock, setLowStock] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [stockDialog, setStockDialog] = useState<Product | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['products', { page, search, category, lowStock }],
    queryFn: () => listProducts({ page, limit: 10, search: search || undefined, category: category || undefined, lowStock: lowStock ? 'true' : undefined }),
  });

  const createMut = useMutation({
    mutationFn: (p: Partial<Product>) => createProduct(p),
    onSuccess: () => { push('Product added successfully.', 'success'); qc.invalidateQueries({ queryKey: ['products'] }); setFormOpen(false); },
    onError: (e) => push(apiErrorMessage(e), 'error'),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Product> }) => updateProduct(id, payload),
    onSuccess: () => { push('Product updated.', 'success'); qc.invalidateQueries({ queryKey: ['products'] }); setFormOpen(false); setEditing(null); },
    onError: (e) => push(apiErrorMessage(e), 'error'),
  });
  const stockMut = useMutation({
    mutationFn: ({ productId, movementType, quantity, reason }: { productId: string; movementType: 'IN' | 'OUT'; quantity: number; reason: string }) =>
      createMovement(productId, { movementType, quantity, reason }),
    onSuccess: (m, vars) => {
      const verb = vars.movementType === 'IN' ? 'increased' : 'decreased';
      push(`Stock ${verb} by ${vars.quantity} units.`, 'success');
      qc.invalidateQueries({ queryKey: ['products'] });
      setStockDialog(null);
    },
    onError: (e) => push(apiErrorMessage(e), 'error'),
  });

  const canManageProduct = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE';

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Solar Equipment Inventory</h1>
          <p>Track panels, inverters, batteries, cables and BOS components with atomic stock control.</p>
        </div>
        {canManageProduct && (
          <button className="btn btn-primary" onClick={() => { setEditing(null); setFormOpen(true); }} data-testid="add-product-btn">
            <Plus size={16} /> Add product
          </button>
        )}
      </div>

      <div className="filters" data-testid="product-filters">
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--slate-400)' }} />
          <input placeholder="Search name, SKU, brand…" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} style={{ paddingLeft: 30 }} data-testid="product-search" />
        </div>
        <select value={category} onChange={(e) => { setPage(1); setCategory(e.target.value as ProductCategory | ''); }} data-testid="filter-category">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
        </select>
        <label className="row gap-sm tiny" style={{ cursor: 'pointer' }}>
          <input type="checkbox" checked={lowStock} onChange={(e) => { setPage(1); setLowStock(e.target.checked); }} data-testid="filter-lowstock" /> Only low stock
        </label>
      </div>

      <div className="table-wrapper" data-testid="product-table">
        <table className="data-table">
          <thead>
            <tr><th>Product</th><th>SKU</th><th>Category</th><th>Brand / Model</th><th className="num">Unit price</th><th className="num">Stock</th><th className="num">Min</th><th>Location</th><th></th></tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={9} className="empty-state">Loading products…</td></tr>
            ) : data && data.data.length === 0 ? (
              <tr><td colSpan={9} className="empty-state"><h3>No equipment found</h3>Add a product or clear filters.</td></tr>
            ) : data?.data.map((p) => {
              const low = p.currentStock <= p.minimumStockAlertQuantity;
              return (
                <tr key={p.id} data-testid={`product-row-${p.id}`}>
                  <td><strong>{p.productName}</strong>{p.wattage && <div className="tiny muted">{p.wattage}W</div>}</td>
                  <td className="mono tiny">{p.sku}</td>
                  <td><span className="badge badge-neutral">{p.category.replace(/_/g, ' ')}</span></td>
                  <td className="tiny">{p.brand || '—'}{p.modelNumber && <div className="muted">{p.modelNumber}</div>}</td>
                  <td className="num">₹{Number(p.unitPrice).toLocaleString()}</td>
                  <td className="num">
                    {low && <AlertTriangle size={12} color="var(--amber-600)" style={{ marginRight: 4 }} />}
                    <strong style={{ color: low ? 'var(--amber-600)' : undefined }}>{p.currentStock}</strong>
                  </td>
                  <td className="num tiny muted">{p.minimumStockAlertQuantity}</td>
                  <td className="tiny">{p.warehouseLocation}</td>
                  <td>
                    <div className="row gap-sm">
                      {canManageProduct && <button className="btn btn-sun btn-sm" onClick={() => setStockDialog(p)} data-testid={`adjust-stock-${p.id}`}>Adjust</button>}
                      {canManageProduct && <button className="btn btn-subtle btn-sm" onClick={() => { setEditing(p); setFormOpen(true); }}>Edit</button>}
                    </div>
                  </td>
                </tr>
              );
            })}
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

      {formOpen && (
        <ProductFormDialog
          initial={editing}
          onClose={() => { setFormOpen(false); setEditing(null); }}
          onSubmit={(payload) => editing ? updateMut.mutate({ id: editing.id, payload }) : createMut.mutate(payload)}
          submitting={createMut.isPending || updateMut.isPending}
        />
      )}
      {stockDialog && (
        <StockAdjustmentDialog
          product={stockDialog}
          onClose={() => setStockDialog(null)}
          onSubmit={(v) => stockMut.mutate({ productId: stockDialog.id, ...v })}
          submitting={stockMut.isPending}
        />
      )}
    </>
  );
}
