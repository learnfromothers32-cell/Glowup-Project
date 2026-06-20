import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users,
  UserCheck,
  Clock,
  ArrowRight,
  CheckCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { getQueueStatus, advanceQueue, markQueueDone } from "../../api/queue";
import { useAuth } from "../../context/authUtils";
import { connectQueue, getQueueSocket, subscribeToQueue, unsubscribeFromQueue } from "../../services/socket";

interface QueueEntry {
  userId: string;
  position: number;
  status: string;
  estimatedServiceMins: number;
  estimatedWaitMins: number;
  joinedAt: string;
}

interface QueueData {
  id: string;
  stylistId: string;
  currentPosition: number;
  predictedWaitMins: number;
  avgServiceDuration: number;
  entries: QueueEntry[];
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default function QueueManagement() {
  const { user } = useAuth();
  const [queue, setQueue] = useState<QueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const stylistId = (user as any)?.stylistId || "";

  const fetchQueue = useCallback(async () => {
    if (!stylistId) return;
    setError("");
    try {
      const data = await getQueueStatus(stylistId);
      setQueue(data.queue);
    } catch {
      setError("Failed to load queue");
    } finally {
      setLoading(false);
    }
  }, [stylistId]);

  useEffect(() => {
    if (!stylistId) return;
    fetchQueue();
    connectQueue();
    subscribeToQueue(stylistId);
    const handleUpdate = (data: any) => {
      if (data?.stylistId === stylistId) setQueue(data);
    };
    const sock = getQueueSocket();
    sock.on("queue:update", handleUpdate);
    return () => {
      unsubscribeFromQueue(stylistId);
      sock.off("queue:update", handleUpdate);
    };
  }, [stylistId, fetchQueue]);

  const handleAdvance = async () => {
    setActionLoading("advance");
    try {
      await advanceQueue(stylistId);
      await fetchQueue();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to advance queue");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDone = async (entryUserId: string) => {
    setActionLoading(`done-${entryUserId}`);
    try {
      await markQueueDone(stylistId, entryUserId);
      await fetchQueue();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to mark as done");
    } finally {
      setActionLoading(null);
    }
  };

  const waiting = queue?.entries?.filter((e) => e.status === "waiting") || [];
  const inService = queue?.entries?.filter((e) => e.status === "in-service") || [];
  const hasInService = inService.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 pb-20">
        <div className="pt-14 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Queue</h1>
              <p className="text-sm text-gray-400 mt-1">Manage your waiting customers</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Users size={16} />
              <span className="font-semibold tabular-nums">{waiting.length} waiting</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 flex items-start gap-2.5">
            <AlertTriangle size={15} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-white border border-gray-100 animate-pulse" />
            ))}
          </div>
        ) : waiting.length === 0 && !hasInService ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
              <Users size={28} className="text-gray-300" />
            </div>
            <p className="text-base font-semibold text-gray-700 mb-1">Queue is empty</p>
            <p className="text-sm text-gray-400 max-w-[280px]">
              Customers you add to your queue will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {hasInService && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
                  <UserCheck size={14} /> Now serving
                </h2>
                <div className="bg-white rounded-xl border border-green-200 overflow-hidden">
                  {inService.map((entry) => (
                    <div key={entry.userId} className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-sm font-bold text-green-700 shrink-0">
                            {initials(entry.userId)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900">
                              In service
                            </p>
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <Clock size={10} />
                              Since {fmtTime(entry.joinedAt)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDone(entry.userId)}
                          disabled={actionLoading === `done-${entry.userId}`}
                          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-green-600 text-white text-xs font-semibold hover:bg-green-700 disabled:opacity-50 transition-all w-full sm:w-auto min-h-[40px]"
                        >
                          {actionLoading === `done-${entry.userId}` ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <CheckCircle size={12} />
                          )}
                          Complete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {waiting.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                    <Clock size={14} /> Waiting list
                  </h2>
                  <span className="text-xs text-gray-400">
                    Est. wait ~{queue?.predictedWaitMins || "—"} min
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {waiting.map((entry, i) => (
                    <motion.div
                      key={entry.userId}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="bg-white rounded-xl border border-gray-100 p-4 hover:border-gray-200 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center min-w-[40px] shrink-0">
                          <span className={`text-lg font-black tabular-nums ${
                            entry.position === 1 ? "text-green-600" : "text-amber-600"
                          }`}>
                            #{entry.position}
                          </span>
                          <span className="text-[9px] text-gray-400 font-medium">Queue</span>
                        </div>
                        <div className="w-px h-8 bg-gray-100 shrink-0" />
                        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                          {initials(entry.userId)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">Customer</p>
                          <p className="text-xs text-gray-400 truncate">
                            ~{entry.estimatedServiceMins} min · Joined {fmtTime(entry.joinedAt)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {!hasInService && waiting.length > 0 && (
              <button
                onClick={handleAdvance}
                disabled={actionLoading === "advance"}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 shadow-sm transition-all min-h-[48px] dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
              >
                {actionLoading === "advance" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ArrowRight size={16} />
                )}
                Call next customer
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
