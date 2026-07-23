import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { UserPlus, UserMinus } from 'lucide-react';

interface JoinLeaveToastProps {
  messages: { id: string; type: 'join' | 'leave'; userName: string }[];
  className?: string;
}

export default function JoinLeaveToast({ messages, className = '' }: JoinLeaveToastProps) {
  const [visibleMessages, setVisibleMessages] = useState<{ id: string; type: 'join' | 'leave'; userName: string }[]>([]);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (messages.length > 0) {
      const newMessage = messages[messages.length - 1];
      setVisibleMessages((prev) => [...prev.slice(-2), newMessage]);

      const timer = setTimeout(() => {
        setVisibleMessages((prev) => prev.filter((m) => m.id !== newMessage.id));
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [messages]);

  return (
    <div className={`absolute bottom-24 left-3 z-[26] flex flex-col gap-2 ${className}`}>
      <AnimatePresence>
        {visibleMessages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5"
          >
            {msg.type === 'join' ? (
              <UserPlus size={12} className="text-green-400" />
            ) : (
              <UserMinus size={12} className="text-red-400" />
            )}
            <span className="text-[11px] text-white font-medium">
              <span className="font-bold">{msg.userName}</span>
              {msg.type === 'join' ? ' joined' : ' left'}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
