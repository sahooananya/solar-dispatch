import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Package, FileText, LogOut, SunMedium, Boxes, Menu, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '../types';

const NAV: { to: string; label: string; icon: React.ReactNode; roles: UserRole[]; testid: string }[] = [
  { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={18} />, roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'], testid: 'nav-dashboard' },
  { to: '/customers', label: 'Customers & Leads', icon: <Users size={18} />, roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'], testid: 'nav-customers' },
  { to: '/products', label: 'Solar Equipment', icon: <Package size={18} />, roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'], testid: 'nav-products' },
  { to: '/stock-movements', label: 'Stock Movements', icon: <Boxes size={18} />, roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'], testid: 'nav-movements' },
  { to: '/challans', label: 'Delivery Challans', icon: <FileText size={18} />, roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'], testid: 'nav-challans' },
];

const roleLabel: Record<UserRole, string> = {
  ADMIN: 'Administrator',
  SALES: 'Solar Consultant',
  WAREHOUSE: 'Warehouse Coordinator',
  ACCOUNTS: 'Accounts',
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close the drawer on route change.
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  // Close the drawer on Escape while it is open (mobile only).
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  if (!user) return null;
  const nav = NAV.filter((n) => n.roles.includes(user.role));

  return (
    <div className="app-shell">
      <div
        className={`sidebar-scrim${drawerOpen ? ' is-open' : ''}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
        data-testid="sidebar-scrim"
      />
      <aside
        className={`sidebar${drawerOpen ? ' is-open' : ''}`}
        data-testid="sidebar"
        aria-label="Primary navigation"
      >
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark"><SunMedium size={22} /></div>
          <div>
            <h1>SolarDispatch</h1>
            <small>Rooftop Solar ERP</small>
          </div>
          <button
            type="button"
            className="btn btn-subtle btn-sm"
            onClick={() => setDrawerOpen(false)}
            data-testid="close-drawer-btn"
            aria-label="Close navigation"
            style={{ marginLeft: 'auto', color: 'var(--slate-300)', display: drawerOpen ? 'inline-flex' : 'none' }}
          >
            <X size={16} />
          </button>
        </div>
        <nav className="sidebar-nav" aria-label="Primary">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              data-testid={n.testid}
            >
              {n.icon} <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user" data-testid="sidebar-user">
            <strong>{user.name}</strong>
            <span>{roleLabel[user.role]}</span>
          </div>
          <button
            type="button"
            className="btn btn-subtle btn-sm mt-sm"
            onClick={() => { logout(); navigate('/login'); }}
            data-testid="logout-btn"
            style={{ color: 'var(--slate-300)' }}
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>
      <main className="main">
        <div className="topbar">
          <div className="row gap-md">
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation"
              aria-expanded={drawerOpen}
              data-testid="open-drawer-btn"
            >
              <Menu size={18} />
            </button>
            <div className="topbar-role" data-testid="topbar-role">Signed in as {roleLabel[user.role]}</div>
          </div>
          <div className="mono tiny muted" data-testid="topbar-email">{user.email}</div>
        </div>
        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
