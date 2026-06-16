import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { getMyTransactions } from '../../api/payments';

const T = {
  navy: "#0B1A33",
  ink: "#0A1424",
  inkFaint: "#8E9FB2",
  inkSoft: "#5A6E8A",
  green: "#059669",
  greenLight: "#ECFDF5",
  red: "#DC2626",
  redLight: "#FEF2F2",
  canvas: "#FFFFFF",
  line: "#E9EEF5",
  raised: "#F8FAFD",
  bg: "#F4F7FC",
};

const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  success: { icon: CheckCircle, color: T.green, bg: T.greenLight, label: 'Paid' },
  failed: { icon: XCircle, color: T.red, bg: T.redLight, label: 'Failed' },
  pending: { icon: Clock, color: '#D4A047', bg: '#FDF8F0', label: 'Pending' },
};

export default function PaymentHistory() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try { setTransactions(await getMyTransactions()); }
      catch { /* ignore */ }
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1 className="text-2xl font-bold mb-6" style={{ color: T.ink, fontFamily: "'Playfair Display', Georgia, serif" }}>
        Payment History
      </h1>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" style={{ color: T.inkFaint }} /></div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-20">
          <Wallet size={40} className="mx-auto mb-4" style={{ color: T.inkFaint }} />
          <p className="text-sm" style={{ color: T.inkFaint }}>No transactions yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((tx: any) => {
            const cfg = statusConfig[tx.status] || statusConfig.pending;
            const Icon = cfg.icon;
            return (
              <div key={tx._id} className="flex items-center gap-4 p-4 rounded-xl" style={{ background: T.canvas, border: `1px solid ${T.line}` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: cfg.bg }}>
                  <Icon size={18} style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: T.ink }}>GH₵ {tx.amount?.toFixed(2) || '0.00'}</p>
                  <p className="text-xs" style={{ color: T.inkFaint }}>
                    {tx.reference || tx._id?.slice(-8)} • {new Date(tx.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
                  {cfg.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
