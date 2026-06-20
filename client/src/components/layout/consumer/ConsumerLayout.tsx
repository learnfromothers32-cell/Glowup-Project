import { Outlet } from "react-router-dom";
import ConsumerNavbar from "./ConsumerNavbar";
import ConsumerFooter from "./ConsumerFooter";

export default function ConsumerLayout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-dark flex flex-col">
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .consumer-fade-in { opacity: 1 !important; transform: none !important; }
        }
      `}</style>
      <ConsumerNavbar />
      <main className="flex-1 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <Outlet />
        </div>
      </main>
      <ConsumerFooter />
    </div>
  );
}
