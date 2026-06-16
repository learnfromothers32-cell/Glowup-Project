import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Pin, MessageSquare, X } from "lucide-react";
import type { DiscussionMessage } from "../types/live.types";

interface Props {
  messages: DiscussionMessage[];
  onSend: (message: string, parentId?: string) => void;
  onPin?: (id: string) => void;
  pinnedMessage?: DiscussionMessage | null;
  isHost?: boolean;
  connected: boolean;
}

export function DiscussionPanel({
  messages,
  onSend,
  onPin,
  pinnedMessage,
  isHost,
  connected,
}: Props) {
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<DiscussionMessage | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input.trim(), replyTo?.id);
    setInput("");
    setReplyTo(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {pinnedMessage && (
        <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-800/30">
          <div className="flex items-start gap-2">
            <Pin size={14} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-amber-800 dark:text-amber-200 font-medium">
                {pinnedMessage.message}
              </p>
              <span className="text-[10px] text-amber-600 dark:text-amber-400">
                Pinned by host
              </span>
            </div>
          </div>
        </div>
      )}

      {!connected && (
        <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 text-xs text-yellow-700 dark:text-yellow-300 text-center">
          Reconnecting...
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages
          .filter((m) => !m.parentId)
          .map((msg) => (
            <div key={msg.id}>
              <div className="group flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-[9px] font-semibold text-gray-500 dark:text-gray-300 shrink-0">
                  {msg.userName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">
                      {msg.userName}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5 break-words">
                    {msg.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => setReplyTo(msg)}
                      className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      Reply
                    </button>
                    {isHost && onPin && (
                      <button
                        onClick={() => onPin(msg.id)}
                        className="text-[10px] text-gray-400 hover:text-amber-500 transition-colors"
                      >
                        {msg.isPinned ? "Unpin" : "Pin"}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {msg.replies.length > 0 && (
                <div className="ml-9 mt-2 space-y-2 pl-3 border-l-2 border-gray-100 dark:border-gray-700">
                  {msg.replies.map((reply) => (
                    <div key={reply.id} className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-[7px] font-semibold text-gray-500 dark:text-gray-300 shrink-0">
                        {reply.userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[11px] font-semibold text-gray-900 dark:text-white">
                            {reply.userName}
                          </span>
                          <span className="text-[9px] text-gray-400">
                            {new Date(reply.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 break-words">
                          {reply.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare size={32} className="text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-sm text-gray-400 dark:text-gray-500">
              No discussion yet
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Be the first to ask a question
            </p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2"
          >
            <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate flex-1">
              Replying to{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {replyTo.userName}
              </span>
              : {replyTo.message}
            </span>
            <button
              onClick={() => setReplyTo(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700/50">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question or share a thought..."
            className="flex-1 px-3.5 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black hover:opacity-80 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
