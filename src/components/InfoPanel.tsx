import React from 'react';
import {
  User,
  GraduationCap,
  Building2,
  Rocket,
  HeartHandshake,
  Target,
  Sparkles,
  Tag,
  ShieldCheck,
} from 'lucide-react';
import { YOUNES_DEHGHAN_CONTEXT } from '../config/pageContext.ts';

export const InfoPanel: React.FC = () => {
  const profile = YOUNES_DEHGHAN_CONTEXT;

  return (
    <aside className="w-full h-full flex flex-col gap-4">
      {/* Profile Header Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
        
        <div className="flex items-center gap-3.5 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/10 shrink-0">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {profile.fullName}
            </h2>
            <p className="text-xs text-emerald-400 font-medium mt-0.5">
              {profile.roleTitle}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed bg-slate-800/40 rounded-xl p-3 border border-slate-800">
          دستیار هوشمند مستقر در این صفحه به صورت اختصاصی بر پایه اطلاعات موثق و رسمی زیر آموزش داده شده و به سؤالات شما پاسخ می‌دهد.
        </p>
      </div>

      {/* Structured Details Cards */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-sm flex-1">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            شناسنامه اطلاعات پایه
          </span>
          <span className="text-[11px] text-slate-500">منبع معتبر</span>
        </div>

        {/* Workplace */}
        <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-850 hover:bg-slate-800/60 border border-slate-800/60 transition-colors">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-0.5">
              محل فعالیت
            </span>
            <p className="text-sm font-medium text-slate-100">
              {profile.workplace}
            </p>
          </div>
        </div>

        {/* Education */}
        <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-850 hover:bg-slate-800/60 border border-slate-800/60 transition-colors">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0 mt-0.5">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-0.5">
              تحصیلات
            </span>
            <p className="text-sm font-medium text-slate-100 leading-relaxed">
              {profile.education}
            </p>
          </div>
        </div>

        {/* Activity Field */}
        <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-850 hover:bg-slate-800/60 border border-slate-800/60 transition-colors">
          <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 shrink-0 mt-0.5">
            <Rocket className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-0.5">
              حوزه فعالیت
            </span>
            <p className="text-sm font-medium text-slate-100 leading-relaxed">
              {profile.activityField}
            </p>
          </div>
        </div>

        {/* Cultural Activity */}
        <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-850 hover:bg-slate-800/60 border border-slate-800/60 transition-colors">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 shrink-0 mt-0.5">
            <HeartHandshake className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-0.5">
              فعالیت فرهنگی
            </span>
            <p className="text-sm font-medium text-slate-100 leading-relaxed">
              {profile.culturalActivity}
            </p>
          </div>
        </div>

        {/* Interests & Background Tags */}
        <div className="p-3 rounded-xl bg-slate-850 hover:bg-slate-800/60 border border-slate-800/60 transition-colors">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="p-1 rounded bg-amber-500/10 text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-slate-400">
              سوابق و علایق
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {profile.interestsAndBackground.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700/60 hover:border-slate-600 transition-colors"
              >
                <Tag className="w-2.5 h-2.5 text-slate-500" />
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Goal */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-800/30">
          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-emerald-400 block mb-0.5">
              هدف و چشم‌انداز
            </span>
            <p className="text-sm font-medium text-slate-100 leading-relaxed">
              {profile.goal}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
