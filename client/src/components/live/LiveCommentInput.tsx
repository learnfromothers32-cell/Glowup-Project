import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send } from 'lucide-react';

interface LiveCommentInputProps {
  onSend: (text: string) => boolean;
  cooldownRemaining: number;
  maxLength?: number;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

export default function LiveCommentInput({
  onSend,
  cooldownRemaining,
  maxLength = 200,
  placeholder = 'Say something...',
  onFocus,
  onBlur,
}: LiveCommentInputProps) {
  const [text, setText] = useState('');
  const [failed, setFailed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cooldownRemaining > 0) {
      const timer = setTimeout(() => setFailed(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [cooldownRemaining]);

  const handleSend = () => {
    if (!text.trim()) return;
    const ok = onSend(text.trim());
    if (ok) {
      setText('');
    } else {
      setFailed(true);
      setTimeout(() => setFailed(false), 1500);
    }
  };

  const disabled = cooldownRemaining > 0;

  return (
    <div className="w-full">
      <div
        className="flex items-center gap-2 rounded-full px-4 py-2.5 border border-white/[0.08] focus-within:border-white/[0.15] focus-within:bg-white/[0.18] transition-all"
        style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
      >
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (text.trim() && !disabled) handleSend();
            }
          }}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={disabled ? `Wait ${cooldownRemaining}s...` : placeholder}
          disabled={disabled}
          maxLength={maxLength + 20}
          aria-label="Type a comment"
          className="flex-1 bg-transparent text-white text-[13px] placeholder:text-white/40 focus:outline-none disabled:opacity-40"
        />
        <AnimatePresence>
          {text.trim() && !disabled && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={handleSend}
              aria-label="Send comment"
              className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center shrink-0 active:scale-90 shadow-md shadow-red-500/30"
            >
              <Send size={11} className="text-white ml-0.5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {failed && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-[10px] text-red-400 text-center mt-1"
          >
            Failed to send. Try again.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
