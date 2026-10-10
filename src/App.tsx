import React, { useState, useEffect, useCallback } from 'react';
import { GrowthCenterBackdrop } from './components/GrowthCenterBackdrop.tsx';
import { AssistantWidget } from './components/AssistantWidget.tsx';
import { AdminKnowledgePanel } from './components/AdminKnowledgePanel.tsx';
import { AdminDashboardPage } from './components/AdminDashboardPage.tsx';
import { LoginPromptModal } from './components/LoginPromptModal.tsx';
import { ChatMessage, ChatSession } from './types/chat.ts';
import { CandidateProfile } from './types/project.ts';
import {
  onAuthChange,
  loginWithGoogle,
  logoutUser,
  getCurrentIdToken,
  ensureSession,
} from './firebase/config.ts';
import {
  listUserChats,
  createChat,
  renameChat,
  deleteChat,
  deleteAllChats,
  loadChatMessages,
  saveChatMessage,
  updateChatMetadata,
} from './firebase/firestoreService.ts';

export default function App() {
  // Routing state for /admin and /widget
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname;
    }
    return '/';
  });

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // Widget Open State (stored in localStorage for UX convenience)
  const [isWidgetOpen, setIsWidgetOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/widget') {
      return true;
    }
    return localStorage.getItem('growth_assistant_open') === 'true';
  });

  // Current Page URL context (default: window.location.href or simulated page)
  const [currentPageUrl, setCurrentPageUrl] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const parent = params.get('parentUrl');
    return parent || 'https://yazdinnofaraz.ir/';
  });

  // Authentication & Admin status
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState<boolean>(false);

  // Chat Sessions & Messages State (Authoritative source: Firestore)
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [currentError, setCurrentError] = useState<string | null>(null);

  // Guest restriction & Preserved pending question state
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('growth_pending_guest_question');
    }
    return null;
  });
  const [showLoginPromptModal, setShowLoginPromptModal] = useState<boolean>(false);

  const activeChat = chats.find((c) => c.id === activeChatId) || null;

  // Persist widget open preference
  useEffect(() => {
    localStorage.setItem('growth_assistant_open', String(isWidgetOpen));
  }, [isWidgetOpen]);

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setIsLoadingAuth(false);
      if (user) {
        setUserId(user.uid);
        setUserEmail(user.email || null);
        const isRealUser = Boolean(user.email && !user.isGuest);
        setIsAuthenticated(isRealUser);

        // Check Admin privilege via server
        try {
          const token = await user.getIdToken();
          const adminCheckRes = await fetch('/api/admin/check', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const adminData = await adminCheckRes.json();
          setIsAdmin(Boolean(adminData.isAdmin));
        } catch (e) {
          console.warn('Admin check error:', e);
        }

        // Load user's persistent chats from Firestore / Local
        await reloadUserChats(user.uid);

        // If user just logged in with Google and had a saved pending question, send it automatically!
        if (isRealUser && typeof window !== 'undefined') {
          const savedPending = localStorage.getItem('growth_pending_guest_question');
          if (savedPending) {
            localStorage.removeItem('growth_pending_guest_question');
            setPendingQuestion(null);
            setShowLoginPromptModal(false);
            setTimeout(() => {
              handleSendMessage(savedPending);
            }, 600);
          }
        }
      } else {
        setUserId(null);
        setUserEmail(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
        setChats([]);
        setActiveChatId(null);
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Reload user chats from Firestore
  const reloadUserChats = async (uid: string) => {
    try {
      const userChats = await listUserChats(uid);
      setChats(userChats);

      if (userChats.length > 0) {
        // Select the most recent chat
        const recent = userChats[0];
        setActiveChatId(recent.id);
        const chatMsgs = await loadChatMessages(uid, recent.id);
        setMessages(chatMsgs);
      } else {
        // Automatically create first chat
        const newChat = await createChat(uid, {
          title: 'پروژه‌های مناسب برای من',
          conversationPageUrl: currentPageUrl,
        });
        setChats([newChat]);
        setActiveChatId(newChat.id);
        setMessages([]);
      }
    } catch (err: any) {
      console.warn('Notice in reloadUserChats:', err?.message || err);
      if (chats.length === 0) {
        const fallbackChat: ChatSession = {
          id: 'chat_session_' + Date.now(),
          title: 'پروژه‌های مناسب برای من',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          conversationPageUrl: currentPageUrl,
        };
        setChats([fallbackChat]);
        setActiveChatId(fallbackChat.id);
      }
    }
  };

  // Google Login action
  const handleLogin = async () => {
    try {
      setCurrentError(null);
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.message === 'POPUP_BLOCKED') {
        setCurrentError('پنجره بازشونده ورود مسدود شد. لطفاً پاپ‌آپ مرورگر را فعال کنید.');
      } else if (err.code !== 'auth/popup-closed-by-user') {
        setCurrentError('ورود با حساب گوگل با خطا مواجه شد.');
      }
    }
  };

  // Logout action
  const handleLogout = async () => {
    try {
      await logoutUser();
      const guestSession = await ensureSession();
      if (guestSession) {
        setUserId(guestSession.uid);
        setUserEmail(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
        await reloadUserChats(guestSession.uid);
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Create New Chat
  const handleNewChat = async () => {
    if (!userId) return;
    try {
      const newChat = await createChat(userId, {
        title: `گفتگوی جدید (${chats.length + 1})`,
        conversationPageUrl: currentPageUrl,
      });
      setChats((prev) => [newChat, ...prev]);
      setActiveChatId(newChat.id);
      setMessages([]);
      setCurrentError(null);
    } catch (err) {
      console.error('Failed to create new chat:', err);
    }
  };

  // Switch Chat
  const handleSelectChat = async (chatId: string) => {
    if (!userId || chatId === activeChatId) return;
    try {
      setActiveChatId(chatId);
      const msgs = await loadChatMessages(userId, chatId);
      setMessages(msgs);
      setCurrentError(null);
    } catch (err) {
      console.error('Failed to load chat messages:', err);
    }
  };

  // Rename Chat
  const handleRenameChat = async (chatId: string, newTitle: string) => {
    if (!userId) return;
    try {
      await renameChat(userId, chatId, newTitle);
      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, title: newTitle } : c))
      );
    } catch (err) {
      console.error('Rename failed:', err);
    }
  };

  // Delete Single Chat
  const handleDeleteChat = async (chatId: string) => {
    if (!userId) return;
    try {
      await deleteChat(userId, chatId);
      const remaining = chats.filter((c) => c.id !== chatId);
      setChats(remaining);

      if (activeChatId === chatId) {
        if (remaining.length > 0) {
          await handleSelectChat(remaining[0].id);
        } else {
          await handleNewChat();
        }
      }
    } catch (err) {
      console.error('Delete chat error:', err);
    }
  };

  // Delete All Chats
  const handleDeleteAllChats = async () => {
    if (!userId) return;
    try {
      await deleteAllChats(userId);
      setChats([]);
      setActiveChatId(null);
      setMessages([]);
      await handleNewChat();
    } catch (err) {
      console.error('Delete all chats error:', err);
    }
  };

  // Send message and stream Gemini response
  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;

      setCurrentError(null);

      let currentUid = userId;
      let currentChatId = activeChatId;

      if (!currentUid) {
        const session = await ensureSession();
        if (session) {
          currentUid = session.uid;
          setUserId(session.uid);
          setUserEmail(session.email || null);
          setIsAuthenticated(!session.isGuest);
        }
      }

      if (!currentUid) {
        currentUid = 'guest_' + Date.now();
        setUserId(currentUid);
      }

      if (!currentChatId) {
        const newChat = await createChat(currentUid, {
          title: 'پروژه‌های مناسب برای من',
          conversationPageUrl: currentPageUrl,
        });
        setChats([newChat]);
        setActiveChatId(newChat.id);
        currentChatId = newChat.id;
      }

      // Check Guest Question Limit: Question 1 is free for guests.
      // Question 2 onwards requires Google login.
      const isGoogleLoggedIn = Boolean(userEmail && isAuthenticated && !currentUid.startsWith('guest_'));
      const previousUserQuestions = messages.filter((m) => m.role === 'user').length;

      if (!isGoogleLoggedIn && previousUserQuestions >= 1) {
        setPendingQuestion(text.trim());
        if (typeof window !== 'undefined') {
          localStorage.setItem('growth_pending_guest_question', text.trim());
        }
        setShowLoginPromptModal(true);
        return false;
      }

      const token = await getCurrentIdToken();
      if (!token) {
        setCurrentError('در حال برقراری اتصال... لطفاً دوباره امتحان فرمایید.');
        return false;
      }

      const userMsgId = 'msg_u_' + Date.now();
      const asstMsgId = 'msg_a_' + Date.now();

      const userMsg: ChatMessage = {
        id: userMsgId,
        role: 'user',
        content: text.trim(),
        timestamp: Date.now(),
      };

      const assistantMsg: ChatMessage = {
        id: asstMsgId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isStreaming: true,
      };

      // Optimistic update
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);

      // Save user message to Firestore / Local
      await saveChatMessage(currentUid, currentChatId, userMsg);

      // Auto-generate title if this is the first message
      if (messages.length === 0 && activeChat?.title.startsWith('گفتگوی جدید')) {
        const shortTitle = text.trim().substring(0, 30);
        handleRenameChat(currentChatId, shortTitle);
      }

      try {
        const historyPayload = messages.slice(-10).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            chatId: currentChatId,
            question: text.trim(),
            currentPageUrl: activeChat?.conversationPageUrl || currentPageUrl,
            chatHistory: historyPayload,
            candidateProfile: activeChat?.candidateProfile,
          }),
        });

        if (!response.ok) {
          let errText = 'خطا در برقراری ارتباط با سرور مشاور.';
          try {
            const errJson = await response.json();
            if (errJson.message) errText = errJson.message;
          } catch (_) {
            if (response.status === 401) errText = 'نشست شما منقضی شده است. مجدداً وارد شوید.';
            if (response.status === 429) errText = 'تعداد درخواست‌ها بیش از حد مجاز است. کمی صبر کنید.';
          }

          const errorMsgObj: ChatMessage = {
            id: asstMsgId,
            role: 'assistant',
            content: errText,
            timestamp: Date.now(),
            isStreaming: false,
            isError: true,
          };

          setMessages((prev) =>
            prev.map((m) => (m.id === asstMsgId ? errorMsgObj : m))
          );
          await saveChatMessage(currentUid, currentChatId, errorMsgObj);
          setIsStreaming(false);
          return;
        }

        // Process SSE Stream
        const reader = response.body?.getReader();
        if (!reader) throw new Error('ReadableStream not supported.');

        const decoder = new TextDecoder('utf-8');
        let accumulatedText = '';
        let receivedProjectCards: any[] = [];
        let receivedSources: any[] = [];
        let receivedProfile: CandidateProfile | null = null;
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const dataStr = trimmed.substring(5).trim();
            if (dataStr === '[DONE]') break;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                accumulatedText += parsed.text;
                const currentTxt = accumulatedText;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === asstMsgId ? { ...m, content: currentTxt } : m
                  )
                );
              }
              if (parsed.projectCards && Array.isArray(parsed.projectCards)) {
                receivedProjectCards = parsed.projectCards;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === asstMsgId ? { ...m, projectCards: receivedProjectCards } : m
                  )
                );
              }
              if (parsed.sources && Array.isArray(parsed.sources)) {
                receivedSources = parsed.sources;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === asstMsgId ? { ...m, sources: receivedSources } : m
                  )
                );
              }
              if (parsed.candidateProfile) {
                receivedProfile = parsed.candidateProfile;
              }
              if (parsed.error) {
                accumulatedText += `\n[${parsed.error}]`;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === asstMsgId
                      ? { ...m, content: accumulatedText, isError: true }
                      : m
                  )
                );
              }
            } catch (jsonErr) {
              console.warn('SSE chunk parse error:', dataStr, jsonErr);
            }
          }
        }

        // Finalize assistant message
        const finalAsstMsg: ChatMessage = {
          id: asstMsgId,
          role: 'assistant',
          content: accumulatedText || 'در حال حاضر اطلاعات مشخصی در این رابطه یافت نشد.',
          timestamp: Date.now(),
          isStreaming: false,
          sources: receivedSources,
          projectCards: receivedProjectCards,
        };

        setMessages((prev) =>
          prev.map((m) => (m.id === asstMsgId ? finalAsstMsg : m))
        );

        // Save completed assistant message to Firestore / Local
        await saveChatMessage(currentUid, currentChatId, finalAsstMsg);

        // Update candidateProfile in Firestore if updated
        if (receivedProfile) {
          await updateChatMetadata(currentUid, currentChatId, {
            candidateProfile: receivedProfile,
          });
          setChats((prev) =>
            prev.map((c) =>
              c.id === currentChatId ? { ...c, candidateProfile: receivedProfile! } : c
            )
          );
        }
        return true;
      } catch (streamErr: any) {
        console.error('Streaming request error:', streamErr);
        const errFinal: ChatMessage = {
          id: asstMsgId,
          role: 'assistant',
          content: 'خطای ارتباط با سرور. لطفاً مجدداً امتحان کنید.',
          timestamp: Date.now(),
          isStreaming: false,
          isError: true,
        };
        setMessages((prev) =>
          prev.map((m) => (m.id === asstMsgId ? errFinal : m))
        );
        await saveChatMessage(currentUid, currentChatId, errFinal);
        return false;
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, userId, activeChatId, messages, activeChat, currentPageUrl]
  );

  // Resume Upload Handler
  const handleApplyResumeText = (cvText: string) => {
    handleSendMessage(`من رزومه و سوابق خود را به شرح زیر ارسال می‌کنم:\n\n${cvText}\n\nلطفاً بر اساس این اطلاعات، مناسب‌ترین پروژه‌های فعال مرکز رشد نوفرآز را به من پیشنهاد بده.`);
  };

  const isWidgetRoute = currentPath.toLowerCase().replace(/\/+$/, '') === '/widget' || currentPath.toLowerCase().startsWith('/widget/');
  const isAdminRoute = currentPath.toLowerCase().replace(/\/+$/, '') === '/admin' || currentPath.toLowerCase().startsWith('/admin/');

  // 1. Standalone Admin Dashboard Route (/admin)
  if (isAdminRoute) {
    return <AdminDashboardPage onBackToApp={() => navigateTo('/')} />;
  }

  // 2. Standalone Embeddable Widget Route (/widget)
  if (isWidgetRoute) {
    return (
      <div dir="rtl" className="w-full h-full min-h-screen bg-[#f8f7fc] font-sans text-slate-800 flex flex-col justify-end sm:justify-start">
        <AssistantWidget
          isOpen={true}
          onToggle={() => {}}
          currentPageUrl={currentPageUrl}
          isAuthenticated={isAuthenticated}
          isLoadingAuth={isLoadingAuth}
          isAdmin={false}
          hideAdminButton={true}
          isStandaloneRoute={true}
          onLogin={handleLogin}
          onLogout={handleLogout}
          chats={chats}
          activeChat={activeChat}
          messages={messages}
          isStreaming={isStreaming}
          onSendMessage={handleSendMessage}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          onRenameChat={handleRenameChat}
          onDeleteChat={handleDeleteChat}
          onDeleteAllChats={handleDeleteAllChats}
          onApplyResumeText={handleApplyResumeText}
          currentError={currentError}
          onDismissError={() => setCurrentError(null)}
        />

        {/* Guest Question Limit Modal */}
        <LoginPromptModal
          isOpen={showLoginPromptModal}
          onClose={() => setShowLoginPromptModal(false)}
          pendingQuestion={pendingQuestion}
          onLogin={async () => {
            await handleLogin();
          }}
        />
      </div>
    );
  }

  // 3. Default Website Preview Experience (/)
  return (
    <div dir="rtl" className="relative min-h-screen bg-[#f8f7fc] font-sans overflow-x-hidden text-slate-800">
      {/* Simulated Live Backdrop for https://yazdinnofaraz.ir/ */}
      <GrowthCenterBackdrop
        currentUrl={currentPageUrl}
        onNavigate={(newUrl) => {
          setCurrentPageUrl(newUrl);
        }}
        onOpenAssistant={() => setIsWidgetOpen(true)}
        isAdmin={isAdmin}
        onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
        onNavigateToAdmin={() => navigateTo('/admin')}
        onNavigateToWidget={() => navigateTo('/widget')}
      />

      {/* Slide-in Assistant Widget */}
      <AssistantWidget
        isOpen={isWidgetOpen}
        onToggle={() => setIsWidgetOpen(!isWidgetOpen)}
        currentPageUrl={currentPageUrl}
        isAuthenticated={isAuthenticated}
        isLoadingAuth={isLoadingAuth}
        isAdmin={isAdmin}
        onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
        onLogin={handleLogin}
        onLogout={handleLogout}
        chats={chats}
        activeChat={activeChat}
        messages={messages}
        isStreaming={isStreaming}
        onSendMessage={handleSendMessage}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onRenameChat={handleRenameChat}
        onDeleteChat={handleDeleteChat}
        onDeleteAllChats={handleDeleteAllChats}
        onApplyResumeText={handleApplyResumeText}
        currentError={currentError}
        onDismissError={() => setCurrentError(null)}
      />

      {/* Guest Question Limit Modal */}
      <LoginPromptModal
        isOpen={showLoginPromptModal}
        onClose={() => setShowLoginPromptModal(false)}
        pendingQuestion={pendingQuestion}
        onLogin={async () => {
          await handleLogin();
        }}
      />

      {/* Admin Knowledge Management Panel (Modal shortcut) */}
      <AdminKnowledgePanel
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        userEmail={userEmail}
      />
    </div>
  );
}
