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
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 text-slate-800 font-sans dir-rtl">
      <div className="bg-white border border-purple-150 rounded-3xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-800 via-violet-800 to-indigo-900 border-b border-purple-900/30 flex items-center justify-between shrink-0 text-white shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 border border-white/20 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white">
                  مدیریت دانش سایت و جهت‌دهی دستیار
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-purple-100 border border-white/20 text-[10px] font-bold">
                  ویژه مدیران
                </span>
              </div>
              <p className="text-xs text-purple-200 mt-0.5">
                تنظیم داینامیک حوزه‌ها و همگام‌سازی خودکار با وب‌سایت https://yazdinnofaraz.ir/
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-purple-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Check State */}
        {loadingAuthCheck ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs">
            <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mb-2" />
            <span>در حال بررسی دسترسی مدیر...</span>
          </div>
        ) : !isAdmin ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3 bg-[#faf9fe]">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">دسترسی مجاز مدیر یافت نشد</h3>
            <p className="text-xs text-slate-600 max-w-sm leading-relaxed">
              شما با حساب <span className="font-mono text-purple-700 font-semibold">{userEmail || 'نامشخص'}</span> وارد شده‌اید. برای دسترسی به بخش مدیریت دانش سایت، باید شناسه کاربری شما در ADMIN_UIDS سرور تعریف شده باشد.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold cursor-pointer shadow-sm shadow-purple-700/20"
            >
              بازگشت به دستیار
            </button>
          </div>
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="px-6 bg-purple-50/50 border-b border-purple-150 flex items-center gap-2 shrink-0 overflow-x-auto text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('domains')}
                className={`py-3 px-3.5 border-b-2 font-bold flex items-center gap-2 cursor-pointer transition-all ${
                  activeTab === 'domains'
                    ? 'border-purple-700 text-purple-800'
                    : 'border-transparent text-slate-500 hover:text-purple-700'
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
                    ? 'border-purple-700 text-purple-800'
                    : 'border-transparent text-slate-500 hover:text-purple-700'
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
                    ? 'border-purple-700 text-purple-800'
                    : 'border-transparent text-slate-500 hover:text-purple-700'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-purple-700' : ''}`} />
                <span>داشبورد همگام‌سازی سایت</span>
              </button>
            </div>

            {/* Error Notification Banner */}
            {generalError && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between shrink-0">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  {generalError}
                </span>
                <button
                  type="button"
                  onClick={() => setGeneralError(null)}
                  className="text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Body Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#faf9fe]">
              {/* TAB 1: Configured Domains */}
              {activeTab === 'domains' && (
                <div className="space-y-6">
                  {/* Add / Edit Form */}
                  <form
                    onSubmit={handleSaveDomain}
                    className="p-5 rounded-2xl bg-white border border-purple-150 shadow-xs space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        {editingDomainId ? <Edit3 className="w-4 h-4 text-amber-600" /> : <Plus className="w-4 h-4 text-purple-700" />}
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
                          className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                        >
                          انصراف از ویرایش
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          نام حوزه (مثال: انرژی، کشاورزی، معدن)
                        </label>
                        <input
                          type="text"
                          required
                          value={domainForm.name}
                          onChange={(e) => setDomainForm({ ...domainForm, name: e.target.value })}
                          placeholder="مثلاً: انرژی و بهینه‌سازی"
                          className="w-full bg-slate-50 border border-purple-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-600 focus:ring-1 focus:ring-purple-200"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          آدرس صفحه اصلی حوزه در سایت نوفرآز
                        </label>
                        <input
                          type="url"
                          required
                          value={domainForm.mainUrl}
                          onChange={(e) => setDomainForm({ ...domainForm, mainUrl: e.target.value })}
                          placeholder="https://yazdinnofaraz.ir/enrgy/"
                          className="w-full bg-slate-50 border border-purple-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-600 focus:ring-1 focus:ring-purple-200 dir-ltr font-mono"
                        />
                      </div>
                    </div>

                    {/* Guidance & Priority */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="md:col-span-3">
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          رهنمود تخصصی این حوزه برای هوش مصنوعی (اختیاری)
                        </label>
                        <input
                          type="text"
                          value={domainForm.guidanceText}
                          onChange={(e) => setDomainForm({ ...domainForm, guidanceText: e.target.value })}
                          placeholder="مثلاً: در این حوزه روی پروژه‌های پایش هوشمند مصرف برق و اینترنت اشیاء تمرکز کن."
                          className="w-full bg-slate-50 border border-purple-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-600 focus:ring-1 focus:ring-purple-200"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          اولویت نمایش (۱ بالاترین)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={99}
                          value={domainForm.priority}
                          onChange={(e) => setDomainForm({ ...domainForm, priority: Number(e.target.value) })}
                          className="w-full bg-slate-50 border border-purple-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-600 focus:ring-1 focus:ring-purple-200 text-center font-bold"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                        <input
                          type="checkbox"
                          checked={domainForm.active}
                          onChange={(e) => setDomainForm({ ...domainForm, active: e.target.checked })}
                          className="rounded border-purple-300 text-purple-700 focus:ring-purple-200"
                        />
                        <span>این حوزه فعال باشد و در کشف پروژه استفاده شود</span>
                      </label>

                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-sm shadow-purple-700/20 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>{editingDomainId ? 'ذخیره تغییرات حوزه' : 'افزودن به لیست حوزه‌ها'}</span>
                      </button>
                    </div>
                  </form>

                  {/* Configured Domains List */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-xs text-slate-700">
                      حوزه‌های پیکربندی‌شده ({domains.length})
                    </h4>

                    {domains.length === 0 ? (
                      <p className="text-xs text-slate-500 p-4 rounded-xl bg-white border border-purple-100 text-center">
                        هیچ حوزه‌ای تعریف نشده است. لطفاً حداقل یک حوزه اضافه کنید.
                      </p>
                    ) : (
                      domains.map((d) => (
                        <div
                          key={d.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            d.active
                              ? 'bg-white border-purple-150 hover:border-purple-300 shadow-xs'
                              : 'bg-slate-50 border-slate-200 opacity-60'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm text-slate-900">{d.name}</span>
                                <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-semibold">
                                  اولویت: {d.priority}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                    d.active
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-slate-100 text-slate-500'
                                  }`}
                                >
                                  {d.active ? 'فعال' : 'غیرفعال'}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono dir-ltr">
                                <Globe className="w-3.5 h-3.5 text-purple-600" />
                                <a
                                  href={d.mainUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="hover:text-purple-700 hover:underline flex items-center gap-1 font-medium"
                                >
                                  {d.mainUrl}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>

                              {d.guidanceText && (
                                <p className="text-[11px] text-slate-700 mt-1 bg-purple-50/60 p-2.5 rounded-lg border border-purple-100">
                                  <span className="font-semibold text-purple-800">رهنمود حوزه: </span>
                                  {d.guidanceText}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleEditDomain(d)}
                                className="p-2 rounded-xl bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-800 text-xs flex items-center gap-1 cursor-pointer transition-colors border border-slate-200"
                                title="ویرایش"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">ویرایش</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteDomain(d.id)}
                                className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs flex items-center gap-1 cursor-pointer border border-rose-200 transition-colors"
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
                  <div className="p-4 rounded-2xl bg-white border border-purple-150 text-xs text-slate-700 leading-relaxed flex items-start gap-3 shadow-xs">
                    <Info className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block mb-1">
                        تنظیم پویای جهت‌دهی و ماموریت مشاور هوشمند:
                      </span>
                      متن زیر خط‌مشی و اولویت‌های گفتگوی مشاور با متقاضیان را تعیین می‌کند. هر تغییری در این بخش ذخیره شود، بلافاصله و بدون نیاز به بیلد مجدد برنامه، روی تمامی درخواست‌ها و چت‌های جدید اعمال می‌گردد.
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-900">
                      متن جهت‌دهی دستیار (Persian Guidance):
                    </label>
                    <textarea
                      rows={12}
                      value={directionText}
                      onChange={(e) => setDirectionText(e.target.value)}
                      className="w-full bg-white border border-purple-200 rounded-2xl p-4 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 leading-relaxed font-sans shadow-xs"
                    />
                  </div>

                  {directionSuccessMsg && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{directionSuccessMsg}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      disabled={isSavingDirection}
                      onClick={handleSaveDirection}
                      className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-sm shadow-purple-700/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
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
                    <div className="p-4 rounded-2xl bg-white border border-purple-150 text-center shadow-xs">
                      <span className="text-[11px] text-slate-500 block mb-1">حوزه‌های فعال</span>
                      <span className="text-xl font-extrabold text-slate-900">
                        {syncStatus?.totalActiveDomains ?? 0}
                        <span className="text-xs text-slate-400 font-normal mr-1">/ {syncStatus?.totalConfiguredDomains ?? 0}</span>
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-purple-150 text-center shadow-xs">
                      <span className="text-[11px] text-slate-500 block mb-1">صفحات شناسایی‌شده</span>
                      <span className="text-xl font-extrabold text-purple-700">
                        {syncStatus?.totalDiscoveredPages ?? 0}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-purple-150 text-center shadow-xs">
                      <span className="text-[11px] text-slate-500 block mb-1">پروژه‌های ایندکس‌شده</span>
                      <span className="text-xl font-extrabold text-violet-700">
                        {syncStatus?.totalIndexedProjectPages ?? 0}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-purple-150 text-center shadow-xs">
                      <span className="text-[11px] text-slate-500 block mb-1">وضعیت آخرین سینک</span>
                      <span className="text-xs font-bold text-emerald-700 flex items-center justify-center gap-1 mt-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {syncStatus?.syncStatus === 'success' ? 'موفق' : 'آماده'}
                      </span>
                    </div>
                  </div>

                  {/* Meta details */}
                  <div className="p-4 rounded-2xl bg-white border border-purple-150 text-xs space-y-2 text-slate-700 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">آخرین زمان همگام‌سازی:</span>
                      <span className="font-mono text-slate-900 font-medium">
                        {syncStatus?.lastSyncTime
                          ? new Date(syncStatus.lastSyncTime).toLocaleString('fa-IR')
                          : 'تاکنون انجام نشده'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">شناسه پایگاه جستجوی فایل (File Search Store):</span>
                      <span className="font-mono text-[11px] text-purple-800 font-semibold truncate max-w-xs">
                        {syncStatus?.fileSearchStoreId || 'Yazd Growth Center Knowledge Base'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">صفحات تغییریافته در آخرین سینک:</span>
                      <span className="font-bold text-slate-900">{syncStatus?.changedPagesCount ?? 0}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">صفحات حذف‌شده در آخرین سینک:</span>
                      <span className="font-bold text-slate-900">{syncStatus?.removedPagesCount ?? 0}</span>
                    </div>
                  </div>

                  {/* Sync Action Buttons */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-50 via-purple-50/60 to-indigo-50/40 border border-purple-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 mb-1">
                        عملیات همگام‌سازی وب‌سایت
                      </h4>
                      <p className="text-xs text-slate-600">
                        «همگام‌سازی عادی» صرفاً صفحات جدید و تغییریافته را استخراج می‌کند. «بازسازی کامل» تمام داده‌ها را بازنشانی و مجدداً ایندکس می‌نماید.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={isSyncing}
                        onClick={() => handleTriggerSync(false)}
                        className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-sm shadow-purple-700/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>همگام‌سازی عادی</span>
                      </button>

                      <button
                        type="button"
                        disabled={isSyncing}
                        onClick={() => setShowFullRebuildConfirm(true)}
                        className="px-4 py-2.5 rounded-xl bg-white hover:bg-rose-50 border border-slate-300 text-slate-700 hover:text-rose-700 font-semibold text-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        بازسازی کامل دانش سایت
                      </button>
                    </div>
                  </div>

                  {/* Full Rebuild Confirmation Dialog */}
                  {showFullRebuildConfirm && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs space-y-3 animate-fadeIn">
                      <div className="flex items-center gap-2 text-rose-800 font-bold">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span>تأیید بازسازی کامل پایگاه دانش سایت</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">
                        این عملیات تمامی ایندکس‌های قبلی را پاک کرده و تمامی صفحات حوزه‌های فعال را به صورت کامل و از نو خزش و ایندکس می‌کند. آیا مایل به ادامه هستید؟
                      </p>
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setShowFullRebuildConfirm(false)}
                          className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs cursor-pointer"
                        >
                          انصراف
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTriggerSync(true)}
                          className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                        >
                          بله، بازسازی کامل انجام شود
                        </button>
                      </div>
                    </div>
                  )}

                  {syncMessage && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{syncMessage}</span>
                    </div>
                  )}

                  {/* Failed URLs list */}
                  {syncStatus?.failedUrls && syncStatus.failedUrls.length > 0 && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
                      <span className="font-bold text-xs text-rose-800 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        آدرس‌های با خطا روبرو شده ({syncStatus.failedUrls.length})
                      </span>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {syncStatus.failedUrls.map((f: FailedUrlRecord, idx: number) => (
                          <div
                            key={idx}
                            className="p-2 rounded-lg bg-white border border-rose-200 text-[11px] flex items-center justify-between gap-2"
                          >
                            <span className="font-mono text-slate-800 truncate dir-ltr">{f.url}</span>
                            <span className="text-rose-600 shrink-0 font-medium">{f.reason}</span>
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
