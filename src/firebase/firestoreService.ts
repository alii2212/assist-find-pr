import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from './config.ts';
import { ChatSession, ChatMessage } from '../types/chat.ts';

// Circuit breaker: If remote Firestore fails due to Spark plan limitations or 403,
// disable remote network calls for the rest of the session so console is never spammed.
let isFirestoreDisabled = false;

export function disableFirestoreSync() {
  isFirestoreDisabled = true;
}

/**
 * Checks if the user is a genuine Firebase Auth user who is allowed by security rules
 * (i.e. not a guest, and auth.currentUser.uid matches userId).
 * This completely prevents 403 Permission Denied and CORS WebChannel errors.
 */
function canSyncWithFirestore(userId?: string): boolean {
  if (isFirestoreDisabled) return false;
  if (!userId) return false;
  if (userId.startsWith('guest_')) return false;
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return false;
  }
  return true;
}

function getLocalChats(userId: string): ChatSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`growth_chats_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalChats(userId: string, chats: ChatSession[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`growth_chats_${userId}`, JSON.stringify(chats));
  } catch {}
}

function getLocalMessages(userId: string, chatId: string): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`growth_msgs_${userId}_${chatId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalMessages(userId: string, chatId: string, msgs: ChatMessage[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`growth_msgs_${userId}_${chatId}`, JSON.stringify(msgs));
  } catch {}
}

async function fetchFirestoreChats(userId: string): Promise<ChatSession[]> {
  const timeoutPromise = new Promise<ChatSession[]>((resolve) =>
    setTimeout(() => resolve(getLocalChats(userId)), 2500)
  );

  const fetchPromise = (async () => {
    try {
      const chatsCol = collection(db, 'users', userId, 'chats');
      const q = query(chatsCol, orderBy('updatedAt', 'desc'));
      const snapshot = await getDocs(q);

      const items = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          title: data.title || 'گفتگوی جدید',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          previousInteractionId: data.previousInteractionId,
          conversationPageUrl: data.conversationPageUrl,
          candidateProfile: data.candidateProfile,
          lastMessagePreview: data.lastMessagePreview,
        };
      });

      if (items.length > 0) {
        saveLocalChats(userId, items);
      }
      return items.length > 0 ? items : getLocalChats(userId);
    } catch (err: any) {
      if (/permission-denied|403|not-found|unavailable/i.test(String(err?.message || err))) {
        disableFirestoreSync();
      }
      return getLocalChats(userId);
    }
  })();

  return Promise.race([fetchPromise, timeoutPromise]);
}

/**
 * Lists all chats for a user, ordered by latest update
 */
export async function listUserChats(userId: string): Promise<ChatSession[]> {
  if (!userId) return [];
  const local = getLocalChats(userId);
  if (local.length > 0) {
    if (canSyncWithFirestore(userId)) {
      fetchFirestoreChats(userId).catch(() => {});
    }
    return local;
  }
  if (!canSyncWithFirestore(userId)) {
    return [];
  }
  return fetchFirestoreChats(userId);
}

/**
 * Creates a new chat session in Firestore and local storage
 */
export async function createChat(
  userId: string,
  initial: Partial<ChatSession> = {}
): Promise<ChatSession> {
  const newId = 'chat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const now = new Date().toISOString();

  const newChat: ChatSession = {
    id: newId,
    title: initial.title || 'گفتگوی جدید',
    createdAt: now,
    updatedAt: now,
    conversationPageUrl: initial.conversationPageUrl || (typeof window !== 'undefined' ? window.location.href : ''),
    candidateProfile: initial.candidateProfile || {
      technicalSkills: [],
      previousProjects: [],
      interests: [],
    },
    lastMessagePreview: '',
  };

  // 1. Immediately save locally
  const currentLocal = getLocalChats(userId);
  saveLocalChats(userId, [newChat, ...currentLocal]);

  // 2. Persist to Firestore in background ONLY if user is genuinely authenticated
  if (canSyncWithFirestore(userId)) {
    try {
      const chatsCol = collection(db, 'users', userId, 'chats');
      const newChatDoc = doc(chatsCol, newId);
      setDoc(newChatDoc, {
        ...newChat,
        serverTimestamp: serverTimestamp(),
      }).catch((err) => {
        if (/permission-denied|403/i.test(String(err?.message || err))) {
          disableFirestoreSync();
        }
      });
    } catch {}
  }

  return newChat;
}

/**
 * Renames an existing chat session
 */
export async function renameChat(
  userId: string,
  chatId: string,
  newTitle: string
): Promise<void> {
  const local = getLocalChats(userId);
  const idx = local.findIndex((c) => c.id === chatId);
  if (idx >= 0) {
    local[idx].title = newTitle.trim() || 'گفتگوی بدون عنوان';
    local[idx].updatedAt = new Date().toISOString();
    saveLocalChats(userId, local);
  }

  if (canSyncWithFirestore(userId)) {
    try {
      const chatDoc = doc(db, 'users', userId, 'chats', chatId);
      setDoc(
        chatDoc,
        {
          title: newTitle.trim() || 'گفتگوی بدون عنوان',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      ).catch(() => {});
    } catch {}
  }
}

/**
 * Updates chat metadata (previousInteractionId, candidateProfile, lastMessagePreview, etc.)
 */
export async function updateChatMetadata(
  userId: string,
  chatId: string,
  meta: Partial<ChatSession>
): Promise<void> {
  const local = getLocalChats(userId);
  const idx = local.findIndex((c) => c.id === chatId);
  if (idx >= 0) {
    local[idx] = { ...local[idx], ...meta, updatedAt: new Date().toISOString() };
    saveLocalChats(userId, local);
  }

  if (canSyncWithFirestore(userId)) {
    try {
      const chatDoc = doc(db, 'users', userId, 'chats', chatId);
      setDoc(
        chatDoc,
        {
          ...meta,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      ).catch(() => {});
    } catch {}
  }
}

/**
 * Deletes a single chat and its messages
 */
export async function deleteChat(userId: string, chatId: string): Promise<void> {
  const local = getLocalChats(userId);
  const filtered = local.filter((c) => c.id !== chatId);
  saveLocalChats(userId, filtered);

  if (typeof window !== 'undefined') {
    localStorage.removeItem(`growth_msgs_${userId}_${chatId}`);
  }

  if (canSyncWithFirestore(userId)) {
    try {
      const messagesCol = collection(db, 'users', userId, 'chats', chatId, 'messages');
      getDocs(messagesCol).then((msgSnapshot) => {
        const batch = writeBatch(db);
        msgSnapshot.docs.forEach((d) => batch.delete(d.ref));
        batch.commit().catch(() => {});
      }).catch(() => {});

      const chatDoc = doc(db, 'users', userId, 'chats', chatId);
      deleteDoc(chatDoc).catch(() => {});
    } catch {}
  }
}

/**
 * Deletes all chats for the authenticated user
 */
export async function deleteAllChats(userId: string): Promise<void> {
  const chats = getLocalChats(userId);
  saveLocalChats(userId, []);

  if (typeof window !== 'undefined') {
    for (const c of chats) {
      localStorage.removeItem(`growth_msgs_${userId}_${c.id}`);
    }
  }

  if (canSyncWithFirestore(userId)) {
    for (const c of chats) {
      deleteChat(userId, c.id).catch(() => {});
    }
  }
}

/**
 * Loads all messages for a specific chat, ordered chronologically
 */
export async function loadChatMessages(userId: string, chatId: string): Promise<ChatMessage[]> {
  if (!userId || !chatId) return [];
  const local = getLocalMessages(userId, chatId);
  if (local.length > 0) {
    return local;
  }
  if (!canSyncWithFirestore(userId)) {
    return [];
  }
  try {
    const messagesCol = collection(db, 'users', userId, 'chats', chatId, 'messages');
    const q = query(messagesCol, orderBy('timestamp', 'asc'));
    const snapshot = await getDocs(q);

    const msgs = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        role: data.role,
        content: data.content || '',
        timestamp: data.timestamp || Date.now(),
        sources: data.sources || [],
        projectCards: data.projectCards || [],
        isStreaming: false,
        isError: data.isError || false,
      };
    });
    saveLocalMessages(userId, chatId, msgs);
    return msgs;
  } catch (err: any) {
    if (/permission-denied|403/i.test(String(err?.message || err))) {
      disableFirestoreSync();
    }
    return getLocalMessages(userId, chatId);
  }
}

/**
 * Persists a message to local storage and optionally Firestore
 */
export async function saveChatMessage(
  userId: string,
  chatId: string,
  msg: ChatMessage
): Promise<void> {
  if (!userId || !chatId || !msg.id) return;

  // 1. Always save locally first so user experience is instant and never lost
  try {
    const localMsgs = getLocalMessages(userId, chatId);
    const existingIdx = localMsgs.findIndex((m) => m.id === msg.id);
    if (existingIdx >= 0) {
      localMsgs[existingIdx] = msg;
    } else {
      localMsgs.push(msg);
    }
    saveLocalMessages(userId, chatId, localMsgs);

    // Update lastMessagePreview in local chats
    const localChats = getLocalChats(userId);
    const chatIdx = localChats.findIndex((c) => c.id === chatId);
    if (chatIdx >= 0) {
      localChats[chatIdx].lastMessagePreview = msg.content.substring(0, 80);
      localChats[chatIdx].updatedAt = new Date().toISOString();
      saveLocalChats(userId, localChats);
    }
  } catch {}

  // 2. Persist to Firestore ONLY if user is genuinely authenticated
  if (canSyncWithFirestore(userId)) {
    try {
      const msgDoc = doc(db, 'users', userId, 'chats', chatId, 'messages', msg.id);
      setDoc(msgDoc, {
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        sources: msg.sources || [],
        projectCards: msg.projectCards || [],
        isError: Boolean(msg.isError),
      }).catch((err) => {
        if (/permission-denied|403/i.test(String(err?.message || err))) {
          disableFirestoreSync();
        }
      });

      const preview = msg.content.substring(0, 80);
      const chatDoc = doc(db, 'users', userId, 'chats', chatId);
      setDoc(
        chatDoc,
        {
          lastMessagePreview: preview,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      ).catch((err) => {
        if (/permission-denied|403/i.test(String(err?.message || err))) {
          disableFirestoreSync();
        }
      });
    } catch {}
  }
}
