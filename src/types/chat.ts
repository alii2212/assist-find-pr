import { ProjectRecommendationCard, CandidateProfile, SourceCitation } from './project.ts';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  text?: string;
  timestamp: number;
  sources?: SourceCitation[];
  projectCards?: ProjectRecommendationCard[];
  isStreaming?: boolean;
  isError?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  previousInteractionId?: string;
  conversationPageUrl?: string;
  candidateProfile?: CandidateProfile;
  lastMessagePreview?: string;
}
