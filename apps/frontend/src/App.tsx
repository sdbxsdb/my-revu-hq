import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Login } from '@/pages/Login';
import { AccountSetup } from '@/pages/AccountSetup';
import { AddCustomer } from '@/pages/AddCustomer';
import { CustomerList } from '@/pages/CustomerList';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/"
            element={<Navigate to="/account" replace />}
          />
          <Route path="/account" element={<AccountSetup />} />
          <Route path="/customers/add" element={<AddCustomer />} />
          <Route path="/customers" element={<CustomerList />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

