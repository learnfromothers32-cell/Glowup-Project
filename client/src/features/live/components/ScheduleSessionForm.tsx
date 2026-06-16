import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, X } from "lucide-react";
import { LIVE_CATEGORIES } from "../types/live.types";
import type { LiveCategory } from "../types/live.types";

interface Props {
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    category: LiveCategory;
    scheduledAt: string;
    durationMinutes: number;
  }) => void;
}

export function ScheduleSessionForm({ onClose, onSubmit }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<LiveCategory>("wellness");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(30);

  const minDate = new Date().toISOString().split("T")[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !time) return;
    const scheduledAt = new Date(`${date}T${time}`).toISOString();
    onSubmit({ title: title.trim(), description: description.trim(), category, scheduledAt, durationMinutes: duration });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        className="w-full max-w-lg bg-white dark:bg-[#1a1a2e] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700/50 overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700/50">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Schedule a Session
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Morning Mobility & Stretch"
              maxLength={100}
              required
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will you cover? Who is this for?"
              rows={3}
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {LIVE_CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setCategory(cat.key)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                    category === cat.key
                      ? "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white"
                      : "bg-white dark:bg-[#1a1a2e] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={14} /> Date
                </span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={minDate}
                required
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={14} /> Time
                </span>
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Duration
            </label>
            <div className="flex gap-2">
              {[15, 30, 45, 60, 90].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDuration(mins)}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${
                    duration === mins
                      ? "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white"
                      : "bg-white dark:bg-[#1a1a2e] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300"
                  }`}
                >
                  {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!title.trim() || !date || !time}
            className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Schedule Session
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
