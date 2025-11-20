import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { IconMenu2, IconX } from '@tabler/icons-react';
import { useAuth } from '@/hooks/useAuth';

interface LayoutProps {
  children?: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isHomePage = location.pathname === '/';

  const handleLogoClick = () => {
    if (user) {
      navigate('/customers');
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
        className={`fixed lg:static left-0 z-50 transform transition-transform duration-300 ease-in-out sidebar-mobile-height lg:h-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <main className="flex-1 w-full lg:ml-0 bg-gray-950 min-h-screen">
        {/* Mobile header */}
        <div className="lg:hidden bg-[#141414] border-b border-[#2a2a2a] sticky top-0 z-30 p-4 flex items-center justify-between">
          <button
            onClick={handleLogoClick}
            className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
          >
            <img
              src="/assets/logos/myrevuhq.png"
              alt="MyRevuHQ"
              className="h-16 w-auto object-contain"
            />
          </button>
          {(!isHomePage || user) && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-[#2a2a2a] active:bg-[#333333] transition-colors text-gray-300"
              aria-label="Toggle menu"
            >
              {sidebarOpen ? <IconX size={24} /> : <IconMenu2 size={24} />}
            </button>
          )}
        </div>

        {/* Desktop header */}
        <div className="hidden lg:flex bg-[#141414] border-b border-[#2a2a2a] sticky top-0 z-30 p-4">
          {/* Empty header for desktop - can add content here if needed */}
        </div>

        {/* Page content */}
        <div className="p-4 max-w-7xl mx-auto">{children || <Outlet />}</div>
      </main>
    </div>
  );
};
