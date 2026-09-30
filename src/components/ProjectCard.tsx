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
    <div className="my-3 rounded-2xl bg-slate-900 border border-emerald-500/30 overflow-hidden shadow-lg hover:border-emerald-500/50 transition-all text-slate-200 text-xs">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950/80 to-slate-900 p-3.5 border-b border-emerald-800/30 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5 shadow-sm">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-white tracking-tight">
                {card.projectName}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                {card.domain}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
              <span className="font-semibold text-emerald-400">چرا متناسب است؟ </span>
              {card.fitReason}
            </p>
          </div>
        </div>
      </div>

      {/* Main Core Insights */}
      <div className="p-3.5 space-y-2.5 bg-slate-900/60">
        {/* Skills Matched vs Gap */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {card.userCurrentSkills && card.userCurrentSkills.length > 0 && (
            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 mb-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                توانمندی‌های موجود شما
              </span>
              <div className="flex flex-wrap gap-1">
                {card.userCurrentSkills.map((s, idx) => (
                  <span key={idx} className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-[10px]">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {card.skillGap && (
            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1 mb-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                شکاف مهارتی (نیاز به یادگیری)
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {card.skillGap}
              </p>
            </div>
          )}
        </div>

        {/* First Actionable Step */}
        <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 flex items-start gap-2">
          <Target className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-200">اولین گام عملی برای شروع: </span>
            <span className="text-slate-300 leading-relaxed">{card.firstActionableStep}</span>
          </div>
        </div>

        {/* Collapsible Detailed Section */}
        {expanded && (
          <div className="space-y-2.5 pt-2 border-t border-slate-800/80 animate-fadeIn">
            {/* Suggested Team */}
            <div className="flex items-start gap-2 text-slate-300">
              <Users className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200">نوع تیم پیشنهادی: </span>
                {card.suggestedTeamType}
              </div>
            </div>

            {/* Similar Previous Projects */}
            <div className="flex items-start gap-2 text-slate-300">
              <FileText className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200">سابقه مشابه در سایت: </span>
                {card.similarPreviousProjects}
              </div>
            </div>

            {/* Market Info */}
            <div className="flex items-start gap-2 text-slate-300">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200">بازار و مشتری: </span>
                {card.marketInfo}
              </div>
            </div>

            {/* Knowledge-based Potential */}
            <div className="flex items-start gap-2 text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200">ظرفیت دانش‌بنیان: </span>
                {card.knowledgeBasedPotential}
              </div>
            </div>

            {/* Source Citation */}
            {card.sourceUrl && (
              <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
                <span>منبع: {card.sourceTitle || 'سایت مرکز رشد نوفرآز'}</span>
                <a
                  href={card.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 hover:underline"
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
      <div className="px-3.5 py-2.5 bg-slate-950/70 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
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
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-medium text-[11px] shadow transition-all cursor-pointer disabled:opacity-50"
        >
          <span>جزئیات بیشتر درباره این پروژه</span>
          <ArrowRight className="w-3.5 h-3.5 rotate-180" />
        </button>
      </div>
    </div>
  );
};
