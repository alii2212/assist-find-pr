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
  AlertTriangle,
  HelpCircle,
  ArrowUpLeft,
  Database,
  Maximize2,
  Minimize2,
  RefreshCw,
  Wifi,
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
  onSendMessage: (text: string) => Promise<boolean | void>;
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

  // User Dynamic Resizing states (Width on desktop, Height on mobile)
  const [desktopWidth, setDesktopWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('yazd_assistant_desktop_width');
      if (saved) return Math.min(Math.max(Number(saved), 380), 960);
    }
    return 440;
  });

  const [mobileHeight, setMobileHeight] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('yazd_assistant_mobile_height');
      if (saved) return Math.min(Math.max(Number(saved), 50), 100);
    }
    return 85;
  });

  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [isResizingDesktop, setIsResizingDesktop] = useState<boolean>(false);
  const [isResizingMobile, setIsResizingMobile] = useState<boolean>(false);

  // Health / VPN Connectivity Check states (< 5s check)
  const [vpnStatus, setVpnStatus] = useState<'idle' | 'checking' | 'fast' | 'vpn_recommended'>('idle');
  const [vpnLatency, setVpnLatency] = useState<number | null>(null);
  const [vpnDismissed, setVpnDismissed] = useState<boolean>(false);

  const checkVpnHealth = async () => {
    setVpnStatus('checking');
    setVpnDismissed(false);
    const startTime = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch('/api/health', { signal: controller.signal });
      clearTimeout(timer);
      const latency = Date.now() - startTime;
      if (res.ok && latency <= 5000) {
        setVpnStatus('fast');
        setVpnLatency(latency);
      } else {
        setVpnStatus('vpn_recommended');
        setVpnLatency(latency);
      }
    } catch (_) {
      clearTimeout(timer);
      setVpnStatus('vpn_recommended');
      setVpnLatency(null);
    }
  };

  // Run VPN / Server health check immediately on initial page load (so result is ready before user clicks)
  useEffect(() => {
    checkVpnHealth();
  }, []);

  // Handle desktop resize (dragging right edge of the left-docked sidebar)
  useEffect(() => {
    if (!isResizingDesktop) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.min(Math.max(e.clientX, 380), Math.min(window.innerWidth - 30, 1050));
      setDesktopWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizingDesktop(false);
      localStorage.setItem('yazd_assistant_desktop_width', String(desktopWidth));
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingDesktop, desktopWidth]);

  // Handle mobile resize (dragging top grab bar of the bottom sheet)
  useEffect(() => {
    if (!isResizingMobile) return;

    const handleTouchMove = (e: TouchEvent) => {
      if (!e.touches[0]) return;
      const clientY = e.touches[0].clientY;
      const vh = Math.round(((window.innerHeight - clientY) / window.innerHeight) * 100);
      const clamped = Math.min(Math.max(vh, 45), 100);
      setMobileHeight(clamped);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const vh = Math.round(((window.innerHeight - e.clientY) / window.innerHeight) * 100);
      const clamped = Math.min(Math.max(vh, 45), 100);
      setMobileHeight(clamped);
    };

    const handleEnd = () => {
      setIsResizingMobile(false);
      localStorage.setItem('yazd_assistant_mobile_height', String(mobileHeight));
    };

    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleEnd);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
    };
  }, [isResizingMobile, mobileHeight]);

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
    if (!isMaximized) {
      setDesktopWidth(Math.min(window.innerWidth - 40, 840));
      setMobileHeight(100);
    } else {
      setDesktopWidth(440);
      setMobileHeight(85);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const isNearBottomRef = useRef(true);

  // Monitor user scroll position: if user scrolled up manually, don't jerk them down!
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceToBottom = scrollHeight - (scrollTop + clientHeight);
    const nearBottom = distanceToBottom < 80;
    isNearBottomRef.current = nearBottom;
    setShowScrollBottom(!nearBottom);
  };

  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
      isNearBottomRef.current = true;
      setShowScrollBottom(false);
    }
  };

  // Auto-scroll ONLY when user has NOT scrolled up or when a new user message is sent
  const prevMessagesCountRef = useRef(messages.length);
  useEffect(() => {
    const isNewMessage = messages.length > prevMessagesCountRef.current;
    prevMessagesCountRef.current = messages.length;

    // If user just sent a message, always scroll down
    if (isNewMessage) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === 'user') {
        scrollToBottom(true);
        return;
      }
    }

    // During streaming or AI typing: only follow along if user is already at the bottom
    if (isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
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
    if ((e.key === 'Enter' || e.code === 'Enter' || e.keyCode === 13) && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isStreaming) return;
    const sent = await onSendMessage(text);
    if (sent !== false) {
      setInputText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
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
      {/* Floating Toggle Launcher Button on Bottom-Left with Cloud Speech Bubble */}
      {!isOpen && (
        <div className="fixed bottom-5 left-5 z-50 flex items-center gap-2.5 dir-rtl group select-none">
          {/* Cloud Speech Bubble (ابری) */}
          <div
            onClick={onToggle}
            className="cursor-pointer bg-white text-slate-800 text-xs font-bold px-3.5 py-2.5 rounded-2xl shadow-xl shadow-purple-900/10 border border-purple-200/90 flex items-center gap-2 hover:bg-purple-50 transition-all hover:scale-105 active:scale-95 animate-pulse"
            title="کلیک کنید تا دستیار باز شود"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-700 shrink-0" />
            <span className="whitespace-nowrap">از هوش مصنوعی برای انتخاب پروژه کمک بگیرید</span>
            {vpnStatus === 'vpn_recommended' && (
              <span className="text-[10px] text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full font-bold shrink-0 animate-bounce">
                نیاز به VPN ⚠️
              </span>
            )}
          </div>

          {/* Small Circular Launcher Button (دایره هوشمند چندلایه و جذاب) */}
          <button
            onClick={onToggle}
            type="button"
            className="relative w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-300 shadow-xl shadow-purple-600/40 hover:shadow-2xl hover:shadow-purple-600/60 transition-all duration-300 hover:scale-108 active:scale-95 cursor-pointer shrink-0 group/btn"
            title="مشاور هوشمند انتخاب پروژه"
          >
            {/* Glowing outer animation */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 blur-sm opacity-60 group-hover/btn:opacity-100 transition-opacity animate-pulse" />
            
            {/* Inner circle body */}
            <div className="relative w-full h-full rounded-full bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 border border-white/40 flex items-center justify-center overflow-hidden">
              {/* Background shimmer */}
              <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-purple-400/30 blur-xs" />
              <div className="absolute -bottom-2 -left-2 w-7 h-7 rounded-full bg-pink-400/20 blur-xs" />
              
              {/* Main Bot & Sparkle icon combo */}
              <div className="relative flex items-center justify-center">
                <Bot className="w-6 h-6 text-white drop-shadow-md transition-transform duration-300 group-hover/btn:scale-110" />
                <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute -top-1 -right-1 animate-spin-slow drop-shadow-xs" />
              </div>

              {/* Online live indicator badge */}
              <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-2 ring-purple-950" />
            </div>
          </button>
        </div>
      )}

      {/* Backdrop for Desktop/Mobile when open */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[2px] transition-opacity"
        />
      )}

      {/* Main Slide-in Assistant Container: Left Sidebar on Desktop & Bottom Sheet (داون‌بار) on Mobile */}
      {isOpen && (
        <div
          dir="rtl"
          style={{
            width: isStandaloneRoute
              ? '100%'
              : typeof window !== 'undefined' && window.innerWidth >= 640
              ? isMaximized
                ? 'min(94vw, 1100px)'
                : `${desktopWidth}px`
              : '100%',
            height: isStandaloneRoute
              ? '100%'
              : typeof window !== 'undefined' && window.innerWidth < 640
              ? isMaximized
                ? '100vh'
                : `${mobileHeight}vh`
              : '100vh',
          }}
          className={`fixed z-50 flex flex-col bg-white border-purple-200 shadow-2xl transition-[width,height] duration-200 font-sans text-slate-800 ${
            isStandaloneRoute
              ? 'inset-0 h-full w-full rounded-none border-none'
              : 'bottom-0 left-0 right-0 rounded-t-3xl border-t sm:inset-y-0 sm:left-0 sm:right-auto sm:h-screen sm:rounded-none sm:border-r sm:border-t-0'
          }`}
        >
          {/* Mobile Drag Handle Bar on Top (کشیدن برای تغییر ارتفاع در گوشی) */}
          {!isStandaloneRoute && (
            <div
              onTouchStart={() => setIsResizingMobile(true)}
              onMouseDown={() => setIsResizingMobile(true)}
              className="sm:hidden flex items-center justify-center py-2 cursor-ns-resize bg-purple-950/40 hover:bg-purple-950/60 active:bg-purple-900 transition-colors select-none shrink-0"
              title="برای تغییر ارتفاع به بالا یا پایین بکشید"
            >
              <div className="w-12 h-1 rounded-full bg-white/60 shadow-xs" />
            </div>
          )}

          {/* Desktop Drag Handle on Right Border (کشیدن برای تغییر عرض در دسکتاپ) */}
          {!isStandaloneRoute && (
            <div
              onMouseDown={() => setIsResizingDesktop(true)}
              className="hidden sm:block absolute top-0 bottom-0 -right-2 w-4 cursor-ew-resize group z-50 select-none"
              title="برای تغییر عرض پنجره درگ کنید"
            >
              <div
                className={`w-1 h-full mx-auto transition-colors ${
                  isResizingDesktop ? 'bg-purple-600' : 'bg-transparent group-hover:bg-purple-400/80'
                }`}
              />
            </div>
          )}

          {/* Header Bar */}
          <div className="px-4 py-3 border-b border-purple-900/20 bg-gradient-to-r from-purple-800 via-violet-800 to-indigo-900 text-white flex items-center justify-between gap-2 shrink-0 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold shrink-0 shadow-xs">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xs font-bold text-white truncate">
                    مشاور انتخاب پروژه نوفرآز
                  </h2>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-purple-200 truncate">
                  <span className="truncate">{activeChat?.title || 'گفتگوی فعال'}</span>
                  {vpnStatus === 'checking' && (
                    <span className="text-amber-200 text-[9px] shrink-0 font-sans">
                      (بررسی اتصال...)
                    </span>
                  )}
                  {vpnStatus === 'fast' && vpnLatency !== null && (
                    <span className="text-emerald-300 text-[9px] shrink-0 font-mono">
                      • {vpnLatency}ms ✅
                    </span>
                  )}
                  {vpnStatus === 'vpn_recommended' && (
                    <span className="text-amber-300 text-[9px] shrink-0 font-bold">
                      • نیاز به VPN ⚠️
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Maximize / Resize Toggle Button */}
              {!isStandaloneRoute && (
                <button
                  type="button"
                  onClick={toggleMaximize}
                  className="p-1.5 rounded-lg text-purple-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title={isMaximized ? 'کاهش اندازه به حالت استاندارد' : 'بزرگ‌نمایی پنجره دستیار'}
                >
                  {isMaximized ? (
                    <Minimize2 className="w-4 h-4 text-purple-100" />
                  ) : (
                    <Maximize2 className="w-4 h-4 text-purple-100" />
                  )}
                </button>
              )}

              {/* New Chat */}
              <button
                type="button"
                onClick={onNewChat}
                className="p-1.5 rounded-lg text-purple-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="شروع گفتگوی جدید"
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* History Drawer Toggle */}
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="p-1.5 rounded-lg text-purple-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer relative"
                title="مشاهده تمام گفتگوها"
              >
                <MessageSquare className="w-4 h-4" />
                {chats.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-purple-300" />
                )}
              </button>

              {/* Admin Knowledge Management button */}
              {isAdmin && !hideAdminButton && (
                <button
                  type="button"
                  onClick={onOpenAdminPanel}
                  className="p-1.5 rounded-lg text-purple-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
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
                  className="p-1.5 rounded-lg text-purple-200 hover:text-rose-300 hover:bg-white/10 transition-colors cursor-pointer"
                  title="خروج از حساب"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              ) : null}

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
                    try {
                      window.parent.postMessage({ type: 'GROWTH_ASSISTANT_CLOSE' }, '*');
                    } catch (_) {}
                  }
                  onToggle();
                }}
                className="p-1.5 rounded-lg text-purple-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer mr-1"
                title="بستن دستیار"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* VPN Status Banner (اگر در زیر ۵ ثانیه پاسخ دریافت نشود) */}
          {vpnStatus === 'vpn_recommended' && !vpnDismissed && (
            <div className="px-3.5 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 shrink-0 shadow-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-[11px] leading-relaxed">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-950">
                    وضعیت اتصال به سرور هوش مصنوعی:
                  </span>
                  <button
                    onClick={() => setVpnDismissed(true)}
                    className="text-amber-700 hover:text-amber-950 text-xs cursor-pointer px-1 font-bold"
                    title="بستن اعلان"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-amber-800 mt-0.5">
                  پاسخ سرور در کمتر از ۵ ثانیه دریافت نشد. برای برقراری ارتباط سریع و بدون وقفه، لطفاً <strong>از وی‌پی‌ان (VPN) استفاده نمایید</strong>.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={checkVpnHealth}
                    className="px-2.5 py-1 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold text-[10px] flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>تست مجدد اتصال</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVpnDismissed(true)}
                    className="px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 text-[10px] cursor-pointer"
                  >
                    متوجه شدم
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Current Page Context Indicator Banner */}
          <div className="px-4 py-1.5 bg-purple-50/80 border-b border-purple-100 flex items-center justify-between text-[10px] text-slate-600 shrink-0">
            <span className="flex items-center gap-1 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0" />
              صفحه منبع: <span className="text-purple-900 font-mono font-medium truncate">{currentPageUrl}</span>
            </span>
          </div>

          {/* Candidate Profile Summary Tag (if user has provided skills) */}
          {activeChat?.candidateProfile?.technicalSkills && activeChat.candidateProfile.technicalSkills.length > 0 && (
            <div className="px-4 py-1.5 bg-purple-100/70 border-b border-purple-200 flex items-center justify-between text-[10px] text-purple-900 font-medium shrink-0">
              <span className="truncate">
                شناخت داوطلب: {activeChat.candidateProfile.fieldOfStudy ? `${activeChat.candidateProfile.fieldOfStudy} • ` : ''}
                {activeChat.candidateProfile.technicalSkills.join(', ')}
              </span>
            </div>
          )}

          {/* Messages Scroll Body */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#faf9fe] relative"
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3 shadow-xs">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm text-slate-900 mb-1">
                  سلام! چطور می‌توانم در انتخاب پروژه به شما کمک کنم؟
                </h4>
                <p className="text-xs text-slate-600 max-w-xs leading-relaxed mb-4">
                  رشته تحصیلی، مهارت‌ها یا سوابق خود را بنویسید تا مناسب‌ترین پروژه‌های فعال مرکز رشد نوفرآز را به شما معرفی کنم.
                </p>

                {/* Initial suggested questions */}
                <div className="w-full space-y-1.5 text-right">
                  <span className="text-[11px] font-semibold text-purple-900 block px-1">
                    پیشنهاد شروع:
                  </span>
                  {suggestedQuestions.slice(0, 3).map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setInputText(q)}
                      className="w-full text-right p-2.5 rounded-xl bg-white hover:bg-purple-50/80 border border-purple-100 text-[11px] text-slate-700 hover:text-purple-950 hover:border-purple-200 transition-colors cursor-pointer flex items-center justify-between group shadow-xs"
                    >
                      <span className="line-clamp-1">{q}</span>
                      <ArrowUpLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-700 shrink-0 mr-1" />
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
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs shadow-xs mt-0.5 ${
                        isUser
                          ? 'bg-purple-700 text-white'
                          : 'bg-slate-800 text-white font-bold'
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
                        className={`rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap transition-all shadow-xs ${
                          isUser
                            ? 'bg-gradient-to-r from-purple-700 to-violet-700 text-white rounded-tr-xs shadow-sm'
                            : message.isError
                            ? 'bg-rose-50 text-rose-800 border border-rose-200 rounded-tl-xs'
                            : 'bg-white text-slate-800 border border-purple-150 rounded-tl-xs shadow-xs'
                        }`}
                      >
                        {message.content}
                        {message.isStreaming && (
                          <span className="inline-block w-1.5 h-3.5 mr-1 bg-purple-600 animate-pulse align-middle" />
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
                              className="inline-flex items-center gap-0.5 text-[10px] text-purple-700 hover:text-purple-900 hover:underline font-medium"
                            >
                              <span>{s.title}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Copy Action & Timestamp */}
                      <div className="flex items-center gap-2 mt-1 px-1 text-[10px] text-slate-400">
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
                            className="hover:text-purple-700 flex items-center gap-0.5 cursor-pointer transition-colors"
                          >
                            {copiedId === message.id ? (
                              <span className="text-purple-700 flex items-center gap-0.5 font-medium">
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
                <div className="w-7 h-7 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white border border-purple-150 rounded-2xl rounded-tl-xs px-3.5 py-2 flex items-center gap-2 text-xs text-purple-700 shadow-xs">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span className="text-slate-600 text-[11px]">در حال تحلیل و جستجو در سایت نوفرآز...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
            {showScrollBottom && (
              <button
                type="button"
                onClick={() => scrollToBottom(true)}
                className="sticky bottom-2 left-1/2 -translate-x-1/2 mx-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-900/90 text-white text-[11px] font-bold shadow-lg backdrop-blur-xs hover:bg-purple-800 transition-all cursor-pointer z-20"
              >
                <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
                <span>مشاهده پیام‌های جدید</span>
              </button>
            )}
          </div>

          {/* Error Alert Bar */}
          {currentError && (
            <div className="px-3 py-2 mx-3 mb-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{currentError}</span>
              </div>
              <button
                type="button"
                onClick={onDismissError}
                className="text-slate-500 hover:text-slate-800 px-1.5 cursor-pointer font-medium"
              >
                بستن
              </button>
            </div>
          )}

          {/* Input & Footer Controls */}
          <div className="p-3 bg-white border-t border-purple-100 shrink-0">
            {!isAuthenticated ? (
              <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 mb-2 bg-purple-50/70 border border-purple-100 rounded-lg text-[11px] text-slate-600">
                <span className="truncate">گفتگو به عنوان کاربر آزاد. برای ذخیره ابری:</span>
                <button
                  type="button"
                  onClick={onLogin}
                  className="font-medium text-purple-700 hover:text-purple-900 hover:underline shrink-0 cursor-pointer"
                >
                  ورود با Google
                </button>
              </div>
            ) : null}

            {/* Chat Input Box */}
            <div className="space-y-2">
              <div className="relative flex items-end gap-2 bg-slate-50/80 border border-purple-200 focus-within:border-purple-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-purple-100 rounded-xl p-2 transition-all">
                {/* Resume Upload Action Button */}
                <button
                  type="button"
                  onClick={() => setIsResumeModalOpen(true)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-purple-700 hover:bg-purple-50 transition-colors shrink-0 cursor-pointer"
                  title="بارگذاری رزومه PDF یا متن سوابق"
                >
                  <FileUp className="w-4 h-4" />
                </button>

                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isStreaming}
                  placeholder="رشته، مهارت‌ها یا سوال خود درباره پروژه‌ها را بنویسید..."
                  rows={1}
                  maxLength={2000}
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none resize-none px-1 py-1 max-h-[120px] leading-relaxed disabled:opacity-50"
                />

                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!inputText.trim() || isStreaming}
                  className="p-2 rounded-lg bg-purple-700 hover:bg-purple-800 active:scale-95 text-white disabled:opacity-30 disabled:hover:bg-purple-700 disabled:cursor-not-allowed transition-all shadow-sm shadow-purple-700/20 shrink-0 cursor-pointer"
                  title="ارسال پیام"
                >
                  {isStreaming ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5 rotate-180" />
                  )}
                </button>
              </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                  <span>Enter برای ارسال • بارگذاری رزومه با دکمه پیوست</span>
                  <span>{inputText.length}/۲۰۰۰</span>
                </div>
              </div>
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
