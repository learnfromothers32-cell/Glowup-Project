import { useState } from "react";
import { logger } from "../../../utils/logger";
import { motion } from "framer-motion";
import {
  Radio,
  CalendarPlus,
  Clock,
  TrendingUp,
  History,
  Bell,
  ChevronRight,
} from "lucide-react";
import { useLiveStore } from "../store/liveStore";
import { useLiveSessions, useTrendingSessions } from "../hooks/useLiveSessions";
import { LiveSessionCard } from "./LiveSessionCard";
import { UpcomingSessionCard } from "./UpcomingSessionCard";
import { SessionReplayCard } from "./SessionReplayCard";
import { LiveNotifications } from "./LiveNotifications";
import { ScheduleSessionForm } from "./ScheduleSessionForm";
import { LivePlayerScreen } from "./LivePlayerScreen";
import type { LiveSession } from "../types/live.types";

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "fitness", label: "Fitness" },
  { key: "startup", label: "Startup" },
  { key: "career", label: "Career" },
  { key: "productivity", label: "Productivity" },
  { key: "wellness", label: "Wellness" },
  { key: "business", label: "Business" },
  { key: "financial-literacy", label: "Finance" },
] as const;

type Tab = "live" | "upcoming" | "recordings";

export function LiveHomeScreen() {
  const [category, setCategory] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<Tab>("live");
  const [showSchedule, setShowSchedule] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const {
    liveSessions,
    upcomingSessions,
    pastSessions,
    recommendedSessions,
    openPlayer,
    notifications,
    markAsRead,
    markAllAsRead,
  } = useLiveStore();

  useLiveSessions(category === "all" ? undefined : category);
  useTrendingSessions();

  const handleJoin = (session: LiveSession) => openPlayer(session);
  const handleWatchReplay = (session: PastSession) => {
    if (session.recordingUrl) {
      window.open(session.recordingUrl, "_blank");
    }
  };
  const handleRemind = (id: string) => {
    useLiveStore.getState().setUpcomingSessions(
      upcomingSessions.map((s) =>
        s.id === id ? { ...s, reminder: !s.reminder } : s
      )
    );
  };
  const handleSchedule = (data: any) => {
    logger.log("Schedule session:", data);
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
              <Radio size={22} className="text-blue-500" />
              Live
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Learn from experts. Connect with community. Grow together.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Bell size={18} className="text-gray-600 dark:text-gray-400" />
              {notifications.filter((n) => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {notifications.filter((n) => !n.read).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowSchedule(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity"
            >
              <CalendarPlus size={16} />
              Schedule
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
                category === cat.key
                  ? "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white"
                  : "bg-white dark:bg-[#1a1a2e] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 mb-6 border-b border-gray-100 dark:border-gray-700/50">
          {[
            { key: "live", label: "Live Now", icon: Radio },
            { key: "upcoming", label: "Upcoming", icon: Clock },
            { key: "recordings", label: "Recordings", icon: History },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as Tab)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === tab.key
                  ? "border-black dark:border-white text-black dark:text-white"
                  : "border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
              {tab.key === "live" && liveSessions.length > 0 && (
                <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                  {liveSessions.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === "live" && (
          <>
            {liveSessions.length > 0 && (
              <section className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Live Now
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {liveSessions.map((session) => (
                    <LiveSessionCard
                      key={session.id}
                      session={session}
                      onJoin={handleJoin}
                    />
                  ))}
                </div>
              </section>
            )}

            {recommendedSessions.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={18} className="text-gray-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Trending Now
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {recommendedSessions.map((session) => (
                    <LiveSessionCard
                      key={session.id}
                      session={session}
                      onJoin={handleJoin}
                    />
                  ))}
                </div>
              </section>
            )}

            {liveSessions.length === 0 && recommendedSessions.length === 0 && (
              <div className="text-center py-20">
                <Radio size={48} className="mx-auto text-gray-200 dark:text-gray-700 mb-4" />
                <h3 className="text-lg font-semibold text-gray-400 dark:text-gray-500">
                  No live sessions right now
                </h3>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  Check back soon or browse upcoming sessions
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === "upcoming" && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Upcoming Sessions
              </h2>
            </div>
            {upcomingSessions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingSessions.map((session) => (
                  <UpcomingSessionCard
                    key={session.id}
                    session={session}
                    onRemind={handleRemind}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Clock size={40} className="mx-auto text-gray-200 dark:text-gray-700 mb-3" />
                <p className="text-sm text-gray-400 dark:text-gray-500">No upcoming sessions scheduled</p>
              </div>
            )}
          </section>
        )}

        {activeTab === "recordings" && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Past Sessions
              </h2>
              <button className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1">
                View all <ChevronRight size={14} />
              </button>
            </div>
            {pastSessions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {pastSessions.map((session) => (
                  <SessionReplayCard
                    key={session.id}
                    session={session}
                    onWatch={handleWatchReplay}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <History size={40} className="mx-auto text-gray-200 dark:text-gray-700 mb-3" />
                <p className="text-sm text-gray-400 dark:text-gray-500">No past recordings yet</p>
              </div>
            )}
          </section>
        )}

        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-6 p-4 bg-white dark:bg-[#1a1a2e] rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm"
          >
            <LiveNotifications
              notifications={notifications}
              onMarkRead={markAsRead}
              onMarkAllRead={markAllAsRead}
            />
          </motion.div>
        )}
      </div>

      {showSchedule && (
        <ScheduleSessionForm
          onClose={() => setShowSchedule(false)}
          onSubmit={handleSchedule}
        />
      )}

      <LivePlayerScreen />
    </>
  );
}
