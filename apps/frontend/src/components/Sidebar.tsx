import { NavLink, Link } from 'react-router-dom';
import {
  IconDeviceMobile,
  IconUserPlus,
  IconList,
  IconLogout,
  IconCreditCard,
  IconInfoCircle,
} from '@tabler/icons-react';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar = ({ onClose }: SidebarProps) => {
  const { signOut, user } = useAuth();

  const navItems = [
    { to: '/about', label: 'About', icon: IconInfoCircle },
    { to: '/customers/add', label: 'Add Customer', icon: IconUserPlus },
    { to: '/customers', label: 'Customer List', icon: IconList },
    { to: '/account', label: 'SMS Setup', icon: IconDeviceMobile },
    { to: '/billing', label: 'Billing', icon: IconCreditCard },
  ];

  const handleNavClick = () => {
    // Close sidebar on mobile when a link is clicked
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="w-64 bg-[#141414] border-r border-[#2a2a2a] text-white h-full p-6 flex flex-col overflow-y-auto overscroll-contain">
      <div className="mb-10 hidden lg:block">
        <div className="mb-2">
          <img
            src="/assets/logos/myrevuhq.png"
            alt="MyRevuHQ"
            className="h-10 w-auto object-contain"
          />
        </div>
        <p className="text-xs text-gray-400">Review Management</p>
      </div>

      {user && (
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/customers'}
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
          })}
        </nav>
      )}

      {/* Legal links footer */}
      <div className="mt-auto pt-4 border-t border-[#2a2a2a]">
        <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center text-xs text-gray-500 mb-4">
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

      {user && (
        <div className="space-y-2">
          <div className="px-4 py-2 text-xs text-gray-500 truncate" title={user.email}>
            {user.email}
          </div>
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
        </div>
      )}

      {!user && (
        <Link
          to="/login"
          onClick={handleNavClick}
          className="flex items-center justify-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-[#2a2a2a] hover:text-teal-400 transition-all duration-200 font-medium"
        >
          <span>Login</span>
        </Link>
      )}
    </div>
  );
};
