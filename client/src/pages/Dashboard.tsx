import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowUpRight, Package, TrendingUp, Users, Calendar, MapPin, Zap } from 'lucide-react';
import { getDashboardSummary } from '../api/dashboard';
import { format } from 'date-fns';

function StatCard({ label, value, hint, tone, testid }: { label: string; value: string | number; hint?: string; tone?: 'accent' | 'danger' | 'success'; testid: string }) {
  return (
    <div className={`stat ${tone ?? ''}`} data-testid={testid}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { data, isLoading, error } = useQuery({ queryKey: ['dashboard-summary'], queryFn: getDashboardSummary });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Operations Dashboard</h1>
          <p>Live view of leads, inventory health and rooftop dispatch activity.</p>
        </div>
      </div>

      {isLoading && (
        <div className="stat-grid" data-testid="dashboard-skeleton">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 96 }} />)}
        </div>
      )}
      {error && <div className="card"><div className="card-body">Failed to load dashboard.</div></div>}

      {data && (
        <>
          <div className="stat-grid">
            <StatCard label="Solar Leads" value={data.totalLeads} hint="New / open" tone="accent" testid="stat-leads" />
            <StatCard label="Active Customers" value={data.activeCustomers} hint="In fulfilment" tone="success" testid="stat-active" />
            <StatCard label="Follow-ups Today" value={data.followUpsDueToday} hint="Due for outreach" testid="stat-followups" />
            <StatCard label="Site Surveys Upcoming" value={data.siteSurveysScheduled} hint="Scheduled visits" testid="stat-surveys" />
            <StatCard label="Pipeline Capacity" value={`${Number(data.pipelineCapacityKw).toLocaleString()} kW`} hint="Estimated across leads" testid="stat-pipeline" />
            <StatCard label="Equipment SKUs" value={data.totalProducts} hint="Distinct products" testid="stat-products" />
            <StatCard label="Low-Stock Items" value={data.lowStockProducts} hint="Below minimum" tone={data.lowStockProducts > 0 ? 'danger' : 'success'} testid="stat-lowstock" />
            <StatCard label="Confirmed Dispatches (MTD)" value={data.confirmedChallansThisMonth} hint={`${data.unitsDispatchedThisMonth} units shipped`} tone="accent" testid="stat-dispatch" />
          </div>

          <div className="grid-2">
            <div className="card" data-testid="recent-challans-card">
              <div className="card-body">
                <div className="row between mb-md">
                  <h2 className="card-title"><FileTextInline /> Recent Challans</h2>
                  <Link to="/challans" className="btn btn-subtle btn-sm">View all <ArrowUpRight size={14} /></Link>
                </div>
                {data.recentChallans.length === 0 ? (
                  <div className="muted">No challans yet.</div>
                ) : (
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead><tr><th>Challan #</th><th>Customer</th><th>Status</th><th className="num">Qty</th><th>Date</th></tr></thead>
                      <tbody>
                        {data.recentChallans.map((c) => (
                          <tr key={c.id}>
                            <td className="mono"><Link to={`/challans/${c.id}`}>{c.challanNumber}</Link></td>
                            <td>{c.customer?.businessName || c.customer?.customerName}</td>
                            <td><StatusBadge status={c.status} /></td>
                            <td className="num">{c.totalQuantity}</td>
                            <td className="tiny muted">{format(new Date(c.createdAt), 'dd MMM yyyy')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="card" data-testid="recent-movements-card">
              <div className="card-body">
                <div className="row between mb-md">
                  <h2 className="card-title"><Package size={16} /> Recent Stock Movements</h2>
                  <Link to="/stock-movements" className="btn btn-subtle btn-sm">View all <ArrowUpRight size={14} /></Link>
                </div>
                {data.recentMovements.length === 0 ? (
                  <div className="muted">No movements recorded.</div>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {data.recentMovements.map((m) => (
                      <li key={m.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--slate-100)' }}>
                        <div className="row between">
                          <div>
                            <strong>{m.product?.productName}</strong>
                            <div className="tiny muted">{m.reason}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span className={`badge ${m.movementType === 'IN' ? 'badge-success' : 'badge-warning'}`}>
                              {m.movementType} · {m.quantityChanged}
                            </span>
                            <div className="tiny muted">{format(new Date(m.createdAt), 'dd MMM, HH:mm')}</div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {data.lowStockProducts > 0 && (
            <div className="card mt-lg" style={{ borderLeft: '3px solid var(--amber-600)' }} data-testid="low-stock-alert">
              <div className="card-body row gap-md">
                <AlertTriangle size={20} color="var(--amber-600)" />
                <div>
                  <strong>{data.lowStockProducts} equipment items are at or below the alert threshold.</strong>
                  <div className="tiny muted">Review the equipment list and raise a purchase order or intake stock to avoid dispatch delays.</div>
                </div>
                <Link to="/products?lowStock=true" className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }}>Review low stock</Link>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

function FileTextInline() { return <TrendingUp size={16} />; }

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = { DRAFT: 'badge-neutral', CONFIRMED: 'badge-success', CANCELLED: 'badge-danger' };
  return <span className={`badge ${map[status] ?? 'badge-neutral'}`}>{status}</span>;
}

/* eslint-disable @typescript-eslint/no-unused-vars */
const _icons = { Users, Calendar, MapPin, Zap };
