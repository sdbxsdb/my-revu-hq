import { NavLink, Link } from 'react-router-dom';
import {
  IconDeviceMobile,
  IconUserPlus,
  IconList,
  IconLogout,
  IconCreditCard,
  IconInfoCircle,
  IconHome,
  IconLogin,
  IconHelpCircle,
  IconChartBar,
  IconLayoutDashboard,
} from '@tabler/icons-react';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar = ({ onClose }: SidebarProps) => {
  const { signOut, user } = useAuth();

  // Dashboard section
  const dashboardNavItem = user
    ? [{ to: '/dashboard', label: 'Dashboard', icon: IconLayoutDashboard }]
    : [];

  // Customers section
  const customerNavItems = user
    ? [
        { to: '/customers/add', label: 'Add Customer', icon: IconUserPlus },
        { to: '/customers', label: 'Customer List', icon: IconList },
      ]
    : [];

  // Account section
  const accountNavItems = user
    ? [
        { to: '/account', label: 'SMS Setup', icon: IconDeviceMobile },
        { to: '/analytics', label: 'Analytics', icon: IconChartBar },
        { to: '/billing', label: 'Billing', icon: IconCreditCard },
      ]
    : [];

  // Others section (no title)
  const otherNavItems = user
    ? [
        { to: '/about', label: 'About', icon: IconInfoCircle },
        { to: '/help', label: 'Help', icon: IconHelpCircle },
      ]
    : [
        { to: '/', label: 'Home', icon: IconHome },
        { to: '/login', label: 'Login', icon: IconLogin },
        { to: '/about', label: 'About', icon: IconInfoCircle },
        { to: '/help', label: 'Help', icon: IconHelpCircle },
      ];

  const handleNavClick = () => {
    // Close sidebar on mobile when a link is clicked
    if (onClose) {
      onClose();
    }
  };

  const renderNavItem = (item: { to: string; label: string; icon: any }) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.to === '/dashboard' || item.to === '/customers' || item.to === '/'}
        onClick={handleNavClick}
        className={({ isActive }) =>
          `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium ${
            isActive
              ? 'bg-[rgb(9,146,104)] text-white shadow-lg shadow-[rgba(9,146,104,0.3)]'
              : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span>{item.label}</span>
          </>
        )}
      </NavLink>
    );
  };

  return (
    <div className="w-64 bg-[#141414] border-r border-[#2a2a2a] text-white h-full p-6 flex flex-col overflow-y-auto overscroll-contain lg:overflow-y-auto lg:overscroll-contain">
      <Link
        to={user ? '/dashboard' : '/'}
        onClick={handleNavClick}
        className="mb-10 hidden lg:block hover:opacity-80 transition-opacity"
      >
        <img
          src="/assets/logos/myrevuhq.png"
          alt="MyRevuHQ"
          className="h-16 w-auto object-contain mb-2"
        />
        <p className="text-[11px] text-gray-300 font-bold tracking-wider uppercase leading-tight text-left">
          Business Review Management
        </p>
      </Link>

      <nav className="flex-1 space-y-6">
        {/* Dashboard Section */}
        {user && dashboardNavItem.length > 0 && (
          <div className="space-y-2">{dashboardNavItem.map(renderNavItem)}</div>
        )}

        {/* Customers Section */}
        {user && customerNavItems.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 mb-2">
              Customers
            </h3>
            {customerNavItems.map(renderNavItem)}
          </div>
        )}

        {/* Account Section */}
        {user && accountNavItems.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 mb-2">
              Account
            </h3>
            {accountNavItems.map(renderNavItem)}
          </div>
        )}

        {/* Info Section */}
        {otherNavItems.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 mb-2">
              Info
            </h3>
            {otherNavItems.map(renderNavItem)}
          </div>
        )}
      </nav>

      {/* Divider */}
      {user && user.email && <div className="my-4 border-t border-[#2a2a2a]" />}

      {/* User section */}
      {user && user.email && (
        <div className="space-y-3">
          <button
            onClick={() => {
              signOut();
              handleNavClick();
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-[#2a2a2a] hover:text-red-400 transition-all duration-200 font-medium w-full"
          >
            <IconLogout size={20} />
            <span>Logout</span>
          </button>
          <div
            className="px-4 py-2 text-xs text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap lg:whitespace-normal lg:overflow-visible lg:text-clip"
            title={user.email}
          >
            {user.email.includes('@') && user.email.length > 20 ? (
              <>
                <span className="block whitespace-nowrap">{user.email.split('@')[0]}</span>
                <span className="block whitespace-nowrap">@{user.email.split('@')[1]}</span>
              </>
            ) : (
              <span className="break-all">{user.email}</span>
            )}
          </div>
        </div>
      )}

      {/* Legal links footer */}
      <div className="mt-4 mb-4 border-t border-[#2a2a2a] pt-4">
        <div className="flex flex-wrap gap-x-2 gap-y-1 justify-center text-xs text-gray-500">
          <Link
            to="/terms"
            onClick={handleNavClick}
            className="hover:text-gray-400 transition-colors"
          >
            Terms
          </Link>
          <span className="text-gray-600">•</span>
          <Link
            to="/privacy"
            onClick={handleNavClick}
            className="hover:text-gray-400 transition-colors"
          >
            Privacy
          </Link>
          <span className="text-gray-600">•</span>
          <a href="mailto:myrevuhq@gmail.com" className="hover:text-gray-400 transition-colors">
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
};
