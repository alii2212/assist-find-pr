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
  Info,
  Smartphone,
  Monitor,
  Eye,
  Clock,
} from 'lucide-react';
import {
  ProjectDomainConfig,
  SyncStatusReport,
  SystemStatusReport,
  IndexedPageSummary,
  ProjectCatalogConfig,
  ProjectCategoryStat,
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
  const [catalogConfig, setCatalogConfig] = useState<ProjectCatalogConfig>({
    catalogUrl: 'https://yazdinnofaraz.ir/categories/',
    catalogUrlPatterns: ['/categories/', '/categories/*'],
    enforceCatalogOnlyForProjects: true,
    generalPagesGuidance: '',
    categories: [],
  });
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState<boolean>(false);
  const [categoryForm, setCategoryForm] = useState<{
    name: string;
    subUrl: string;
    projectCount: number;
    keySkillsText: string;
    description: string;
    active: boolean;
  }>({
    name: '',
    subUrl: '',
    projectCount: 0,
    keySkillsText: '',
    description: '',
    active: true,
  });
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
        if (data.assistantDirection) {
          setDirectionText(data.assistantDirection.directionText || '');
          if (data.assistantDirection.catalogConfig) {
            setCatalogConfig(data.assistantDirection.catalogConfig);
          }
        }
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

  // Assistant Direction & Catalog Actions
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
        body: JSON.stringify({
          directionText,
          catalogConfig,
        }),
      });
      if (res.ok) {
        setDirectionSuccessMsg('جهت‌دهی دستیار و تنظیمات کاتالوگ با موفقیت ذخیره شد و بلافاصله در تمامی گفتگوهای جدید اعمال می‌گردد.');
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
    if (!window.confirm('آیا مایل به بازگردانی تنظیمات پیش‌فرض کاتالوگ و جهت‌دهی دستیار هستید؟')) return;
    try {
      const token = await getCurrentIdToken();
      const res = await fetch('/api/admin/assistant-direction/reset', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDirectionText(data.assistantDirection.directionText);
        if (data.assistantDirection.catalogConfig) {
          setCatalogConfig(data.assistantDirection.catalogConfig);
        }
        setDirectionSuccessMsg('تنظیمات پیش‌فرض کاتالوگ و جهت‌دهی با موفقیت بازگردانده شد.');
        setTimeout(() => setDirectionSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Category Actions for Catalog Config
  const handleToggleCategoryActive = (catId: string) => {
    setCatalogConfig((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.id === catId ? { ...c, active: !c.active } : c
      ),
    }));
  };

  const handleDeleteCategory = (catId: string) => {
    if (!window.confirm('آیا از حذف این حوزه از کاتالوگ پروژه‌ها اطمینان دارید؟')) return;
    setCatalogConfig((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== catId),
    }));
  };

  const handleStartEditCategory = (cat: ProjectCategoryStat) => {
    setEditingCategoryId(cat.id);
    setCategoryForm({
      name: cat.name,
      subUrl: cat.subUrl || '',
      projectCount: cat.projectCount || 0,
      keySkillsText: (cat.keySkills || []).join('، '),
      description: cat.description || '',
      active: cat.active,
    });
    setShowCategoryForm(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;

    const skills = categoryForm.keySkillsText
      .split(/[,،]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingCategoryId) {
      setCatalogConfig((prev) => ({
        ...prev,
        categories: prev.categories.map((c) =>
          c.id === editingCategoryId
            ? {
                ...c,
                name: categoryForm.name.trim(),
                subUrl: categoryForm.subUrl.trim(),
                projectCount: Number(categoryForm.projectCount) || 0,
                keySkills: skills,
                description: categoryForm.description.trim(),
                active: categoryForm.active,
              }
            : c
        ),
      }));
    } else {
      const newId = 'cat_' + Date.now().toString(36);
      const newCat: ProjectCategoryStat = {
        id: newId,
        name: categoryForm.name.trim(),
        subUrl: categoryForm.subUrl.trim() || `${catalogConfig.catalogUrl}${newId}/`,
        projectCount: Number(categoryForm.projectCount) || 0,
        keySkills: skills,
        description: categoryForm.description.trim(),
        active: categoryForm.active,
      };
      setCatalogConfig((prev) => ({
        ...prev,
        categories: [...prev.categories, newCat],
      }));
    }

    setShowCategoryForm(false);
    setEditingCategoryId(null);
    setCategoryForm({
      name: '',
      subUrl: '',
      projectCount: 0,
      keySkillsText: '',
      description: '',
      active: true,
    });
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

  // User Persistent App Base Domain (defaults to Render domain, remembered across page refreshes)
  const defaultRenderDomain = 'https://assist-find-pr1.onrender.com';
  const [appDomain, setAppDomain] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('yazd_assistant_app_domain');
      if (saved && saved.trim()) return saved.trim();
    }
    return defaultRenderDomain;
  });
  const [domainSavedNotice, setDomainSavedNotice] = useState<boolean>(false);

  // Helper to normalize input domain (strips trailing /widget, slashes, ensures https://)
  const cleanAppDomain = (raw: string): string => {
    let clean = (raw || '').trim();
    if (!clean) return defaultRenderDomain;
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'https://' + clean;
    }
    // Remove trailing /widget or /widget/
    clean = clean.replace(/\/widget\/?$/i, '');
    // Remove trailing slashes
    clean = clean.replace(/\/+$/, '');
    return clean;
  };

  const normalizedDomain = cleanAppDomain(appDomain);
  const widgetUrl = `${normalizedDomain}/widget`;
  const healthUrl = `${normalizedDomain}/health`;

  const handleDomainChange = (val: string) => {
    setAppDomain(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('yazd_assistant_app_domain', val.trim());
    }
  };

  const handleSaveAppDomain = () => {
    const cleaned = cleanAppDomain(appDomain);
    setAppDomain(cleaned);
    if (typeof window !== 'undefined') {
      localStorage.setItem('yazd_assistant_app_domain', cleaned);
    }
    setDomainSavedNotice(true);
    setTimeout(() => setDomainSavedNotice(false), 3000);
  };

  // Cron Job states & helpers to keep Render / cloud hosting server awake
  const [copiedCron, setCopiedCron] = useState<boolean>(false);
  const [healthTestStatus, setHealthTestStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  const [healthTestLatency, setHealthTestLatency] = useState<number | null>(null);

  const cronCurlCommand = `*/10 * * * * curl -s -f ${healthUrl} > /dev/null 2>&1`;
  const cronWgetCommand = `*/10 * * * * wget -q -O - ${healthUrl} > /dev/null 2>&1`;

  const handleCopyCronCode = () => {
    navigator.clipboard.writeText(cronCurlCommand);
    setCopiedCron(true);
    setTimeout(() => setCopiedCron(false), 2500);
  };

  const testServerHealth = async () => {
    setHealthTestStatus('testing');
    const start = Date.now();
    try {
      const res = await fetch('/api/health');
      const latency = Date.now() - start;
      if (res.ok) {
        setHealthTestStatus('ok');
        setHealthTestLatency(latency);
      } else {
        setHealthTestStatus('fail');
      }
    } catch (_) {
      setHealthTestStatus('fail');
    }
  };

  // Dynamic Embed Code Generator matching user requirements:
  // 1. Bottom-Left small circle button
  // 2. Cloud-shaped speech bubble: "از هوش مصنوعی برای انتخاب پروژه کمک بگیرید"
  // 3. Desktop: Left-side drawer (سایدبار سمت چپ)
  // 4. Mobile: Bottom drawer (داون‌بار تمام‌عرض و راحت برای چت)
  const generateWordPressEmbedCode = (url: string) => `<!-- شروع کد هوشمند دستیار انتخاب پروژه مرکز رشد فراز دانشگاه یزد -->
<div id="yazd-growth-ai-root">
  <!-- دکمه شناور دایره‌ای و ابری پیام در گوشه پایین سمت چپ -->
  <div id="yazd-ai-launcher" style="position: fixed; bottom: 24px; left: 24px; z-index: 9999999; display: flex; align-items: center; gap: 10px; font-family: Tahoma, Vazirmatn, system-ui, sans-serif; direction: rtl;">
    <!-- ابری پیام راهنما -->
    <div id="yazd-ai-cloud" style="background: #ffffff; color: #1e1b4b; font-size: 13px; font-weight: 700; padding: 9px 16px; border-radius: 20px; box-shadow: 0 10px 25px -5px rgba(109, 40, 217, 0.25), 0 8px 10px -6px rgba(0,0,0,0.1); border: 1px solid #ddd6fe; cursor: pointer; white-space: nowrap; display: flex; align-items: center; gap: 8px; transition: all 0.25s ease; animation: yazdCloudFloat 3s ease-in-out infinite;">
      <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #7c3aed; box-shadow: 0 0 8px #7c3aed;"></span>
      <span>از هوش مصنوعی برای انتخاب پروژه کمک بگیرید</span>
    </div>
    <!-- دایره کوچک آیکون دستیار در سمت چپ -->
    <button id="yazd-ai-btn" type="button" aria-label="مشاور هوشمند انتخاب پروژه" style="width: 54px; height: 54px; min-width: 54px; border-radius: 50%; background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #4338ca 100%); border: 2px solid #ffffff; box-shadow: 0 10px 25px -3px rgba(109, 40, 217, 0.5), 0 4px 6px -4px rgba(0,0,0,0.1); cursor: pointer; display: flex; align-items: center; justify-content: center; color: #ffffff; transition: transform 0.2s ease, box-shadow 0.2s ease;">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
        <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
      </svg>
    </button>
  </div>

  <!-- لایه تیره پشت پنل -->
  <div id="yazd-ai-overlay" style="display: none; position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(2px); -webkit-backdrop-filter: blur(2px); z-index: 9999998; opacity: 0; transition: opacity 0.3s ease;"></div>

  <!-- کانتینر چت: سایدبار چپ در کامپیوتر و داون‌بار در گوشی -->
  <div id="yazd-ai-panel" style="display: none; position: fixed; z-index: 9999999; background: #ffffff; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); overflow: hidden; transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;">
    <!-- دستگیره کشیدن برای تغییر ارتفاع در موبایل -->
    <div id="yazd-ai-drag-mobile" style="display: none; height: 16px; width: 100%; cursor: ns-resize; background: #581c87; align-items: center; justify-content: center; select-none;">
      <div style="width: 42px; height: 4px; background: rgba(255,255,255,0.7); border-radius: 2px;"></div>
    </div>

    <!-- نوار کشیدن برای تغییر عرض در دسکتاپ -->
    <div id="yazd-ai-drag-desktop" style="position: absolute; top: 0; bottom: 0; right: 0; width: 8px; cursor: ew-resize; background: transparent; z-index: 9999;" title="برای تغییر عرض سایدبار بکشید"></div>

    <!-- نوار بالای پنل با دکمه‌های تغییر اندازه و بستن -->
    <div id="yazd-ai-panel-header" style="height: 46px; background: linear-gradient(to right, #6d28d9, #4f46e5); display: flex; align-items: center; justify-content: space-between; padding: 0 14px; color: #ffffff; font-family: Tahoma, Vazirmatn, system-ui, sans-serif; direction: rtl;">
      <span style="font-size: 13px; font-weight: bold; display: flex; align-items: center; gap: 7px;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
        مشاور انتخاب پروژه نوفرآز دانشگاه یزد
      </span>
      <div style="display: flex; align-items: center; gap: 6px;">
        <button id="yazd-ai-resize-btn" type="button" aria-label="تغییر اندازه" title="بزرگ‌نمایی / کوچک‌نمایی پنجره دستیار" style="background: rgba(255,255,255,0.2); border: none; color: #ffffff; width: 30px; height: 30px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; transition: background 0.2s ease;">⛶</button>
        <button id="yazd-ai-close-btn" type="button" aria-label="بستن پنجره" style="background: rgba(255,255,255,0.2); border: none; color: #ffffff; width: 30px; height: 30px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: bold; transition: background 0.2s ease;">✕</button>
      </div>
    </div>
    <!-- آی‌فریم لود کننده مشاور هوشمند -->
    <iframe id="yazd-ai-iframe" src="" style="width: 100%; height: calc(100% - 46px); border: none; display: block;" allow="clipboard-write; identity-credentials-get"></iframe>
  </div>
</div>

<style>
  @keyframes yazdCloudFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }
  #yazd-ai-btn:hover { transform: scale(1.08); box-shadow: 0 15px 30px -3px rgba(109, 40, 217, 0.6); }
  #yazd-ai-cloud:hover { background: #f5f3ff; border-color: #c4b5fd; transform: translateY(-2px); }
  #yazd-ai-close-btn:hover, #yazd-ai-resize-btn:hover { background: rgba(255,255,255,0.35); }

  /* حالت کامپیوتر (دسکتاپ): سایدبار سمت چپ */
  @media (min-width: 641px) {
    #yazd-ai-panel {
      top: 0; left: 0; bottom: 0; width: 440px; height: 100vh;
      border-right: 1px solid #e2e8f0;
      transform: translateX(-100%);
    }
    #yazd-ai-panel.yazd-open {
      display: block !important;
      transform: translateX(0);
    }
    #yazd-ai-drag-mobile { display: none !important; }
    #yazd-ai-drag-desktop { display: block !important; }
  }

  /* حالت گوشی (موبایل): داون‌بار از پایین صفحه */
  @media (max-width: 640px) {
    #yazd-ai-panel {
      bottom: 0; left: 0; right: 0; width: 100vw; height: 85vh;
      border-top-left-radius: 24px; border-top-right-radius: 24px;
      transform: translateY(100%);
    }
    #yazd-ai-panel.yazd-open {
      display: block !important;
      transform: translateY(0);
    }
    #yazd-ai-cloud {
      font-size: 11px; padding: 7px 12px;
    }
    #yazd-ai-launcher {
      bottom: 16px; left: 16px; gap: 8px;
    }
    #yazd-ai-drag-mobile { display: flex !important; }
    #yazd-ai-drag-desktop { display: none !important; }
  }
</style>

<script>
(function() {
  var targetUrl = "${url.trim()}";
  var launcher = document.getElementById("yazd-ai-launcher");
  var cloud = document.getElementById("yazd-ai-cloud");
  var btn = document.getElementById("yazd-ai-btn");
  var overlay = document.getElementById("yazd-ai-overlay");
  var panel = document.getElementById("yazd-ai-panel");
  var iframe = document.getElementById("yazd-ai-iframe");
  var closeBtn = document.getElementById("yazd-ai-close-btn");
  var resizeBtn = document.getElementById("yazd-ai-resize-btn");
  var dragDesktop = document.getElementById("yazd-ai-drag-desktop");
  var dragMobile = document.getElementById("yazd-ai-drag-mobile");
  var isOpen = false;
  var isMax = false;

  function openAssistant() {
    if (!iframe.src) {
      var currentUrl = encodeURIComponent(window.location.href);
      var sep = targetUrl.indexOf("?") === -1 ? "?" : "&";
      iframe.src = targetUrl + sep + "parentUrl=" + currentUrl;
    }
    isOpen = true;
    overlay.style.display = "block";
    panel.style.display = "block";
    launcher.style.display = "none";
    setTimeout(function() {
      panel.classList.add("yazd-open");
      overlay.style.opacity = "1";
    }, 15);
  }

  function closeAssistant() {
    isOpen = false;
    panel.classList.remove("yazd-open");
    overlay.style.opacity = "0";
    setTimeout(function() {
      if (!isOpen) {
        overlay.style.display = "none";
        panel.style.display = "none";
        launcher.style.display = "flex";
      }
    }, 320);
  }

  if (btn) btn.addEventListener("click", openAssistant);
  if (cloud) cloud.addEventListener("click", openAssistant);
  if (closeBtn) closeBtn.addEventListener("click", closeAssistant);
  if (overlay) overlay.addEventListener("click", closeAssistant);

  // Resize toggle button
  if (resizeBtn) {
    resizeBtn.addEventListener("click", function() {
      isMax = !isMax;
      var isMobile = window.innerWidth <= 640;
      if (isMobile) {
        panel.style.height = isMax ? "100vh" : "85vh";
      } else {
        panel.style.width = isMax ? "min(94vw, 860px)" : "440px";
      }
      resizeBtn.textContent = isMax ? "▫" : "⛶";
    });
  }

  // Desktop drag width
  if (dragDesktop) {
    dragDesktop.addEventListener("mousedown", function(e) {
      e.preventDefault();
      function onMouseMove(ev) {
        var w = Math.min(Math.max(ev.clientX, 360), window.innerWidth - 30);
        panel.style.width = w + "px";
      }
      function onMouseUp() {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      }
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    });
  }

  // Mobile drag height
  if (dragMobile) {
    function startMobileDrag(startY) {
      function onMove(evY) {
        var vh = Math.round(((window.innerHeight - evY) / window.innerHeight) * 100);
        var clamped = Math.min(Math.max(vh, 45), 100);
        panel.style.height = clamped + "vh";
      }
      function onTouchMove(ev) {
        if (ev.touches && ev.touches[0]) onMove(ev.touches[0].clientY);
      }
      function onMouseMove(ev) { onMove(ev.clientY); }
      function onEnd() {
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("touchend", onEnd);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onEnd);
      }
      window.addEventListener("touchmove", onTouchMove);
      window.addEventListener("touchend", onEnd);
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onEnd);
    }

    dragMobile.addEventListener("touchstart", function(e) {
      if (e.touches && e.touches[0]) startMobileDrag(e.touches[0].clientY);
    });
    dragMobile.addEventListener("mousedown", function(e) {
      startMobileDrag(e.clientY);
    });
  }

  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape" && isOpen) closeAssistant();
  });

  window.addEventListener("message", function(e) {
    if (e.data && (e.data.type === "GROWTH_ASSISTANT_CLOSE" || e.data.type === "CLOSE_ASSISTANT_WIDGET")) {
      closeAssistant();
    }
  });
})();
</script>
<!-- پایان کد هوشمند دستیار انتخاب پروژه -->`.trim();

  const currentEmbedCode = generateWordPressEmbedCode(widgetUrl);

  const handleCopyEmbedCode = () => {
    navigator.clipboard.writeText(currentEmbedCode);
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

          {/* SECTION 4: ASSISTANT DIRECTION & PROJECT CATALOG CONFIGURATION */}
          {activeTab === 'direction' && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="p-5 rounded-2xl bg-white border border-purple-150 text-xs text-slate-700 leading-relaxed flex items-start justify-between gap-4 shadow-xs">
                <div className="flex items-start gap-3">
                  <Sliders className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
                      <span>جهت‌گیری دستیار و کاتالوگ پروژه‌های قابل اخذ</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        اعمال آنی بدون نیاز به بیلد
                      </span>
                    </h3>
                    <p className="text-slate-500 text-xs">
                      پروژه‌های قابل اخذ منحصراً از لینک کاتالوگ و حوزه‌های تعریف‌شده در آن استخراج می‌شوند. سایر صفحات سایت صرفاً برای پاسخ به سوالات عمومی کاربر (آدرس، سوابق تیم‌ها، تسهیلات و ...) استفاده خواهند شد.
                    </p>
                  </div>
                </div>

                <div className="hidden lg:flex items-center gap-4 text-left shrink-0">
                  <div className="px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-center">
                    <span className="block text-[10px] text-purple-700 font-medium">حوزه‌های فعال کاتالوگ</span>
                    <span className="text-sm font-extrabold text-purple-900">
                      {catalogConfig.categories.filter((c) => c.active).length} از {catalogConfig.categories.length}
                    </span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                    <span className="block text-[10px] text-emerald-700 font-medium">مجموع پروژه‌های باز</span>
                    <span className="text-sm font-extrabold text-emerald-900">
                      {catalogConfig.categories.filter((c) => c.active).reduce((sum, c) => sum + (c.projectCount || 0), 0)} پروژه
                    </span>
                  </div>
                </div>
              </div>

              {/* CARD 1: تنظیم منبع اصلی کاتالوگ پروژه‌ها */}
              <div className="bg-white border border-purple-150 rounded-2xl p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-purple-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-purple-700" />
                    <h4 className="font-bold text-xs text-slate-900">
                      ۱. آدرس اصلی کاتالوگ پروژه‌ها و قوانین اعتبارسنجی
                    </h4>
                  </div>
                  <span className="text-[11px] text-purple-700 font-semibold bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                    منبع اصلی و انحصاری پروژه‌های قابل اخذ
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      آدرس اصلی کاتالوگ پروژه‌ها (مرجع انحصاری شناسایی پروژه‌ها):
                    </label>
                    <input
                      type="url"
                      value={catalogConfig.catalogUrl}
                      onChange={(e) =>
                        setCatalogConfig({ ...catalogConfig, catalogUrl: e.target.value })
                      }
                      placeholder="https://yazdinnofaraz.ir/categories/"
                      className="w-full bg-[#f8f7fc] border border-purple-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono dir-ltr focus:outline-none focus:border-purple-600 focus:bg-white"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      هوش مصنوعی موظف است پروژه‌های پیشنهادی به کاربر را صرفاً از این آدرس و حوزه‌های مشتق‌شده از آن استخراج کند.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      الگوی مسیرهای مجاز کاتالوگ:
                    </label>
                    <input
                      type="text"
                      value={catalogConfig.catalogUrlPatterns.join(', ')}
                      onChange={(e) =>
                        setCatalogConfig({
                          ...catalogConfig,
                          catalogUrlPatterns: e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder="/categories/, /categories/*"
                      className="w-full bg-[#f8f7fc] border border-purple-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono dir-ltr focus:outline-none focus:border-purple-600 focus:bg-white"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      با ویرگول جدا کنید.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2.5 cursor-pointer p-3 rounded-xl bg-purple-50/70 border border-purple-200/80 hover:bg-purple-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={catalogConfig.enforceCatalogOnlyForProjects}
                      onChange={(e) =>
                        setCatalogConfig({
                          ...catalogConfig,
                          enforceCatalogOnlyForProjects: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded border-purple-300 text-purple-700 focus:ring-purple-200"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-900 block">
                        الزام اکید: پروژه‌های قابل اخذ فقط و فقط از لینک کاتالوگ و حوزه‌های فعال آن استخراج شوند
                      </span>
                      <span className="text-slate-600 text-[11px]">
                        در صورت فعال بودن، صفحات متفرقه سایت (مانند درباره ما یا اخبار) هرگز به عنوان پروژه قابل اخذ پیشنهاد نخواهند شد.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* CARD 2: مدیریت حوزه‌های کاتالوگ و لینک‌های اختصاصی */}
              <div className="bg-white border border-purple-150 rounded-2xl p-5 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-100 pb-3">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-purple-700" />
                      <span>۲. حوزه‌های فعال پروژه‌ها در کاتالوگ ({catalogConfig.categories.length} حوزه)</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      هر حوزه دارای لینک اختصاصی در کاتالوگ، تعداد پروژه‌های آماده اخذ، و مهارت‌های مورد نیاز است.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategoryId(null);
                      setCategoryForm({
                        name: '',
                        subUrl: '',
                        projectCount: 0,
                        keySkillsText: '',
                        description: '',
                        active: true,
                      });
                      setShowCategoryForm(!showCategoryForm);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0 self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>افزودن حوزه جدید به کاتالوگ</span>
                  </button>
                </div>

                {/* Form to Add / Edit Category */}
                {showCategoryForm && (
                  <form
                    onSubmit={handleSaveCategory}
                    className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-900">
                        {editingCategoryId ? 'ویرایش اطلاعات حوزه کاتالوگ' : 'افزودن حوزه جدید به کاتالوگ'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCategoryForm(false);
                          setEditingCategoryId(null);
                        }}
                        className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        انصراف
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          عنوان حوزه (مثال: کشاورزی و امنیت غذایی)
                        </label>
                        <input
                          type="text"
                          required
                          value={categoryForm.name}
                          onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                          placeholder="مثلاً: رباتیک و اتوماسیون صنعتی"
                          className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          آدرس URL مستقیم زیرشاخه در کاتالوگ:
                        </label>
                        <input
                          type="url"
                          required
                          value={categoryForm.subUrl}
                          onChange={(e) => setCategoryForm({ ...categoryForm, subUrl: e.target.value })}
                          placeholder="https://yazdinnofaraz.ir/categories/robotics/"
                          className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono dir-ltr focus:outline-none focus:border-purple-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          تعداد پروژه‌های قابل اخذ:
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={9999}
                          value={categoryForm.projectCount}
                          onChange={(e) => setCategoryForm({ ...categoryForm, projectCount: Number(e.target.value) })}
                          className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold text-center focus:outline-none focus:border-purple-600"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          مهارت‌های کلیدی (با کاما یا ویرگول جدا کنید):
                        </label>
                        <input
                          type="text"
                          value={categoryForm.keySkillsText}
                          onChange={(e) => setCategoryForm({ ...categoryForm, keySkillsText: e.target.value })}
                          placeholder="مثلاً: طراحی برد، ROS، پردازش تصویر، اینترنت اشیاء"
                          className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        توضیحات و محورهای اولویت‌دار حوزه:
                      </label>
                      <input
                        type="text"
                        value={categoryForm.description}
                        onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                        placeholder="توضیح کوتاه درباره فرصت‌های این حوزه و اولویت‌های سرمایه‌گذاری"
                        className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                        <input
                          type="checkbox"
                          checked={categoryForm.active}
                          onChange={(e) => setCategoryForm({ ...categoryForm, active: e.target.checked })}
                          className="rounded border-purple-300 text-purple-700 focus:ring-purple-200"
                        />
                        <span>این حوزه فعال باشد و در پیشنهادات مشاور لحاظ گردد</span>
                      </label>

                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>{editingCategoryId ? 'بروزرسانی حوزه' : 'ثبت حوزه در کاتالوگ'}</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* Categories Table */}
                <div className="overflow-x-auto rounded-xl border border-purple-150">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-[#f8f7fc] text-slate-600 border-b border-purple-150">
                      <tr>
                        <th className="p-3 font-semibold">عنوان حوزه</th>
                        <th className="p-3 font-semibold text-center">پروژه‌های قابل اخذ</th>
                        <th className="p-3 font-semibold">لینک مستقیم در کاتالوگ</th>
                        <th className="p-3 font-semibold">مهارت‌های کلیدی</th>
                        <th className="p-3 font-semibold text-center">وضعیت</th>
                        <th className="p-3 font-semibold text-center">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-100">
                      {catalogConfig.categories.map((cat) => (
                        <tr
                          key={cat.id}
                          className={`hover:bg-purple-50/50 transition-colors ${
                            !cat.active ? 'opacity-60 bg-slate-50' : ''
                          }`}
                        >
                          <td className="p-3 font-bold text-slate-900">
                            <div>{cat.name}</div>
                            {cat.description && (
                              <div className="text-[11px] text-slate-500 font-normal mt-0.5 line-clamp-1">
                                {cat.description}
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-purple-50 text-purple-800 border border-purple-200">
                              {cat.projectCount}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-slate-600 dir-ltr text-left">
                            <a
                              href={cat.subUrl || catalogConfig.catalogUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:text-purple-700 hover:underline flex items-center gap-1"
                            >
                              <span className="truncate max-w-[200px]">
                                {cat.subUrl || catalogConfig.catalogUrl}
                              </span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {(cat.keySkills || []).slice(0, 3).map((sk, idx) => (
                                <span
                                  key={idx}
                                  className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]"
                                >
                                  {sk}
                                </span>
                              ))}
                              {(cat.keySkills || []).length > 3 && (
                                <span className="text-[10px] text-slate-400">
                                  +{(cat.keySkills || []).length - 3}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleCategoryActive(cat.id)}
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                                cat.active
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-500 border border-slate-200'
                              }`}
                            >
                              {cat.active ? 'فعال' : 'غیرفعال'}
                            </button>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleStartEditCategory(cat)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-800 transition-colors"
                                title="ویرایش حوزه"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors"
                                title="حذف حوزه"
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

              {/* CARD 3: دستورالعمل سایر صفحات سایت و اطلاعات سازمانی مرکز */}
              <div className="bg-white border border-purple-150 rounded-2xl p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-purple-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-purple-700" />
                    <h4 className="font-bold text-xs text-slate-900">
                      ۳. دستورالعمل استفاده از سایر صفحات و اطلاعات عمومی مرکز رشد
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    پاسخ به سوالاتی مانند آدرس، تعداد تیم‌ها، تسهیلات و شرایط پذیرش
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed">
                  هوش مصنوعی از سایر صفحات وب‌سایت نوفرآز (شامل درباره ما، تماس با ما، تیم‌ها، تسهیلات، سوالات متداول و ...) صرفاً برای پاسخ به پرسش‌های اطلاعاتی و سازمانی زیر استفاده خواهد کرد:
                </p>

                <textarea
                  rows={4}
                  value={catalogConfig.generalPagesGuidance}
                  onChange={(e) =>
                    setCatalogConfig({ ...catalogConfig, generalPagesGuidance: e.target.value })
                  }
                  className="w-full bg-[#f8f7fc] border border-purple-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-500 focus:outline-none focus:border-purple-600 focus:bg-white leading-relaxed font-sans"
                  placeholder="دستورالعمل نحوه برخورد با صفحات متفرقه سایت..."
                />
              </div>

              {/* CARD 4: متن دستورالعمل و جهت‌دهی رفتاری دستیار هوشمند */}
              <div className="bg-white border border-purple-150 rounded-2xl p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-purple-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-700" />
                    <h4 className="font-bold text-xs text-slate-900">
                      ۴. متن جهت‌دهی جامع و رفتارشناسی مشاور هوشمند (Persian System Prompt)
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    خط‌مشی رفتار، جمع‌آوری تدریجی اطلاعات، استدلال و پیشنهاد گام‌های عملی
                  </span>
                </div>

                <textarea
                  rows={10}
                  value={directionText}
                  onChange={(e) => setDirectionText(e.target.value)}
                  className="w-full bg-[#f8f7fc] border border-purple-200 rounded-xl p-4 text-xs sm:text-sm text-slate-800 placeholder-slate-500 focus:outline-none focus:border-purple-600 focus:bg-white leading-relaxed font-sans"
                />
              </div>

              {/* Status Notifications */}
              {directionSuccessMsg && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="font-medium">{directionSuccessMsg}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetDirection}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>بازنشانی به مقادیر پیش‌فرض</span>
                </button>

                <button
                  type="button"
                  disabled={isSavingDirection}
                  onClick={handleSaveDirection}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md shadow-purple-700/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSavingDirection ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>ذخیره تمامی تنظیمات جهت‌دهی و کاتالوگ پروژه‌ها</span>
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

                {/* Single Persistent Domain Box */}
                <div className="p-4 rounded-xl bg-[#f8f7fc] border border-purple-150 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="text-xs font-bold text-slate-800 block">
                        آدرس دامنه اصلی سرور برنامه (محل نصب یا اجرای دستیار):
                      </label>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        فقط دامنه اصلی را وارد کنید (مثلاً <code className="font-mono text-purple-700 bg-purple-50 px-1 py-0.5 rounded">https://assist-find-pr1.onrender.com/</code>). این آدرس در حافظه مرورگر شما ذخیره دائمی می‌شود تا با رفرش صفحه از بین نرود. مسیر <code className="font-mono text-purple-700">/widget</code> به صورت خودکار به کد نهایی افزوده می‌شود.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveAppDomain}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                    >
                      <Check className="w-4 h-4" />
                      <span>{domainSavedNotice ? 'ذخیره شد ✅' : 'ذخیره دامنه'}</span>
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={appDomain}
                      onChange={(e) => handleDomainChange(e.target.value)}
                      placeholder="https://assist-find-pr1.onrender.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-purple-200 text-xs text-slate-900 font-mono dir-ltr focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 shadow-xs"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-600 pt-0.5">
                    <span>
                      آدرس مستقیم ویجت: <strong className="font-mono text-purple-700 dir-ltr">{widgetUrl}</strong>
                    </span>
                    <span>
                      آدرس پینگ/کرون: <strong className="font-mono text-emerald-700 dir-ltr">{healthUrl}</strong>
                    </span>
                    {domainSavedNotice && (
                      <span className="text-emerald-700 font-bold">
                        ✓ با موفقیت در حافظه ذخیره شد و در دفعات بعد باقی می‌ماند.
                      </span>
                    )}
                  </div>
                </div>

                {/* Important 403 Explanation Alert */}
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-800">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>علت خطای ۴۰۳ (Access Denied) در لینک‌های ais-dev و نحوه رفع آن:</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    گوگل آدرس‌های با پیشوند <code className="text-amber-900 font-mono bg-amber-100 px-1 py-0.5 rounded">ais-dev-</code> را به عنوان محیط توسعه خصوصی برنامه‌نویس قفل می‌کند و اجازه باز شدن آن توسط سایر کاربران یا بازدیدکنندگان وردپرس را نمی‌دهد.
                  </p>
                  <p className="text-[11px] text-purple-900 leading-relaxed font-semibold">
                    برای اینکه کاربران سایت شما مستقیماً و بدون هیچ اروری به ویجت دسترسی داشته باشند، کافیست در بالای همین صفحه استودیو روی دکمه <span className="bg-purple-100 px-1.5 py-0.5 rounded border border-purple-300">Share (اشتراک‌گذاری)</span> کلیک کنید تا نسخه عمومی <code className="text-purple-900 font-mono font-bold">ais-pre-</code> فعال شود. کد درج شده در جعبه زیر به صورت خودکار از دامنه عمومی استفاده می‌کند.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="font-bold">کد نهایی HTML برای قرار دادن در المنتور یا وردپرس:</span>
                    <span className="font-mono text-purple-700 dir-ltr text-[11px]">{widgetUrl}</span>
                  </div>

                  <pre className="bg-[#f8f7fc] p-4 rounded-xl border border-purple-150 text-[11px] font-mono text-slate-700 overflow-x-auto dir-ltr max-h-72 select-all">
                    {currentEmbedCode}
                  </pre>
                </div>
              </div>

              {/* Instructions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-purple-150 space-y-3">
                  <h4 className="font-bold text-xs text-slate-900">مراحل درج در المنتور (Elementor):</h4>
                  <ol className="list-decimal list-inside text-xs text-slate-700 space-y-2 leading-relaxed">
                    <li>وارد پیشخوان وردپرس شده و برگه یا فوتر سراسری (Footer Template) را با المنتور باز کنید.</li>
                    <li>ویجت «کد HTML» (HTML Widget) را به قالب اضافه کنید.</li>
                    <li>کد بالا را کپی کرده و درون فیلد کد المنتور جای‌گذاری کنید.</li>
                    <li>دکمه «انتشار / ذخیره» را بزنید. دایره کوچک دستیار و پیام ابری در گوشه پایین سمت چپ سایت فعال می‌شود.</li>
                  </ol>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-purple-150 space-y-3">
                  <h4 className="font-bold text-xs text-slate-900">رفتار در دسکتاپ و موبایل:</h4>
                  <ul className="text-xs text-slate-700 space-y-2 leading-relaxed">
                    <li>
                      <span className="font-bold text-slate-900">• آیکون و پیام ابری: </span>
                      در گوشه پایین سمت چپ یک دایره کوچک مدرن و پیام ابری زیبا با عنوان «از هوش مصنوعی برای انتخاب پروژه کمک بگیرید» به کاربر نمایش داده می‌شود.
                    </li>
                    <li>
                      <span className="font-bold text-slate-900">• دسکتاپ (کامپیوتر): </span>
                      با کلیک کاربر، <span className="text-purple-700 font-bold">سایدبار سمت چپ (Left Sidebar)</span> با عرض ۴۴۰ پیکسل و ارتفاع تمام‌صفحه به صورت روان باز می‌شود و محتوای سایت نیز در پس‌زمینه دیده می‌شود.
                    </li>
                    <li>
                      <span className="font-bold text-slate-900">• موبایل (گوشی): </span>
                      به صورت <span className="text-purple-700 font-bold">داون‌بار (Down Bar / Bottom Sheet)</span> با ارتفاع ۸۵٪ از پایین صفحه بالا می‌آید تا کاربر با نهایت راحتی چت کند و پروژه‌ها را بررسی نماید.
                    </li>
                    <li>
                      <span className="font-bold text-slate-900">• انتقال خودکار آدرس صفحه: </span>
                      آدرس دقیق صفحه‌ای از سایت که کاربر روی آن کلیک کرده به عنوان کانتکست به دستیار منتقل می‌گردد.
                    </li>
                  </ul>
                </div>
              </div>

              {/* CARD: راهنمای کرون جابز برای جلوگیری از اسلیپ سرور در رندر (Render / Cloud Hosting) */}
              <div className="p-6 rounded-2xl bg-white border border-purple-150 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-100 pb-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-700" />
                      <span>راهنمای تنظیم Cron Job در هاست برای جلوگیری از به خواب رفتن سرور (Sleep / Spin-down در Render)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      سرویس‌های هاستینگ نظیر Render در پلن رایگان پس از ۱۵ دقیقه عدم فعالیت به حالت Sleep می‌روند. با تنظیم یک کرون جاب هر ۱۰ دقیقه یک‌بار، سرور شما همیشه آنلاین، بیدار و آماده پاسخگویی سریع به کاربران خواهد بود.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={testServerHealth}
                      className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${healthTestStatus === 'testing' ? 'animate-spin' : ''}`} />
                      <span>تست پینگ زنده سرور</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyCronCode}
                      className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                      {copiedCron ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedCron ? 'کپی شد!' : 'کپی دستور Cron'}</span>
                    </button>
                  </div>
                </div>

                {healthTestStatus !== 'idle' && (
                  <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                    healthTestStatus === 'ok'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : healthTestStatus === 'testing'
                      ? 'bg-purple-50 border-purple-200 text-purple-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}>
                    <span>
                      {healthTestStatus === 'testing' && 'در حال ارسال درخواست پینگ به سرور...'}
                      {healthTestStatus === 'ok' && `✅ سرور با موفقیت پاسخ داد (پینگ: ${healthTestLatency}ms). این اندپوینت آماده دریافت کرون جاب است.`}
                      {healthTestStatus === 'fail' && '❌ خطا در ارسال پینگ به سرور. لطفاً آدرس سرور را بررسی فرمایید.'}
                    </span>
                  </div>
                )}

                {/* Crontab Code Box */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="font-bold">دستور کرون جاب (اجرا هر ۱۰ دقیقه):</span>
                    <span className="text-[11px] font-mono text-purple-700">اینتروال: */10 * * * *</span>
                  </div>

                  <pre className="bg-[#f8f7fc] p-3.5 rounded-xl border border-purple-150 text-[11px] font-mono text-purple-950 overflow-x-auto dir-ltr select-all">
                    {cronCurlCommand}
                  </pre>
                  <p className="text-[11px] text-slate-500">
                    یا در صورت استفاده از wget: <code className="bg-slate-100 text-purple-800 px-1 py-0.5 rounded dir-ltr font-mono">{cronWgetCommand}</code>
                  </p>
                </div>

                {/* Step by step for cPanel and free tools */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-150 text-xs space-y-2">
                    <span className="font-bold text-slate-900 block">نحوه تنظیم در سی‌پنل (cPanel Cron Jobs):</span>
                    <ol className="list-decimal list-inside text-slate-600 space-y-1.5 leading-relaxed">
                      <li>وارد کنترل‌پنل هاست سی‌پنل (cPanel) خود شوید.</li>
                      <li>در بخش <strong>Advanced</strong> روی گزینه <strong>Cron Jobs</strong> کلیک کنید.</li>
                      <li>در بخش Common Settings، گزینه <strong>Once Per 10 Minutes (*/10 * * * *)</strong> را انتخاب کنید.</li>
                      <li>در کادر <strong>Command</strong>، دستور curl بالا را جای‌گذاری نمایید.</li>
                      <li>روی دکمه <strong>Add New Cron Job</strong> کلیک کنید.</li>
                    </ol>
                  </div>

                  <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-150 text-xs space-y-2">
                    <span className="font-bold text-slate-900 block">روش جایگزین رایگان بدون هاست (Uptime Monitors):</span>
                    <p className="text-slate-600 leading-relaxed">
                      اگر هاست لینوکسی برای کرون جاب ندارید، می‌توانید از وب‌سایت‌های رایگان نگهداری سرور استفاده کنید:
                    </p>
                    <ul className="text-slate-600 space-y-1.5 leading-relaxed">
                      <li>
                        • <strong>cron-job.org (رایگان):</strong> ثبت‌نام کنید، آدرس <code className="font-mono text-purple-800 bg-white px-1 rounded dir-ltr">{hostBaseUrl}/health</code> را وارد کنید و زمان‌بندی را روی هر ۱۰ دقیقه بگذارید.
                      </li>
                      <li>
                        • <strong>UptimeRobot.com (رایگان):</strong> یک مانیتور HTTP روی آدرس فوق ایجاد کنید تا هر ۵ یا ۱۰ دقیقه به سرور پینگ بزند و از اسلیپ رفتن رندر جلوگیری کند.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
