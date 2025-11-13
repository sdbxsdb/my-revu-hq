import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { IconMenu2, IconX, IconCreditCard, IconCreditCardOff } from '@tabler/icons-react';
import { usePayment } from '@/contexts/PaymentContext';
import { Switch, Tooltip } from '@mantine/core';

interface LayoutProps {
  children?: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { hasPaid, togglePayment } = usePayment();

  return (
    <div className="flex min-h-screen">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <main className="flex-1 w-full lg:ml-0 bg-gray-950 min-h-screen">
        {/* Mobile header */}
        <div className="lg:hidden bg-[#141414] border-b border-[#2a2a2a] sticky top-0 z-30 p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">MyRevuHQ</h1>
          <div className="flex items-center gap-3">
            <Tooltip label={hasPaid ? 'Payment Active' : 'Payment Required'}>
              <div className="flex items-center gap-2">
                {hasPaid ? (
                  <IconCreditCard size={20} className="text-teal-400" />
                ) : (
                  <IconCreditCardOff size={20} className="text-red-400" />
                )}
                <Switch
                  checked={hasPaid}
                  onChange={togglePayment}
                  size="sm"
                  color="teal"
                  aria-label="Toggle payment status"
                />
              </div>
            </Tooltip>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-[#2a2a2a] active:bg-[#333333] transition-colors text-gray-300"
              aria-label="Toggle menu"
            >
              {sidebarOpen ? <IconX size={24} /> : <IconMenu2 size={24} />}
            </button>
          </div>
        </div>

        {/* Desktop header with payment toggle */}
        <div className="hidden lg:flex bg-[#141414] border-b border-[#2a2a2a] sticky top-0 z-30 p-4 items-center justify-end">
          <Tooltip label={hasPaid ? 'Payment Active' : 'Payment Required'}>
            <div className="flex items-center gap-2">
              {hasPaid ? (
                <IconCreditCard size={20} className="text-teal-400" />
              ) : (
                <IconCreditCardOff size={20} className="text-red-400" />
              )}
              <Switch
                checked={hasPaid}
                onChange={togglePayment}
                size="sm"
                color="teal"
                aria-label="Toggle payment status"
              />
              <span className="text-sm text-gray-400">{hasPaid ? 'Paid' : 'Unpaid'}</span>
            </div>
          </Tooltip>
        </div>

        {/* Page content */}
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">{children || <Outlet />}</div>
      </main>
    </div>
  );
};
