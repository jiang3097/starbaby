import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ClipboardList, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

const Navigation = () => {
  const navItems = [
    { icon: Home, label: '首页', path: '/' },
    { icon: ClipboardList, label: '成长档案', path: '/growth' },
    { icon: Settings, label: '家长设置', path: '/settings' },
  ];

  return (
    <nav className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] h-16 bg-white/90 backdrop-blur-md border border-slate-100 rounded-full shadow-lg flex items-center justify-around px-4 z-40">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }: { isActive: boolean }) => cn(
            "flex flex-col items-center justify-center space-y-1 transition-all duration-300 rounded-full w-16 h-14",
            isActive ? "text-sky-500 scale-110" : "text-slate-400"
          )}
        >
          {({ isActive }: { isActive: boolean }) => (
            <>
              <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default Navigation;
