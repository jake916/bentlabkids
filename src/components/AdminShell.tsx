"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { Menu } from "lucide-react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { canAccessRoute } from "@/lib/permissions";

// ─── Inner shell (needs access to the auth context) ───────────────────────────

function InnerShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, adminType, loading } = useAuth();

  // Automatically close mobile sidebar when path changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Once the user loads, redirect to /dashboard if they don't have access
  // to the current route.
  useEffect(() => {
    if (loading) return;
    if (!canAccessRoute(adminType, pathname)) {
      router.replace("/dashboard");
    }
  }, [loading, adminType, pathname, router]);

  const displayName = user?.name ?? "Administrator";

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F9FC] relative">
      {/* Sidebar overlay wrapper */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:relative md:translate-x-0 shrink-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <Sidebar userName={displayName} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Dimmed overlay backdrop on mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-zinc-950/40 z-40 md:hidden transition-opacity"
        />
      )}

      {/* Main viewport area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header Bar */}
        <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-zinc-100 md:hidden shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 rounded-xl text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 transition-all cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-extrabold text-[#B31046] tracking-tight text-lg">Bentlab Kids</span>
          </div>
        </header>

        {/* Scrollable page body */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

// ─── Public export — wraps with AuthProvider ──────────────────────────────────

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <InnerShell>{children}</InnerShell>
    </AuthProvider>
  );
}
