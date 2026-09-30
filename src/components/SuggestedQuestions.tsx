import React from 'react';
import { HelpCircle, ArrowUpLeft } from 'lucide-react';
import { YOUNES_DEHGHAN_CONTEXT } from '../config/pageContext.ts';

interface SuggestedQuestionsProps {
  onSelectQuestion: (question: string) => void;
  disabled?: boolean;
}

export const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({
  onSelectQuestion,
  disabled = false,
}) => {
  const questions = YOUNES_DEHGHAN_CONTEXT.suggestedQuestions;

  return (
    <div className="w-full">
      <div className="flex items-center gap-1.5 mb-2.5 px-1">
        <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-xs font-semibold text-slate-400">
          پرسش‌های پیشنهادی:
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {questions.map((q, idx) => (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => onSelectQuestion(q)}
            className="flex items-center justify-between text-right p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-white text-xs font-medium transition-all group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <span className="line-clamp-1">{q}</span>
            <ArrowUpLeft className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 mr-2" />
          </button>
        ))}
      </div>
    </div>
  );
};
