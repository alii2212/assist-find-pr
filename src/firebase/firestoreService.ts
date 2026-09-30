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
import { db } from './config.ts';
import { ChatSession, ChatMessage } from '../types/chat.ts';

/**
 * Lists all chats for an authenticated user, ordered by latest update
 */
export async function listUserChats(userId: string): Promise<ChatSession[]> {
  if (!userId) return [];
  try {
    const chatsCol = collection(db, 'users', userId, 'chats');
    const q = query(chatsCol, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
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
  } catch (err: any) {
    console.warn('Notice listing user chats from Firestore with order:', err?.message || err);
    // Graceful fallback to unordered getDocs
    try {
      const chatsCol = collection(db, 'users', userId, 'chats');
      const snapshot = await getDocs(chatsCol);
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
      items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      return items;
    } catch (fallbackErr: any) {
      console.warn('Fallback getDocs also returned:', fallbackErr?.message || fallbackErr);
      return [];
    }
  }
}

/**
 * Creates a new chat session in Firestore
 */
export async function createChat(
  userId: string,
  initial: Partial<ChatSession> = {}
): Promise<ChatSession> {
  const chatsCol = collection(db, 'users', userId, 'chats');
  const newChatDoc = doc(chatsCol);
  const now = new Date().toISOString();

  const newChat: ChatSession = {
    id: newChatDoc.id,
    title: initial.title || 'گفتگوی جدید',
    createdAt: now,
    updatedAt: now,
    conversationPageUrl: initial.conversationPageUrl || window.location.href,
    candidateProfile: initial.candidateProfile || {
      technicalSkills: [],
      previousProjects: [],
      interests: [],
    },
    lastMessagePreview: '',
  };

  try {
    await setDoc(newChatDoc, {
      ...newChat,
      serverTimestamp: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Notice saving new chat to Firestore:', err);
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
  try {
    const chatDoc = doc(db, 'users', userId, 'chats', chatId);
    await setDoc(
      chatDoc,
      {
        title: newTitle.trim() || 'گفتگوی بدون عنوان',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Notice renaming chat in Firestore:', err);
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
  try {
    const chatDoc = doc(db, 'users', userId, 'chats', chatId);
    await setDoc(
      chatDoc,
      {
        ...meta,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Notice updating chat metadata in Firestore:', err);
  }
}

/**
 * Deletes a single chat and its messages
 */
export async function deleteChat(userId: string, chatId: string): Promise<void> {
  try {
    const messagesCol = collection(db, 'users', userId, 'chats', chatId, 'messages');
    const msgSnapshot = await getDocs(messagesCol);
    const batch = writeBatch(db);
    msgSnapshot.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  } catch (e) {
    console.warn('Could not batch delete messages:', e);
  }

  try {
    const chatDoc = doc(db, 'users', userId, 'chats', chatId);
    await deleteDoc(chatDoc);
  } catch (err) {
    console.warn('Notice deleting chat doc in Firestore:', err);
  }
}

/**
 * Deletes all chats for the authenticated user
 */
export async function deleteAllChats(userId: string): Promise<void> {
  const chats = await listUserChats(userId);
  for (const c of chats) {
    await deleteChat(userId, c.id);
  }
}

/**
 * Loads all messages for a specific chat, ordered chronologically
 */
export async function loadChatMessages(userId: string, chatId: string): Promise<ChatMessage[]> {
  if (!userId || !chatId) return [];
  try {
    const messagesCol = collection(db, 'users', userId, 'chats', chatId, 'messages');
    const q = query(messagesCol, orderBy('timestamp', 'asc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
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
  } catch (err: any) {
    console.warn('Notice loading chat messages with order:', err?.message || err);
    try {
      const messagesCol = collection(db, 'users', userId, 'chats', chatId, 'messages');
      const snapshot = await getDocs(messagesCol);
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
      msgs.sort((a, b) => a.timestamp - b.timestamp);
      return msgs;
    } catch (fallbackErr) {
      console.warn('Fallback loading messages also returned:', fallbackErr);
      return [];
    }
  }
}

/**
 * Persists a message to Firestore
 */
export async function saveChatMessage(
  userId: string,
  chatId: string,
  msg: ChatMessage
): Promise<void> {
  if (!userId || !chatId || !msg.id) return;
  try {
    const msgDoc = doc(db, 'users', userId, 'chats', chatId, 'messages', msg.id);

    await setDoc(msgDoc, {
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
      sources: msg.sources || [],
      projectCards: msg.projectCards || [],
      isError: Boolean(msg.isError),
    });

    const preview = msg.content.substring(0, 80);
    const chatDoc = doc(db, 'users', userId, 'chats', chatId);
    await setDoc(
      chatDoc,
      {
        lastMessagePreview: preview,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err: any) {
    console.warn('Notice persisting chat message to Firestore:', err?.message || err);
  }
}
