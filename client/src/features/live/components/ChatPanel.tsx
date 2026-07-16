import { useState, useCallback, useRef, useEffect } from "react";
import { MessageSquare } from "lucide-react";
import { cn } from "@/utils/cn";
import { useLiveChat } from "../hooks/useLiveChat";
import type { ChatMessage } from "@/domain/live/live.types";

interface ChatPanelProps {
  className?: string;
}

export function ChatPanel({ className }: ChatPanelProps) {
  const {
    messages,
    hasMoreHistory,
    isLoadingHistory,
    pinnedMessageId,
    sendMessage,
    loadHistory,
  } = useLiveChat();

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const pinnedMessage = pinnedMessageId
    ? messages.find(
        (m) => m.id === pinnedMessageId || m.messageId === pinnedMessageId,
      )
    : null;

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, autoScroll]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 80);

    if (scrollTop < 40 && hasMoreHistory && !isLoadingHistory) {
      const prevHeight = scrollRef.current.scrollHeight;
      loadHistory();
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop =
            scrollRef.current.scrollHeight - prevHeight;
        }
      });
    }
  }, [hasMoreHistory, isLoadingHistory, loadHistory]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    sendMessage(text);
    setInput("");
  }, [input, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const canSend = input.trim().length > 0;

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-white dark:bg-surface-dark-secondary",
        "border-l border-gray-100 dark:border-gray-700/40",
        className,
      )}
      role="log"
      aria-label="Live chat"
      aria-live="polite"
    >
      {pinnedMessage && (
        <div
          className="px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-100 dark:border-yellow-800/30"
          role="status"
          aria-label="Pinned message"
        >
          <p className="text-[10px] font-semibold text-yellow-600 dark:text-yellow-400 uppercase tracking-wide mb-0.5">
            Pinned
          </p>
          <p className="text-xs text-yellow-800 dark:text-yellow-200 truncate">
            {pinnedMessage.content}
          </p>
        </div>
      )}

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-2 space-y-1"
        role="log"
        aria-label="Chat messages"
      >
        {isLoadingHistory && (
          <div className="text-center py-2" role="status" aria-label="Loading chat history">
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
              <svg
                className="animate-spin h-3 w-3"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Loading history...
            </span>
          </div>
        )}

        {!isLoadingHistory && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageSquare
              size={24}
              className="text-gray-300 dark:text-gray-600 mb-2"
              aria-hidden="true"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500">
              No messages yet
            </p>
            <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-0.5">
              Be the first to say something!
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <ChatBubble key={msg.id || msg.messageId} message={msg} />
        ))}
      </div>

      <div className="p-3 border-t border-gray-100 dark:border-gray-700/40">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <label htmlFor="chat-input" className="sr-only">
            Type a message
          </label>
          <input
            id="chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            aria-label="Chat message input"
            autoComplete="off"
            className="flex-1 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
          />
          <button
            type="submit"
            disabled={!canSend}
            aria-label="Send message"
            className={cn(
              "p-2 rounded-xl transition-all",
              canSend
                ? "bg-brand-500 text-white hover:bg-brand-600"
                : "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed",
            )}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isLocal = message.senderId === "local";
  const isSystem = message.type === "system";

  if (isSystem) {
    return (
      <div className="text-center py-1" role="status">
        <span className="text-[11px] text-gray-400 dark:text-gray-500 italic">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex gap-2 py-0.5",
        isLocal && "flex-row-reverse",
      )}
      role="article"
      aria-label={`${isLocal ? "You" : message.senderName} said: ${message.content}`}
    >
      {!isLocal && (
        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0 mt-0.5">
          {message.senderAvatar ? (
            <img
              src={message.senderAvatar}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-gray-400">
              {message.senderName?.[0] || "?"}
            </div>
          )}
        </div>
      )}

      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3 py-1.5",
          isLocal
            ? "bg-brand-500 text-white rounded-br-md"
            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md",
        )}
      >
        {!isLocal && (
          <p className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 mb-0.5">
            {message.senderName}
          </p>
        )}
        <p className="text-xs leading-relaxed break-words">{message.content}</p>
      </div>
    </div>
  );
}
