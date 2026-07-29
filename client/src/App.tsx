import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Products from './pages/Products';
import Challans from './pages/Challans';
import ChallanCreate from './pages/ChallanCreate';
import ChallanDetail from './pages/ChallanDetail';
import ChallanPrint from './pages/ChallanPrint';
import StockMovements from './pages/StockMovements';
import AppLayout from './layouts/AppLayout';

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 40 }}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 40 }} data-testid="app-loading">Loading…</div>;
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route
        path="/challans/:id/print"
        element={<Protected><ChallanPrint /></Protected>}
      />
      <Route element={<Protected><AppLayout /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="customers" element={<Customers />} />
        <Route path="customers/:id" element={<CustomerDetail />} />
        <Route path="products" element={<Products />} />
        <Route path="stock-movements" element={<StockMovements />} />
        <Route path="challans" element={<Challans />} />
        <Route path="challans/new" element={<ChallanCreate />} />
        <Route path="challans/:id" element={<ChallanDetail />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
