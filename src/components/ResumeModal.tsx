import React, { useState } from 'react';
import { FileUp, X, Loader2, FileText } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-purple-150 rounded-2xl w-full max-w-lg p-5 shadow-2xl flex flex-col gap-4 text-slate-800">
        <div className="flex items-center justify-between pb-3 border-b border-purple-100">
          <div className="flex items-center gap-2">
            <FileUp className="w-5 h-5 text-purple-700" />
            <h3 className="font-bold text-sm text-slate-900">بارگذاری رزومه یا معرفی سوابق</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          می‌توانید فایل PDF رزومه خود را بارگذاری کنید یا متن سوابق، مهارت‌ها و پروژه‌های خود را اینجا وارد نمایید تا هوش مصنوعی آن را تحلیل کند.
        </p>

        {/* PDF upload area */}
        <label className="border-2 border-dashed border-purple-200 hover:border-purple-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-purple-50/40">
          <FileText className="w-7 h-7 text-purple-600 mb-1" />
          <span className="text-xs font-semibold text-purple-900">
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
          <div className="flex items-center justify-center gap-2 text-xs text-purple-700 py-2 font-medium">
            <Loader2 className="w-4 h-4 animate-spin text-purple-700" />
            <span>در حال استخراج متن از رزومه...</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Textarea */}
        <textarea
          value={cvText}
          onChange={(e) => setCvText(e.target.value)}
          placeholder="یا متن رزومه و مهارت‌های خود را اینجا جای‌گذاری کنید..."
          rows={5}
          className="w-full bg-slate-50 border border-purple-200 focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-100 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 resize-none leading-relaxed focus:outline-none transition-all"
        />

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl text-slate-600 hover:text-slate-900 text-xs cursor-pointer"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!cvText.trim() || isParsing}
            className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs transition-all shadow-sm shadow-purple-700/20 disabled:opacity-50 cursor-pointer"
          >
            ثبت و تحلیل توسط مشاور
          </button>
        </div>
      </div>
    </div>
  );
};
