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
} from '../types/admin.ts';

const DATA_DIR = path.resolve(process.cwd(), 'src/data');
const KNOWLEDGE_BASE_PATH = path.join(DATA_DIR, 'websiteKnowledgeBase.json');
const DOMAINS_CONFIG_PATH = path.join(DATA_DIR, 'domainConfigs.json');
const ASSISTANT_DIRECTION_PATH = path.join(DATA_DIR, 'assistantDirection.json');
const SYNC_STATUS_PATH = path.join(DATA_DIR, 'syncStatus.json');

const TARGET_DOMAIN = 'yazdinnofaraz.ir';
const TARGET_WEBSITE = 'https://yazdinnofaraz.ir/';

export const DEFAULT_ASSISTANT_DIRECTION = `هدف اصلی دستیار این است که به کاربر کمک کند بر اساس تحصیلات، مهارت‌ها، تجربه، علایق، سابقه پروژه، شرایط و توانمندی‌هایش، از میان پروژه‌های موجود در مرکز رشد، پروژه‌های مناسب را شناسایی کند.

در ابتدای گفتگو اطلاعات لازم درباره کاربر را به‌صورت تدریجی جمع‌آوری کن و همه پرسش‌ها را یکجا نپرس.

پس از شناخت کافی از کاربر، پروژه‌های مرتبط را از دانش رسمی سایت پیدا کن و دلیل تناسب آنها را توضیح بده.

در صورت امکان درباره مسیر اولیه انجام پروژه، مهارت‌های موردنیاز، شکاف مهارتی، نیاز به تیم، نمونه‌های مشابه، مشتری، بازار و ظرفیت تجاری‌سازی نیز توضیح بده.

اگر اطلاعات لازم در سایت وجود ندارد، آن را حدس نزن و صریحاً کمبود اطلاعات را اعلام کن.

هدف نهایی گفتگو کمک به کاربر برای رسیدن به پروژه‌های واقعی و قابل‌بررسی مرکز رشد است.`.trim();

// Initial default domains configuration
export const DEFAULT_DOMAINS: ProjectDomainConfig[] = [
  {
    id: 'domain_energy',
    name: 'انرژی و بهینه‌سازی',
    mainUrl: 'https://yazdinnofaraz.ir/enrgy/',
    priority: 1,
    active: true,
    guidanceText: 'در این حوزه روی پروژه‌های پایش هوشمند مصرف برق، اینترنت اشیاء صنعتی، مانیتورینگ خطوط انتقال و سیستم‌های مدیریت باتری (BMS) تمرکز کن.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'domain_iot_teams',
    name: 'تجهیزات هوشمند و تیم‌های نوپا',
    mainUrl: 'https://yazdinnofaraz.ir/teams/',
    priority: 2,
    active: true,
    guidanceText: 'روی تیم‌های فعال در توسعه سخت‌افزار، سیستم‌های نهفته، روبات زیرسطحی ROV و فرصت‌های جذب هم‌تیمی تأکید کن.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'domain_categories',
    name: 'فراخوان‌های صنعتی و فناوری',
    mainUrl: 'https://yazdinnofaraz.ir/categories/',
    priority: 3,
    active: true,
    guidanceText: 'فراخوان‌های باز در بخش‌های کشاورزی، امنیت غذایی، سلامت، نفت و گاز، و معدن را برای تیم‌ها تشریح کن.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'domain_growth_facilities',
    name: 'مراحل پذیرش و تسهیلات مرکز رشد',
    mainUrl: 'https://yazdinnofaraz.ir/facility/',
    priority: 4,
    active: true,
    guidanceText: 'خدمات استقرار در دانشگاه یزد، فضای کار اشتراکی، گرنت نمونه‌سازی و فرآیند اخذ گرید دانش‌بنیان را تبیین کن.',
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
      cachedAssistantDirection = JSON.parse(raw);
      return cachedAssistantDirection!;
    }
  } catch (err) {
    console.error('Error reading assistant direction:', err);
  }

  const initial: AssistantDirectionConfig = {
    directionText: DEFAULT_ASSISTANT_DIRECTION,
    updatedAt: new Date().toISOString(),
  };
  saveAssistantDirection(initial);
  return initial;
}

export function saveAssistantDirection(cfg: AssistantDirectionConfig): void {
  ensureDataDir();
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
 * Identifies if a page is a project page, domain page, or general page
 */
export function detectPageType(
  url: string,
  title: string,
  content: string,
  isMainDomainUrl: boolean
): 'project_domain' | 'project' | 'general' {
  if (isMainDomainUrl) return 'project_domain';

  const indicators = [
    'پروژه',
    'محصول',
    'تیم',
    'ایده',
    'فناور',
    'طرح',
    'سامانه',
    'دستگاه',
    'ربات',
    'اینترنت اشیاء',
    'iot',
    'شتابدهی',
    'شغل',
    'هم‌تیمی',
    'فرصت',
    'فراخوان',
    'چالش',
    'نیازمندی',
    'bms',
    'rov',
    'انرژی',
  ];

  const lowerTitle = title.toLowerCase();
  const lowerUrl = url.toLowerCase();
  const lowerContent = content.slice(0, 1000).toLowerCase();

  for (const ind of indicators) {
    if (lowerTitle.includes(ind) || lowerUrl.includes(ind)) {
      return 'project';
    }
  }

  let matchCount = 0;
  for (const ind of indicators) {
    if (lowerContent.includes(ind)) matchCount++;
  }

  if (matchCount >= 2) return 'project';
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

          const pageType = detectPageType(childUrl, title, cleanChildText, false);

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
  const projectPages = allIndexedPages.filter((p) => p.page_type === 'project');

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

    // Projects receive higher weight for matching
    if (page.page_type === 'project') score += 10;
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
 * Builds grounded context for Gemini dynamically
 */
export function buildGroundingContext(
  retrievedPages: IndexedPage[],
  currentPageUrl?: string,
  domainGuidanceList: string[] = []
): string {
  let text = `=== پایگاه دانش اختصاصی مرکز رشد و نوآوری نوفرآز (https://yazdinnofaraz.ir/) ===\n`;

  if (currentPageUrl) {
    text += `[آدرس صفحه جاری کاربر (CURRENT_PAGE_URL): ${currentPageUrl}]\n\n`;
  }

  if (domainGuidanceList.length > 0) {
    text += `=== رهنمودهای تخصصی مدیر برای حوزه‌های مرتبط ===\n`;
    text += domainGuidanceList.join('\n') + '\n\n';
  }

  for (const page of retrievedPages) {
    text += `--- صفحه: ${page.page_title} (${page.source_url}) ---\n`;
    text += `نوع برگه: ${page.page_type} | حوزه: ${page.domain || page.project_domain}\n`;
    text += `محتوا:\n${page.content}\n\n`;
  }

  return text.trim();
}
