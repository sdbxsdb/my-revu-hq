import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { OfflineAlert } from './OfflineAlert';
import { IconMenu2, IconX } from '@tabler/icons-react';
import { useAuth } from '@/hooks/useAuth';

interface LayoutProps {
  children?: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogoClick = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

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
        className={`fixed lg:fixed left-0 z-50 transform transition-transform duration-300 ease-in-out sidebar-mobile-height lg:h-screen ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <main className="flex-1 w-full lg:ml-64 bg-gray-950 min-h-screen">
        {/* Mobile header */}
        <div className="lg:hidden bg-[#141414] border-b border-[#2a2a2a] sticky top-0 z-30 p-4 flex items-center justify-between">
          <button
            onClick={handleLogoClick}
            className="flex flex-col items-start cursor-pointer hover:opacity-80 transition-opacity"
          >
            <img
              src="/assets/logos/myrevuhq.png"
              alt="MyRevuHQ"
              className="h-16 w-auto object-contain mb-1 -ml-1"
            />
            <p className="text-[10px] text-gray-300 font-bold tracking-wider uppercase leading-tight">
              Business Review Management
            </p>
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-[#2a2a2a] active:bg-[#333333] transition-colors text-gray-300"
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <IconX size={24} /> : <IconMenu2 size={24} />}
          </button>
        </div>

        {/* Page content */}
        <div className="p-0 max-w-7xl mx-auto min-h-screen lg:flex lg:flex-col lg:px-8 lg:py-8">
          <div className="lg:flex-1 lg:flex lg:flex-col">
            <OfflineAlert />
            {children || <Outlet />}
          </div>
        </div>
      </main>
    </div>
  );
};
