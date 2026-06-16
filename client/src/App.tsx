import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Suspense } from "react";
import AppRouter from "./router/AppRouter";
import StructuredData from "./components/seo/StructuredData";
import { FollowProvider } from "./context/FollowContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <FollowProvider>
          <StructuredData />
          <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-white"><div className="w-10 h-10 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" /></div>}>
            <AppRouter />
          </Suspense>
        </FollowProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
