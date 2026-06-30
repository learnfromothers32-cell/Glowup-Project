import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { X, Search, User, Scissors, Sparkles, Flame, Loader2 } from "lucide-react";
import { getStylists } from "../../../api/stylists";
import type { Stylist } from "@/domain/stylist/stylist.types";
import { getLocationString } from "@/utils/location";

interface SearchResult {
  type: "stylist" | "service" | "category" | "trending";
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  link: string;
}

const CATEGORIES = ["Hair", "Barber", "Braids", "Nails", "Skin", "Lashes"];

export default function GlobalSearchModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [initialLoading, setInitialLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load stylists when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    setResults([]);
    setFetchError(false);
    setInitialLoading(true);
    getStylists()
      .then(({ stylists }) => {
        setStylists(stylists);
        setInitialLoading(false);
      })
      .catch(() => {
        setFetchError(true);
        setInitialLoading(false);
      });
    inputRef.current?.focus();
  }, [isOpen]);

  const doSearch = useCallback(
    (term: string) => {
      if (!term.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const lower = term.toLowerCase().trim();
      const newResults: SearchResult[] = [];

      // 1. Search stylists
      stylists.forEach((s) => {
        if (
          s.name.toLowerCase().includes(lower) ||
          s.category?.toLowerCase().includes(lower) ||
          s.location?.area?.toLowerCase().includes(lower)
        ) {
          newResults.push({
            type: "stylist",
            id: s.id,
            title: s.name,
            subtitle: `${s.category || "Stylist"} • ${getLocationString(s.location)}`,
            image: s.image,
            link: `/app/stylist/${s.id}`,
          });
        }
      });

      // 2. Search services
      const seen = new Set<string>();
      stylists.forEach((s) => {
        (s.services ?? []).forEach((service) => {
          if (typeof service === "string") return;
          if (service.name?.toLowerCase().includes(lower) && !seen.has(service.name)) {
            seen.add(service.name);
            newResults.push({
              type: "service",
              id: service.name,
              title: service.name,
              subtitle: service.price ? `Starting at ${service.price}` : undefined,
              link: `/app/search?service=${encodeURIComponent(service.name)}`,
            });
          }
        });
      });

      // 3. Search categories
      CATEGORIES.forEach((cat) => {
        if (cat.toLowerCase().includes(lower)) {
          newResults.push({
            type: "category",
            id: cat,
            title: cat,
            subtitle: `Explore ${cat} stylists`,
            link: `/app/${cat.toLowerCase()}`,
          });
        }
      });

      // 4. Search before/after captions
      stylists.forEach((s) => {
        (s.beforeAfter ?? []).forEach((ba, idx) => {
          if (ba.caption?.toLowerCase().includes(lower)) {
            newResults.push({
              type: "trending",
              id: `${s.id}_${idx}`,
              title: ba.caption,
              subtitle: `By ${s.name}`,
              image: ba.after,
              link: `/app/trending`,
            });
          }
        });
      });

      setResults(newResults.slice(0, 20));
      setLoading(false);
    },
    [stylists]
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  const handleResultClick = (link: string) => {
    onClose();
    navigate(link);
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hasNoResults = !initialLoading && !loading && query.trim() && results.length === 0 && !fetchError;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-surface-dark-secondary rounded-2xl shadow-2xl dark:shadow-2xl dark:shadow-black/50 overflow-hidden mx-4 border border-gray-200/80 dark:border-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-400 dark:text-text-dark-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stylists, services, categories..."
            className="flex-1 bg-transparent text-base text-gray-900 dark:text-text-dark-primary placeholder-gray-400 dark:placeholder-text-dark-muted outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-surface-dark-tertiary text-gray-400 dark:text-text-dark-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-dark-tertiary text-gray-400 dark:text-text-dark-muted transition-colors"
          >
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-surface-dark-tertiary text-gray-500 dark:text-text-dark-muted mr-1">
              ESC
            </kbd>
            <X className="w-4 h-4 sm:hidden" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[70vh] overflow-y-auto overscroll-contain p-3">
          {initialLoading && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-400 dark:text-text-dark-muted">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading stylists...
            </div>
          )}

          {fetchError && (
            <div className="text-center py-10 text-sm text-gray-400 dark:text-text-dark-muted">
              Could not load stylists. Please try again.
            </div>
          )}

          {!initialLoading && !fetchError && loading && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-400 dark:text-text-dark-muted">
              <Loader2 className="w-4 h-4 animate-spin" />
              Searching...
            </div>
          )}

          {hasNoResults && (
            <div className="text-center py-10">
              <Search className="w-8 h-8 mx-auto mb-3 text-gray-300 dark:text-text-dark-muted" />
              <p className="text-sm text-gray-500 dark:text-text-dark-secondary">
                No results for "<span className="font-medium">{query}</span>"
              </p>
              <p className="text-xs text-gray-400 dark:text-text-dark-muted mt-1">
                Try a different name, service, or category
              </p>
            </div>
          )}

          {!initialLoading && !fetchError && !loading && query && results.length > 0 && (
            <div className="space-y-5">
              {(["stylist", "service", "category", "trending"] as const).map((type) => {
                const filtered = results.filter((r) => r.type === type);
                if (filtered.length === 0) return null;
                const icons = { stylist: User, service: Scissors, category: Sparkles, trending: Flame };
                const Icon = icons[type];
                const labels = { stylist: "Stylists", service: "Services", category: "Categories", trending: "Trending" };
                return (
                  <div key={type}>
                    <h3 className="text-xs font-semibold text-gray-400 dark:text-text-dark-muted uppercase tracking-wider mb-2 px-2">
                      {labels[type]}
                    </h3>
                    <div className="space-y-0.5">
                      {filtered.map((r) => (
                        <div
                          key={r.id}
                          onClick={() => handleResultClick(r.link)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary cursor-pointer transition-colors group"
                        >
                          {r.image ? (
                            <img
                              src={r.image}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-700"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-surface-dark-tertiary flex items-center justify-center ring-2 ring-gray-100 dark:ring-gray-700">
                              <Icon className="w-5 h-5 text-gray-400 dark:text-text-dark-muted" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-text-dark-primary truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                              {r.title}
                            </p>
                            {r.subtitle && (
                              <p className="text-xs text-gray-500 dark:text-text-dark-muted truncate mt-0.5">
                                {r.subtitle}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!query && !initialLoading && (
            <div className="text-center py-10">
              <Search className="w-8 h-8 mx-auto mb-3 text-gray-200 dark:text-text-dark-muted" />
              <p className="text-sm text-gray-400 dark:text-text-dark-secondary">
                Type to search stylists, services, and more
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
