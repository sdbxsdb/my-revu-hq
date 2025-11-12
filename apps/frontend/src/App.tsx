import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePayment } from '@/contexts/PaymentContext';
import { Layout } from '@/components/Layout';
import { Login } from '@/pages/Login';
import { AccountSetup } from '@/pages/AccountSetup';
import { Billing } from '@/pages/Billing';
import { AddCustomer } from '@/pages/AddCustomer';
import { CustomerList } from '@/pages/CustomerList';
import { Paper, Title, Text, Button } from '@mantine/core';
import { IconLock } from '@tabler/icons-react';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { hasPaid } = usePayment();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Allow access to billing page and customer pages even if unpaid
  // But block other pages (like account setup)
  const allowedUnpaidPaths = ['/billing', '/customers', '/customers/add'];
  if (!hasPaid && !allowedUnpaidPaths.includes(location.pathname)) {
    return (
      <Layout>
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <Paper shadow="md" p="xl" className="max-w-2xl mx-auto text-center">
            <IconLock size={48} className="mx-auto mb-4 text-gray-400" />
            <Title order={2} className="text-2xl font-bold mb-2 text-white">
              Payment Required
            </Title>
            <Text size="sm" className="text-gray-400 mb-6">
              Please set up your payment method to access this feature.
            </Text>
            <Button component={Link} to="/billing" variant="filled" color="teal" size="md">
              Go to Billing
            </Button>
          </Paper>
        </div>
      </Layout>
    );
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
          <Route path="/" element={<Navigate to="/account" replace />} />
          <Route path="/account" element={<AccountSetup />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/customers/add" element={<AddCustomer />} />
          <Route path="/customers" element={<CustomerList />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
