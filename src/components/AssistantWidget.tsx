import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Sparkles,
  Plus,
  X,
  Send,
  FileUp,
  ExternalLink,
  ChevronDown,
  User,
  Bot,
  Copy,
  Check,
  Lock,
  LogOut,
  AlertCircle,
  HelpCircle,
  ArrowUpLeft,
  Database,
} from 'lucide-react';
import { ChatMessage, ChatSession } from '../types/chat.ts';
import { ProjectRecommendationCard, CandidateProfile } from '../types/project.ts';
import { ProjectCard } from './ProjectCard.tsx';
import { ChatSessionsDrawer } from './ChatSessionsDrawer.tsx';
import { ResumeModal } from './ResumeModal.tsx';

interface AssistantWidgetProps {
  isOpen: boolean;
  onToggle: () => void;
  currentPageUrl: string;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  isAdmin?: boolean;
  hideAdminButton?: boolean;
  isStandaloneRoute?: boolean;
  onOpenAdminPanel?: () => void;
  onLogin: () => void;
  onLogout: () => void;
  chats: ChatSession[];
  activeChat: ChatSession | null;
  messages: ChatMessage[];
  isStreaming: boolean;
  onSendMessage: (text: string) => Promise<void>;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  onRenameChat: (chatId: string, newTitle: string) => Promise<void>;
  onDeleteChat: (chatId: string) => Promise<void>;
  onDeleteAllChats: () => Promise<void>;
  onApplyResumeText: (text: string) => void;
  currentError: string | null;
  onDismissError: () => void;
}

export const AssistantWidget: React.FC<AssistantWidgetProps> = ({
  isOpen,
  onToggle,
  currentPageUrl,
  isAuthenticated,
  isLoadingAuth,
  isAdmin = false,
  hideAdminButton = false,
  isStandaloneRoute = false,
  onOpenAdminPanel,
  onLogin,
  onLogout,
  chats,
  activeChat,
  messages,
  isStreaming,
  onSendMessage,
  onNewChat,
  onSelectChat,
  onRenameChat,
  onDeleteChat,
  onDeleteAllChats,
  onApplyResumeText,
  currentError,
  onDismissError,
}) => {
  const [inputText, setInputText] = useState<string>('');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Adjust textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  // Post message to parent if embedded
  useEffect(() => {
    if (window.parent !== window) {
      window.parent.postMessage(
        { type: 'GROWTH_ASSISTANT_RESIZE', isOpen },
        '*'
      );
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && inputText.trim() && isAuthenticated) {
        handleSend();
      }
    }
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isStreaming || !isAuthenticated) return;
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await onSendMessage(text);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const suggestedQuestions = [
    'من دانشجوی مهندسی برق هستم و در پایتون و پردازش سیگنال مهارت دارم.',
    'کدام پروژه‌های مرکز رشد نوفرآز برای من مناسب‌تر است؟',
    'آیا قبلاً مشابه این پروژه در مرکز رشد انجام شده؟',
    'این پروژه چقدر قابلیت تبدیل به شرکت دانش‌بنیان دارد؟',
  ];

  return (
    <>
      {/* Floating Toggle Launcher Button */}
      {!isOpen && (
        <button
          onClick={onToggle}
          type="button"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-2xl shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer border border-emerald-400/30 group"
          title="باز کردن مشاور هوشمند انتخاب پروژه"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0 group-hover:rotate-12 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-right">
            <div className="text-[10px] text-emerald-200 font-medium">دانشگاه یزد</div>
            <div className="text-xs font-extrabold text-white">مشاور هوشمند انتخاب پروژه</div>
          </div>
        </button>
      )}

      {/* Backdrop for Desktop/Mobile when open */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity"
        />
      )}

      {/* Main Slide-in Assistant Container */}
      {isOpen && (
        <div
          dir="rtl"
          className={`fixed z-50 flex flex-col bg-slate-950 border-slate-800 shadow-2xl transition-all font-sans text-slate-100 ${
            isStandaloneRoute
              ? 'inset-0 h-full w-full rounded-none border-none'
              : 'bottom-0 right-0 h-[40vh] w-full rounded-t-3xl border-t sm:h-screen sm:w-[440px] sm:rounded-none sm:border-l sm:border-t-0'
          }`}
        >
          {/* Header Bar */}
          <div className="px-4 py-3.5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shrink-0 shadow-sm">
                <Bot className="w-5 h-5 text-slate-950" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xs font-bold text-white truncate">
                    مشاور انتخاب پروژه نوفرآز
                  </h2>
                </div>
                <p className="text-[10px] text-emerald-400 truncate">
                  {activeChat?.title || 'گفتگوی فعال'}
                </p>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-1 shrink-0">
              {/* New Chat */}
              <button
                type="button"
                onClick={onNewChat}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="شروع گفتگوی جدید"
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* History Drawer Toggle */}
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer relative"
                title="مشاهده تمام گفتگوها"
              >
                <MessageSquare className="w-4 h-4" />
                {chats.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400" />
                )}
              </button>

              {/* Admin Knowledge Management button */}
              {isAdmin && !hideAdminButton && (
                <button
                  type="button"
                  onClick={onOpenAdminPanel}
                  className="p-1.5 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-500/20 transition-colors cursor-pointer"
                  title="مدیریت دانش سایت (ویژه مدیران)"
                >
                  <Database className="w-4 h-4" />
                </button>
              )}

              {/* Auth button */}
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  title="خروج از حساب"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              ) : null}

              {/* Close Button */}
              <button
                type="button"
                onClick={onToggle}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer mr-1"
                title="بستن دستیار"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Current Page Context Indicator Banner */}
          <div className="px-4 py-1.5 bg-slate-900/40 border-b border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 shrink-0">
            <span className="flex items-center gap-1 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              صفحه منبع: <span className="text-slate-300 font-mono truncate">{currentPageUrl}</span>
            </span>
          </div>

          {/* Candidate Profile Summary Tag (if user has provided skills) */}
          {activeChat?.candidateProfile?.technicalSkills && activeChat.candidateProfile.technicalSkills.length > 0 && (
            <div className="px-4 py-1.5 bg-emerald-950/30 border-b border-emerald-900/40 flex items-center justify-between text-[10px] text-emerald-300 shrink-0">
              <span className="truncate">
                شناخت داوطلب: {activeChat.candidateProfile.fieldOfStudy ? `${activeChat.candidateProfile.fieldOfStudy} • ` : ''}
                {activeChat.candidateProfile.technicalSkills.join(', ')}
              </span>
            </div>
          )}

          {/* Messages Scroll Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm text-slate-200 mb-1">
                  سلام! چطور می‌توانم در انتخاب پروژه به شما کمک کنم؟
                </h4>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-4">
                  رشته تحصیلی، مهارت‌ها یا سوابق خود را بنویسید تا مناسب‌ترین پروژه‌های فعال مرکز رشد نوفرآز را به شما معرفی کنم.
                </p>

                {/* Initial suggested questions */}
                <div className="w-full space-y-1.5 text-right">
                  <span className="text-[11px] font-semibold text-slate-400 block px-1">
                    پیشنهاد شروع:
                  </span>
                  {suggestedQuestions.slice(0, 3).map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setInputText(q)}
                      className="w-full text-right p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[11px] text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center justify-between group"
                    >
                      <span className="line-clamp-1">{q}</span>
                      <ArrowUpLeft className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 shrink-0 mr-1" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => {
                const isUser = message.role === 'user';
                return (
                  <div
                    key={message.id}
                    className={`flex gap-2.5 items-start ${
                      isUser ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    {/* Role Avatar */}
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs shadow-sm mt-0.5 ${
                        isUser
                          ? 'bg-slate-700 text-slate-200'
                          : 'bg-emerald-600 text-white font-bold'
                      }`}
                    >
                      {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>

                    {/* Bubble Content */}
                    <div
                      className={`flex flex-col max-w-[85%] ${
                        isUser ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap transition-all shadow-sm ${
                          isUser
                            ? 'bg-emerald-600 text-white rounded-tr-sm'
                            : message.isError
                            ? 'bg-rose-950/60 text-rose-200 border border-rose-800/60 rounded-tl-sm'
                            : 'bg-slate-850 text-slate-100 border border-slate-700/60 rounded-tl-sm'
                        }`}
                      >
                        {message.content}
                        {message.isStreaming && (
                          <span className="inline-block w-1.5 h-3.5 mr-1 bg-emerald-400 animate-pulse align-middle" />
                        )}
                      </div>

                      {/* Project Recommendation Cards inside Chat */}
                      {message.projectCards && message.projectCards.length > 0 && (
                        <div className="w-full mt-2 space-y-2">
                          {message.projectCards.map((card, cIdx) => (
                            <ProjectCard
                              key={cIdx}
                              card={card}
                              onAskMore={(pName) => {
                                onSendMessage(`لطفاً درباره پروژه «${pName}» و نحوه شروع آن توضیحات بیشتری بده.`);
                              }}
                              disabled={isStreaming}
                            />
                          ))}
                        </div>
                      )}

                      {/* Source Citations */}
                      {message.sources && message.sources.length > 0 && !isUser && (
                        <div className="flex flex-wrap gap-1 mt-1.5 px-1">
                          <span className="text-[10px] text-slate-500">منابع: </span>
                          {message.sources.map((s, sIdx) => (
                            <a
                              key={sIdx}
                              href={s.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-0.5 text-[10px] text-emerald-400 hover:text-emerald-300 hover:underline"
                            >
                              <span>{s.title}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Copy Action & Timestamp */}
                      <div className="flex items-center gap-2 mt-1 px-1 text-[10px] text-slate-500">
                        <span>
                          {new Date(message.timestamp).toLocaleTimeString('fa-IR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {!isUser && !message.isStreaming && message.content && (
                          <button
                            type="button"
                            onClick={() => handleCopy(message.id, message.content)}
                            className="hover:text-slate-200 flex items-center gap-0.5 cursor-pointer"
                          >
                            {copiedId === message.id ? (
                              <span className="text-emerald-400 flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5" /> کپی شد
                              </span>
                            ) : (
                              <span className="flex items-center gap-0.5">
                                <Copy className="w-2.5 h-2.5" /> کپی
                              </span>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Waiting for response indicator */}
            {isStreaming && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
              <div className="flex gap-2 items-start">
                <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-slate-850 border border-slate-700/60 rounded-2xl rounded-tl-sm px-3.5 py-2 flex items-center gap-2 text-xs text-emerald-400">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span className="text-slate-300 text-[11px]">در حال تحلیل و جستجو در سایت نوفرآز...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Error Alert Bar */}
          {currentError && (
            <div className="px-3 py-2 mx-3 mb-2 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{currentError}</span>
              </div>
              <button
                type="button"
                onClick={onDismissError}
                className="text-slate-400 hover:text-white px-1.5 cursor-pointer"
              >
                بستن
              </button>
            </div>
          )}

          {/* Input & Footer Controls */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 shrink-0">
            {!isAuthenticated && !isLoadingAuth ? (
              /* Auth Required Notice */
              <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 text-right">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs text-slate-300 font-medium">
                    برای مشاوره و انتخاب پروژه، با Google وارد شوید.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onLogin}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-950 bg-white hover:bg-slate-100 active:scale-95 px-3 py-1.5 rounded-lg shadow transition-all cursor-pointer font-sans shrink-0"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.33 24 12 24z" />
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                  </svg>
                  <span>ورود با Google</span>
                </button>
              </div>
            ) : (
              /* Chat Input Box */
              <div className="space-y-2">
                <div className="relative flex items-end gap-2 bg-slate-950 border border-slate-800 focus-within:border-emerald-500/60 rounded-xl p-2 transition-all">
                  {/* Resume Upload Action Button */}
                  <button
                    type="button"
                    onClick={() => setIsResumeModalOpen(true)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                    title="بارگذاری رزومه PDF یا متن سوابق"
                  >
                    <FileUp className="w-4 h-4" />
                  </button>

                  <textarea
                    ref={textareaRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isStreaming || !isAuthenticated}
                    placeholder="رشته، مهارت‌ها یا سوال خود درباره پروژه‌ها را بنویسید..."
                    rows={1}
                    maxLength={2000}
                    className="w-full bg-transparent text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none px-1 py-1 max-h-[120px] leading-relaxed disabled:opacity-50"
                  />

                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!inputText.trim() || isStreaming || !isAuthenticated}
                    className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white disabled:opacity-30 disabled:hover:bg-emerald-600 disabled:cursor-not-allowed transition-all shadow shrink-0 cursor-pointer"
                    title="ارسال پیام"
                  >
                    {isStreaming ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5 rotate-180" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
                  <span>Enter برای ارسال • بارگذاری رزومه با دکمه پیوست</span>
                  <span>{inputText.length}/۲۰۰۰</span>
                </div>
              </div>
            )}
          </div>

          {/* Multiple Chats Drawer */}
          <ChatSessionsDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            chats={chats}
            activeChatId={activeChat?.id || null}
            onSelectChat={onSelectChat}
            onNewChat={onNewChat}
            onRenameChat={onRenameChat}
            onDeleteChat={onDeleteChat}
            onDeleteAllChats={onDeleteAllChats}
          />

          {/* Resume Upload Modal */}
          <ResumeModal
            isOpen={isResumeModalOpen}
            onClose={() => setIsResumeModalOpen(false)}
            onApplyResumeText={(cvText) => {
              onApplyResumeText(cvText);
            }}
          />
        </div>
      )}
    </>
  );
};
