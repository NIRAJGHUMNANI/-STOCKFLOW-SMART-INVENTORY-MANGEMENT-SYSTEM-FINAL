import React, { useState } from 'react';

export default function AdjustModal({ product, onAdjust, onClose, loading }) {
  const [form, setForm] = useState({ type: 'stock-in', quantity: '', note: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.quantity || Number(form.quantity) <= 0) {
      return setError('Please enter a valid quantity greater than 0.');
    }
    if (form.type === 'stock-out' && Number(form.quantity) > product.quantity) {
      return setError(`Cannot remove more than current stock (${product.quantity}).`);
    }
    try {
      await onAdjust({ type: form.type, quantity: Number(form.quantity), note: form.note });
    } catch (err) {
      setError(err.message);
    }
  };

  const newQty = form.quantity
    ? form.type === 'stock-in'
      ? product.quantity + Number(form.quantity)
      : product.quantity - Number(form.quantity)
    : product.quantity;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <h3>Adjust Stock</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div style={{
          background: 'var(--bg3)', borderRadius: 'var(--radius-sm)',
          padding: '12px 16px', marginBottom: 16, border: '1.5px solid var(--border)'
        }}>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>Product</div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{product.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
            Current Stock: <strong style={{ color: 'var(--text)' }}>{product.quantity}</strong>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Adjustment Type</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {['stock-in', 'stock-out'].map((t) => (
                <label key={t} style={{
                  flex: 1, display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                  border: `1.5px solid ${form.type === t ? (t === 'stock-in' ? 'var(--green)' : 'var(--red)') : 'var(--border)'}`,
                  background: form.type === t ? (t === 'stock-in' ? 'var(--green-soft)' : 'var(--red-soft)') : 'var(--bg3)',
                  cursor: 'pointer', transition: 'all 0.18s', fontSize: 14, fontWeight: 600,
                  color: form.type === t ? (t === 'stock-in' ? 'var(--green)' : 'var(--red)') : 'var(--text2)',
                }}>
                  <input
                    type="radio" name="type" value={t} checked={form.type === t}
                    onChange={handleChange} style={{ display: 'none' }}
                  />
                  {t === 'stock-in' ? '↑ Stock In' : '↓ Stock Out'}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Quantity *</label>
            <input
              className="form-input" type="number" name="quantity"
              value={form.quantity} onChange={handleChange} min="1" placeholder="Enter quantity" required
            />
          </div>

          {form.quantity && (
            <div style={{
              padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: 14,
              background: 'var(--bg3)', border: '1.5px solid var(--border)',
              fontSize: 13, color: 'var(--text2)'
            }}>
              New stock will be:{' '}
              <strong style={{ color: newQty < 0 ? 'var(--red)' : 'var(--text)', fontSize: 16 }}>
                {newQty}
              </strong>
            </div>
          )}

          <div className="form-group">
            <label>Note (optional)</label>
            <input
              className="form-input" name="note" value={form.note}
              onChange={handleChange} placeholder="e.g. Received from supplier"
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" /> Adjusting...</> : 'Adjust Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
