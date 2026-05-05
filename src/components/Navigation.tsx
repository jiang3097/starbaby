import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../lib/utils';

const Navigation = () => {
  const navItems = [
    { emoji: '🏠', label: '首页', path: '/home' },
    { emoji: '📊', label: '成长', path: '/growth' },
    { emoji: '⚙️', label: '设置', path: '/settings' },
  ];

  return (
    <nav className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] h-18 bg-white/95 backdrop-blur-xl border-2 border-white rounded-full shadow-xl flex items-center justify-around px-4 z-40">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }: { isActive: boolean }) => cn(
            "flex flex-col items-center justify-center gap-1 transition-all duration-300 rounded-2xl px-4 py-2 min-w-[70px]",
            isActive 
              ? "bg-gradient-to-b from-amber-50 to-orange-50 scale-110" 
              : "text-slate-400 hover:text-slate-600"
          )}
        >
          {({ isActive }: { isActive: boolean }) => (
            <>
              <span className={cn(
                "text-2xl transition-transform duration-300",
                isActive && "animate-bounce"
              )}>
                {item.emoji}
              </span>
              <span className={cn(
                "text-[10px] font-bold",
                isActive ? "text-amber-600" : "text-slate-400"
              )}>
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default Navigation;
