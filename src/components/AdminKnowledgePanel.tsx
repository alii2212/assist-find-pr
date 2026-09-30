import React, { useState, useEffect } from 'react';
import {
  Database,
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  AlertTriangle,
  Globe,
  Sliders,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Layers,
  Info,
} from 'lucide-react';
import {
  ProjectDomainConfig,
  SyncStatusReport,
  FailedUrlRecord,
} from '../types/admin.ts';
import { getCurrentIdToken } from '../firebase/config.ts';

interface AdminKnowledgePanelProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string | null;
}

export const AdminKnowledgePanel: React.FC<AdminKnowledgePanelProps> = ({
  isOpen,
  onClose,
  userEmail,
}) => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loadingAuthCheck, setLoadingAuthCheck] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'domains' | 'direction' | 'sync'>('domains');

  // Domain Configs
  const [domains, setDomains] = useState<ProjectDomainConfig[]>([]);
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

  // Assistant Direction
  const [directionText, setDirectionText] = useState<string>('');
  const [isSavingDirection, setIsSavingDirection] = useState<boolean>(false);
  const [directionSuccessMsg, setDirectionSuccessMsg] = useState<string | null>(null);

  // Sync Status
  const [syncStatus, setSyncStatus] = useState<SyncStatusReport | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [showFullRebuildConfirm, setShowFullRebuildConfirm] = useState<boolean>(false);

  const [generalError, setGeneralError] = useState<string | null>(null);

  // Check admin rights on open
  useEffect(() => {
    if (!isOpen) return;

    const checkAdmin = async () => {
      setLoadingAuthCheck(true);
      setGeneralError(null);
      try {
        const token = await getCurrentIdToken();
        const res = await fetch('/api/admin/check', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.isAdmin) {
          setIsAdmin(true);
          await loadDashboardData();
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('Admin check failed:', err);
        setIsAdmin(false);
      } finally {
        setLoadingAuthCheck(false);
      }
    };

    checkAdmin();
  }, [isOpen]);

  const loadDashboardData = async () => {
    try {
      const token = await getCurrentIdToken();
      const res = await fetch('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDomains(data.domains || []);
        setDirectionText(data.assistantDirection?.directionText || '');
        setSyncStatus(data.syncStatus || null);
      }
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    }
  };

  // Domain Actions
  const handleSaveDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainForm.name.trim() || !domainForm.mainUrl.trim()) return;

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
        setGeneralError(data.message || 'خطا در ثبت حوزه');
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
      setGeneralError('خطا در ذخیره‌سازی حوزه');
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
  };

  const handleDeleteDomain = async (id: string) => {
    if (!window.confirm('آیا از حذف این حوزه اطمینان دارید؟')) return;
    try {
      const token = await getCurrentIdToken();
      const res = await fetch(`/api/admin/domains/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setDomains(data.domains);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save Assistant Direction
  const handleSaveDirection = async () => {
    setIsSavingDirection(true);
    setDirectionSuccessMsg(null);
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
        setDirectionSuccessMsg('جهت‌دهی دستیار ذخیره شد و در مکالمات جدید بلافاصله اعمال خواهد شد.');
        setTimeout(() => setDirectionSuccessMsg(null), 4000);
      } else {
        setGeneralError('خطا در ذخیره جهت‌دهی دستیار');
      }
    } catch (err) {
      console.error(err);
      setGeneralError('خطا در ارتباط با سرور');
    } finally {
      setIsSavingDirection(false);
    }
  };

  // Sync Action
  const handleTriggerSync = async (isFullRebuild: boolean = false) => {
    setIsSyncing(true);
    setSyncMessage(null);
    setGeneralError(null);
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
        setSyncMessage(report.lastMessage || 'همگام‌سازی با موفقیت پایان یافت.');
        await loadDashboardData();
      } else {
        setGeneralError(report.message || 'خطا در اجرای همگام‌سازی');
      }
    } catch (err: any) {
      console.error(err);
      setGeneralError('خطا در ارتباط با سرور هنگام همگام‌سازی');
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 text-slate-100 font-sans dir-rtl">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white">
                  مدیریت دانش سایت و جهت‌دهی دستیار
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                  ویژه مدیران
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                تنظیم داینامیک حوزه‌ها و همگام‌سازی خودکار با وب‌سایت https://yazdinnofaraz.ir/
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Check State */}
        {loadingAuthCheck ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs">
            <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mb-2" />
            <span>در حال بررسی دسترسی مدیر...</span>
          </div>
        ) : !isAdmin ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-white">دسترسی مجاز مدیر یافت نشد</h3>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              شما با حساب <span className="font-mono text-emerald-400">{userEmail || 'نامشخص'}</span> وارد شده‌اید. برای دسترسی به بخش مدیریت دانش سایت، باید دسترسی ادمین برای حساب شما فعال باشد.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
            >
              بازگشت به دستیار
            </button>
          </div>
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="px-6 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2 shrink-0 overflow-x-auto text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('domains')}
                className={`py-3 px-3.5 border-b-2 font-bold flex items-center gap-2 cursor-pointer transition-all ${
                  activeTab === 'domains'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>حوزه‌های پروژه‌ها ({domains.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('direction')}
                className={`py-3 px-3.5 border-b-2 font-bold flex items-center gap-2 cursor-pointer transition-all ${
                  activeTab === 'direction'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>هدف و جهت‌دهی دستیار</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('sync')}
                className={`py-3 px-3.5 border-b-2 font-bold flex items-center gap-2 cursor-pointer transition-all ${
                  activeTab === 'sync'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
                <span>داشبورد همگام‌سازی سایت</span>
              </button>
            </div>

            {/* Error Notification Banner */}
            {generalError && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center justify-between shrink-0">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  {generalError}
                </span>
                <button
                  type="button"
                  onClick={() => setGeneralError(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Body Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* TAB 1: Configured Domains */}
              {activeTab === 'domains' && (
                <div className="space-y-6">
                  {/* Add / Edit Form */}
                  <form
                    onSubmit={handleSaveDomain}
                    className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-white flex items-center gap-2">
                        {editingDomainId ? <Edit3 className="w-4 h-4 text-amber-400" /> : <Plus className="w-4 h-4 text-emerald-400" />}
                        {editingDomainId ? 'ویرایش حوزه پروژه' : 'افزودن حوزه پروژه جدید به سایت'}
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
                          className="text-xs text-slate-400 hover:text-white"
                        >
                          انصراف از ویرایش
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          نام حوزه (مثال: انرژی، کشاورزی، معدن)
                        </label>
                        <input
                          type="text"
                          required
                          value={domainForm.name}
                          onChange={(e) => setDomainForm({ ...domainForm, name: e.target.value })}
                          placeholder="مثلاً: انرژی و بهینه‌سازی"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          آدرس صفحه اصلی حوزه در سایت نوفرآز
                        </label>
                        <input
                          type="url"
                          required
                          value={domainForm.mainUrl}
                          onChange={(e) => setDomainForm({ ...domainForm, mainUrl: e.target.value })}
                          placeholder="https://yazdinnofaraz.ir/enrgy/"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 dir-ltr font-mono"
                        />
                      </div>
                    </div>

                    {/* Guidance & Priority */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="md:col-span-3">
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          رهنمود تخصصی این حوزه برای هوش مصنوعی (اختیاری)
                        </label>
                        <input
                          type="text"
                          value={domainForm.guidanceText}
                          onChange={(e) => setDomainForm({ ...domainForm, guidanceText: e.target.value })}
                          placeholder="مثلاً: در این حوزه روی پروژه‌های پایش هوشمند مصرف برق و اینترنت اشیاء تمرکز کن."
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          اولویت نمایش (۱ بالاترین)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={99}
                          value={domainForm.priority}
                          onChange={(e) => setDomainForm({ ...domainForm, priority: Number(e.target.value) })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 text-center"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                        <input
                          type="checkbox"
                          checked={domainForm.active}
                          onChange={(e) => setDomainForm({ ...domainForm, active: e.target.checked })}
                          className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                        />
                        <span>این حوزه فعال باشد و در کشف پروژه استفاده شود</span>
                      </label>

                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>{editingDomainId ? 'ذخیره تغییرات حوزه' : 'افزودن به لیست حوزه‌ها'}</span>
                      </button>
                    </div>
                  </form>

                  {/* Configured Domains List */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-xs text-slate-300">
                      حوزه‌های پیکربندی‌شده ({domains.length})
                    </h4>

                    {domains.length === 0 ? (
                      <p className="text-xs text-slate-500 p-4 rounded-xl bg-slate-950/40 text-center">
                        هیچ حوزه‌ای تعریف نشده است. لطفاً حداقل یک حوزه اضافه کنید.
                      </p>
                    ) : (
                      domains.map((d) => (
                        <div
                          key={d.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            d.active
                              ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                              : 'bg-slate-950/30 border-slate-900 opacity-60'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm text-white">{d.name}</span>
                                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px]">
                                  اولویت: {d.priority}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                    d.active
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      : 'bg-slate-800 text-slate-500'
                                  }`}
                                >
                                  {d.active ? 'فعال' : 'غیرفعال'}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono dir-ltr">
                                <Globe className="w-3.5 h-3.5 text-slate-500" />
                                <a
                                  href={d.mainUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="hover:text-emerald-400 hover:underline flex items-center gap-1"
                                >
                                  {d.mainUrl}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>

                              {d.guidanceText && (
                                <p className="text-[11px] text-slate-300 mt-1 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                                  <span className="font-semibold text-emerald-400">رهنمود حوزه: </span>
                                  {d.guidanceText}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleEditDomain(d)}
                                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1 cursor-pointer"
                                title="ویرایش"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">ویرایش</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteDomain(d.id)}
                                className="p-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 text-xs flex items-center gap-1 cursor-pointer border border-rose-900/60"
                                title="حذف"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">حذف</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: Assistant Direction */}
              {activeTab === 'direction' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 leading-relaxed flex items-start gap-3">
                    <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block mb-1">
                        تنظیم پویای جهت‌دهی و ماموریت مشاور هوشمند:
                      </span>
                      متن زیر خط‌مشی و اولویت‌های گفتگوی مشاور با متقاضیان را تعیین می‌کند. هر تغییری در این بخش ذخیره شود، بلافاصله و بدون نیاز به بیلد مجدد برنامه، روی تمامی درخواست‌ها و چت‌های جدید اعمال می‌گردد.
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-white">
                      متن جهت‌دهی دستیار (Persian Guidance):
                    </label>
                    <textarea
                      rows={12}
                      value={directionText}
                      onChange={(e) => setDirectionText(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
                    />
                  </div>

                  {directionSuccessMsg && (
                    <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{directionSuccessMsg}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      disabled={isSavingDirection}
                      onClick={handleSaveDirection}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                    >
                      {isSavingDirection ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      <span>ذخیره فوری جهت‌دهی دستیار</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: Synchronization Dashboard */}
              {activeTab === 'sync' && (
                <div className="space-y-6">
                  {/* Status Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                      <span className="text-[11px] text-slate-400 block mb-1">حوزه‌های فعال</span>
                      <span className="text-xl font-extrabold text-white">
                        {syncStatus?.totalActiveDomains ?? 0}
                        <span className="text-xs text-slate-500 font-normal mr-1">/ {syncStatus?.totalConfiguredDomains ?? 0}</span>
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                      <span className="text-[11px] text-slate-400 block mb-1">صفحات شناسایی‌شده</span>
                      <span className="text-xl font-extrabold text-emerald-400">
                        {syncStatus?.totalDiscoveredPages ?? 0}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                      <span className="text-[11px] text-slate-400 block mb-1">پروژه‌های ایندکس‌شده</span>
                      <span className="text-xl font-extrabold text-teal-400">
                        {syncStatus?.totalIndexedProjectPages ?? 0}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                      <span className="text-[11px] text-slate-400 block mb-1">وضعیت آخرین سینک</span>
                      <span className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1 mt-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {syncStatus?.syncStatus === 'success' ? 'موفق' : 'آماده'}
                      </span>
                    </div>
                  </div>

                  {/* Meta details */}
                  <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 text-xs space-y-2 text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">آخرین زمان همگام‌سازی:</span>
                      <span className="font-mono text-slate-200">
                        {syncStatus?.lastSyncTime
                          ? new Date(syncStatus.lastSyncTime).toLocaleString('fa-IR')
                          : 'تاکنون انجام نشده'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">شناسه پایگاه جستجوی فایل (File Search Store):</span>
                      <span className="font-mono text-[11px] text-slate-300 truncate max-w-xs">
                        {syncStatus?.fileSearchStoreId || 'Yazd Growth Center Knowledge Base'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">صفحات تغییریافته در آخرین سینک:</span>
                      <span className="font-bold text-slate-200">{syncStatus?.changedPagesCount ?? 0}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">صفحات حذف‌شده در آخرین سینک:</span>
                      <span className="font-bold text-slate-200">{syncStatus?.removedPagesCount ?? 0}</span>
                    </div>
                  </div>

                  {/* Sync Action Buttons */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 to-emerald-950/30 border border-emerald-900/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-sm text-white mb-1">
                        عملیات همگام‌سازی وب‌سایت
                      </h4>
                      <p className="text-xs text-slate-400">
                        «همگام‌سازی عادی» صرفاً صفحات جدید و تغییریافته را استخراج می‌کند. «بازسازی کامل» تمام داده‌ها را بازنشانی و مجدداً ایندکس می‌نماید.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={isSyncing}
                        onClick={() => handleTriggerSync(false)}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>همگام‌سازی عادی</span>
                      </button>

                      <button
                        type="button"
                        disabled={isSyncing}
                        onClick={() => setShowFullRebuildConfirm(true)}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950 hover:border-rose-700 border border-slate-700 text-slate-200 hover:text-rose-200 font-semibold text-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        بازسازی کامل دانش سایت
                      </button>
                    </div>
                  </div>

                  {/* Full Rebuild Confirmation Dialog */}
                  {showFullRebuildConfirm && (
                    <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-800 text-xs space-y-3 animate-fadeIn">
                      <div className="flex items-center gap-2 text-rose-300 font-bold">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <span>تأیید بازسازی کامل پایگاه دانش سایت</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        این عملیات تمامی ایندکس‌های قبلی را پاک کرده و تمامی صفحات حوزه‌های فعال را به صورت کامل و از نو خزش و ایندکس می‌کند. آیا مایل به ادامه هستید؟
                      </p>
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setShowFullRebuildConfirm(false)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
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
                    <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{syncMessage}</span>
                    </div>
                  )}

                  {/* Failed URLs list */}
                  {syncStatus?.failedUrls && syncStatus.failedUrls.length > 0 && (
                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                      <span className="font-bold text-xs text-rose-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        آدرس‌های با خطا روبرو شده ({syncStatus.failedUrls.length})
                      </span>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {syncStatus.failedUrls.map((f: FailedUrlRecord, idx: number) => (
                          <div
                            key={idx}
                            className="p-2 rounded-lg bg-rose-950/30 border border-rose-900/50 text-[11px] flex items-center justify-between gap-2"
                          >
                            <span className="font-mono text-slate-300 truncate dir-ltr">{f.url}</span>
                            <span className="text-rose-400 shrink-0">{f.reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
