import { GoogleGenAI } from "@google/genai";
import {
  searchKnowledgeBase,
  buildGroundingContext,
  loadAssistantDirection,
} from "./crawlerService.ts";
import type {
  CandidateProfile,
  ProjectRecommendationCard,
  SourceCitation,
} from "../types/project.ts";

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY_MISSING");
  }

  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

const CANDIDATE_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash",
  "gemini-flash-latest",
];

export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface StreamChatAdvisorOptions {
  userQuestion: string;
  currentPageUrl?: string;
  chatHistory?: ChatHistoryMessage[];
  candidateProfile?: CandidateProfile;
  onChunk: (chunk: string) => void;
  onProjectCards?: (cards: ProjectRecommendationCard[]) => void;
  onProfileUpdate?: (profile: CandidateProfile) => void;
  onSources?: (citations: SourceCitation[]) => void;
}

/**
 * Strips both completed and in-flight unclosed tags to prevent JSON/tags leakage to the user.
 */
function getVisibleText(raw: string): string {
  let s = raw
    .replace(/<<<PROJECT_CARDS_START>>>[\s\S]*?(?:<<<PROJECT_CARDS_END>>>|$)/g, '')
    .replace(/<<<PROFILE_UPDATE_START>>>[\s\S]*?(?:<<<PROFILE_UPDATE_END>>>|$)/g, '');
  // Also strip any partial trailing marker starting with <<<
  s = s.replace(/<<<[A-Z_]*$/g, '');
  return s;
}

/**
 * Helper to pause execution with jitter
 */
const waitDelay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function streamProjectAdvisor(options: StreamChatAdvisorOptions): Promise<{
  fullText: string;
  projectCards: ProjectRecommendationCard[];
  candidateProfile: CandidateProfile;
  citations: SourceCitation[];
}> {
  const {
    userQuestion,
    currentPageUrl,
    chatHistory = [],
    candidateProfile = { technicalSkills: [], previousProjects: [], interests: [] },
    onChunk,
    onProjectCards,
    onProfileUpdate,
    onSources,
  } = options;

  if (!userQuestion || !userQuestion.trim()) {
    throw new Error("EMPTY_PROMPT");
  }

  const trimmed = userQuestion.trim();
  if (trimmed.length > 2500) {
    throw new Error("PROMPT_TOO_LONG");
  }

  // 1. Dynamic Retrieval from synchronized Growth Center Knowledge Base
  const { retrievedPages, citations, domainGuidanceList } = searchKnowledgeBase(
    trimmed,
    currentPageUrl,
    6
  );

  // 2. Load dynamically configured Assistant Direction and Catalog config from admin settings
  const assistantConfig = loadAssistantDirection();
  const dynamicDirectionText = assistantConfig.directionText;
  const catalogConfig = assistantConfig.catalogConfig;
  const catalogUrl = catalogConfig?.catalogUrl || 'https://yazdinnofaraz.ir/categories/';

  const websiteContext = buildGroundingContext(
    retrievedPages,
    currentPageUrl,
    domainGuidanceList,
    catalogConfig
  );

  // Detect if user is explicitly asking for external market / competitor / regulatory research
  const isAskingForMarketOrLegal = /بازار|رقیب|رقبا|مارکت|سایز بازار|قوانین|مجوز|دانش‌بنیان|آیین‌نامه|صادرات|رگولاتوری/i.test(trimmed);

  const systemInstruction = `
شما «مشاور هوشمند انتخاب پروژه مرکز رشد و نوآوری فراز (نوفرآز) دانشگاه یزد» هستید.
آدرس وب‌سایت مرجع: https://yazdinnofaraz.ir/
آدرس منبع انحصاری پروژه‌های قابل اخذ: ${catalogUrl}

=== جهت‌دهی و دستورالعمل مصوب مدیریت (قابل تنظیم داینامیک در پنل ادمین) ===
${dynamicDirectionText}

=== قوانین حیاتی تفکیک «پروژه‌های قابل اخذ» از «دانش عمومی مرکز» ===
۱. پروژه‌ها و فراخوان‌های قابل اخذ (Actionable Takeable Projects):
   - هر زمان کاربر درباره پیشنهاد پروژه، شروع کار، انطباق رشته و مهارت با پروژه‌ها سوال پرسید یا رزومه‌اش را ارائه کرد:
     شما فقط و فقط باید پروژه‌ها را از «بخش ۱: کاتالوگ پروژه‌ها و فراخوان‌های قابل اخذ» (منبع انحصاری: ${catalogUrl} و حوزه‌های ۱۱گانه فعال فراخوان) پیشنهاد دهید.
   - هرگز از سایر صفحات (اخبار، درباره ما، تماس با ما و ...) پروژه اختراع یا به عنوان پروژه قابل اخذ معرفی نکنید.

۲. پاسخ به سوالات عمومی و اطلاعات سازمانی مرکز (Institutional Knowledge):
   - هر زمان کاربر سوالات عمومی مطرح کرد (مانند: «آدرس مرکز رشد کجاست؟»، «چند تیم تا حالا پروژه گرفتن؟»، «تسهیلات و گرنت چقدر است؟»، «روال پذیرش چیست؟»):
     از «بخش ۲: اطلاعات عمومی و سازمانی مرکز رشد» با دقت و استناد کامل پاسخ دهید.
     - آدرس دقیق: یزد، دانشگاه یزد، مرکز نوآوری و رشد فراز (باشگاه نوآوری شهید علم‌الهدی)، تلفن هماهنگی: ۰۹۹۱۳۲۳۶۶۳۴.
     - حمایت‌ها: حمایت مالی تا سقف ۷۰۰ میلیون تومان، فضای اشتراکی، دسترسی به منتورها و شبکه صنعتی.
     - سوابق تیم‌ها: بیش از ۴ سال سابقه استقرار تیم‌های دانشجویی دانشگاه یزد در حوزه‌های رباتیک زیرسطحی ROV، انرژی، نرم‌افزار و ...

=== اولویت و سلسله‌مراتب منابع (Source Priority) ===
۱. اولویت اول: پایگاه دانش رسمی وب‌سایت مرکز رشد (https://yazdinnofaraz.ir/) با تفکیک دوگانه فوق.
۲. اولویت دوم: اطلاعاتی که کاربر صریحاً درباره تحصیلات، مهارت‌ها، سوابق و علایقش در چت بیان می‌کند.
۳. اولویت سوم: استدلال و تحلیل مشاور بر پایه دو اولویت بالا.

=== خروجی ساختاریافته کارت‌های پروژه ===
هر زمان که پروژه‌های مشخصی از بخش ۱ (${catalogUrl}) برای کاربر مناسب تشخیص داده شد، در انتهای پاسخ تگ زیر را قرار دهید:
<<<PROJECT_CARDS_START>>>
[
  {
    "projectName": "نام دقیق پروژه یا فراخوان از سایت",
    "domain": "حوزه پروژه (مثلاً انرژی و بهینه‌سازی)",
    "fitReason": "دلیل تناسب با توانمندی‌های کاربر",
    "requiredSkills": ["مهارت‌های لازم"],
    "userCurrentSkills": ["مهارت‌های موجود کاربر"],
    "skillGap": "مهارت‌های کمبود که نیاز به یادگیری دارد",
    "firstActionableStep": "اولین گام عملی برای شروع",
    "suggestedTeamType": "فردی یا تیمی (با ذکر تخصص‌های مکمل مورد نیاز)",
    "similarPreviousProjects": "سابقه مشابه ثبت‌شده در سایت یا اعلام عدم ثبت",
    "marketInfo": "اطلاعات بازار موجود در سایت یا نیاز به بررسی بیرونی",
    "knowledgeBasedPotential": "تحلیل مقدماتی پتانسیل دانش‌بنیانی",
    "sourceUrl": "لینک دقیق صفحه در سایت نوفرآز",
    "sourceTitle": "عنوان صفحه منبع"
  }
]
<<<PROJECT_CARDS_END>>>

۶. بروزرسانی تجمیعی پروفایل داوطلب (Candidate Profile):
<<<PROFILE_UPDATE_START>>>
{
  "fieldOfStudy": "رشته تحصیلی در صورت بیان",
  "degree": "مقطع در صورت بیان",
  "technicalSkills": ["مهارت‌های احراز شده"],
  "previousProjects": ["پروژه‌های قبلی"],
  "interests": ["علاقه‌مندی‌ها"],
  "availableHours": "ساعت در دسترس",
  "teamStatus": "فردی / دارای تیم",
  "extractedSummary": "خلاصه دوخطی وضعیت کاربر"
}
<<<PROFILE_UPDATE_END>>>

${websiteContext}
`.trim();

  // Multi-turn history reconstruction
  const contentsPayload: any[] = [];
  for (const h of chatHistory.slice(-8)) {
    contentsPayload.push({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }],
    });
  }

  let currentPromptText = trimmed;
  if (candidateProfile.technicalSkills && candidateProfile.technicalSkills.length > 0) {
    currentPromptText = `[پروفایل شناخته‌شده کاربر تا این مرحله: رشته: ${candidateProfile.fieldOfStudy || 'نامشخص'} | مهارت‌ها: ${candidateProfile.technicalSkills.join('، ')} | سوابق: ${candidateProfile.previousProjects.join('، ')}]\n\nپیام جدید کاربر:\n${trimmed}`;
  }

  contentsPayload.push({
    role: 'user',
    parts: [{ text: currentPromptText }],
  });

  const ai = getAiClient();
  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    let fullAccumulated = '';
    let lastEmittedLength = 0;
    const maxAttemptsForModel = 1;

    for (let attempt = 1; attempt <= maxAttemptsForModel; attempt++) {
      try {
        fullAccumulated = '';
        lastEmittedLength = 0;

        const responseStream = await ai.models.generateContentStream({
          model,
          contents: contentsPayload,
          config: {
            systemInstruction,
            temperature: 0.25,
            topP: 0.9,
          },
        });

        for await (const chunk of responseStream) {
          const text = chunk.text;
          if (text) {
            fullAccumulated += text;
            const currentVisible = getVisibleText(fullAccumulated);
            if (currentVisible.length > lastEmittedLength) {
              const delta = currentVisible.slice(lastEmittedLength);
              lastEmittedLength = currentVisible.length;
              onChunk(delta);
            }
          }
        }

        // If streaming succeeded and produced content
        if (fullAccumulated.trim().length > 0) {
          // Parse structured project cards
          let projectCards: ProjectRecommendationCard[] = [];
          let updatedProfile: CandidateProfile = { ...candidateProfile };

          const cardsMatch = fullAccumulated.match(/<<<PROJECT_CARDS_START>>>([\s\S]*?)<<<PROJECT_CARDS_END>>>/);
          if (cardsMatch) {
            try {
              projectCards = JSON.parse(cardsMatch[1].trim());
              if (onProjectCards && Array.isArray(projectCards)) {
                onProjectCards(projectCards);
              }
            } catch (e) {
              console.warn('Failed to parse project cards JSON:', e);
            }
          }

          // Parse candidate profile update
          const profileMatch = fullAccumulated.match(/<<<PROFILE_UPDATE_START>>>([\s\S]*?)<<<PROFILE_UPDATE_END>>>/);
          if (profileMatch) {
            try {
              const parsedProf = JSON.parse(profileMatch[1].trim());
              updatedProfile = {
                ...candidateProfile,
                ...parsedProf,
                technicalSkills: Array.from(new Set([...(candidateProfile.technicalSkills || []), ...(parsedProf.technicalSkills || [])])),
                previousProjects: Array.from(new Set([...(candidateProfile.previousProjects || []), ...(parsedProf.previousProjects || [])])),
                interests: Array.from(new Set([...(candidateProfile.interests || []), ...(parsedProf.interests || [])])),
              };
              if (onProfileUpdate) {
                onProfileUpdate(updatedProfile);
              }
            } catch (e) {
              console.warn('Failed to parse profile update JSON:', e);
            }
          }

          const cleanFullText = getVisibleText(fullAccumulated).trim();

          return {
            fullText: cleanFullText,
            projectCards,
            candidateProfile: updatedProfile,
            citations,
          };
        }
      } catch (err: any) {
        lastError = err;
        const errMessage = String(err?.message || err);
        const isTransient = /503|429|UNAVAILABLE|RESOURCE_EXHAUSTED|high demand/i.test(errMessage);

        console.warn(`[Model: ${model} | Attempt ${attempt}/${maxAttemptsForModel}] Error:`, errMessage.slice(0, 160));

        // If chunks were already partially emitted to client, break to avoid duplicate text
        if (lastEmittedLength > 0) {
          console.warn(`Partial content already emitted (${lastEmittedLength} chars), finishing with current text.`);
          const cleanFullText = getVisibleText(fullAccumulated).trim();
          return {
            fullText: cleanFullText,
            projectCards: [],
            candidateProfile,
            citations,
          };
        }

        // If it's a transient 503/429 error and we have another attempt, wait with backoff
        if (isTransient && attempt < maxAttemptsForModel) {
          const delay = 600 * attempt;
          console.info(`Waiting ${delay}ms before retrying model ${model}...`);
          await waitDelay(delay);
          continue;
        }

        // Otherwise break attempt loop and try next fallback model
        break;
      }
    }
  }

  // Final fallback: Non-streaming generateContent on gemini-3.5-flash-lite as safety net
  try {
    console.info('Attempting emergency non-streaming fallback on gemini-3.5-flash-lite...');
    const fallbackRes = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: contentsPayload,
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    const text = fallbackRes.text || '';
    if (text) {
      const cleanFullText = getVisibleText(text).trim();
      onChunk(cleanFullText);
      return {
        fullText: cleanFullText,
        projectCards: [],
        candidateProfile,
        citations,
      };
    }
  } catch (emergencyErr) {
    console.error('Emergency fallback also failed:', emergencyErr);
  }

  throw lastError || new Error("ALL_MODELS_UNAVAILABLE");
}
