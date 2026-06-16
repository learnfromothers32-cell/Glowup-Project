import { useState } from "react";
import { Star, MessageSquare, Sparkles, X, Loader2 } from "lucide-react";
import { Modal } from "./SharedUI";
import { fmtDate } from "./StatusBadge";

interface ReviewModalProps {
  stylistName?: string;
  bookingDate: string;
  onRatingChange: (r: number) => void;
  onCommentChange: (c: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  loading: boolean;
}

export default function ReviewModal({
  stylistName,
  bookingDate,
  onRatingChange,
  onCommentChange,
  onSubmit,
  onClose,
  loading,
}: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hover, setHover] = useState(0);
  const display = hover || rating;
  const labels = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

  const handleRating = (r: number) => {
    setRating(r);
    onRatingChange(r);
  };

  const handleComment = (c: string) => {
    setComment(c);
    onCommentChange(c);
  };

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Leave a Review</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {stylistName} · {fmtDate(bookingDate)}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-100">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <Sparkles size={14} className="text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-amber-700">Earn 20 reward points</p>
            <p className="text-[11px] text-amber-500">Share your experience to earn points.</p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-4">How was it?</p>
          <div className="flex items-center justify-center gap-2 mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => handleRating(s)}
                onMouseEnter={() => setHover(s)}
                onMouseLeave={() => setHover(0)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  size={30}
                  className={display >= s ? "text-amber-400" : "text-gray-200"}
                  fill={display >= s ? "#f59e0b" : "none"}
                />
              </button>
            ))}
          </div>
          {display > 0 && <p className="text-sm font-bold text-amber-500">{labels[display]}</p>}
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
            Comments <span className="normal-case font-normal">(optional)</span>
          </p>
          <textarea
            value={comment}
            onChange={(e) => handleComment(e.target.value)}
            placeholder="Share your experience…"
            maxLength={400}
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-300 resize-none focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
          />
          <p className="text-right text-[11px] text-gray-300 mt-1">{comment.length}/400</p>
        </div>

        <button
          onClick={onSubmit}
          disabled={loading}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] ${
            loading
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gray-900 text-white hover:bg-gray-800 shadow-md"
          }`}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Submitting…
            </>
          ) : (
            <>
              <MessageSquare size={14} />
              Submit Review
            </>
          )}
        </button>
      </div>
    </Modal>
  );
}
