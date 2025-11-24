import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AccountProvider } from '@/contexts/AccountContext';
import { PaymentProvider } from '@/contexts/PaymentContext';
import { Layout } from '@/components/Layout';
import { ScrollToTop } from '@/components/ScrollToTop';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Login } from '@/pages/Login';
import { AccountSetup } from '@/pages/AccountSetup';
import { Billing } from '@/pages/Billing';
import { BillingSuccess } from '@/pages/BillingSuccess';
import { BillingCancel } from '@/pages/BillingCancel';
import { AddCustomer } from '@/pages/AddCustomer';
import { CustomerList } from '@/pages/CustomerList';
import { Terms } from '@/pages/Terms';
import { Privacy } from '@/pages/Privacy';
import { About } from '@/pages/About';
import { Home } from '@/pages/Home';
import { Help } from '@/pages/Help';
import { ResetPassword } from '@/pages/ResetPassword';
import { Analytics } from '@/pages/Analytics';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const [showTimeoutError, setShowTimeoutError] = React.useState(false);

  React.useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        setShowTimeoutError(true);
      }, 10000);
      return () => clearTimeout(timeout);
    } else {
      setShowTimeoutError(false);
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
          {showTimeoutError ? (
            <div className="mt-4">
              <p className="text-red-400 text-sm mb-2">Loading is taking longer than expected</p>
              <button
                onClick={() => (window.location.href = '/login')}
                className="text-teal-400 hover:text-teal-300 text-sm underline"
              >
                Go to login page
              </button>
            </div>
          ) : (
            <p className="text-xs text-gray-500 mt-2">
              If this takes too long, check your connection
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Always allow access - payment warnings are shown on individual pages
  return <>{children}</>;
};

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ScrollToTop />
        <AccountProvider>
          <PaymentProvider>
            <Routes>
              <Route element={<Layout />}>
                {/* Public pages with navigation */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/about" element={<About />} />
                <Route path="/help" element={<Help />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
              </Route>
              {/* Protected routes with navigation */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/home" element={<Navigate to="/about" replace />} />
              <Route path="/account" element={<AccountSetup />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/billing/success" element={<BillingSuccess />} />
              <Route path="/billing/cancel" element={<BillingCancel />} />
              <Route path="/customers/add" element={<AddCustomer />} />
              <Route path="/customers" element={<CustomerList />} />
            </Route>
            </Routes>
          </PaymentProvider>
        </AccountProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
