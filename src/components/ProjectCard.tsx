import React, { useState } from 'react';
import {
  Briefcase,
  Target,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Users,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { ProjectRecommendationCard } from '../types/project.ts';

interface ProjectCardProps {
  card: ProjectRecommendationCard;
  onAskMore: (projectName: string) => void;
  disabled?: boolean;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ card, onAskMore, disabled }) => {
  const [expanded, setExpanded] = useState<boolean>(false);

  return (
    <div className="my-3 rounded-2xl bg-white border border-purple-200 overflow-hidden shadow-xs hover:border-purple-300 hover:shadow-md transition-all text-slate-800 text-xs">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-50 via-purple-50/60 to-indigo-50/40 p-3.5 border-b border-purple-100 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="p-2 rounded-xl bg-purple-100 text-purple-700 shrink-0 mt-0.5 shadow-xs">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-extrabold text-slate-900 tracking-tight">
                {card.projectName}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-semibold">
                {card.domain}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              <span className="font-semibold text-purple-800">چرا متناسب است؟ </span>
              {card.fitReason}
            </p>
          </div>
        </div>
      </div>

      {/* Main Core Insights */}
      <div className="p-3.5 space-y-2.5 bg-white">
        {/* Skills Matched vs Gap */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {card.userCurrentSkills && card.userCurrentSkills.length > 0 && (
            <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-100">
              <span className="text-[11px] font-semibold text-purple-800 flex items-center gap-1 mb-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-700" />
                توانمندی‌های موجود شما
              </span>
              <div className="flex flex-wrap gap-1">
                {card.userCurrentSkills.map((s, idx) => (
                  <span key={idx} className="px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-900 border border-purple-200/60 text-[10px]">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {card.skillGap && (
            <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200">
              <span className="text-[11px] font-semibold text-amber-800 flex items-center gap-1 mb-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                شکاف مهارتی (نیاز به یادگیری)
              </span>
              <p className="text-[11px] text-slate-700 leading-relaxed">
                {card.skillGap}
              </p>
            </div>
          )}
        </div>

        {/* First Actionable Step */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-purple-100/70 flex items-start gap-2">
          <Target className="w-3.5 h-3.5 text-purple-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-900">اولین گام عملی برای شروع: </span>
            <span className="text-slate-600 leading-relaxed">{card.firstActionableStep}</span>
          </div>
        </div>

        {/* Collapsible Detailed Section */}
        {expanded && (
          <div className="space-y-2.5 pt-2 border-t border-purple-100 animate-fadeIn">
            {/* Suggested Team */}
            <div className="flex items-start gap-2 text-slate-700">
              <Users className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-900">نوع تیم پیشنهادی: </span>
                {card.suggestedTeamType}
              </div>
            </div>

            {/* Similar Previous Projects */}
            <div className="flex items-start gap-2 text-slate-700">
              <FileText className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-900">سابقه مشابه در سایت: </span>
                {card.similarPreviousProjects}
              </div>
            </div>

            {/* Market Info */}
            <div className="flex items-start gap-2 text-slate-700">
              <TrendingUp className="w-3.5 h-3.5 text-violet-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-900">بازار و مشتری: </span>
                {card.marketInfo}
              </div>
            </div>

            {/* Knowledge-based Potential */}
            <div className="flex items-start gap-2 text-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-900">ظرفیت دانش‌بنیان: </span>
                {card.knowledgeBasedPotential}
              </div>
            </div>

            {/* Source Citation */}
            {card.sourceUrl && (
              <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
                <span>منبع: {card.sourceTitle || 'سایت مرکز رشد نوفرآز'}</span>
                <a
                  href={card.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-purple-700 hover:text-purple-900 hover:underline font-medium"
                >
                  مشاهده صفحه سایت
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="px-3.5 py-2.5 bg-purple-50/40 border-t border-purple-100 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-purple-800 transition-colors cursor-pointer font-medium"
        >
          {expanded ? (
            <>
              <span>بستن جزئیات</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              <span>تحلیل بازار، تیم و پیشینه</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onAskMore(card.projectName)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 active:scale-95 text-white font-medium text-[11px] shadow-xs shadow-purple-700/20 transition-all cursor-pointer disabled:opacity-50"
        >
          <span>جزئیات بیشتر درباره این پروژه</span>
          <ArrowRight className="w-3.5 h-3.5 rotate-180" />
        </button>
      </div>
    </div>
  );
};
