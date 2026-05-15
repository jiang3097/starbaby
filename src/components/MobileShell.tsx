import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Home } from 'lucide-react';
import { cn } from '../lib/utils';

interface MobileShellProps {
  children: React.ReactNode;
  className?: string;
  showNav?: boolean;
}

const MobileShell: React.FC<MobileShellProps> = ({ children, className, showNav = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 是否显示返回主页按钮（除了主页本身）
  const showBackHome = location.pathname !== '/home';
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4 font-sans selection:bg-sky-100">
      <div className={cn(
        "relative w-full max-w-[414px] h-[100dvh] max-h-[100dvh] bg-white rounded-[48px] shadow-2xl overflow-hidden border-[8px] border-slate-900 flex flex-col",
        className
      )}>
        {/* Notch / Status Bar Area */}
        <div className="h-10 w-full flex items-center justify-between px-8 pt-4 pb-2 text-xs font-semibold text-slate-400 bg-transparent absolute top-0 z-50">
          <span>9:41</span>
          <div className="flex gap-1.5 items-center">
            <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center">
              <div className="w-1 h-1 bg-slate-400 rounded-full" />
            </div>
            <span>5G</span>
            <div className="w-6 h-3 border border-slate-400 rounded-sm relative">
              <div className="absolute left-0.5 top-0.5 bottom-0.5 right-1.5 bg-slate-400 rounded-px" />
              <div className="absolute -right-1 top-1 w-0.5 h-1 bg-slate-400 rounded-r-full" />
            </div>
          </div>
        </div>

        {/* 返回主页按钮 - 始终显示在左上角 */}
        {showBackHome && (
          <button
            onClick={() => navigate('/home')}
            className="absolute left-3 top-12 z-50 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
          >
            <Home size={20} className="text-slate-500" />
          </button>
        )}

        {/* Content */}
        <div className={cn("flex-1 overflow-y-auto mt-10 scrollbar-hide", showNav ? "mb-20" : "")}>
          {children}
        </div>

        {/* Home Indicator */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-200 rounded-full z-50" />
      </div>
    </div>
  );
};

export default MobileShell;
