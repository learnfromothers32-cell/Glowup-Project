import { useState } from "react";
import { Search, Radio } from "lucide-react";
import { useLiveSessions, useFeaturedSessions } from "../../domain/live/live.hooks";
import { DiscoverCard } from "../../features/live/components/DiscoverCard";
import { DiscoverSkeleton } from "../../features/live/components/LiveSkeleton";
import { LiveBadge } from "../../features/live/components/LiveBadge";
import { Button } from "../../components/ui/Button";
import { cn } from "../../utils/cn";

const CATEGORIES = [
  "All",
  "Hair Tutorial",
  "Styling Tips",
  "Live Q&A",
  "Product Review",
  "Behind the Scenes",
];

export default function LiveDiscoverPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"trending" | "newest" | "popular">("trending");

  const categoryFilter = activeCategory === "All" ? undefined : activeCategory;

  const { data: sessionsData, isLoading, error } = useLiveSessions({
    category: categoryFilter,
    sort: sortBy,
    limit: 20,
  });

  const { data: featuredData, isLoading: featuredLoading } = useFeaturedSessions(6);

  const sessions = sessionsData?.sessions ?? [];
  const featured = featuredData?.sessions ?? [];

  const filteredSessions = sessions.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      (typeof s.stylistId === "object" && s.stylistId.name?.toLowerCase().includes(q)) ||
      s.category?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="page-container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h3 font-display text-text-primary flex items-center gap-2">
            <Radio size={24} className="text-red-500" />
            Live Now
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Watch live sessions from your favorite stylists
          </p>
        </div>
      </div>

      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search live sessions..."
          className="input-field pl-9 pr-4"
        />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all",
              activeCategory === cat
                ? "bg-brand-500 text-white shadow-sm"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700",
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-text-secondary font-medium">Sort:</span>
        {(["trending", "newest", "popular"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSortBy(s)}
            className={cn(
              "px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition-all",
              sortBy === s
                ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {featured.length > 0 && !searchQuery && (
        <section>
          <h2 className="text-h4 font-display text-text-primary mb-3 flex items-center gap-2">
            Featured
            <LiveBadge size="sm" />
          </h2>
          {featuredLoading ? (
            <DiscoverSkeleton />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
              {featured.map((session) => (
                <DiscoverCard key={session._id} session={session} />
              ))}
            </div>
          )}
        </section>
      )}

      <section>
        <h2 className="text-h4 font-display text-text-primary mb-3">
          {activeCategory === "All" ? "All Sessions" : activeCategory}
        </h2>
        {isLoading ? (
          <DiscoverSkeleton />
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-sm text-red-500">Failed to load live sessions</p>
            <Button variant="secondary" size="sm" className="mt-3" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mx-auto mb-4 flex items-center justify-center">
              <Radio size={24} className="text-gray-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              No live sessions
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs mx-auto">
              {searchQuery
                ? "No sessions match your search"
                : "Check back later for upcoming live sessions"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredSessions.map((session) => (
              <DiscoverCard key={session._id} session={session} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
