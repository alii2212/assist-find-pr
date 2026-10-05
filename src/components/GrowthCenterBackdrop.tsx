import React from 'react';
import {
  ExternalLink,
  Zap,
  Layers,
  Users,
  Sparkles,
} from 'lucide-react';

interface GrowthCenterBackdropProps {
  currentUrl: string;
  onNavigate: (url: string) => void;
  onOpenAssistant: () => void;
  isAdmin?: boolean;
  onOpenAdminPanel?: () => void;
  onNavigateToAdmin?: () => void;
  onNavigateToWidget?: () => void;
}

export const GrowthCenterBackdrop: React.FC<GrowthCenterBackdropProps> = ({
  currentUrl,
  onNavigate,
  onOpenAssistant,
  isAdmin,
  onOpenAdminPanel,
  onNavigateToAdmin,
  onNavigateToWidget,
}) => {
  const pages = [
    { name: 'صفحه اصلی', path: 'https://yazdinnofaraz.ir/' },
    { name: 'حوزه انرژی و بهینه‌سازی', path: 'https://yazdinnofaraz.ir/enrgy/' },
    { name: 'تیم‌ها و پروژه‌ها', path: 'https://yazdinnofaraz.ir/teams/' },
    { name: 'فراخوان‌های باز', path: 'https://yazdinnofaraz.ir/categories/' },
    { name: 'مراحل رشد و شتابدهی', path: 'https://yazdinnofaraz.ir/roshd/' },
    { name: 'تسهیلات و بورسیه', path: 'https://yazdinnofaraz.ir/facility/' },
    { name: 'فرصت‌های شغلی و هم‌تیمی', path: 'https://yazdinnofaraz.ir/career/' },
  ];

  const activePage = pages.find((p) => p.path === currentUrl) || pages[0];

  return (
    <div className="w-full min-h-screen bg-[#f8f7fc] text-slate-800 flex flex-col font-sans select-none pointer-events-auto">
      {/* Simulation Browser Bar */}
      <div className="bg-white border-b border-purple-100 px-4 py-2 flex items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
          </div>
          <span className="text-slate-600 font-medium mr-2 hidden sm:inline text-[11px]">
            وب‌سایت رسمی مرکز نوآوری و توسعه فناوری فراز (نوفرآز دانشگاه یزد)
          </span>
        </div>

        {/* URL Bar */}
        <div className="flex-1 max-w-xl bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 flex items-center justify-between text-slate-700 font-mono text-[11px] dir-ltr shadow-xs">
          <span className="truncate">{currentUrl}</span>
          <a
            href={currentUrl}
            target="_blank"
            rel="noreferrer"
            className="text-slate-400 hover:text-purple-700 ml-2 shrink-0 transition-colors"
            title="باز کردن سایت اصلی در تب جدید"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onNavigateToAdmin && (
            <button
              onClick={onNavigateToAdmin}
              className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs flex items-center gap-1 cursor-pointer transition-colors"
              title="ورود به پنل مدیریت دستیار (/admin)"
            >
              <span className="hidden sm:inline">پنل مدیریت</span>
              <span className="font-mono text-[10px] text-purple-600">/admin</span>
            </button>
          )}

          {onNavigateToWidget && (
            <button
              onClick={onNavigateToWidget}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs flex items-center gap-1 cursor-pointer transition-colors"
              title="مشاهده صفحه مستقل ویجت (/widget)"
            >
              <span className="hidden sm:inline">ویجت</span>
              <span className="font-mono text-[10px] text-slate-500">/widget</span>
            </button>
          )}

          {isAdmin && onOpenAdminPanel && (
            <button
              onClick={onOpenAdminPanel}
              className="px-2.5 py-1 rounded-lg bg-purple-100/80 border border-purple-300 text-purple-800 hover:bg-purple-200 text-xs flex items-center gap-1 cursor-pointer transition-colors font-medium"
              title="مدیریت دانش سایت (ویژه مدیران)"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-700" />
              <span className="hidden sm:inline">مدیریت دانش</span>
            </button>
          )}

          <button
            onClick={onOpenAssistant}
            className="px-3 py-1 rounded-lg bg-gradient-to-r from-purple-700 to-violet-700 hover:from-purple-800 hover:to-violet-800 text-white font-medium text-xs flex items-center gap-1 shadow-sm cursor-pointer transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">باز کردن</span> دستیار
          </button>
        </div>
      </div>

      {/* Website Navigation simulation */}
      <header className="bg-white text-slate-900 shadow-sm border-b border-purple-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-700 to-violet-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              ن
            </div>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">
                مرکز نوآوری و شتابدهی نوفرآز
              </h1>
              <p className="text-[11px] text-purple-700 font-medium">
                مرکز رشد و توسعه فناوری دانشگاه یزد
              </p>
            </div>
          </div>

          {/* Quick page switcher buttons */}
          <nav className="hidden lg:flex items-center gap-1 text-xs">
            {pages.map((p) => {
              const isSelected = p.path === currentUrl;
              return (
                <button
                  key={p.path}
                  onClick={() => onNavigate(p.path)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
                    isSelected
                      ? 'bg-purple-100 text-purple-800 font-bold border border-purple-200'
                      : 'text-slate-600 hover:text-purple-800 hover:bg-purple-50'
                  }`}
                >
                  {p.name}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Mobile Page Navigator Selector */}
      <div className="lg:hidden bg-purple-50/80 p-2 border-b border-purple-150 flex items-center gap-2 overflow-x-auto text-xs text-slate-800">
        <span className="shrink-0 font-semibold text-[11px] text-purple-800">صفحه فعال:</span>
        {pages.map((p) => (
          <button
            key={p.path}
            onClick={() => onNavigate(p.path)}
            className={`px-2.5 py-1 rounded-md text-[11px] whitespace-nowrap shrink-0 transition-colors ${
              p.path === currentUrl
                ? 'bg-purple-700 text-white font-bold'
                : 'bg-white text-slate-700 border border-purple-200 hover:bg-purple-50'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Main Website Simulated Content */}
      <div className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Hero Section */}
        <div className="rounded-3xl bg-gradient-to-br from-white via-purple-50/50 to-indigo-50/40 border border-purple-150 p-6 sm:p-10 shadow-lg shadow-purple-900/5 relative overflow-hidden">
          <div className="max-w-2xl relative z-10 space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 border border-purple-200 text-purple-800 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-purple-700" />
              {activePage.name} (CURRENT_PAGE_URL)
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
              تبدیل ایده‌ها و مهارت‌های شما به پروژه‌های فناورانه و شرکت‌های دانش‌بنیان
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              شتابدهنده و مرکز نوآوری نوفرآز با همراهی دانشگاه یزد، بستر حمایت از تیم‌ها، فراخوان‌های صنعتی و اجرای پروژه‌های پیشرفته در حوزه‌های انرژی، اینترنت اشیاء، هوش مصنوعی، روباتیک و سلامت است.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={onOpenAssistant}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 via-violet-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold text-sm shadow-lg shadow-purple-700/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-purple-200" />
                <span>مشاوره و انتخاب پروژه متناسب با شما</span>
              </button>
            </div>
          </div>
        </div>

        {/* Highlighted Project Domains from crawled data */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-purple-100 hover:border-purple-300 shadow-xs hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1">
              حوزه انرژی و بهینه‌سازی
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              پایش هوشمند خطوط انتقال برق، تحلیل داده‌های مصرف با پایتون، سیستم‌های اینترنت اشیاء (IoT) و ماژول‌های مدیریت باتری (BMS).
            </p>
            <span className="text-[11px] text-purple-700 font-semibold">۶۰ پروژه و فراخوان فعال</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-purple-100 hover:border-purple-300 shadow-xs hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-3">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1">
              روباتیک و تجهیزات پیشرفته (ROV)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              توسعه محصول ربات زیرسطحی کنترل از راه دور، سیستم‌های پردازش سیگنال و بینایی ماشین جهت مانیتورینگ صنعتی و محیطی.
            </p>
            <span className="text-[11px] text-indigo-700 font-semibold">۴+ پروژه تخصصی در دست اجرا</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-purple-100 hover:border-purple-300 shadow-xs hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1">
              جذب تیم و هم‌تیمی تخصصی
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              فرصت همکاری برای دانشجویان مهندسی برق، کامپیوتر، مکانیک، صنایع و مدیریت جهت ورود به تیم‌های نوپا و هدایت تا شرکت دانش‌بنیان.
            </p>
            <span className="text-[11px] text-violet-700 font-semibold">استقرار و آزمایشگاه در دانشگاه یزد</span>
          </div>
        </div>
      </div>
    </div>
  );
};
