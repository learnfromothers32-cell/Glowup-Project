import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellRing, User, Calendar } from "lucide-react";
import type { LiveNotification } from "../types/live.types";

interface Props {
  notifications: LiveNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export function LiveNotifications({
  notifications,
  onMarkRead,
  onMarkAllRead,
}: Props) {
  const unread = notifications.filter((n) => !n.read);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          {unread.length > 0 ? (
            <BellRing size={16} className="text-blue-500" />
          ) : (
            <Bell size={16} className="text-gray-400" />
          )}
          Notifications
          {unread.length > 0 && (
            <span className="px-1.5 py-0.5 bg-blue-500 text-white text-[10px] font-bold rounded-full">
              {unread.length}
            </span>
          )}
        </h3>
        {unread.length > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        <AnimatePresence initial={false}>
          {notifications.length === 0 && (
            <div className="text-center py-8">
              <Bell size={28} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-sm text-gray-400 dark:text-gray-500">
                No notifications yet
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                You'll be notified when your favorite hosts go live
              </p>
            </div>
          )}

          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              onClick={() => !notif.read && onMarkRead(notif.id)}
              className={`relative flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                notif.read
                  ? "bg-white dark:bg-[#1a1a2e]"
                  : "bg-blue-50 dark:bg-blue-900/10"
              }`}
            >
              <div className="shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                {notif.type === "host-live" ? (
                  <User size={16} className="text-gray-500 dark:text-gray-300" />
                ) : (
                  <Calendar size={16} className="text-gray-500 dark:text-gray-300" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">
                  {notif.message}
                </p>
                <span className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 block">
                  {new Date(notif.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              {!notif.read && (
                <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
