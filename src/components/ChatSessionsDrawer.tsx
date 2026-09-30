import React, { useState } from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Clock,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
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
    <div className="absolute inset-0 z-40 bg-slate-950/95 backdrop-blur-md flex flex-col p-4 animate-fadeIn text-slate-200">
      {/* Drawer Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-sm text-white">تاریخچه و گفتگوهای من</h3>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
            {chats.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
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
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>شروع گفتگوی جدید</span>
        </button>
      </div>

      {/* Chats List */}
      <div className="flex-1 overflow-y-auto space-y-2 py-1 pr-0.5">
        {chats.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <MessageSquare className="w-10 h-10 mb-2 opacity-30" />
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
                    ? 'bg-emerald-950/40 border-emerald-500/60 shadow-sm'
                    : 'bg-slate-900/80 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700'
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
                          className="bg-slate-800 text-xs px-2 py-1 rounded text-white border border-slate-600 focus:outline-none w-full"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={(e) => handleSaveRename(chat.id, e)}
                          className="p-1 text-emerald-400 hover:text-emerald-300"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingChatId(null)}
                          className="p-1 text-slate-400 hover:text-slate-300"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-white line-clamp-1">
                          {chat.title}
                        </span>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        )}
                      </div>
                    )}

                    {chat.lastMessagePreview && !isEditing && (
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-1">
                        {chat.lastMessagePreview}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(chat.updatedAt).toLocaleDateString('fa-IR', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      {chat.conversationPageUrl && (
                        <span className="line-clamp-1 text-slate-600 font-mono text-[9px]">
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
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="ویرایش عنوان"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(chat.id, e)}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
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
        <div className="pt-3 border-t border-slate-800">
          {showConfirmDeleteAll ? (
            <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800/80 flex items-center justify-between gap-2 text-xs">
              <span className="text-rose-200">حذف تمام تاریخچه؟</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={async () => {
                    await onDeleteAllChats();
                    setShowConfirmDeleteAll(false);
                  }}
                  className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium text-[11px]"
                >
                  بله، حذف کن
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmDeleteAll(false)}
                  className="px-2 py-1 rounded text-slate-400 hover:text-white text-[11px]"
                >
                  انصراف
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirmDeleteAll(true)}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
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
