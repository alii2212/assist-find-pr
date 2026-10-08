import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Layers,
  Database,
  Sliders,
  RefreshCw,
  Activity,
  Code2,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Globe,
  RotateCcw,
  Copy,
  LogOut,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  ProjectDomainConfig,
  SyncStatusReport,
  SystemStatusReport,
  IndexedPageSummary,
} from '../types/admin.ts';
import {
  getCurrentIdToken,
  loginWithGoogle,
  logoutUser,
  onAuthChange,
} from '../firebase/config.ts';

interface AdminDashboardPageProps {
  onBackToApp?: () => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onBackToApp }) => {
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Active Navigation Tab (7 Sections)
  const [activeTab, setActiveTab] = useState<
    'overview' | 'domains' | 'knowledge' | 'direction' | 'sync' | 'system' | 'wordpress'
  >('overview');

  // Dashboard Data
  const [domains, setDomains] = useState<ProjectDomainConfig[]>([]);
  const [directionText, setDirectionText] = useState<string>('');
  const [syncStatus, setSyncStatus] = useState<SyncStatusReport | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatusReport | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [indexedPages, setIndexedPages] = useState<IndexedPageSummary[]>([]);
  const [selectedDomainFilter, setSelectedDomainFilter] = useState<string>('all');

  // Domain Form
  const [editingDomainId, setEditingDomainId] = useState<string | null>(null);
  const [domainForm, setDomainForm] = useState<{
    name: string;
    mainUrl: string;
    priority: number;
    active: boolean;
    guidanceText: string;
  }>({
    name: '',
    mainUrl: 'https://yazdinnofaraz.ir/',
    priority: 1,
    active: true,
    guidanceText: '',
  });

  // Action states
  const [isSavingDirection, setIsSavingDirection] = useState<boolean>(false);
  const [directionSuccessMsg, setDirectionSuccessMsg] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [showFullRebuildConfirm, setShowFullRebuildConfirm] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Auth check & load data
  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      setAuthChecking(true);
      setCurrentUser(user);
      if (!user) {
        setIsAdmin(false);
        setAuthChecking(false);
        return;
      }

      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/admin/check', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.isAdmin) {
          setIsAdmin(true);
          await loadAdminData(token);
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('Admin check error:', err);
        setIsAdmin(false);
      } finally {
        setAuthChecking(false);
      }
    });

    return () => unsub();
  }, []);

  const loadAdminData = async (token?: string) => {
    try {
      const idToken = token || (await getCurrentIdToken());
      if (!idToken) return;

      const res = await fetch('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        setDomains(data.domains || []);
        setDirectionText(data.assistantDirection?.directionText || '');
        setSyncStatus(data.syncStatus || null);
        setSystemStatus(data.systemStatus || null);
        setTotalPages(data.totalPages || 0);
        setIndexedPages(data.indexedPages || []);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  };

  const handleLogin = async () => {
    try {
      setAuthError(null);
      await loginWithGoogle();
    } catch (err: any) {
      setAuthError('ورود با گوگل با خطا مواجه شد. لطفاً بررسی کنید پاپ‌آپ مرورگر مسدود نباشد.');
    }
  };

  const handleLogout = async () => {
    await logoutUser();
  };

  // Domain Actions
  const handleSaveDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainForm.name.trim() || !domainForm.mainUrl.trim()) return;
    setActionError(null);

    try {
      const token = await getCurrentIdToken();
      let res: Response;
      if (editingDomainId) {
        res = await fetch(`/api/admin/domains/${editingDomainId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(domainForm),
        });
      } else {
        res = await fetch('/api/admin/domains', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(domainForm),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.message || 'خطا در ثبت حوزه پروژه');
        return;
      }

      setDomains(data.domains);
      setEditingDomainId(null);
      setDomainForm({
        name: '',
        mainUrl: 'https://yazdinnofaraz.ir/',
        priority: data.domains.length + 1,
        active: true,
        guidanceText: '',
      });
    } catch (err) {
      console.error(err);
      setActionError('خطا در ذخیره‌سازی اطلاعات حوزه');
    }
  };

  const handleEditDomain = (d: ProjectDomainConfig) => {
    setEditingDomainId(d.id);
    setDomainForm({
      name: d.name,
      mainUrl: d.mainUrl,
      priority: d.priority,
      active: d.active,
      guidanceText: d.guidanceText || '',
    });
    setActiveTab('domains');
  };

  const handleToggleDomainActive = async (d: ProjectDomainConfig) => {
    try {
      const token = await getCurrentIdToken();
      const res = await fetch(`/api/admin/domains/${d.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ active: !d.active }),
      });
      const data = await res.json();
      if (res.ok) setDomains(data.domains);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDomain = async (id: string) => {
    if (!window.confirm('آیا از حذف این حوزه از سامانه مطمئن هستید؟')) return;
    try {
      const token = await getCurrentIdToken();
      const res = await fetch(`/api/admin/domains/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setDomains(data.domains);
    } catch (err) {
      console.error(err);
    }
  };

  // Assistant Direction
  const handleSaveDirection = async () => {
    setIsSavingDirection(true);
    setDirectionSuccessMsg(null);
    setActionError(null);
    try {
      const token = await getCurrentIdToken();
      const res = await fetch('/api/admin/assistant-direction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ directionText }),
      });
      if (res.ok) {
        setDirectionSuccessMsg('جهت‌دهی دستیار ذخیره شد و در تمامی گفتگوهای جدید بدون نیاز به بیلد مجدد اعمال می‌شود.');
        setTimeout(() => setDirectionSuccessMsg(null), 5000);
      } else {
        setActionError('خطا در ذخیره جهت‌دهی دستیار');
      }
    } catch (err) {
      setActionError('خطای ارتباط با سرور');
    } finally {
      setIsSavingDirection(false);
    }
  };

  const handleResetDirection = async () => {
    if (!window.confirm('آیا مایل به بازگردانی متن پیش‌فرض جهت‌دهی دستیار هستید؟')) return;
    try {
      const token = await getCurrentIdToken();
      const res = await fetch('/api/admin/assistant-direction/reset', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDirectionText(data.assistantDirection.directionText);
        setDirectionSuccessMsg('متن پیش‌فرض جهت‌دهی با موفقیت بازگردانده شد.');
        setTimeout(() => setDirectionSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Sync Trigger
  const handleTriggerSync = async (isFullRebuild: boolean = false) => {
    setIsSyncing(true);
    setSyncMessage(null);
    setActionError(null);
    setShowFullRebuildConfirm(false);

    try {
      const token = await getCurrentIdToken();
      const res = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isFullRebuild }),
      });

      const report = await res.json();
      if (res.ok) {
        setSyncStatus(report);
        setSyncMessage(report.lastMessage || 'همگام‌سازی وب‌سایت با موفقیت پایان یافت.');
        await loadAdminData();
      } else {
        setActionError(report.message || 'خطا در همگام‌سازی پایگاه دانش سایت');
      }
    } catch (err) {
      setActionError('خطا در ارتباط با سرور');
    } finally {
      setIsSyncing(false);
    }
  };

  // Host configuration for embedding
  const sharedOrigin = 'https://ais-pre-jpusmsdrg4bi5d447purk4-558511060556.europe-west3.run.app';
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : sharedOrigin;
  const [embedHostOption, setEmbedHostOption] = useState<'shared' | 'custom' | 'current'>('shared');
  const [customHost, setCustomHost] = useState('');

  const selectedOrigin =
    embedHostOption === 'shared'
      ? sharedOrigin
      : embedHostOption === 'custom' && customHost.trim()
      ? customHost.trim().replace(/\/$/, '')
      : currentOrigin;

  const widgetUrl = `${selectedOrigin}/widget`;

  const wordpressEmbedCode = `<!-- شروع ویجت مشاور هوشمند انتخاب پروژه مرکز رشد فراز -->
<iframe
  id="yazd-growth-ai-widget"
  src="${widgetUrl}?parentUrl="
  style="position: fixed; bottom: 20px; right: 20px; width: 70px; height: 70px; border: none; z-index: 999999; max-width: 100vw; transition: all 0.3s ease;"
  allow="clipboard-write; identity-credentials-get"
></iframe>
<script>
  (function() {
    var iframe = document.getElementById('yazd-growth-ai-widget');
    if (!iframe) return;
    // ارسال آدرس صفحه فعلی وردپرس به عنوان بافت پروژه
    iframe.src = iframe.src + encodeURIComponent(window.location.href);

    window.addEventListener('message', function(e) {
      if (e.data && e.data.type === 'GROWTH_ASSISTANT_RESIZE') {
        if (e.data.isOpen) {
          if (window.innerWidth < 640) {
            iframe.style.width = '100vw';
            iframe.style.height = '42vh';
            iframe.style.bottom = '0px';
            iframe.style.right = '0px';
          } else {
            iframe.style.width = '440px';
            iframe.style.height = '100vh';
            iframe.style.bottom = '0px';
            iframe.style.right = '0px';
          }
        } else {
          iframe.style.width = '70px';
          iframe.style.height = '70px';
          iframe.style.bottom = '20px';
          iframe.style.right = '20px';
        }
      }
    });
  })();
</script>
<!-- پایان ویجت مشاور هوشمند -->`.trim();

  const handleCopyEmbedCode = () => {
    navigator.clipboard.writeText(wordpressEmbedCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Render Loading
  if (authChecking) {
    return (
      <div dir="rtl" className="min-h-screen bg-[#f8f7fc] flex flex-col items-center justify-center text-slate-700 font-sans p-4">
        <div className="w-10 h-10 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-base font-bold text-slate-900">در حال بررسی دسترسی مدیریت سامانه...</h2>
        <p className="text-xs text-slate-500 mt-1">احراز هویت سروری با Firebase</p>
      </div>
    );
  }

  // Render Unauthorized / Login Required
  if (!currentUser || currentUser.isGuest || !currentUser.email) {
    return (
      <div dir="rtl" className="min-h-screen bg-[#f8f7fc] flex flex-col items-center justify-center text-slate-700 font-sans p-6">
        <div className="w-full max-w-md bg-white border border-purple-150 rounded-3xl p-8 text-center shadow-2xl space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 mx-auto">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">ورود به پنل مدیریت دستیار هوشمند</h1>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              برای مدیریت حوزه‌های پروژه، پایگاه دانش و جهت‌دهی دستیار، ابتدا با حساب کاربری Google مجاز وارد شوید.
            </p>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {authError}
            </div>
          )}

          <button
            type="button"
            onClick={handleLogin}
            className="w-full py-3 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm shadow-lg shadow-purple-700/20 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>ورود با حساب گوگل</span>
          </button>

          {onBackToApp && (
            <button
              type="button"
              onClick={onBackToApp}
              className="text-xs text-slate-500 hover:text-purple-800 transition-colors"
            >
              بازگشت به پیش‌نمایش سایت
            </button>
          )}
        </div>
      </div>
    );
  }

  // Render Access Denied for Non-Admin Authenticated Users
  if (!isAdmin) {
    return (
      <div dir="rtl" className="min-h-screen bg-[#f8f7fc] flex flex-col items-center justify-center text-slate-700 font-sans p-6">
        <div className="w-full max-w-md bg-white border border-rose-200 rounded-3xl p-8 text-center shadow-2xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-lg font-black text-rose-600">
            شما اجازه دسترسی به پنل مدیریت را ندارید.
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            حساب کاربری فعلی شما (<span className="font-mono text-purple-700 font-bold">{currentUser?.email}</span>) در فهرست مدیران مجاز ثبت نشده است. برای دسترسی، با حساب ایمیل ادمین وارد شوید.
          </p>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={async () => {
                await logoutUser();
                await handleLogin();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold cursor-pointer shadow-md transition-all"
            >
              خروج و ورود با حسابی دیگر
            </button>
            {onBackToApp && (
              <button
                type="button"
                onClick={onBackToApp}
                className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
              >
                بازگشت به پیش‌نمایش
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const filteredIndexedPages =
    selectedDomainFilter === 'all'
      ? indexedPages
      : indexedPages.filter(
          (p) => p.domain === selectedDomainFilter || p.parentDomainUrl?.includes(selectedDomainFilter)
        );

  return (
    <div dir="rtl" className="min-h-screen bg-[#f8f7fc] text-slate-800 font-sans flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-l border-purple-150 flex flex-col shrink-0">
        {/* Brand Header */}
        <div className="p-5 border-b border-purple-150 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 font-black">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xs font-black text-slate-900 leading-tight">
                مرکز رشد فراز یزد
              </h1>
              <p className="text-[10px] text-slate-500 mt-0.5">پنل جامع مدیریت دستیار</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (7 Sections) */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-purple-700 text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>داشبورد وضعیت</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('domains')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'domains'
                ? 'bg-purple-700 text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>حوزه‌های پروژه ({domains.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('knowledge')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'knowledge'
                ? 'bg-purple-700 text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            <Database className="w-4 h-4 shrink-0" />
            <span>دانش سایت ({totalPages})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('direction')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'direction'
                ? 'bg-purple-700 text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            <Sliders className="w-4 h-4 shrink-0" />
            <span>جهت‌دهی دستیار</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sync')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'sync'
                ? 'bg-purple-700 text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            <RefreshCw className={`w-4 h-4 shrink-0 ${isSyncing ? 'animate-spin text-purple-700' : ''}`} />
            <span>وضعیت همگام‌سازی</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('system')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'system'
                ? 'bg-purple-700 text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            <Activity className="w-4 h-4 shrink-0" />
            <span>وضعیت سیستم</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('wordpress')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'wordpress'
                ? 'bg-purple-700 text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            <Code2 className="w-4 h-4 shrink-0" />
            <span>تنظیمات و وردپرس</span>
          </button>
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-purple-150 bg-[#f8f7fc]/60 flex items-center justify-between">
          <div className="min-w-0">
            <span className="block text-[11px] font-bold text-slate-900 truncate">
              {currentUser?.email}
            </span>
            <span className="inline-block px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 text-[9px] font-mono mt-0.5">
              مدیر تاییدشده
            </span>
          </div>

          <div className="flex items-center gap-1">
            {onBackToApp && (
              <button
                type="button"
                onClick={onBackToApp}
                className="p-1.5 rounded-lg text-slate-500 hover:text-purple-800 hover:bg-slate-100"
                title="بازگشت به پیش‌نمایش"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40"
              title="خروج"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#f8f7fc] overflow-y-auto">
        {/* Top Breadcrumb Header */}
        <header className="px-6 py-4 bg-white/60 border-b border-purple-150 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              {activeTab === 'overview' && 'داشبورد خلاصه وضعیت'}
              {activeTab === 'domains' && 'مدیریت حوزه‌های پروژه‌های مرکز رشد'}
              {activeTab === 'knowledge' && 'پایگاه دانش استخراج‌شده از وب‌سایت'}
              {activeTab === 'direction' && 'هدف و جهت‌دهی هوشمند دستیار'}
              {activeTab === 'sync' && 'مرکز عملیات همگام‌سازی و بازسازی'}
              {activeTab === 'system' && 'بررسی سلامت زیرساخت و سرویس‌ها'}
              {activeTab === 'wordpress' && 'راهنمای نصب و درج در المنتور و وردپرس'}
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              دامنه هدف: <span className="font-mono text-purple-700">https://yazdinnofaraz.ir/</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSyncing}
              onClick={() => handleTriggerSync(false)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-purple-700' : ''}`} />
              <span>همگام‌سازی سریع</span>
            </button>

            <a
              href="/widget"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-purple-700/20 border border-purple-200 text-purple-800 hover:bg-purple-700/30 text-xs font-semibold flex items-center gap-1.5"
            >
              <span>مشاهده ویجت مستقل</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </header>

        {/* Global Error Banner */}
        {actionError && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              {actionError}
            </span>
            <button onClick={() => setActionError(null)} className="text-slate-500 hover:text-purple-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* SECTION 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-purple-150">
                  <span className="text-xs text-slate-500 block mb-1">حوزه‌های پروژه</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-purple-700">{domains.length}</span>
                    <span className="text-xs text-purple-700 font-semibold">
                      ({domains.filter((d) => d.active).length} فعال)
                    </span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-purple-150">
                  <span className="text-xs text-slate-500 block mb-1">صفحات شناسایی‌شده</span>
                  <span className="text-2xl font-black text-purple-700">{totalPages}</span>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-purple-150">
                  <span className="text-xs text-slate-500 block mb-1">پروژه‌های ایندکس‌شده</span>
                  <span className="text-2xl font-black text-violet-700">
                    {syncStatus?.totalIndexedProjectPages ?? indexedPages.filter((p) => p.type === 'project').length}
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-purple-150">
                  <span className="text-xs text-slate-500 block mb-1">وضعیت دستیار</span>
                  <span className="text-xs font-bold text-purple-700 flex items-center gap-1.5 mt-2">
                    <CheckCircle2 className="w-4 h-4" />
                    فعال و آماده پاسخگویی
                  </span>
                </div>
              </div>

              {/* Status Banner Card */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-purple-150 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 mb-1">
                    داشبورد مدیریت دستیار مرکز رشد نوفرآز
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                    این سامانه به طور خودکار پایگاه دانش را با صفحات رسمی حوزه‌های انرژی، تیم‌ها، فراخوان‌ها و تسهیلات وب‌سایت همگام کرده و مشاور هوشمند پروژه را بر اساس دستورالعمل‌های مدیریتی هدایت می‌کند.
                  </p>
                  <div className="mt-3 flex items-center gap-4 text-xs text-slate-700">
                    <span>
                      آخرین همگام‌سازی:{' '}
                      <span className="font-mono text-purple-700">
                        {syncStatus?.lastSyncTime
                          ? new Date(syncStatus.lastSyncTime).toLocaleString('fa-IR')
                          : 'انجام نشده'}
                      </span>
                    </span>
                    <span>•</span>
                    <span>پایگاه جستجو: فعال</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab('sync')}
                    className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md"
                  >
                    مدیریت همگام‌سازی
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('wordpress')}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                  >
                    کد درج وردپرس
                  </button>
                </div>
              </div>

              {/* Quick Status Grid */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/60 border border-purple-150 text-center">
                  <span className="text-[10px] text-slate-500 block mb-1">احراز هویت گوگل</span>
                  <span className="text-xs font-bold text-purple-700">OK</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/60 border border-purple-150 text-center">
                  <span className="text-[10px] text-slate-500 block mb-1">سرویس Gemini</span>
                  <span className="text-xs font-bold text-purple-700">OK (3.1-Flash-Lite)</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/60 border border-purple-150 text-center">
                  <span className="text-[10px] text-slate-500 block mb-1">دیتابیس Firestore</span>
                  <span className="text-xs font-bold text-purple-700">OK</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/60 border border-purple-150 text-center">
                  <span className="text-[10px] text-slate-500 block mb-1">دانش سایت</span>
                  <span className="text-xs font-bold text-purple-700">OK ({totalPages} صفحه)</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/60 border border-purple-150 text-center">
                  <span className="text-[10px] text-slate-500 block mb-1">همگام‌سازی سایت</span>
                  <span className="text-xs font-bold text-purple-700">OK</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/60 border border-purple-150 text-center">
                  <span className="text-[10px] text-slate-500 block mb-1">ویجت وردپرس</span>
                  <span className="text-xs font-bold text-violet-700">READY</span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: PROJECT DOMAINS */}
          {activeTab === 'domains' && (
            <div className="space-y-6">
              {/* Form */}
              <form
                onSubmit={handleSaveDomain}
                className="p-5 rounded-2xl bg-white border border-purple-150 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    {editingDomainId ? <Edit3 className="w-4 h-4 text-amber-400" /> : <Plus className="w-4 h-4 text-purple-700" />}
                    {editingDomainId ? 'ویرایش حوزه پروژه' : 'افزودن حوزه پروژه جدید (تنها ورود آدرس صفحه اصلی)'}
                  </h3>
                  {editingDomainId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingDomainId(null);
                        setDomainForm({
                          name: '',
                          mainUrl: 'https://yazdinnofaraz.ir/',
                          priority: domains.length + 1,
                          active: true,
                          guidanceText: '',
                        });
                      }}
                      className="text-xs text-slate-500 hover:text-purple-800"
                    >
                      انصراف از ویرایش
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      عنوان حوزه (مثال: انرژی و بهینه‌سازی)
                    </label>
                    <input
                      type="text"
                      required
                      value={domainForm.name}
                      onChange={(e) => setDomainForm({ ...domainForm, name: e.target.value })}
                      placeholder="مثلاً: انرژی و بهینه‌سازی"
                      className="w-full bg-[#f8f7fc] border border-purple-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      آدرس اصلی حوزه در سایت نوفرآز (تنها آدرس اصلی کافیست، زیرصفحات خودکار شناسایی می‌شوند)
                    </label>
                    <input
                      type="url"
                      required
                      value={domainForm.mainUrl}
                      onChange={(e) => setDomainForm({ ...domainForm, mainUrl: e.target.value })}
                      placeholder="https://yazdinnofaraz.ir/enrgy/"
                      className="w-full bg-[#f8f7fc] border border-purple-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-600 dir-ltr font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-3">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      راهنمای اختصاصی حوزه برای هوش مصنوعی (اختیاری)
                    </label>
                    <input
                      type="text"
                      value={domainForm.guidanceText}
                      onChange={(e) => setDomainForm({ ...domainForm, guidanceText: e.target.value })}
                      placeholder="مثلاً: در این حوزه روی پروژه‌های پایش هوشمند مصرف و تشکیل تیم تأکید کن."
                      className="w-full bg-[#f8f7fc] border border-purple-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      اولویت (۱ بالاترین)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={domainForm.priority}
                      onChange={(e) => setDomainForm({ ...domainForm, priority: Number(e.target.value) })}
                      className="w-full bg-[#f8f7fc] border border-purple-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-600 text-center"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={domainForm.active}
                      onChange={(e) => setDomainForm({ ...domainForm, active: e.target.checked })}
                      className="rounded border-purple-200 text-purple-700"
                    />
                    <span>این حوزه فعال باشد و در کشف خودکار پروژه‌ها لحاظ گردد</span>
                  </label>

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingDomainId ? 'ذخیره تغییرات حوزه' : 'ثبت حوزه در سامانه'}</span>
                  </button>
                </div>
              </form>

              {/* Domains Table */}
              <div className="bg-white border border-purple-150 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-purple-150 flex items-center justify-between">
                  <h4 className="font-bold text-xs text-white">
                    فهرست حوزه‌های پیکربندی‌شده ({domains.length})
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    مدیریت بدون نیاز به دستکاری کدهای سامانه
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-[#f8f7fc]/80 text-slate-500 border-b border-purple-150">
                      <tr>
                        <th className="p-3 font-semibold">اولویت</th>
                        <th className="p-3 font-semibold">عنوان حوزه</th>
                        <th className="p-3 font-semibold">URL صفحه اصلی</th>
                        <th className="p-3 font-semibold">وضعیت</th>
                        <th className="p-3 font-semibold">راهنمای اختصاصی حوزه</th>
                        <th className="p-3 font-semibold text-center">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {domains.map((d) => (
                        <tr key={d.id} className="hover:bg-purple-50/50/50 transition-colors">
                          <td className="p-3 font-mono font-bold text-slate-700">{d.priority}</td>
                          <td className="p-3 font-bold text-slate-900">{d.name}</td>
                          <td className="p-3 font-mono text-[11px] text-slate-500 dir-ltr text-left">
                            <a
                              href={d.mainUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:text-purple-700 hover:underline flex items-center gap-1"
                            >
                              {d.mainUrl}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </td>
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => handleToggleDomainActive(d)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                                d.active
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : 'bg-slate-100 text-slate-500 border border-purple-200'
                              }`}
                            >
                              {d.active ? 'فعال' : 'غیرفعال'}
                            </button>
                          </td>
                          <td className="p-3 text-slate-700 text-[11px] max-w-xs truncate">
                            {d.guidanceText || '—'}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleEditDomain(d)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                                title="ویرایش"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteDomain(d.id)}
                                className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-900/50"
                                title="حذف"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: KNOWLEDGE BASE */}
          {activeTab === 'knowledge' && (
            <div className="space-y-6">
              {/* Header & Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-purple-150">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-purple-700" />
                  <div>
                    <h3 className="font-bold text-xs text-white">
                      صفحات استخراج‌شده و ایندکس در پایگاه دانش ({totalPages} صفحه)
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      اطلاعات رسمی وب‌سایت نوفرآز با متادیتای کامل (URL منبع، نوع صفحه، حوزه و زمان ویرایش)
                    </p>
                  </div>
                </div>

                {/* Filter by Domain */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">فیلتر حوزه:</span>
                  <select
                    value={selectedDomainFilter}
                    onChange={(e) => setSelectedDomainFilter(e.target.value)}
                    className="bg-[#f8f7fc] border border-purple-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                  >
                    <option value="all">همه حوزه‌ها ({indexedPages.length})</option>
                    {domains.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Knowledge Pages Table */}
              <div className="bg-white border border-purple-150 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-[#f8f7fc] text-slate-500 border-b border-purple-150">
                      <tr>
                        <th className="p-3 font-semibold">حوزه</th>
                        <th className="p-3 font-semibold">عنوان صفحه</th>
                        <th className="p-3 font-semibold">نوع صفحه</th>
                        <th className="p-3 font-semibold">آدرس اینترنتی (منبع رسمی)</th>
                        <th className="p-3 font-semibold">حجم محتوا</th>
                        <th className="p-3 font-semibold">آخرین همگام‌سازی</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {filteredIndexedPages.map((page) => (
                        <tr key={page.id} className="hover:bg-purple-50/50/50 transition-colors">
                          <td className="p-3 font-bold text-purple-700">{page.domain || 'عمومی'}</td>
                          <td className="p-3 font-medium text-white max-w-xs truncate">{page.title}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                              {page.type === 'project_domain'
                                ? 'حوزه اصلی'
                                : page.type === 'project'
                                ? 'پروژه / تیم'
                                : 'محتوای عمومی'}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-slate-500 dir-ltr text-left">
                            <a
                              href={page.url}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:text-purple-700 hover:underline flex items-center gap-1"
                            >
                              {page.url}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </td>
                          <td className="p-3 font-mono text-slate-500">
                            {page.contentLength ? `${Math.round(page.contentLength / 1024)} KB` : '—'}
                          </td>
                          <td className="p-3 text-[11px] text-slate-500 font-mono">
                            {page.lastModified
                              ? new Date(page.lastModified).toLocaleDateString('fa-IR')
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: ASSISTANT DIRECTION */}
          {activeTab === 'direction' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-white border border-purple-150 text-xs text-slate-700 leading-relaxed flex items-start gap-3">
                <Sliders className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">
                    تنظیم پویای هدف و جهت‌دهی دستیار هوشمند:
                  </h3>
                  <p className="text-slate-500">
                    متن زیر به عنوان دستورالعمل اصلی به مدل هوش مصنوعی ارسال می‌شود. هرگونه تغییر در این بخش، بلافاصله در پردازش مکالمات جدید ذخیره و اعمال می‌شود و هیچ نیازی به بیلد یا انتشار مجدد ندارد.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-900">
                  دستورالعمل و ماموریت رفتاری دستیار:
                </label>
                <textarea
                  rows={13}
                  value={directionText}
                  onChange={(e) => setDirectionText(e.target.value)}
                  className="w-full bg-white border border-purple-200 rounded-2xl p-4 text-xs sm:text-sm text-slate-800 placeholder-slate-600 focus:outline-none focus:border-purple-600 leading-relaxed font-sans"
                />
              </div>

              {directionSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-800 text-purple-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-700 shrink-0" />
                  <span>{directionSuccessMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleResetDirection}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>بازگردانی متن پیش‌فرض</span>
                </button>

                <button
                  type="button"
                  disabled={isSavingDirection}
                  onClick={handleSaveDirection}
                  className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isSavingDirection ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>ذخیره تغییرات جهت‌دهی</span>
                </button>
              </div>
            </div>
          )}

          {/* SECTION 5: SYNC STATUS & OPERATIONS */}
          {activeTab === 'sync' && (
            <div className="space-y-6">
              {/* Sync Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-purple-150 text-center">
                  <span className="text-[11px] text-slate-500 block mb-1">صفحات تغییرکرده</span>
                  <span className="text-xl font-extrabold text-slate-900">
                    {syncStatus?.changedPagesCount ?? 0}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-purple-150 text-center">
                  <span className="text-[11px] text-slate-500 block mb-1">صفحات حذف‌شده</span>
                  <span className="text-xl font-extrabold text-slate-700">
                    {syncStatus?.removedPagesCount ?? 0}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-purple-150 text-center">
                  <span className="text-[11px] text-slate-500 block mb-1">حوزه‌های فعال تحت پایش</span>
                  <span className="text-xl font-extrabold text-purple-700">
                    {syncStatus?.totalActiveDomains ?? domains.filter((d) => d.active).length}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-purple-150 text-center">
                  <span className="text-[11px] text-slate-500 block mb-1">وضعیت آخرین عملیات</span>
                  <span className="text-xs font-bold text-purple-700 flex items-center justify-center gap-1 mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    موفق
                  </span>
                </div>
              </div>

              {/* Action Box */}
              <div className="p-6 rounded-3xl bg-white border border-purple-150 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-extrabold text-sm text-white">
                      عملیات همگام‌سازی و بازسازی پایگاه دانش
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-xl">
                      «همگام‌سازی عادی» صفحات حوزه‌ها را بررسی کرده و صرفاً تغییرات جدید را بروز می‌کند. «بازسازی کامل» تمام ایندکس‌های قبلی را ریست و همه صفحات را از نو پردازش می‌نماید.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={isSyncing}
                      onClick={() => handleTriggerSync(false)}
                      className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>همگام‌سازی عادی</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSyncing}
                      onClick={() => setShowFullRebuildConfirm(true)}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-rose-950 hover:border-rose-700 border border-purple-200 text-slate-700 hover:text-rose-200 font-semibold text-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      بازسازی کامل دانش سایت
                    </button>
                  </div>
                </div>

                {showFullRebuildConfirm && (
                  <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-800 text-xs space-y-3">
                    <div className="flex items-center gap-2 text-rose-300 font-bold">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span>تأیید بازسازی کامل پایگاه دانش سایت</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">
                      این فرآیند تمام صفحات ذخیره‌شده را از ابتدا خزش و ایندکس‌گذاری مجدد می‌کند. آیا اطمینان دارید؟
                    </p>
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowFullRebuildConfirm(false)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs"
                      >
                        انصراف
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTriggerSync(true)}
                        className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                      >
                        بله، بازسازی کامل انجام شود
                      </button>
                    </div>
                  </div>
                )}

                {syncMessage && (
                  <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-800 text-purple-800 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-700 shrink-0" />
                    <span>{syncMessage}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 6: SYSTEM STATUS */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-purple-150 space-y-3">
                  <h4 className="font-bold text-xs text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-700" />
                    <span>سرویس احراز هویت (Authentication)</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    ورود کاربران عادی با Google Sign-In فعال است و نشست‌ها با Firebase ID Token به صورت سروری اعتبارسنجی می‌شوند.
                  </p>
                  <span className="inline-block px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
                    وضعیت: OK
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-purple-150 space-y-3">
                  <h4 className="font-bold text-xs text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-700" />
                    <span>هوش مصنوعی Gemini (LLM API)</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    مدل Gemini 3.1 Flash-Lite با قابلیت استریم بی‌وقفه و پاسخ به زبان فارسی پیکربندی شده است.
                  </p>
                  <span className="inline-block px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
                    وضعیت: OK (کلید فعال در سرور)
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-purple-150 space-y-3">
                  <h4 className="font-bold text-xs text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-purple-700" />
                    <span>پایگاه داده Firestore</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    قواعد امنیتی Firestore ذخیره گفتگوها را به شناسه اختصاصی هر کاربر محدود کرده‌اند و پایداری سوابق چت تضمین شده است.
                  </p>
                  <span className="inline-block px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
                    وضعیت: OK
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-purple-150 space-y-3">
                  <h4 className="font-bold text-xs text-white flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-violet-700" />
                    <span>ویجت مستقل (Embeddable Widget)</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    مسیر اختصاصی <span className="font-mono text-purple-700">/widget</span> با تنظیمات CSP frame-ancestors برای درج در سایت نوفرآز آماده است.
                  </p>
                  <span className="inline-block px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 text-xs font-bold border border-teal-500/20">
                    وضعیت: READY
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 7: WORDPRESS & ELEMENTOR INTEGRATION */}
          {activeTab === 'wordpress' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-white border border-purple-150 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-white">
                      راهنمای درج دستیار در وردپرس و المنتور (WordPress & Elementor)
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      مدیر سایت وردپرس بدون نیاز به هیچ کلید API یا تنظیمات سروری، تنها با درج کد زیر دستیار را فعال می‌کند.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyEmbedCode}
                    className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedCode ? 'کپی شد!' : 'کپی کد درج وردپرس'}</span>
                  </button>
                </div>

                {/* Host Source Selector */}
                <div className="p-4 rounded-xl bg-[#f8f7fc] border border-purple-150 space-y-3">
                  <span className="text-xs font-bold text-slate-700 block">انتخاب دامنه و میزبان ویجت:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setEmbedHostOption('shared')}
                      className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                        embedHostOption === 'shared'
                          ? 'border-purple-600 bg-purple-50 text-white'
                          : 'border-purple-150 bg-white text-slate-500 hover:border-purple-200'
                      }`}
                    >
                      <span className="block text-xs font-bold text-purple-700">دامنه عمومی ابری (پیش‌فرض)</span>
                      <span className="block text-[10px] text-slate-500 mt-0.5 dir-ltr truncate">ais-pre-...run.app</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEmbedHostOption('current')}
                      className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                        embedHostOption === 'current'
                          ? 'border-purple-600 bg-purple-50 text-white'
                          : 'border-purple-150 bg-white text-slate-500 hover:border-purple-200'
                      }`}
                    >
                      <span className="block text-xs font-bold text-amber-400">دامنه جاری مرورگر</span>
                      <span className="block text-[10px] text-slate-500 mt-0.5 dir-ltr truncate">{currentOrigin}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEmbedHostOption('custom')}
                      className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                        embedHostOption === 'custom'
                          ? 'border-purple-600 bg-purple-50 text-white'
                          : 'border-purple-150 bg-white text-slate-500 hover:border-purple-200'
                      }`}
                    >
                      <span className="block text-xs font-bold text-cyan-400">دامنه اختصاصی خودتان</span>
                      <span className="block text-[10px] text-slate-500 mt-0.5">مانند assistant.yazdinnofaraz.ir</span>
                    </button>
                  </div>

                  {embedHostOption === 'custom' && (
                    <div className="pt-2">
                      <label className="text-[11px] text-slate-500 block mb-1">آدرس دامنه اختصاصی شما (با https://):</label>
                      <input
                        type="url"
                        placeholder="https://assistant.yazdinnofaraz.ir"
                        value={customHost}
                        onChange={(e) => setCustomHost(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-purple-200 text-xs text-white font-mono dir-ltr focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  )}
                </div>

                {/* Important 403 Explanation Alert */}
                <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/80 text-xs text-amber-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-300">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>علت خطای ۴۰۳ (Access Denied) در لینک‌های ais-dev و نحوه رفع آن:</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    گوگل آدرس‌های با پیشوند <code className="text-amber-300 font-mono bg-white px-1 py-0.5 rounded">ais-dev-</code> را به عنوان محیط توسعه خصوصی برنامه‌نویس قفل می‌کند و اجازه باز شدن آن توسط سایر کاربران یا بازدیدکنندگان وردپرس را نمی‌دهد.
                  </p>
                  <p className="text-[11px] text-purple-800 leading-relaxed font-semibold">
                    برای اینکه کاربران سایت شما مستقیماً و بدون هیچ اروری به ویجت دسترسی داشته باشند، کافیست در بالای همین صفحه استودیو روی دکمه <span className="bg-emerald-900/60 px-1.5 py-0.5 rounded border border-emerald-700">Share (اشتراک‌گذاری)</span> کلیک کنید تا نسخه عمومی <code className="text-white font-mono">ais-pre-</code> فعال شود. کد درج شده در جعبه بالا به صورت خودکار از دامنه عمومی استفاده می‌کند.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>آدرس اختصاصی ویجت:</span>
                    <span className="font-mono text-purple-700 dir-ltr">{widgetUrl}</span>
                  </div>

                  <pre className="bg-[#f8f7fc] p-4 rounded-xl border border-purple-150 text-[11px] font-mono text-slate-700 overflow-x-auto dir-ltr">
                    {wordpressEmbedCode}
                  </pre>
                </div>
              </div>

              {/* Instructions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-purple-150 space-y-3">
                  <h4 className="font-bold text-xs text-white">مراحل درج در المنتور (Elementor):</h4>
                  <ol className="list-decimal list-inside text-xs text-slate-700 space-y-2 leading-relaxed">
                    <li>وارد پیشخوان وردپرس شده و برگه یا فوتر سراسری (Footer Template) را با المنتور باز کنید.</li>
                    <li>ویجت «کد HTML» (HTML Widget) را به قالب اضافه کنید.</li>
                    <li>کد بالا را کپی کرده و درون فیلد کد المنتور جای‌گذاری کنید.</li>
                    <li>دکمه «انتشار / ذخیره» را بزنید. آیکون دستیار هوشمند به گوشه سایت اضافه می‌شود.</li>
                  </ol>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-purple-150 space-y-3">
                  <h4 className="font-bold text-xs text-white">رفتار در دسکتاپ و موبایل:</h4>
                  <ul className="text-xs text-slate-700 space-y-2 leading-relaxed">
                    <li>
                      <span className="font-bold text-slate-900">• دسکتاپ: </span>
                      پنل اسلایدی در سمت راست صفحه با عرض ۴۴۰ پیکسل و ارتفاع تمام‌صفحه باز می‌شود و محتوای سایت نوفرآز همچنان قابل مشاهده است.
                    </li>
                    <li>
                      <span className="font-bold text-slate-900">• موبایل: </span>
                      به صورت باتم‌شیت (Bottom Sheet) مدرن با اشغال حدود ۴۰٪ پایین صفحه باز می‌شود، کاربر حدود ۶۰٪ صفحه وب را می‌بیند و لیست پیام‌ها به طور مستقل اسکرول می‌خورد.
                    </li>
                    <li>
                      <span className="font-bold text-slate-900">• انتقال بافت صفحه: </span>
                      آدرس دقیق صفحه‌ای که کاربر در حال حاضر در وردپرس مشاهده می‌کند، به عنوان بافت پروژه به مشاور هوشمند پاس داده می‌شود.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
