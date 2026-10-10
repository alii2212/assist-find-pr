export interface ProjectRecommendationCard {
  projectName: string;
  domain: string;
  fitReason: string;
  requiredSkills: string[];
  userCurrentSkills: string[];
  skillGap: string;
  firstActionableStep: string;
  suggestedTeamType: string;
  similarPreviousProjects: string;
  marketInfo: string;
  knowledgeBasedPotential: string;
  sourceUrl: string;
  sourceTitle: string;
  uncertaintyNotes?: string;
}

export interface CandidateProfile {
  fieldOfStudy?: string;
  degree?: string;
  technicalSkills: string[];
  previousProjects: string[];
  interests: string[];
  availableHours?: string;
  teamStatus?: string;
  extractedSummary?: string;
}

export interface SourceCitation {
  title: string;
  url: string;
  snippet?: string;
}

export interface IndexedPage {
  id: string;
  slug: string;
  source_url: string;
  page_title: string;
  page_type: 'project' | 'project_domain' | 'project_list' | 'general' | 'actionable_project' | 'institutional_info';
  project_domain?: string;
  domain?: string;
  parent_domain_url?: string;
  last_modified?: string;
  content_hash?: string;
  last_synced_at: string;
  content_length: number;
  content: string;
  discovery_method?: string;
}

export interface WebsiteKnowledgeBase {
  websiteUrl: string;
  fileSearchStoreId?: string | null;
  fileSearchStoreName?: string | null;
  lastSyncedAt: string;
  totalPages: number;
  pages: IndexedPage[];
}
