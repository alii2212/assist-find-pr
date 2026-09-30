import React from 'react';
import {
  ExternalLink,
  Zap,
  Layers,
  Users,
  Compass,
  Award,
  Sparkles,
  ArrowLeft,
  Building,
  CheckCircle,
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
    <div className="w-full min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans select-none pointer-events-auto">
      {/* Simulation Browser Bar */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <span className="text-slate-400 font-medium mr-2 hidden sm:inline">
            وب‌سایت رسمی مرکز توسعه و فناوری فراز (نوفرآز یزد)
          </span>
        </div>

        {/* URL Bar */}
        <div className="flex-1 max-w-xl bg-slate-900 border border-slate-800 rounded-lg px-3 py-1 flex items-center justify-between text-slate-300 font-mono text-[11px] dir-ltr">
          <span className="truncate">{currentUrl}</span>
          <a
            href={currentUrl}
            target="_blank"
            rel="noreferrer"
            className="text-slate-500 hover:text-emerald-400 ml-2 shrink-0"
            title="باز کردن سایت اصلی در تب جدید"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onNavigateToAdmin && (
            <button
              onClick={onNavigateToAdmin}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1 cursor-pointer transition-colors"
              title="ورود به پنل مدیریت دستیار (/admin)"
            >
              <span className="hidden sm:inline">پنل مدیریت</span>
              <span className="font-mono text-[10px] text-emerald-400">/admin</span>
            </button>
          )}

          {onNavigateToWidget && (
            <button
              onClick={onNavigateToWidget}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1 cursor-pointer transition-colors"
              title="مشاهده صفحه مستقل ویجت (/widget)"
            >
              <span className="hidden sm:inline">ویجت</span>
              <span className="font-mono text-[10px] text-teal-400">/widget</span>
            </button>
          )}

          {isAdmin && onOpenAdminPanel && (
            <button
              onClick={onOpenAdminPanel}
              className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs flex items-center gap-1 cursor-pointer transition-colors"
              title="مدیریت دانش سایت (ویژه مدیران)"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">مدیریت دانش</span>
            </button>
          )}

          <button
            onClick={onOpenAssistant}
            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1 shadow cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">باز کردن</span> دستیار
          </button>
        </div>
      </div>

      {/* Website Navigation simulation */}
      <header className="bg-white text-slate-900 shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              ن
            </div>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">
                مرکز نوآوری و شتابدهی نوفرآز
              </h1>
              <p className="text-[11px] text-slate-500">
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
                      ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
      <div className="lg:hidden bg-slate-100 p-2 border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs text-slate-800">
        <span className="shrink-0 font-semibold text-[11px] text-slate-500">صفحه فعال:</span>
        {pages.map((p) => (
          <button
            key={p.path}
            onClick={() => onNavigate(p.path)}
            className={`px-2.5 py-1 rounded-md text-[11px] whitespace-nowrap shrink-0 ${
              p.path === currentUrl ? 'bg-emerald-600 text-white font-bold' : 'bg-white text-slate-700 border'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Main Website Simulated Content */}
      <div className="flex-1 bg-slate-950 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Hero Section */}
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-emerald-950/40 border border-slate-800 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="max-w-2xl relative z-10 space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5" />
              {activePage.name} (CURRENT_PAGE_URL)
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
              تبدیل ایده‌ها و مهارت‌های شما به پروژه‌های فناورانه و شرکت‌های دانش‌بنیان
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              شتابدهنده و مرکز نوآوری نوفرآز با همراهی دانشگاه یزد، بستر حمایت از تیم‌ها، فراخوان‌های صنعتی و اجرای پروژه‌های پیشرفته در حوزه‌های انرژی، اینترنت اشیاء، هوش مصنوعی، روباتیک و سلامت است.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={onOpenAssistant}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>مشاوره و انتخاب پروژه متناسب با شما</span>
              </button>
            </div>
          </div>
        </div>

        {/* Highlighted Project Domains from crawled data */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white mb-1">
              حوزه انرژی و بهینه‌سازی
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              پایش هوشمند خطوط انتقال برق، تحلیل داده‌های مصرف با پایتون، سیستم‌های اینترنت اشیاء (IoT) و ماژول‌های مدیریت باتری (BMS).
            </p>
            <span className="text-[11px] text-emerald-400 font-semibold">۶۰ پروژه و فراخوان فعال</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white mb-1">
              روباتیک و تجهیزات پیشرفته (ROV)
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              توسعه محصول ربات زیرسطحی کنترل از راه دور، سیستم‌های پردازش سیگنال و بینایی ماشین جهت مانیتورینگ صنعتی و محیطی.
            </p>
            <span className="text-[11px] text-blue-400 font-semibold">۴+ پروژه تخصصی در دست اجرا</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white mb-1">
              جذب تیم و هم‌تیمی تخصصی
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              فرصت همکاری برای دانشجویان مهندسی برق، کامپیوتر، مکانیک، صنایع و مدیریت جهت ورود به تیم‌های نوپا و هدایت تا شرکت دانش‌بنیان.
            </p>
            <span className="text-[11px] text-purple-400 font-semibold">استقرار و آزمایشگاه در دانشگاه یزد</span>
          </div>
        </div>
      </div>
    </div>
  );
};
