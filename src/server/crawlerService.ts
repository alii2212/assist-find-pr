import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { GoogleGenAI } from '@google/genai';
import type { IndexedPage, WebsiteKnowledgeBase, SourceCitation } from '../types/project.ts';
import type {
  ProjectDomainConfig,
  SyncStatusReport,
  FailedUrlRecord,
  AssistantDirectionConfig,
  ProjectCatalogConfig,
  ProjectCategoryStat,
} from '../types/admin.ts';

const DATA_DIR = path.resolve(process.cwd(), 'src/data');
const KNOWLEDGE_BASE_PATH = path.join(DATA_DIR, 'websiteKnowledgeBase.json');
const DOMAINS_CONFIG_PATH = path.join(DATA_DIR, 'domainConfigs.json');
const ASSISTANT_DIRECTION_PATH = path.join(DATA_DIR, 'assistantDirection.json');
const SYNC_STATUS_PATH = path.join(DATA_DIR, 'syncStatus.json');

const TARGET_DOMAIN = 'yazdinnofaraz.ir';
const TARGET_WEBSITE = 'https://yazdinnofaraz.ir/';

export const DEFAULT_CATALOG_CONFIG: ProjectCatalogConfig = {
  catalogUrl: 'https://yazdinnofaraz.ir/categories/',
  catalogUrlPatterns: ['/categories/', '/categories/*'],
  enforceCatalogOnlyForProjects: true,
  generalPagesGuidance: `سایر صفحات وب‌سایت نوفرآز (شامل درباره ما، تماس با ما، تیم‌ها، تسهیلات و سوالات متداول) نشان‌دهنده اطلاعات سازمانی، معرفی مرکز، آدرس دقیق (یزد، دانشگاه یزد، شتاب‌دهنده و مرکز رشد فراز)، سوابق تیم‌های مستقر قبلی، فرآیند پذیرش، گرنت نمونه‌سازی (تا سقف ۷۰۰ میلیون تومان)، فضای اشتراکی و منتورینگ هستند. از این اطلاعات فقط برای پاسخ دادن به سوالات عمومی و راهنمایی کاربر استفاده شود و هرگز نباید به عنوان پروژه‌های جدید برای اخذ پیشنهاد شوند.`,
  categories: [
    {
      id: 'cat_agriculture',
      name: 'کشاورزی و امنیت غذایی',
      projectCount: 151,
      subUrl: 'https://yazdinnofaraz.ir/categories/agriculture/',
      keySkills: ['مهندسی کشاورزی', 'هوشمندسازی گلخانه', 'بیوتکنولوژی', 'پایش خاک و بذر'],
      description: 'پروژه‌های فناورانه در زنجیره ارزش غذا، گلخانه‌های هوشمند و کاهش ضایعات',
      active: true,
    },
    {
      id: 'cat_health',
      name: 'سلامت و زیست‌فناوری',
      projectCount: 82,
      subUrl: 'https://yazdinnofaraz.ir/categories/health/',
      keySkills: ['مهندسی پزشکی', 'بیوانفورماتیک', 'تجهیزات ارتوپدی', 'سامانه‌های سلامت دیجیتال'],
      description: 'نوآوری در تجهیزات تشخیصی، سیستم‌های هوشمند پزشکی و داربست‌های زیستی',
      active: true,
    },
    {
      id: 'cat_water_energy',
      name: 'آب، انرژی و محیط زیست',
      projectCount: 60,
      subUrl: 'https://yazdinnofaraz.ir/categories/water-energy/',
      keySkills: ['انرژی خورشیدی', 'تصفیه پساب صنعتی', 'سیستم‌های BMS', 'کنتورهای هوشمند'],
      description: 'بازچرخانی آب در مناطق کویری، ذخیره‌سازی انرژی و مدیریت هوشمند شبکه توزیع',
      active: true,
    },
    {
      id: 'cat_oil_gas',
      name: 'نفت، گاز و پتروشیمی',
      projectCount: 56,
      subUrl: 'https://yazdinnofaraz.ir/categories/oil-gas/',
      keySkills: ['مهندسی شیمی', 'کاتالیست‌ها', 'پایش خطوط لوله', 'ابزاردقیق'],
      description: 'توسعه مواد شیمیایی تخصصی، پایش ضدخوردگی و کنترل هوشمند فرآیند',
      active: true,
    },
    {
      id: 'cat_ict',
      name: 'فناوری اطلاعات و هوش مصنوعی',
      projectCount: 51,
      subUrl: 'https://yazdinnofaraz.ir/categories/ict/',
      keySkills: ['اینترنت اشیاء (IoT)', 'بینایی ماشین', 'توسعه وب و موبایل', 'پردازش داده'],
      description: 'پلتفرم‌های داده، سخت‌افزارهای امبدد، هوش مصنوعی صنعتی و سامانه‌های مانیتورینگ',
      active: true,
    },
    {
      id: 'cat_transport',
      name: 'حمل و نقل و لجستیک هوشمند',
      projectCount: 44,
      subUrl: 'https://yazdinnofaraz.ir/categories/transportation/',
      keySkills: ['مکانیک خودرو', 'ناوبری و ردیابی', 'سامانه‌های تلمتیکس', 'لجستیک هوشمند'],
      description: 'بهینه‌سازی ناوگان حمل‌ونقل، سنسورهای پایش بار و وسایل نقلیه الکتریکی',
      active: true,
    },
    {
      id: 'cat_housing',
      name: 'اسکان، ساختمان و شهر هوشمند',
      projectCount: 22,
      subUrl: 'https://yazdinnofaraz.ir/categories/housing/',
      keySkills: ['مهندسی عمران', 'متریال نوین ساختمانی', 'اتوماسیون خانگی', 'سیستم‌های ضدزلزله'],
      description: 'مصالح ساختمانی عایق، ساختمان‌های سبز و زیرساخت‌های هوشمند شهری',
      active: true,
    },
    {
      id: 'cat_mining',
      name: 'معدن و صنایع معدنی',
      projectCount: 17,
      subUrl: 'https://yazdinnofaraz.ir/categories/mining/',
      keySkills: ['متالورژی', 'فرآوری مواد معدنی', 'اکتشاف ژئوفیزیک', 'ماشین‌آلات سنگین'],
      description: 'بهینه‌سازی خطوط خردایش و تغلیظ مواد معدنی یزد، استحصال عناصر نادر و ایمنی معدن',
      active: true,
    },
    {
      id: 'cat_environment',
      name: 'محیط زیست و پسماند',
      projectCount: 10,
      subUrl: 'https://yazdinnofaraz.ir/categories/environment/',
      keySkills: ['بازیافت صنعتی', 'مدیریت پسماند', 'کنترل گردوغبار', 'تصفیه هوا'],
      description: 'پایش ریزگردها، مدیریت پایدار پسماندهای ویژه صنعتی و هوازی',
      active: true,
    },
    {
      id: 'cat_appliances',
      name: 'لوازم خانگی هوشمند',
      projectCount: 3,
      subUrl: 'https://yazdinnofaraz.ir/categories/appliances/',
      keySkills: ['طراحی صنعتی', 'برد الکترونیکی', 'کاهش مصرف انرژی', 'فرمان صوتی'],
      description: 'بومی‌سازی قطعات کلیدی، اینورترها و اتصال ابری لوازم خانگی',
      active: true,
    },
    {
      id: 'cat_crisis',
      name: 'مدیریت بحران و ایمنی',
      projectCount: 2,
      subUrl: 'https://yazdinnofaraz.ir/categories/crisis-management/',
      keySkills: ['سنسورهای هشدار سریع', 'امداد و نجات', 'پهپادهای شناسایی'],
      description: 'سامانه‌های اعلام خطر زودهنگام سیل و حوادث صنعتی و زیرساخت‌های پدافندی',
      active: true,
    },
  ],
};

export const DEFAULT_ASSISTANT_DIRECTION = `هدف اصلی دستیار این است که به کاربر کمک کند بر اساس تحصیلات، مهارت‌ها، تجربه، علایق، سابقه پروژه و توانمندی‌هایش، مناسب‌ترین «پروژه‌ها و فراخوان‌های قابل اخذ» را از مرکز رشد فراز دانشگاه یزد شناسایی کند.

=== تفکیک حیاتی منابع دانش ===
۱. پروژه‌های قابل اخذ:
   - پروژه‌های فعال فقط و فقط باید از آدرس اصلی https://yazdinnofaraz.ir/categories/ و حوزه‌های ۱۱گانه فراخوان مستخرج از آن پیشنهاد شوند.
   - هرگز از برگه‌های عمومی سایت، پروژه اختراع یا به عنوان پروژه قابل اخذ پیشنهاد ندهید.

۲. دانش عمومی و اطلاعات مرکز رشد:
   - سایر صفحات سایت (تماس با ما، درباره ما، تیم‌ها، تسهیلات و سوالات متداول) برای پاسخ به سوالات اداری و عمومی کاربر است.
   - آدرس مرکز (یزد، دانشگاه یزد، شتاب‌دهنده و مرکز نوآوری فراز)، شماره‌های تماس، تیم‌های مستقر قبلی، سقف حمایت‌های مالی و تسهیلات استقرار را با دقت از این صفحات تشریح کن.

۳. نحوه پاسخ‌دهی و تعامل:
   - اطلاعات کاربر را تدریجی و تعاملی بپرس و برای پیشنهاد پروژه، دلیل انطباق مهارتی و گام بعدی را توضیح بده.`.trim();

// Initial default domains configuration
export const DEFAULT_DOMAINS: ProjectDomainConfig[] = [
  {
    id: 'domain_categories',
    name: 'کاتالوگ و فراخوان‌های فعال پروژه‌ها',
    mainUrl: 'https://yazdinnofaraz.ir/categories/',
    priority: 1,
    active: true,
    guidanceText: 'منبع انحصاری و مرجع اصلی پروژه‌های قابل اخذ در ۱۱ حوزه صنعتی (کشاورزی، سلامت، آب و انرژی، نفت و گاز، فناوری اطلاعات و ...).',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'domain_energy',
    name: 'انرژی و بهینه‌سازی',
    mainUrl: 'https://yazdinnofaraz.ir/enrgy/',
    priority: 2,
    active: true,
    guidanceText: 'پروژه‌های پایش هوشمند مصرف برق، اینترنت اشیاء صنعتی، مانیتورینگ خطوط انتقال و سیستم‌های مدیریت باتری (BMS).',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'domain_iot_teams',
    name: 'تیم‌ها و سوابق استقرار',
    mainUrl: 'https://yazdinnofaraz.ir/teams/',
    priority: 3,
    active: true,
    guidanceText: 'اطلاعات تیم‌های مستقر، روبات زیرسطحی ROV و سوابق پروژه‌های انجام‌شده.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'domain_growth_facilities',
    name: 'تسهیلات و پذیرش مرکز رشد',
    mainUrl: 'https://yazdinnofaraz.ir/facility/',
    priority: 4,
    active: true,
    guidanceText: 'خدمات استقرار در دانشگاه یزد، گرنت نمونه‌سازی تا ۷۰۰ میلیون تومان و فضای اشتراکی.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let cachedKnowledgeBase: WebsiteKnowledgeBase | null = null;
let cachedDomains: ProjectDomainConfig[] | null = null;
let cachedAssistantDirection: AssistantDirectionConfig | null = null;
let cachedSyncStatus: SyncStatusReport | null = null;

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// ----------------------------------------------------
// Assistant Direction Management
// ----------------------------------------------------

export function loadAssistantDirection(): AssistantDirectionConfig {
  if (cachedAssistantDirection) return cachedAssistantDirection;
  ensureDataDir();

  try {
    if (fs.existsSync(ASSISTANT_DIRECTION_PATH)) {
      const raw = fs.readFileSync(ASSISTANT_DIRECTION_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (!parsed.catalogConfig) {
        parsed.catalogConfig = DEFAULT_CATALOG_CONFIG;
      }
      cachedAssistantDirection = parsed;
      return cachedAssistantDirection!;
    }
  } catch (err) {
    console.error('Error reading assistant direction:', err);
  }

  const initial: AssistantDirectionConfig = {
    directionText: DEFAULT_ASSISTANT_DIRECTION,
    catalogConfig: DEFAULT_CATALOG_CONFIG,
    updatedAt: new Date().toISOString(),
  };
  saveAssistantDirection(initial);
  return initial;
}

export function saveAssistantDirection(cfg: AssistantDirectionConfig): void {
  ensureDataDir();
  if (!cfg.catalogConfig) {
    cfg.catalogConfig = DEFAULT_CATALOG_CONFIG;
  }
  fs.writeFileSync(ASSISTANT_DIRECTION_PATH, JSON.stringify(cfg, null, 2), 'utf-8');
  cachedAssistantDirection = cfg;
}

// ----------------------------------------------------
// Domain Configuration Management
// ----------------------------------------------------

export function loadConfiguredDomains(): ProjectDomainConfig[] {
  if (cachedDomains) return cachedDomains;
  ensureDataDir();

  try {
    if (fs.existsSync(DOMAINS_CONFIG_PATH)) {
      const raw = fs.readFileSync(DOMAINS_CONFIG_PATH, 'utf-8');
      cachedDomains = JSON.parse(raw);
      return cachedDomains!;
    }
  } catch (err) {
    console.error('Error reading domains config:', err);
  }

  cachedDomains = [...DEFAULT_DOMAINS];
  saveConfiguredDomains(cachedDomains);
  return cachedDomains;
}

export function saveConfiguredDomains(domains: ProjectDomainConfig[]): void {
  ensureDataDir();
  // Sort by priority ascending
  domains.sort((a, b) => a.priority - b.priority);
  fs.writeFileSync(DOMAINS_CONFIG_PATH, JSON.stringify(domains, null, 2), 'utf-8');
  cachedDomains = domains;
}

// ----------------------------------------------------
// Sync Status Management
// ----------------------------------------------------

export function loadSyncStatus(): SyncStatusReport {
  if (cachedSyncStatus) return cachedSyncStatus;
  ensureDataDir();

  try {
    if (fs.existsSync(SYNC_STATUS_PATH)) {
      const raw = fs.readFileSync(SYNC_STATUS_PATH, 'utf-8');
      cachedSyncStatus = JSON.parse(raw);
      return cachedSyncStatus!;
    }
  } catch (err) {
    console.error('Error reading sync status:', err);
  }

  const kb = loadKnowledgeBase();
  const domains = loadConfiguredDomains();

  cachedSyncStatus = {
    lastSyncTime: kb.lastSyncedAt || null,
    syncStatus: 'idle',
    totalConfiguredDomains: domains.length,
    totalActiveDomains: domains.filter((d) => d.active).length,
    totalDiscoveredPages: kb.totalPages,
    totalIndexedProjectPages: kb.pages.filter((p) => p.page_type === 'project').length,
    changedPagesCount: 0,
    removedPagesCount: 0,
    failedUrls: [],
    fileSearchStoreId: kb.fileSearchStoreId || null,
    fileSearchStoreName: kb.fileSearchStoreName || null,
    lastSyncType: 'normal',
    lastMessage: 'سیستم آماده همگام‌سازی است.',
  };
  return cachedSyncStatus;
}

export function saveSyncStatus(status: SyncStatusReport): void {
  ensureDataDir();
  fs.writeFileSync(SYNC_STATUS_PATH, JSON.stringify(status, null, 2), 'utf-8');
  cachedSyncStatus = status;
}

// ----------------------------------------------------
// Knowledge Base JSON Storage
// ----------------------------------------------------

export function loadKnowledgeBase(): WebsiteKnowledgeBase {
  if (cachedKnowledgeBase) return cachedKnowledgeBase;
  ensureDataDir();

  try {
    if (fs.existsSync(KNOWLEDGE_BASE_PATH)) {
      const raw = fs.readFileSync(KNOWLEDGE_BASE_PATH, 'utf-8');
      cachedKnowledgeBase = JSON.parse(raw);
      return cachedKnowledgeBase!;
    }
  } catch (err) {
    console.error('Error reading knowledge base JSON:', err);
  }

  return {
    websiteUrl: TARGET_WEBSITE,
    lastSyncedAt: new Date().toISOString(),
    totalPages: 0,
    pages: [],
  };
}

export function saveKnowledgeBase(data: WebsiteKnowledgeBase): void {
  ensureDataDir();
  fs.writeFileSync(KNOWLEDGE_BASE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  cachedKnowledgeBase = data;
}

// ----------------------------------------------------
// Utility Helpers
// ----------------------------------------------------

export function computeContentHash(text: string): string {
  return crypto.createHash('sha256').update(text.trim()).digest('hex');
}

export function cleanHtmlContent(rawHtml: string): string {
  if (!rawHtml) return '';
  return rawHtml
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8211;/g, '-')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if a URL strictly belongs to https://yazdinnofaraz.ir/
 */
export function isAllowedUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname === TARGET_DOMAIN || parsed.hostname === `www.${TARGET_DOMAIN}`;
  } catch {
    return false;
  }
}

/**
 * Extracts links pointing strictly to https://yazdinnofaraz.ir/
 */
export function extractInternalLinks(html: string): string[] {
  const linkRegex = /href=[\"'](https?:\/\/(?:www\.)?yazdinnofaraz\.ir\/[^\"'#\s?]+)[\"']/gi;
  const urls = new Set<string>();
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    let clean = match[1];
    if (clean.endsWith('/')) {
      clean = clean.slice(0, -1);
    }
    // Filter out asset and feed links
    if (
      !clean.includes('/wp-content/') &&
      !clean.includes('/wp-json/') &&
      !clean.includes('/feed') &&
      !clean.endsWith('.css') &&
      !clean.endsWith('.js') &&
      !clean.endsWith('.png') &&
      !clean.endsWith('.jpg')
    ) {
      urls.add(clean + '/');
    }
  }
  return Array.from(urls);
}

/**
 * Identifies if a page is an actionable project, institutional info, domain page, or general page
 */
export function detectPageType(
  url: string,
  title: string,
  content: string,
  isMainDomainUrl: boolean,
  catalogConfig?: ProjectCatalogConfig
): 'actionable_project' | 'institutional_info' | 'project_domain' | 'project' | 'general' {
  if (isMainDomainUrl) return 'project_domain';

  const lowerUrl = url.toLowerCase();
  const lowerTitle = title.toLowerCase();

  // 1. Matches configured project catalog (default: https://yazdinnofaraz.ir/categories/)
  const catalogUrl = catalogConfig?.catalogUrl || 'https://yazdinnofaraz.ir/categories/';
  const patterns = catalogConfig?.catalogUrlPatterns || ['/categories/'];
  const enforceOnlyCatalog = catalogConfig?.enforceCatalogOnlyForProjects ?? true;

  // Check if URL matches the catalog URL, patterns, or any configured category subUrl
  const matchesCatalogUrl =
    lowerUrl.includes('categories') ||
    patterns.some((pat) => lowerUrl.includes(pat.toLowerCase().replace(/^\/|\/$/g, ''))) ||
    (catalogConfig?.categories || []).some(
      (cat) => cat.subUrl && lowerUrl.includes(cat.subUrl.toLowerCase().replace(/^https?:\/\/[^/]+/, ''))
    );

  if (matchesCatalogUrl) {
    return 'actionable_project';
  }

  // 2. Institutional pages (about center, address, facilities, past teams, FAQ, mentors, contact, etc.)
  if (
    lowerUrl.includes('/about') ||
    lowerUrl.includes('/contact') ||
    lowerUrl.includes('/teams') ||
    lowerUrl.includes('/facility') ||
    lowerUrl.includes('/faq') ||
    lowerUrl.includes('/mentor') ||
    lowerTitle.includes('تماس') ||
    lowerTitle.includes('درباره ما') ||
    lowerTitle.includes('تسهیلات') ||
    lowerTitle.includes('تیم') ||
    lowerTitle.includes('پذیرش') ||
    lowerTitle.includes('آدرس') ||
    lowerTitle.includes('سوالات متداول')
  ) {
    return 'institutional_info';
  }

  // If strictly enforcing catalog, non-catalog pages are NOT actionable takeable projects
  if (enforceOnlyCatalog) {
    return 'institutional_info';
  }

  const indicators = ['پروژه', 'فراخوان', 'طرح', 'فناور'];
  for (const ind of indicators) {
    if (lowerTitle.includes(ind)) return 'project';
  }

  return 'general';
}

// ----------------------------------------------------
// Gemini File Search Store Integration
// ----------------------------------------------------

let fileSearchStoreNameCached: string | null = null;

export async function getOrCreateFileSearchStore(forceNew: boolean = false): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY missing, skipping FileSearchStore creation');
    return 'local_knowledge_store';
  }

  const ai = new GoogleGenAI({ apiKey });

  if (!forceNew) {
    const kb = loadKnowledgeBase();
    if (kb.fileSearchStoreName) {
      fileSearchStoreNameCached = kb.fileSearchStoreName;
      return kb.fileSearchStoreName;
    }

    try {
      const stores = await ai.fileSearchStores.list();
      for await (const s of stores) {
        if (s.displayName?.includes('Yazd Growth Center') && s.name) {
          fileSearchStoreNameCached = s.name;
          return s.name;
        }
      }
    } catch (e: any) {
      console.warn('Could not list fileSearchStores:', e.message);
    }
  }

  // Create fresh store
  try {
    const store = await ai.fileSearchStores.create({
      config: {
        displayName: 'Yazd Growth Center Knowledge Base',
      },
    });
    if (store.name) {
      fileSearchStoreNameCached = store.name;
      return store.name;
    }
    return 'local_knowledge_store';
  } catch (err: any) {
    console.error('Failed to create fileSearchStore:', err);
    return 'local_knowledge_store';
  }
}

// ----------------------------------------------------
// Core Synchronization Engine
// ----------------------------------------------------

export interface SyncOptions {
  isFullRebuild?: boolean;
  requesterUid?: string;
}

export const syncWebsiteContent = (options?: SyncOptions | string) => {
  if (typeof options === 'string') {
    return synchronizeWebsiteKnowledge({ requesterUid: options });
  }
  return synchronizeWebsiteKnowledge(options);
};

export async function synchronizeWebsiteKnowledge(
  options: SyncOptions = {}
): Promise<SyncStatusReport> {
  const { isFullRebuild = false } = options;
  console.log(`Starting ${isFullRebuild ? 'FULL REBUILD' : 'NORMAL SYNC'} for Growth Center website...`);

  const domains = loadConfiguredDomains();
  const activeDomains = domains.filter((d) => d.active);
  const currentKb = loadKnowledgeBase();
  const existingPagesMap = new Map<string, IndexedPage>();

  if (!isFullRebuild) {
    for (const p of currentKb.pages) {
      existingPagesMap.set(p.source_url, p);
    }
  }

  const failedUrls: FailedUrlRecord[] = [];
  const discoveredPagesMap = new Map<string, IndexedPage>();
  let changedCount = 0;
  let removedCount = 0;

  // Step 1: Ensure/Reset File Search Store
  let storeName = 'local_knowledge_store';
  try {
    storeName = await getOrCreateFileSearchStore(isFullRebuild);
  } catch (err) {
    console.warn('FileSearchStore setup error:', err);
  }

  // Step 2: Query WordPress REST API and Sitemap for fast batch discovery
  let wpPages: any[] = [];
  let wpPosts: any[] = [];

  try {
    const [pagesRes, postsRes] = await Promise.all([
      fetch(`${TARGET_WEBSITE}wp-json/wp/v2/pages?per_page=100`, {
        headers: { 'User-Agent': 'YazdGrowthCenterBot/2.0' },
      }),
      fetch(`${TARGET_WEBSITE}wp-json/wp/v2/posts?per_page=100`, {
        headers: { 'User-Agent': 'YazdGrowthCenterBot/2.0' },
      }),
    ]);
    if (pagesRes.ok) wpPages = await pagesRes.json();
    if (postsRes.ok) wpPosts = await postsRes.json();
  } catch (wpErr: any) {
    console.warn('WordPress REST API unreachable:', wpErr.message);
  }

  // Step 3: Iterate through each active configured domain
  for (const domain of activeDomains) {
    const domainUrl = domain.mainUrl.trim();
    if (!isAllowedUrl(domainUrl)) {
      failedUrls.push({
        url: domainUrl,
        reason: 'URL does not belong to yazdinnofaraz.ir',
        timestamp: new Date().toISOString(),
      });
      continue;
    }

    console.log(`Processing domain [${domain.name}] URL: ${domainUrl}`);

    // Fetch main domain page content
    let mainPageHtml = '';
    try {
      const res = await fetch(domainUrl, {
        headers: { 'User-Agent': 'YazdGrowthCenterBot/2.0' },
      });
      if (res.ok) {
        mainPageHtml = await res.text();
      } else {
        failedUrls.push({
          url: domainUrl,
          reason: `HTTP status ${res.status}`,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (e: any) {
      failedUrls.push({
        url: domainUrl,
        reason: e.message || 'Fetch error',
        timestamp: new Date().toISOString(),
      });
    }

    // Process main domain page
    if (mainPageHtml) {
      const cleanMainText = cleanHtmlContent(mainPageHtml);
      const mainHash = computeContentHash(cleanMainText);
      const titleMatch = mainPageHtml.match(/<title>(.*?)<\/title>/i);
      const mainTitle = (titleMatch ? titleMatch[1].split('|')[0].trim() : domain.name) || domain.name;

      const existing = existingPagesMap.get(domainUrl);
      const isChanged = !existing || existing.content_hash !== mainHash;
      if (isChanged) changedCount++;

      discoveredPagesMap.set(domainUrl, {
        id: `page_${domain.id}_main`,
        slug: domainUrl.split('/').filter(Boolean).pop() || 'main',
        source_url: domainUrl,
        page_title: mainTitle,
        page_type: 'project_domain',
        domain: domain.name,
        project_domain: domain.name,
        parent_domain_url: domainUrl,
        last_modified: new Date().toISOString(),
        content_hash: mainHash,
        last_synced_at: new Date().toISOString(),
        content_length: cleanMainText.length,
        content: cleanMainText,
        discovery_method: 'manual',
      });

      // Step 4: Child page discovery for this domain
      // 1) Internal links from the main domain page
      const childLinks = extractInternalLinks(mainPageHtml);

      // 2) Related WordPress pages/posts matched by slug or content
      const domainTerms = domain.name.split(/\s+/).filter((t: string) => t.length > 2);
      const relatedWpItems = [...wpPages, ...wpPosts].filter((item) => {
        const itemUrl = item.link || '';
        if (childLinks.includes(itemUrl)) return true;
        const textToMatch = `${item.slug} ${item.title?.rendered || ''}`.toLowerCase();
        return domainTerms.some((term: string) => textToMatch.includes(term.toLowerCase()));
      });

      // Merge URLs to crawl for this domain
      const urlsToCrawl = new Set<string>();
      for (const link of childLinks) urlsToCrawl.add(link);
      for (const item of relatedWpItems) {
        if (item.link) urlsToCrawl.add(item.link);
      }

      // Crawl each discovered child URL
      for (const childUrl of urlsToCrawl) {
        if (childUrl === domainUrl || discoveredPagesMap.has(childUrl)) continue;

        try {
          // Check if already in WP REST API response (avoids separate HTTP fetch)
          const wpMatch = relatedWpItems.find((w) => w.link === childUrl);
          let rawHtml = '';
          let title = '';
          let modifiedDate = new Date().toISOString();

          if (wpMatch && wpMatch.content?.rendered) {
            rawHtml = wpMatch.content.rendered;
            title = (wpMatch.title?.rendered || wpMatch.slug || '').replace(/&#8211;/g, '-').trim();
            modifiedDate = wpMatch.modified || modifiedDate;
          } else {
            const childRes = await fetch(childUrl, {
              headers: { 'User-Agent': 'YazdGrowthCenterBot/2.0' },
            });
            if (!childRes.ok) {
              failedUrls.push({
                url: childUrl,
                reason: `HTTP ${childRes.status}`,
                timestamp: new Date().toISOString(),
              });
              continue;
            }
            rawHtml = await childRes.text();
            const cTitleMatch = rawHtml.match(/<title>(.*?)<\/title>/i);
            title = cTitleMatch ? cTitleMatch[1].split('|')[0].trim() : childUrl;
          }

          const cleanChildText = cleanHtmlContent(rawHtml);
          if (cleanChildText.length < 30) continue;

          const childHash = computeContentHash(cleanChildText);
          const existingChild = existingPagesMap.get(childUrl);
          const isChildChanged = !existingChild || existingChild.content_hash !== childHash;

          if (isChildChanged) {
            changedCount++;
          }

          const assistantCfg = loadAssistantDirection();
          const pageType = detectPageType(
            childUrl,
            title,
            cleanChildText,
            false,
            assistantCfg.catalogConfig
          );

          discoveredPagesMap.set(childUrl, {
            id: `child_${computeContentHash(childUrl).slice(0, 10)}`,
            slug: childUrl.split('/').filter(Boolean).pop() || 'child',
            source_url: childUrl,
            page_title: title,
            page_type: pageType,
            domain: domain.name,
            project_domain: domain.name,
            parent_domain_url: domainUrl,
            last_modified: modifiedDate,
            content_hash: childHash,
            last_synced_at: new Date().toISOString(),
            content_length: cleanChildText.length,
            content: cleanChildText,
            discovery_method: wpMatch ? 'wp_api' : 'internal_link',
          });
        } catch (childErr: any) {
          failedUrls.push({
            url: childUrl,
            reason: childErr.message || 'Fetch failed',
            timestamp: new Date().toISOString(),
          });
        }
      }
    }
  }

  // Detect removed pages
  if (!isFullRebuild) {
    for (const [existingUrl] of existingPagesMap) {
      if (!discoveredPagesMap.has(existingUrl)) {
        removedCount++;
      }
    }
  }

  const allIndexedPages = Array.from(discoveredPagesMap.values());
  const projectPages = allIndexedPages.filter(
    (p) => p.page_type === 'actionable_project' || p.page_type === 'project'
  );

  // Save updated knowledge base
  const updatedKb: WebsiteKnowledgeBase = {
    websiteUrl: TARGET_WEBSITE,
    fileSearchStoreId: storeName,
    fileSearchStoreName: storeName,
    lastSyncedAt: new Date().toISOString(),
    totalPages: allIndexedPages.length,
    pages: allIndexedPages,
  };
  saveKnowledgeBase(updatedKb);

  // Update sync status report
  const report: SyncStatusReport = {
    lastSyncTime: updatedKb.lastSyncedAt,
    syncStatus: 'success',
    totalConfiguredDomains: domains.length,
    totalActiveDomains: activeDomains.length,
    totalDiscoveredPages: allIndexedPages.length,
    totalIndexedProjectPages: projectPages.length,
    changedPagesCount: changedCount,
    removedPagesCount: removedCount,
    failedUrls,
    fileSearchStoreId: storeName,
    fileSearchStoreName: storeName,
    lastSyncType: isFullRebuild ? 'full_rebuild' : 'normal',
    lastMessage: `همگام‌سازی با موفقیت انجام شد: ${allIndexedPages.length} صفحه شناسایی و ${projectPages.length} پروژه ایندکس گردید.`,
  };
  saveSyncStatus(report);

  return report;
}

// ----------------------------------------------------
// Search & Retrieval with Domain Guidance
// ----------------------------------------------------

export function searchKnowledgeBase(
  query: string,
  currentPageUrl?: string,
  topK: number = 6
): {
  retrievedPages: IndexedPage[];
  citations: SourceCitation[];
  domainGuidanceList: string[];
} {
  const kb = loadKnowledgeBase();
  const domains = loadConfiguredDomains().filter((d) => d.active);

  if (!kb.pages || kb.pages.length === 0) {
    return { retrievedPages: [], citations: [], domainGuidanceList: [] };
  }

  const queryTerms = query
    .toLowerCase()
    .split(/[\s,،؛]+/)
    .filter((w) => w.length > 2);

  const scored = kb.pages.map((page) => {
    let score = 0;
    const contentLower = page.content.toLowerCase();
    const titleLower = page.page_title.toLowerCase();
    const domainLower = (page.domain || page.project_domain || '').toLowerCase();
    const urlLower = page.source_url.toLowerCase();

    // Priority bonus 1: user is viewing this exact page URL
    if (currentPageUrl && (page.source_url === currentPageUrl || currentPageUrl.includes(page.slug))) {
      score += 150;
    }

    // Priority bonus 2: Domain priority configured by admin
    const matchedDomain = domains.find(
      (d) => d.name === page.domain || d.mainUrl === page.parent_domain_url
    );
    if (matchedDomain) {
      score += (10 - Math.min(matchedDomain.priority, 9)) * 3;
    }

    // Match in title & domain
    for (const term of queryTerms) {
      if (titleLower.includes(term)) score += 20;
      if (domainLower.includes(term)) score += 15;
      if (contentLower.includes(term)) score += 3;
    }

    // Intent 1: Projects / Calls / Categories
    if (urlLower.includes('categories')) {
      score += 30;
      if (/پروژه|فراخوان|حوزه|پیشنهاد|شروع|رشته|همکاری|کار/i.test(query)) {
        score += 40;
      }
    }

    // Intent 2: Address / Contact / Location
    if (/آدرس|کجاست|تماس|تلفن|موقعیت|شماره|لوکیشن|دانشگاه/i.test(query)) {
      if (urlLower.includes('contact') || urlLower.includes('about')) {
        score += 80;
      }
    }

    // Intent 3: Past teams / How many teams took projects
    if (/تیم|چند تیم|سوابق|نمونه|پروژه گرفتن|شرکت|استقرار/i.test(query)) {
      if (urlLower.includes('teams') || urlLower.includes('about')) {
        score += 80;
      }
    }

    // Intent 4: Funding / Facilities / Grant / Space
    if (/تسهیلات|گرنت|بورسیه|پذیرش|میلیون|حمایت|فضای کار|وام/i.test(query)) {
      if (urlLower.includes('facility') || urlLower.includes('about')) {
        score += 80;
      }
    }

    // Projects receive higher weight for matching
    if (page.page_type === 'actionable_project' || page.page_type === 'project') score += 12;
    if (page.page_type === 'project_domain') score += 6;

    return { page, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const relevant = scored.slice(0, topK).map((s) => s.page);

  // Extract domain guidance relevant to retrieved pages
  const relevantDomainNames = new Set(relevant.map((p) => p.domain).filter(Boolean));
  const domainGuidanceList: string[] = [];

  for (const d of domains) {
    if (relevantDomainNames.has(d.name) && d.guidanceText && d.guidanceText.trim()) {
      domainGuidanceList.push(`[رهنمود مدیر برای حوزه «${d.name}»]: ${d.guidanceText.trim()}`);
    }
  }

  const citations: SourceCitation[] = relevant.map((p) => ({
    title: p.page_title,
    url: p.source_url,
    snippet: p.content.substring(0, 160) + '...',
    isExternal: false,
  }));

  return { retrievedPages: relevant, citations, domainGuidanceList };
}

/**
 * Builds grounded context for Gemini dynamically, cleanly separating
 * Actionable Projects (from categories) vs General Center Knowledge (address, teams, etc.)
 */
export function buildGroundingContext(
  retrievedPages: IndexedPage[],
  currentPageUrl?: string,
  domainGuidanceList: string[] = [],
  catalogConfig?: ProjectCatalogConfig
): string {
  const catalogUrl = catalogConfig?.catalogUrl || 'https://yazdinnofaraz.ir/categories/';
  const generalGuidance = catalogConfig?.generalPagesGuidance || '';

  let text = `=== پایگاه دانش تفکیک‌شده مرکز رشد و نوآوری نوفرآز (https://yazdinnofaraz.ir/) ===\n\n`;

  if (currentPageUrl) {
    text += `[آدرس صفحه جاری کاربر در وب‌سایت: ${currentPageUrl}]\n\n`;
  }

  text += `[منبع رسمی کاتالوگ پروژه‌ها و فراخوان‌های قابل اخذ: ${catalogUrl}]\n`;
  if (generalGuidance) {
    text += `[دستورالعمل نحوه استفاده از صفحات عمومی مرکز]:\n${generalGuidance}\n\n`;
  }

  if (domainGuidanceList.length > 0) {
    text += `=== رهنمودهای تخصصی مدیر برای حوزه‌های مرتبط ===\n`;
    text += domainGuidanceList.join('\n') + '\n\n';
  }

  // Separate actionable project pages vs institutional knowledge pages
  const actionablePages = retrievedPages.filter(
    (p) =>
      p.page_type === 'actionable_project' ||
      p.page_type === 'project' ||
      p.page_type === 'project_list' ||
      p.source_url.includes('categories')
  );
  const generalPages = retrievedPages.filter((p) => !actionablePages.includes(p));

  text += `=================================================================\n`;
  text += `بخش ۱: کاتالوگ پروژه‌ها و فراخوان‌های قابل اخذ (منبع: ${catalogUrl})\n`;
  text += `(قانون الزامی: فقط و فقط پروژه‌های معرفی‌شده در این بخش را به عنوان پروژه قابل اخذ پیشنهاد دهید)\n`;
  text += `=================================================================\n\n`;

  if (catalogConfig?.categories && catalogConfig.categories.length > 0) {
    text += `--- حوزه‌های فعال فراخوان و آمار پروژه‌ها در ${catalogUrl} ---\n`;
    for (const cat of catalogConfig.categories.filter((c) => c.active)) {
      text += `- **${cat.name}**: ${cat.projectCount} پروژه فعال | لینک: ${cat.subUrl || catalogUrl}\n`;
      if (cat.keySkills && cat.keySkills.length > 0) {
        text += `  مهارت‌های کلیدی: ${cat.keySkills.join('، ')}\n`;
      }
      if (cat.description) {
        text += `  توضیحات: ${cat.description}\n`;
      }
    }
    text += `\n`;
  }

  for (const page of actionablePages) {
    text += `--- برگه فراخوان/پروژه: ${page.page_title} (${page.source_url}) ---\n`;
    text += `محتوا:\n${page.content}\n\n`;
  }

  text += `=================================================================\n`;
  text += `بخش ۲: اطلاعات عمومی و سازمانی مرکز رشد (آدرس، تیم‌های گذشته، تسهیلات و قوانین)\n`;
  text += `(قانون: این بخش را برای پاسخ به سوالات اطلاعاتی کاربر مانند آدرس مرکز، تعداد تیم‌ها، شرایط پذیرش و تسهیلات استفاده کنید)\n`;
  text += `--- شناسنامه رسمی و اطلاعات هویتی مرکز نوفرآز ---\n`;
  text += `- آدرس دقیق: یزد، دانشگاه یزد، شتاب‌دهنده و مرکز نوآوری و رشد فراز (باشگاه نوآوری شهید علم‌الهدی)\n`;
  text += `- تلفن تماس و ارتباط: ۰۹۹۱۳۲۳۶۶۳۴ | وب‌سایت: https://yazdinnofaraz.ir/\n`;
  text += `- سوابق تیم‌ها و پروژه‌های گرفته‌شده: بیش از ۴ سال سابقه استقرار تیم‌های تخصصی و دانشجویی دانشگاه یزد در حوزه‌های رباتیک زیرسطحی ROV، انرژی و مانیتورینگ هوشمند برق، کشاورزی هوشمند و نرم‌افزار\n`;
  text += `- تسهیلات و حمایت‌ها: فضای کار اشتراکی، مشاوره و منتورینگ، دسترسی به شبکه صنعتی و گرنت نمونه‌سازی تا سقف ۷۰۰ میلیون تومان\n\n`;

  for (const page of generalPages) {
    text += `--- برگه اطلاعات مرکز: ${page.page_title} (${page.source_url}) ---\n`;
    text += `محتوا:\n${page.content}\n\n`;
  }

  return text.trim();
}
