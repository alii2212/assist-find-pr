export interface ProjectDomainConfig {
  id: string;
  name: string;
  mainUrl: string;
  priority: number;
  active: boolean;
  guidanceText?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FailedUrlRecord {
  url: string;
  reason: string;
  timestamp: string;
}

export interface SyncStatusReport {
  lastSyncTime: string | null;
  syncStatus: 'idle' | 'in_progress' | 'success' | 'failed';
  totalConfiguredDomains: number;
  totalActiveDomains: number;
  totalDiscoveredPages: number;
  totalIndexedProjectPages: number;
  changedPagesCount: number;
  removedPagesCount: number;
  failedUrls: FailedUrlRecord[];
  fileSearchStoreId?: string | null;
  fileSearchStoreName?: string | null;
  lastSyncType?: 'normal' | 'full_rebuild' | null;
  lastMessage?: string;
}

export interface ProjectCategoryStat {
  id: string;
  name: string;
  projectCount: number;
  subUrl?: string;
  keySkills?: string[];
  description?: string;
  active: boolean;
}

export interface ProjectCatalogConfig {
  catalogUrl: string; // Default: 'https://yazdinnofaraz.ir/categories/'
  catalogUrlPatterns: string[]; // Patterns like ['/categories/']
  enforceCatalogOnlyForProjects: boolean; // Only recommend takeable projects from this source
  generalPagesGuidance: string; // Instructions on using general info (about, contact, teams, facility, faq)
  categories: ProjectCategoryStat[];
}

export interface AssistantDirectionConfig {
  directionText: string;
  catalogConfig?: ProjectCatalogConfig;
  updatedAt: string;
  updatedBy?: string;
}

export interface SystemStatusReport {
  authentication: 'OK' | 'ERROR';
  gemini: 'OK' | 'ERROR';
  firestore: 'OK' | 'ERROR';
  knowledgeBase: 'OK' | 'EMPTY' | 'ERROR';
  websiteSync: 'OK' | 'ERROR';
  widget: 'READY' | 'ERROR';
}

export interface IndexedPageSummary {
  id: string;
  slug: string;
  title: string;
  type: string;
  domain: string;
  url: string;
  parentDomainUrl?: string;
  lastModified?: string;
  contentLength?: number;
}

export interface AdminDashboardData {
  isAdmin: boolean;
  userEmail?: string;
  userUid?: string;
  domains: ProjectDomainConfig[];
  assistantDirection: AssistantDirectionConfig;
  syncStatus: SyncStatusReport;
  systemStatus: SystemStatusReport;
  totalPages: number;
  indexedPages: IndexedPageSummary[];
}
