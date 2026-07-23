"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { getCurrentUser, getAdmins, User } from "@/lib/api";
import {
  canAccessRoute,
  hasPermission,
  Permission,
  AdminType,
  ROLE_PERMISSIONS,
} from "@/lib/permissions";

// ─── Role Normalizer ──────────────────────────────────────────────────────────

function normalizeAdminType(raw: string | null | undefined): AdminType | null {
  if (!raw) return null;

  const upper = raw.trim().toUpperCase().replace(/\s+/g, "_").replace(/-/g, "_");

  const aliases: Record<string, AdminType> = {
    SUPERADMIN:    "SUPER_ADMIN",
    CONTENTADMIN:  "CONTENT_ADMIN",
    PRODUCTADMIN:  "PRODUCT_ADMIN",
    SUPER_ADMIN:   "SUPER_ADMIN",
    ADMIN:         "ADMIN",
    CONTENT_ADMIN: "CONTENT_ADMIN",
    PRODUCT_ADMIN: "PRODUCT_ADMIN",
    SUPER:         "SUPER_ADMIN",
    CONTENT:       "CONTENT_ADMIN",
    PRODUCT:       "PRODUCT_ADMIN",
  };

  const resolved = (aliases[upper] ?? upper) as AdminType;
  return (resolved in ROLE_PERMISSIONS) ? resolved : null;
}

// ─── Context Shape ────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  adminType: AdminType | null;
  loading: boolean;
  can: (permissions: Permission[]) => boolean;
  canAccess: (pathname: string) => boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  adminType: null,
  loading: true,
  can: () => true,
  canAccess: () => true,
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== "undefined") {
      const savedEmail = localStorage.getItem("user_email");
      const savedName = localStorage.getItem("user_name");
      if (savedEmail || savedName) {
        return {
          id: "",
          name: savedName || "",
          email: savedEmail || "",
          emailVerified: true,
          image: null,
          role: "",
          status: "ACTIVE",
          createdAt: "",
          updatedAt: "",
        };
      }
    }
    return null;
  });

  const [adminType, setAdminType] = useState<AdminType | null>(() => {
    if (typeof window !== "undefined") {
      return normalizeAdminType(localStorage.getItem("user_admin_type"));
    }
    return null;
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadAuth() {
      let u: User | null = null;

      try {
        const res = await getCurrentUser();
        if (cancelled) return;
        const rawData = (res as any)?.data?.user ?? (res as any)?.data ?? (res as any)?.user ?? res;
        if (rawData && typeof rawData === "object" && (rawData.email || rawData.id)) {
          u = rawData as User;
          setUser(u);
          if (typeof window !== "undefined") {
            if (u.email) localStorage.setItem("user_email", u.email);
            if (u.name) localStorage.setItem("user_name", u.name);
          }
        }
      } catch {
        if (cancelled) return;
      }

      // Check fields on the user object first
      if (u) {
        const candidate =
          normalizeAdminType((u as any).adminType) ??
          normalizeAdminType((u as any).admin_type) ??
          normalizeAdminType(u.role) ??
          normalizeAdminType((u as any).type) ??
          normalizeAdminType((u as any).userRole) ??
          normalizeAdminType((u as any).roleName);

        if (candidate) {
          setAdminType(candidate);
          if (typeof window !== "undefined") {
            localStorage.setItem("user_admin_type", candidate);
          }
          setLoading(false);
          return;
        }

        // Check getAdmins list only if user is logged in
        try {
          const adminsRes = await getAdmins({ search: u.email, limit: 100 });
          if (!cancelled && adminsRes?.data) {
            const record = adminsRes.data.find(
              (a) => a.id === u!.id || a.email === u!.email
            );

            if (record?.adminType) {
              const fromRecord = normalizeAdminType(record.adminType);
              if (fromRecord) {
                setAdminType(fromRecord);
                if (typeof window !== "undefined") {
                  localStorage.setItem("user_admin_type", fromRecord);
                }
                setLoading(false);
                return;
              }
            }
          }
        } catch {
          // getAdmins failed (e.g. 403 Forbidden for non-superadmins)
        }
      }

      // Fallback: check cached adminType from localStorage
      const cachedType = typeof window !== "undefined" ? normalizeAdminType(localStorage.getItem("user_admin_type")) : null;
      if (cachedType) {
        setAdminType(cachedType);
        setLoading(false);
        return;
      }

      // Final safety fallback: default to ADMIN (not SUPER_ADMIN) so non-superadmins do NOT get elevated
      setAdminType((prev) => prev ?? "ADMIN");
      setLoading(false);
    }

    loadAuth();
    return () => { cancelled = true; };
  }, []);

  const can = (permissions: Permission[]): boolean => {
    if (adminType) {
      return hasPermission(adminType, permissions);
    }
    if (loading) return true;
    return false;
  };

  const canAccess = (pathname: string): boolean => {
    if (adminType) {
      return canAccessRoute(adminType, pathname);
    }
    if (loading) return true;
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, adminType, loading, can, canAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
