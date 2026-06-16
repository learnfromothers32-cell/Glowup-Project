import { useEffect, useState } from "react";
import { getStylistById } from "../api/stylists";
import { getStylistReviews } from "../api/reviews";

export function useStylistDetail(id?: string) {
  const [stylist, setStylist] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    let alive = true;

    const fetchDetail = async () => {
      try {
        const found = await getStylistById(id);
        if (!alive) return;

        setStylist({
          ...found,
          reviews: [],
          reviewCount: found.reviewCount || 0,
        });
        setLoading(false);

        try {
          const rawReviews = await getStylistReviews(id);
          if (!alive) return;
          const reviews = (rawReviews || []).map((r: any) => ({
            user: r.clientId?.name || r.userName || "Customer",
            rating: r.rating || 0,
            comment: r.comment || "",
            date: r.createdAt
              ? new Date(r.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "",
          }));
          if (alive) {
            setStylist((prev: any) =>
              prev ? { ...prev, reviews, reviewCount: reviews.length } : prev
            );
          }
        } catch {
          // Reviews are non-critical — stylist renders with empty reviews
        }
      } catch (err) {
        if (alive) setLoading(false);
      }
    };

    fetchDetail();

    return () => {
      alive = false;
    };
  }, [id]);

  return { stylist, setStylist, loading };
}
