import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  // Disabled global redirect - let pages handle their own auth redirects via useAuth hook
  return;
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    // The redirect check is now inside redirectToLoginIfUnauthorized
    redirectToLoginIfUnauthorized(error);
    
    // Don't log authentication errors on public pages (home, signin, signup, etc.)
    const publicPaths = ['/', '/signin', '/signup', '/about', '/jobs', '/forgot-password', '/reset-password', '/verify-email'];
    const isPublicPage = publicPaths.some(path => window.location.pathname === path || window.location.pathname.startsWith('/jobs/'));
    const isAuthError = error instanceof TRPCClientError && error.message?.includes('Please login');
    
    if (!isPublicPage || !isAuthError) {
      console.error("[API Query Error]", error);
    }
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    
    // Don't log authentication errors on public pages
    const publicPaths = ['/', '/signin', '/signup', '/about', '/jobs', '/forgot-password', '/reset-password', '/verify-email'];
    const isPublicPage = publicPaths.some(path => window.location.pathname === path || window.location.pathname.startsWith('/jobs/'));
    const isAuthError = error instanceof TRPCClientError && error.message?.includes('Please login');
    
    if (!isPublicPage || !isAuthError) {
      console.error("[API Mutation Error]", error);
    }
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        // Get token from localStorage
        const token = localStorage.getItem('auth_token');
        console.log('[tRPC Client] Token from localStorage:', token ? 'EXISTS' : 'MISSING');
        
        const headers = {
          ...(init?.headers || {}),
          // Add Authorization header if token exists
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        };
        console.log('[tRPC Client] Request headers:', headers);
        
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include", // Still send cookies as fallback
          headers,
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
