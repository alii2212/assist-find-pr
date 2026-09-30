import React from 'react';
import { LogIn, LogOut, CheckCircle2, Bot, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  onLogin: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isAuthenticated,
  isLoadingAuth,
  onLogin,
  onLogout,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Brand & Title */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-bold">
              <Bot className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  دستیار هوشمند یونس دهقان
                </h1>
                <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" />
                  مبتنی بر داده‌های موثق
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                درباره فعالیت‌ها، سوابق و حوزه‌های کاری من سؤال بپرسید
              </p>
            </div>
          </div>
        </div>

        {/* Authentication Controls */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {isLoadingAuth ? (
            <div className="flex items-center gap-2 text-xs text-slate-400 py-1.5 px-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
              <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              <span>در حال بررسی وضعیت ورود...</span>
            </div>
          ) : isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>شما وارد شده‌اید</span>
              </div>
              <button
                onClick={onLogout}
                type="button"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-rose-300 hover:bg-rose-500/10 px-3 py-1.5 rounded-lg border border-slate-700/80 hover:border-rose-500/30 transition-colors cursor-pointer"
                title="خروج از حساب کاربری"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>خروج</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              type="button"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-medium text-slate-950 bg-white hover:bg-slate-100 active:scale-[0.98] px-4 py-2 rounded-xl shadow-md transition-all cursor-pointer font-sans"
            >
              {/* Google G Icon */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>ورود با Google</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
