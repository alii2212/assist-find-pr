import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Trash2,
  Copy,
  Check,
  Bot,
  User,
  AlertCircle,
  Sparkles,
  Lock,
  RotateCcw,
} from 'lucide-react';
import { ChatMessage } from '../types/chat.ts';

interface ChatBoxProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  onSendMessage: (text: string) => Promise<void>;
  onClearHistory: () => void;
  onLogin: () => void;
  inputPrompt: string;
  setInputPrompt: (val: string) => void;
  currentError: string | null;
  onDismissError: () => void;
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  messages,
  isStreaming,
  isAuthenticated,
  isLoadingAuth,
  onSendMessage,
  onClearHistory,
  onLogin,
  inputPrompt,
  setInputPrompt,
  currentError,
  onDismissError,
}) => {
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on messages update or streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Adjust textarea height automatically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        140
      )}px`;
    }
  }, [inputPrompt]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.key === 'Enter' || e.code === 'Enter' || e.keyCode === 13) && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    const text = inputPrompt.trim();
    if (!text || isStreaming) return;
    setInputPrompt('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await onSendMessage(text);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => {
      setCopiedMessageId(null);
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Chat Header Bar */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-slate-300">
            گفتگوی زنده با دستیار
          </span>
          {messages.length > 0 && (
            <span className="text-[11px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
              {messages.length} پیام
            </span>
          )}
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            disabled={isStreaming}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            title="پاک کردن سابقه گفتگو"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>پاک کردن گفتگو</span>
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 shadow-inner">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-slate-200 mb-1">
              هنوز پیامی ارسال نشده است
            </h3>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              سؤال خود را درباره تحصیلات، فعالیت‌ها، سوابق یا اهداف یونس دهقان بنویسید، یا از پرسش‌های پیشنهادی زیر استفاده کنید.
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isUser = message.role === 'user';
            return (
              <div
                key={message.id}
                className={`flex gap-3 items-start ${
                  isUser ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs shadow-sm mt-0.5 ${
                    isUser
                      ? 'bg-slate-700 text-slate-200'
                      : 'bg-emerald-600 text-white font-bold'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble Container */}
                <div
                  className={`flex flex-col max-w-[85%] sm:max-w-[78%] ${
                    isUser ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap transition-all shadow-sm ${
                      isUser
                        ? 'bg-emerald-600 text-white rounded-tr-sm'
                        : message.isError
                        ? 'bg-rose-950/60 text-rose-200 border border-rose-800/60 rounded-tl-sm'
                        : 'bg-slate-800/90 text-slate-100 border border-slate-700/60 rounded-tl-sm'
                    }`}
                  >
                    {message.content || message.text}
                    {message.isStreaming && (
                      <span className="inline-block w-1.5 h-4 mr-1 bg-emerald-400 animate-pulse align-middle" />
                    )}
                  </div>

                  {/* Actions / Timestamp Bar */}
                  <div className="flex items-center gap-2 mt-1 px-1">
                    <span className="text-[10px] text-slate-500">
                      {new Date(message.timestamp).toLocaleTimeString('fa-IR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>

                    {!isUser && !message.isStreaming && (message.content || message.text) && (
                      <button
                        type="button"
                        onClick={() => handleCopy(message.id, message.content || message.text || '')}
                        className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 px-1.5 py-0.5 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                        title="کپی پاسخ"
                      >
                        {copiedMessageId === message.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 font-medium">کپی شد</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>کپی</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Streaming Loading Indicator (when stream started but before first chunk) */}
        {isStreaming && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-800/90 border border-slate-700/60 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2 text-xs text-emerald-400">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
              <span className="text-slate-300">در حال تدوین پاسخ موثق...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Alert Bar */}
      {currentError && (
        <div className="px-4 py-2.5 mx-4 mb-2 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-200 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{currentError}</span>
          </div>
          <button
            type="button"
            onClick={onDismissError}
            className="text-slate-400 hover:text-white px-2 py-0.5 rounded cursor-pointer"
          >
            بستن
          </button>
        </div>
      )}

      {/* Input / Auth Bar Area */}
      <div className="p-3 sm:p-4 bg-slate-950/70 border-t border-slate-800 relative">
        {!isAuthenticated ? (
          <div className="rounded-lg bg-slate-900 border border-slate-800 p-2.5 mb-2 flex items-center justify-between gap-2 text-xs text-slate-300">
            <span>گفتگو به عنوان کاربر مهمان</span>
            <button
              onClick={onLogin}
              type="button"
              className="text-emerald-400 hover:text-emerald-300 font-medium hover:underline cursor-pointer"
            >
              ورود با Google (ذخیره سوابق)
            </button>
          </div>
        ) : null}

        {/* Input Box */}
        <div className="flex flex-col gap-2">
          <div className="relative flex items-end gap-2 bg-slate-900 border border-slate-800 focus-within:border-emerald-500/60 rounded-xl p-2 transition-all shadow-inner">
            <textarea
              ref={textareaRef}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
              placeholder="مثلاً: سوابق تحصیلی من چیست؟"
              rows={1}
              maxLength={500}
              className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none px-2 py-1 max-h-[140px] leading-relaxed disabled:opacity-50"
            />

            <button
              type="button"
              onClick={handleSend}
              disabled={!inputPrompt.trim() || isStreaming}
              className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white disabled:opacity-30 disabled:hover:bg-emerald-600 disabled:cursor-not-allowed transition-all shadow-md shrink-0 cursor-pointer"
              title="ارسال سؤال (Enter)"
            >
              {isStreaming ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4 rotate-180" />
              )}
            </button>
            <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
              <span>کلید Enter برای ارسال • Shift + Enter برای خط جدید</span>
              <span>{inputPrompt.length}/500</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
