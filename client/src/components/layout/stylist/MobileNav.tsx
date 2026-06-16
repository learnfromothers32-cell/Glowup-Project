import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  Wallet,
  Radio,
  Menu,
  MessageSquare,
  Users,
} from "lucide-react";

const navItems = [
  { path: "/stylist/dashboard", label: "Home", icon: LayoutDashboard },
  { path: "/stylist/bookings", label: "Bookings", icon: BookOpen },
  { path: "/stylist/calendar", label: "Calendar", icon: CalendarDays },
  { path: "/stylist/messages", label: "Messages", icon: MessageSquare },
  { path: "/stylist/clients", label: "Clients", icon: Users },
  { path: "/stylist/earnings", label: "Earnings", icon: Wallet },
  { path: "/stylist/live", label: "Live", icon: Radio },
];

interface MobileNavProps {
  onOpenMenu?: () => void;
}

export default function MobileNav({ onOpenMenu }: MobileNavProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 lg:hidden flex items-center justify-around py-1 bg-white dark:bg-surface-dark-secondary border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_20px_rgba(15,31,61,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]"
      style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom, 0px))" }}
    >
      {navItems.map(({ path, label, icon: Icon }) => {
        const active = location.pathname.startsWith(path);

        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`flex flex-col items-center gap-0.5 px-1.5 py-1 text-[10px] font-semibold transition-all min-h-[44px] min-w-[48px] ${
              active
                ? "text-gray-900 dark:text-text-dark-primary"
                : "text-gray-400 dark:text-text-dark-muted"
            }`}
          >
            <Icon size={18} strokeWidth={active ? 2.5 : 1.5} />
            <span>{label}</span>
          </button>
        );
      })}

      <button
        onClick={onOpenMenu}
        className="flex flex-col items-center gap-0.5 px-1.5 py-1 text-[10px] font-semibold min-h-[44px] min-w-[48px] text-gray-400 dark:text-text-dark-muted"
      >
        <Menu size={18} />
        <span>More</span>
      </button>
    </nav>
  );
}
