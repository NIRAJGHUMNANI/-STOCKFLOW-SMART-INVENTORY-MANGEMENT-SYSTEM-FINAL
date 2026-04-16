import React, { useEffect, useState, useCallback } from 'react';
import { productAPI } from '../services/api';
import ProductModal from '../components/inventory/ProductModal';
import AdjustModal from '../components/inventory/AdjustModal';
import './Inventory.css';

const STATUS_MAP = {
  'in-stock': { label: 'In Stock', cls: 'badge-green' },
  'low-stock': { label: 'Low Stock', cls: 'badge-yellow' },
  'out-of-stock': { label: 'Out of Stock', cls: 'badge-red' },
};

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, currentPage: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const [showProductModal, setShowProductModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      if (filterCategory) params.category = filterCategory;
      const { data } = await productAPI.getAll(params);
      setProducts(data.products);
      setPagination({
        total: data.total,
        totalPages: data.totalPages,
        currentPage: data.currentPage,
      });
    } catch (err) {
      setError('Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterCategory]);

  useEffect(() => { fetchProducts(1); }, [fetchProducts]);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleSaveProduct = async (formData) => {
    setActionLoading(true);
    try {
      if (editProduct) {
        await productAPI.update(editProduct._id, formData);
        showSuccess('Product updated successfully!');
      } else {
        await productAPI.create(formData);
        showSuccess('Product created successfully!');
      }
      setShowProductModal(false);
      setEditProduct(null);
      fetchProducts(pagination.currentPage);
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Operation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdjust = async (adjustData) => {
    setActionLoading(true);
    try {
      await productAPI.adjustStock(adjustProduct._id, adjustData);
      showSuccess('Stock adjusted successfully!');
      setShowAdjustModal(false);
      setAdjustProduct(null);
      fetchProducts(pagination.currentPage);
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Adjustment failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setActionLoading(true);
    try {
      await productAPI.delete(id);
      showSuccess('Product deleted.');
      setDeleteConfirm(null);
      fetchProducts(pagination.currentPage);
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed.');
      setDeleteConfirm(null);
    } finally {
      setActionLoading(false);
    }
  };

  const openEdit = (product) => {
    setEditProduct(product);
    setShowProductModal(true);
  };

  const openAdjust = (product) => {
    setAdjustProduct(product);
    setShowAdjustModal(true);
  };

  return (
    <div className="inventory">
      <div className="inventory-header">
        <div>
          <div className="page-title">Inventory</div>
          <div className="page-subtitle">{pagination.total} products total</div>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => { setEditProduct(null); setShowProductModal(true); }}
        >
          <span>＋</span> Add Product
        </button>
      </div>

      {successMsg && <div className="alert alert-success">{successMsg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Filters */}
      <div className="filters-bar">
        <input
          className="form-input filter-search"
          type="text"
          placeholder="Search by name, SKU, supplier..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="form-input filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="in-stock">In Stock</option>
          <option value="low-stock">Low Stock</option>
          <option value="out-of-stock">Out of Stock</option>
        </select>
        <input
          className="form-input filter-select"
          type="text"
          placeholder="Category..."
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="inventory-loading">
          <div className="spinner" style={{ width: 28, height: 28, borderWidth: 2.5 }} />
          <span>Loading products...</span>
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <div className="empty-title">No products found</div>
          <div className="empty-sub">
            {search || filterStatus || filterCategory
              ? 'Try adjusting your filters.'
              : 'Add your first product to get started.'}
          </div>
          {!search && !filterStatus && !filterCategory && (
            <button
              className="btn btn-primary"
              onClick={() => { setEditProduct(null); setShowProductModal(true); }}
            >
              Add Product
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Supplier</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const s = STATUS_MAP[p.status] || STATUS_MAP['in-stock'];
                  return (
                    <tr key={p._id}>
                      <td>
                        <div className="product-name">{p.name}</div>
                        {p.location && <div className="product-loc">{p.location}</div>}
                      </td>
                      <td><span className="sku-badge">{p.sku}</span></td>
                      <td>{p.category}</td>
                      <td>
                        <span className={p.quantity === 0 ? 'text-red' : p.quantity <= p.minStockLevel ? 'text-yellow' : ''}>
                          {p.quantity}
                        </span>
                      </td>
                      <td>₹{p.price.toLocaleString('en-IN')}</td>
                      <td><span className={`badge ${s.cls}`}>{s.label}</span></td>
                      <td className="text-muted">{p.supplier || '—'}</td>
                      <td>
                        <div className="action-btns">
                          <button
                            className="action-btn action-adjust"
                            onClick={() => openAdjust(p)}
                            title="Adjust Stock"
                          >
                            ⇅
                          </button>
                          <button
                            className="action-btn action-edit"
                            onClick={() => openEdit(p)}
                            title="Edit"
                          >
                            ✎
                          </button>
                          <button
                            className="action-btn action-delete"
                            onClick={() => setDeleteConfirm(p)}
                            title="Delete"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-secondary btn-sm"
                disabled={pagination.currentPage === 1}
                onClick={() => fetchProducts(pagination.currentPage - 1)}
              >
                ← Prev
              </button>
              <span className="page-info">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => fetchProducts(pagination.currentPage + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <ProductModal
          product={editProduct}
          onSave={handleSaveProduct}
          onClose={() => { setShowProductModal(false); setEditProduct(null); }}
          loading={actionLoading}
        />
      )}

      {/* Adjust Modal */}
      {showAdjustModal && adjustProduct && (
        <AdjustModal
          product={adjustProduct}
          onAdjust={handleAdjust}
          onClose={() => { setShowAdjustModal(false); setAdjustProduct(null); }}
          loading={actionLoading}
        />
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <h3>Delete Product</h3>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>×</button>
            </div>
            <p style={{ color: 'var(--text2)', marginBottom: 20 }}>
              Are you sure you want to delete <strong style={{ color: 'var(--text)' }}>{deleteConfirm.name}</strong>?
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button
                className="btn btn-danger"
                disabled={actionLoading}
                onClick={() => handleDelete(deleteConfirm._id)}
              >
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
