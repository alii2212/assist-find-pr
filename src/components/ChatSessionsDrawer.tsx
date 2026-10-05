import React, { useState } from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Clock,
} from 'lucide-react';
import { ChatSession } from '../types/chat.ts';

interface ChatSessionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  chats: ChatSession[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onRenameChat: (chatId: string, newTitle: string) => Promise<void>;
  onDeleteChat: (chatId: string) => Promise<void>;
  onDeleteAllChats: () => Promise<void>;
}

export const ChatSessionsDrawer: React.FC<ChatSessionsDrawerProps> = ({
  isOpen,
  onClose,
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onRenameChat,
  onDeleteChat,
  onDeleteAllChats,
}) => {
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [showConfirmDeleteAll, setShowConfirmDeleteAll] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleStartRename = (chat: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditingTitle(chat.title);
  };

  const handleSaveRename = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingTitle.trim()) {
      await onRenameChat(chatId, editingTitle.trim());
    }
    setEditingChatId(null);
  };

  const handleDelete = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('آیا مطمئن هستید که می‌خواهید این گفتگو را حذف کنید؟')) {
      await onDeleteChat(chatId);
    }
  };

  return (
    <div className="absolute inset-0 z-40 bg-white/95 backdrop-blur-md flex flex-col p-4 animate-fadeIn text-slate-800">
      {/* Drawer Header */}
      <div className="flex items-center justify-between pb-3 border-b border-purple-100">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-purple-700" />
          <h3 className="font-bold text-sm text-slate-900">تاریخچه و گفتگوهای من</h3>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold">
            {chats.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="py-3">
        <button
          type="button"
          onClick={() => {
            onNewChat();
            onClose();
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-700 to-violet-700 hover:from-purple-800 hover:to-violet-800 active:scale-[0.98] text-white font-semibold text-xs shadow-sm shadow-purple-700/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>شروع گفتگوی جدید</span>
        </button>
      </div>

      {/* Chats List */}
      <div className="flex-1 overflow-y-auto space-y-2 py-1 pr-0.5">
        {chats.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <MessageSquare className="w-10 h-10 mb-2 opacity-30 text-purple-400" />
            <p className="text-xs">هنوز هیچ گفتگویی ثبت نشده است.</p>
          </div>
        ) : (
          chats.map((chat) => {
            const isActive = chat.id === activeChatId;
            const isEditing = chat.id === editingChatId;

            return (
              <div
                key={chat.id}
                onClick={() => {
                  onSelectChat(chat.id);
                  onClose();
                }}
                className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-purple-50 border-purple-300 text-purple-950 shadow-xs'
                    : 'bg-white border-slate-200/80 hover:bg-purple-50/40 hover:border-purple-200 text-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          className="bg-white text-xs px-2 py-1 rounded text-slate-900 border border-purple-300 focus:outline-none w-full"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={(e) => handleSaveRename(chat.id, e)}
                          className="p-1 text-purple-700 hover:text-purple-900"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingChatId(null)}
                          className="p-1 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-slate-900 line-clamp-1">
                          {chat.title}
                        </span>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0" />
                        )}
                      </div>
                    )}

                    {chat.lastMessagePreview && !isEditing && (
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-1">
                        {chat.lastMessagePreview}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-purple-400" />
                        {new Date(chat.updatedAt).toLocaleDateString('fa-IR', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      {chat.conversationPageUrl && (
                        <span className="line-clamp-1 text-slate-400 font-mono text-[9px]">
                          {chat.conversationPageUrl.replace('https://yazdinnofaraz.ir', '')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {!isEditing && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleStartRename(chat, e)}
                        className="p-1 rounded text-slate-400 hover:text-purple-700 hover:bg-purple-50 transition-colors"
                        title="ویرایش عنوان"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(chat.id, e)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="حذف گفتگو"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Drawer Footer Actions */}
      {chats.length > 0 && (
        <div className="pt-3 border-t border-purple-100">
          {showConfirmDeleteAll ? (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-2 text-xs">
              <span className="text-rose-800">حذف تمام تاریخچه؟</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={async () => {
                    await onDeleteAllChats();
                    setShowConfirmDeleteAll(false);
                  }}
                  className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-medium text-[11px]"
                >
                  بله، حذف کن
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmDeleteAll(false)}
                  className="px-2 py-1 rounded text-slate-600 hover:text-slate-900 text-[11px]"
                >
                  انصراف
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirmDeleteAll(true)}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>حذف تمام گفتگوهای من</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
