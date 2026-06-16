import { X, Shield, MicOff, Ban } from "lucide-react";

interface ModUser {
  id: string;
  name: string;
  messageCount: number;
  isMuted: boolean;
  isBlocked: boolean;
  isModerator: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  users: ModUser[];
  onMuteUser: (id: string) => void;
  onBlockUser: (id: string) => void;
}

export default function ModerationPanel({ isOpen, onClose, users, onMuteUser, onBlockUser }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#1a1a2e] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700/50 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-emerald-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Moderation</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-4">
          {users.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No active participants</p>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                    <p className="text-xs text-gray-400">{user.messageCount} messages</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onMuteUser(user.id)}
                      className={`p-2 rounded-lg transition-colors ${user.isMuted ? "bg-amber-50 text-amber-500" : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"}`}
                      title={user.isMuted ? "Unmute" : "Mute"}
                    >
                      <MicOff size={14} />
                    </button>
                    <button
                      onClick={() => onBlockUser(user.id)}
                      className={`p-2 rounded-lg transition-colors ${user.isBlocked ? "bg-red-50 text-red-500" : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"}`}
                      title={user.isBlocked ? "Unblock" : "Block"}
                    >
                      <Ban size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
