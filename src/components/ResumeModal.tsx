import React, { useState } from 'react';
import { FileUp, X, Check, Loader2, FileText } from 'lucide-react';
import { getCurrentIdToken } from '../firebase/config.ts';

interface ResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyResumeText: (text: string) => void;
}

export const ResumeModal: React.FC<ResumeModalProps> = ({
  isOpen,
  onClose,
  onApplyResumeText,
}) => {
  const [cvText, setCvText] = useState<string>('');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      setErrorMsg('لطفاً یک فایل PDF معتبر انتخاب نمایید.');
      return;
    }

    setIsParsing(true);
    setErrorMsg(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const token = await getCurrentIdToken();

        const res = await fetch('/api/resume-parse', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ base64Pdf: base64 }),
        });

        if (res.ok) {
          const data = await res.json();
          setCvText(data.extractedText || '');
        } else {
          setErrorMsg('خطا در استخراج متن از فایل PDF.');
        }
        setIsParsing(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setErrorMsg('خطا در بارگذاری فایل.');
      setIsParsing(false);
    }
  };

  const handleApply = () => {
    if (!cvText.trim()) return;
    onApplyResumeText(cvText.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl flex flex-col gap-4 text-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileUp className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">بارگذاری رزومه یا معرفی سوابق</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          می‌توانید فایل PDF رزومه خود را بارگذاری کنید یا متن سوابق، مهارت‌ها و پروژه‌های خود را اینجا وارد نمایید تا هوش مصنوعی آن را تحلیل کند.
        </p>

        {/* PDF upload area */}
        <label className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-950/40">
          <FileText className="w-7 h-7 text-slate-400 mb-1" />
          <span className="text-xs font-medium text-slate-300">
            انتخاب فایل PDF رزومه
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">
            حداکثر حجم: ۴ مگابایت
          </span>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isParsing}
          />
        </label>

        {isParsing && (
          <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 py-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>در حال استخراج متن از رزومه...</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-2 rounded-lg bg-rose-950/70 border border-rose-800/80 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Textarea */}
        <textarea
          value={cvText}
          onChange={(e) => setCvText(e.target.value)}
          placeholder="یا متن رزومه و مهارت‌های خود را اینجا جای‌گذاری کنید..."
          rows={5}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 resize-none leading-relaxed"
        />

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white text-xs"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!cvText.trim() || isParsing}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow disabled:opacity-50 cursor-pointer"
          >
            ثبت و تحلیل توسط مشاور
          </button>
        </div>
      </div>
    </div>
  );
};
