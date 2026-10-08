import React from 'react';
import { ShieldAlert, LogIn, X, CheckCircle2 } from 'lucide-react';

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingQuestion: string | null;
  onLogin: () => Promise<void>;
  isLoggingIn?: boolean;
}

export const LoginPromptModal: React.FC<LoginPromptModalProps> = ({
  isOpen,
  onClose,
  pendingQuestion,
  onLogin,
  isLoggingIn = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-purple-100 overflow-hidden text-slate-800 p-6 sm:p-7 space-y-5 animate-scale-up">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="بستن"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>

        {/* Header Text */}
        <div className="text-center space-y-1.5">
          <h3 className="text-base sm:text-lg font-black text-slate-900">
            ورود با حساب Google برای ادامه مشاوره
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            پاسخ سوال اول به شما ارائه شد. برای دریافت پاسخ سوالات بعدی، راهنمایی تکمیلی و ذخیره ابری گفتگو، لطفاً با حساب گوگل وارد شوید.
          </p>
        </div>

        {/* Preserved Question Card */}
        {pendingQuestion && (
          <div className="bg-purple-50/70 border border-purple-200/60 rounded-2xl p-3.5 text-right space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>سوال شما با موفقیت ذخیره شد و نیازی به تایپ مجدد نیست:</span>
            </div>
            <p className="text-xs text-slate-700 font-medium line-clamp-3 bg-white/80 p-2.5 rounded-xl border border-purple-100/50">
              «{pendingQuestion}»
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={onLogin}
            disabled={isLoggingIn}
            className="w-full py-3.5 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-700/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoggingIn ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>ورود با حساب گوگل و ارسال خودکار سوال</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 px-3 text-xs text-slate-400 hover:text-slate-600 transition-colors text-center cursor-pointer"
          >
            ویرایش سوال و انصراف
          </button>
        </div>
      </div>
    </div>
  );
};
