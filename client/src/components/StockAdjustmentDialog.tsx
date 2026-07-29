import { useRef, useState } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import type { Product } from '../types';

export default function StockAdjustmentDialog({
  product, onClose, onSubmit, submitting,
}: {
  product: Product;
  onClose: () => void;
  onSubmit: (v: { movementType: 'IN' | 'OUT'; quantity: number; reason: string }) => void;
  submitting: boolean;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true, onClose);
  const [movementType, setMovementType] = useState<'IN' | 'OUT'>('IN');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (quantity <= 0) { setError('Quantity must be positive'); return; }
    if (!reason.trim()) { setError('Reason is required'); return; }
    if (movementType === 'OUT' && quantity > product.currentStock) {
      setError(`Cannot dispatch more than available stock (${product.currentStock})`);
      return;
    }
    onSubmit({ movementType, quantity, reason: reason.trim() });
  };

  return (
    <div className="dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="stock-dialog-title" onClick={onClose} data-testid="stock-dialog">
      <div ref={dialogRef} className="dialog" onClick={(e) => e.stopPropagation()} tabIndex={-1} style={{ maxWidth: 480 }}>
        <div className="dialog-header">
          <div><h2 id="stock-dialog-title">Adjust stock</h2><p>{product.productName} · {product.sku} · current: <strong>{product.currentStock}</strong></p></div>
          <button type="button" className="btn btn-subtle btn-sm" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="dialog-body">
            <div className="field">
              <label>Movement type *</label>
              <select value={movementType} onChange={(e) => setMovementType(e.target.value as 'IN' | 'OUT')} data-testid="stock-type">
                <option value="IN">IN — Add to stock</option>
                <option value="OUT">OUT — Remove from stock</option>
              </select>
            </div>
            <div className="field"><label>Quantity *</label><input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} data-testid="stock-qty" /></div>
            <div className="field"><label>Reason *</label><input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Purchase order / Site dispatch / Return" data-testid="stock-reason" /></div>
            {error && <div className="field-error" data-testid="stock-error">{error}</div>}
          </div>
          <div className="dialog-footer">
            <button type="button" className="btn btn-subtle" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting} data-testid="stock-submit">{submitting ? 'Saving…' : 'Record movement'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
