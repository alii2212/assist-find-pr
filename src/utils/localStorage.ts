import { ChatMessage } from '../types/chat.ts';

const CHAT_STORAGE_KEY = 'chat_history';

/**
 * Loads saved chat messages from localStorage
 */
export function loadChatHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((m: any) => {
      const msgContent = String(m.content || m.text || '');
      return {
        id: String(m.id || Math.random().toString(36).substring(2)),
        role: m.role === 'user' ? 'user' : 'assistant',
        content: msgContent,
        text: msgContent,
        timestamp: Number(m.timestamp) || Date.now(),
        isStreaming: false,
        isError: Boolean(m.isError),
      };
    });
  } catch (err) {
    console.error('Failed to load chat history from localStorage:', err);
    return [];
  }
}

/**
 * Saves chat messages into localStorage.
 * Ensures NEVER saving credentials, tokens, or keys.
 */
export function saveChatHistory(messages: ChatMessage[]): void {
  try {
    const sanitized = messages
      .slice(-50)
      .map(({ id, role, content, text, timestamp, isError }) => ({
        id,
        role,
        content: content || text || '',
        text: content || text || '',
        timestamp,
        isError,
      }));

    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(sanitized));
  } catch (err) {
    console.error('Failed to save chat history to localStorage:', err);
  }
}

/**
 * Clears chat history from localStorage
 */
export function clearChatHistory(): void {
  try {
    localStorage.removeItem(CHAT_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear chat history:', err);
  }
}
