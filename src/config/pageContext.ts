/**
 * اطلاعات پایه مربوط به یونس دهقان
 * این اطلاعات به عنوان منبع قابل اعتماد (Single Source of Truth)
 * هم در پنل معرفی و هم در زمینه (Context) سمت سرور برای Gemini استفاده می‌شود.
 */

export interface ProfileContext {
  fullName: string;
  roleTitle: string;
  workplace: string;
  education: string;
  activityField: string;
  culturalActivity: string;
  interestsAndBackground: string[];
  goal: string;
  suggestedQuestions: string[];
}

export const YOUNES_DEHGHAN_CONTEXT: ProfileContext = {
  fullName: "یونس دهقان",
  roleTitle: "فعال حوزه نوآوری، شتاب‌دهی و فعالیت‌های فرهنگی دانشگاهی",
  workplace: "دانشگاه یزد",
  education: "کارشناسی مدیریت مالی و ادامه تحصیل در مقطع کارشناسی ارشد مدیریت مالی",
  activityField: "شتاب‌دهی، جذب تیم و کمک به رشد تیم‌ها",
  culturalActivity: "فعالیت فرهنگی و کار با نوجوانان",
  interestsAndBackground: [
    "نوآوری",
    "تیم‌سازی",
    "فعالیت فرهنگی",
    "کار با نوجوانان",
    "مسائل اجتماعی",
    "فعالیت‌های دانشگاهی"
  ],
  goal: "کمک به رشد افراد و تیم‌ها و انجام فعالیت‌های اثرگذار",
  suggestedQuestions: [
    "سوابق تحصیلی یونس دهقان چیست؟",
    "در چه حوزه‌هایی فعالیت می‌کند؟",
    "فعالیت‌های فرهنگی او چیست؟",
    "هدف اصلی فعالیت‌های او چیست؟"
  ]
};

/**
 * متن ساخت‌یافته و ایمن برای تزریق به عنوان Context سمت سرور
 */
export function getSystemPromptContext(): string {
  return `
--- اطلاعات موثق و پایه درباره یونس دهقان (PAGE_CONTEXT) ---
نام و نام خانوادگی: ${YOUNES_DEHGHAN_CONTEXT.fullName}
محل فعالیت: ${YOUNES_DEHGHAN_CONTEXT.workplace}
تحصیلات: ${YOUNES_DEHGHAN_CONTEXT.education}
حوزه فعالیت: ${YOUNES_DEHGHAN_CONTEXT.activityField}
فعالیت فرهنگی: ${YOUNES_DEHGHAN_CONTEXT.culturalActivity}
سوابق و علایق: ${YOUNES_DEHGHAN_CONTEXT.interestsAndBackground.join('، ')}
هدف اصلی: ${YOUNES_DEHGHAN_CONTEXT.goal}
-----------------------------------------------------------
`.trim();
}
