import { NavLink } from 'react-router-dom';
import {
  IconSettings,
  IconUserPlus,
  IconList,
  IconLogout
} from '@tabler/icons-react';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar = ({ onClose }: SidebarProps) => {
  const { signOut } = useAuth();

  const navItems = [
    { to: '/account', label: 'Account Settings', icon: IconSettings },
    { to: '/customers/add', label: 'Add Customer', icon: IconUserPlus },
    { to: '/customers', label: 'Customer List', icon: IconList },
  ];

  const handleNavClick = () => {
    // Close sidebar on mobile when a link is clicked
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="w-64 bg-[#141414] border-r border-[#2a2a2a] text-white min-h-screen p-6 flex flex-col">
      <div className="mb-10 hidden lg:block">
        <h1 className="text-2xl font-bold text-white mb-1">Rate My Work</h1>
        <p className="text-xs text-gray-400">Review Management</p>
      </div>

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
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium ${isActive
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/30'
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

      <button
        onClick={() => {
          signOut();
          handleNavClick();
        }}
        className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-[#2a2a2a] hover:text-red-400 transition-all duration-200 font-medium border-t border-[#2a2a2a] mt-auto pt-4"
      >
        <IconLogout size={20} />
        <span>Logout</span>
      </button>
    </div>
  );
};

