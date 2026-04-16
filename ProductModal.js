import React, { useState, useEffect } from 'react';

const INITIAL = {
  name: '', sku: '', description: '', category: '',
  quantity: '', price: '', costPrice: '', supplier: '',
  location: '', minStockLevel: 10,
};

export default function ProductModal({ product, onSave, onClose, loading }) {
  const [form, setForm] = useState(INITIAL);
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        sku: product.sku || '',
        description: product.description || '',
        category: product.category || '',
        quantity: product.quantity ?? '',
        price: product.price ?? '',
        costPrice: product.costPrice ?? '',
        supplier: product.supplier || '',
        location: product.location || '',
        minStockLevel: product.minStockLevel ?? 10,
      });
    } else {
      setForm(INITIAL);
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.sku || !form.category || form.quantity === '' || form.price === '') {
      return setError('Please fill all required fields.');
    }
    try {
      await onSave({
        ...form,
        quantity: Number(form.quantity),
        price: Number(form.price),
        costPrice: Number(form.costPrice) || 0,
        minStockLevel: Number(form.minStockLevel) || 10,
      });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h3>{product ? 'Edit Product' : 'Add New Product'}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Product Name *</label>
              <input className="form-input" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Wireless Keyboard" required />
            </div>

            <div className="form-group">
              <label>SKU *</label>
              <input className="form-input" name="sku" value={form.sku} onChange={handleChange} placeholder="e.g. WK-001" required />
            </div>

            <div className="form-group">
              <label>Category *</label>
              <input className="form-input" name="category" value={form.category} onChange={handleChange} placeholder="e.g. Electronics" required />
            </div>

            <div className="form-group">
              <label>Quantity *</label>
              <input className="form-input" type="number" name="quantity" value={form.quantity} onChange={handleChange} min="0" placeholder="0" required />
            </div>

            <div className="form-group">
              <label>Selling Price (₹) *</label>
              <input className="form-input" type="number" name="price" value={form.price} onChange={handleChange} min="0" step="0.01" placeholder="0.00" required />
            </div>

            <div className="form-group">
              <label>Cost Price (₹)</label>
              <input className="form-input" type="number" name="costPrice" value={form.costPrice} onChange={handleChange} min="0" step="0.01" placeholder="0.00" />
            </div>

            <div className="form-group">
              <label>Min Stock Level</label>
              <input className="form-input" type="number" name="minStockLevel" value={form.minStockLevel} onChange={handleChange} min="0" />
            </div>

            <div className="form-group">
              <label>Supplier</label>
              <input className="form-input" name="supplier" value={form.supplier} onChange={handleChange} placeholder="Supplier name" />
            </div>

            <div className="form-group">
              <label>Location</label>
              <input className="form-input" name="location" value={form.location} onChange={handleChange} placeholder="e.g. Shelf A-3" />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Description</label>
              <textarea
                className="form-input"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={2}
                placeholder="Optional product description..."
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" /> Saving...</> : product ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
