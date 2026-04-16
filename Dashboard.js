import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productAPI } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import './Dashboard.css';

const StatCard = ({ label, value, sub, color }) => (
  <div className="stat-card" style={{ '--card-accent': color }}>
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
    {sub && <div className="stat-sub">{sub}</div>}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <div className="chart-tooltip-label">{label}</div>
        <div className="chart-tooltip-value">{payload[0].value} items</div>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await productAPI.getStats();
        setStats(data.stats);
      } catch (err) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        <span>Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  const chartData = stats?.categories?.slice(0, 8).map(c => ({
    name: c._id || 'Uncategorized',
    count: c.count,
  })) || [];

  const COLORS = ['#6c63ff', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7', '#f97316', '#84cc16'];

  return (
    <div className="dashboard">
      <div className="page-title">Dashboard</div>
      <div className="page-subtitle">Real-time overview of your inventory</div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <StatCard
          label="Total Products"
          value={stats?.totalProducts ?? 0}
          sub="Across all categories"
          color="#6c63ff"
        />
        <StatCard
          label="In Stock"
          value={stats?.inStock ?? 0}
          sub="Healthy stock level"
          color="#22c55e"
        />
        <StatCard
          label="Low Stock"
          value={stats?.lowStock ?? 0}
          sub="Needs reordering"
          color="#f59e0b"
        />
        <StatCard
          label="Out of Stock"
          value={stats?.outOfStock ?? 0}
          sub="Immediate action needed"
          color="#ef4444"
        />
        <StatCard
          label="Total Inventory Value"
          value={`₹${(stats?.totalValue ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          sub="At selling price"
          color="#06b6d4"
        />
      </div>

      <div className="dashboard-row">
        {/* Category Chart */}
        <div className="card chart-card">
          <div className="card-header">
            <h3>Products by Category</h3>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'var(--text2)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--text2)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-chart">No category data yet. <Link to="/inventory">Add products</Link></div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="card transactions-card">
          <div className="card-header">
            <h3>Recent Activity</h3>
          </div>
          {stats?.recentTransactions?.length > 0 ? (
            <div className="transaction-list">
              {stats.recentTransactions.map((t) => (
                <div key={t._id} className="transaction-item">
                  <div className={`txn-icon ${t.type === 'stock-in' ? 'txn-in' : 'txn-out'}`}>
                    {t.type === 'stock-in' ? '↑' : '↓'}
                  </div>
                  <div className="txn-details">
                    <div className="txn-product">{t.product?.name || 'Unknown Product'}</div>
                    <div className="txn-meta">
                      {t.type === 'stock-in' ? '+' : '-'}{t.quantity} units •{' '}
                      {t.performedBy?.name || 'System'} •{' '}
                      {new Date(t.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-chart">No transactions yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
