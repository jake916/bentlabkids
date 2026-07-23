"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Tv,
  LayoutGrid,
  BookOpen,
  HandHeart,
  Video,
  ShoppingBag,
  Tag,
  ClipboardList,
  Users,
  Settings,
  ShieldCheck,
  UserCog,
  Headphones,
  LogOut,
  X,
} from "lucide-react";
import { signOut } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Permission } from "@/lib/permissions";

// ─── Nav Data ─────────────────────────────────────────────────────────────────
//
// Each nav item declares which permissions are required to see it.
// An empty `permissions` array means it's visible to all authenticated admins.

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  /** User needs at least one of these permissions to see this item. Empty = everyone. */
  permissions: Permission[];
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: "MAIN",
    items: [
      { label: "Home",  href: "/dashboard", icon: LayoutDashboard, permissions: [] },
      { label: "Media", href: "/media",     icon: Tv,              permissions: ["MANAGE_CONTENT", "MANAGE_PRODUCTS"] },
    ],
  },
  {
    label: "CONTENT",
    items: [
      { label: "Content Categories", href: "/categories",    icon: LayoutGrid, permissions: ["MANAGE_CONTENT"] },
      { label: "Bible Stories",      href: "/bible-stories", icon: BookOpen,   permissions: ["MANAGE_CONTENT"] },
      { label: "Prayers",            href: "/prayers",       icon: HandHeart,  permissions: ["MANAGE_CONTENT"] },
      { label: "Videos",             href: "/videos",        icon: Video,      permissions: ["MANAGE_CONTENT"] },
    ],
  },
  {
    label: "STORE",
    items: [
      { label: "Products",           href: "/products",           icon: ShoppingBag,  permissions: ["MANAGE_PRODUCTS"] },
      { label: "Product Categories", href: "/product-categories", icon: Tag,          permissions: ["MANAGE_PRODUCTS"] },
      { label: "Orders",             href: "/orders",             icon: ClipboardList, permissions: ["MANAGE_PRODUCTS"] },
      { label: "Customers",          href: "/customers",          icon: Users,         permissions: ["MANAGE_USERS", "MANAGE_PRODUCTS"] },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { label: "Settings",          href: "/settings",          icon: Settings,    permissions: ["MANAGE_SYSTEM"] },
      { label: "Admin Management",  href: "/admin-management",  icon: ShieldCheck, permissions: ["MANAGE_ADMINS"] },
      { label: "App Users",         href: "/app-users",         icon: UserCog,     permissions: ["MANAGE_USERS", "MANAGE_SYSTEM"] },
      { label: "Support",           href: "/support",           icon: Headphones,  permissions: ["MANAGE_SYSTEM", "MANAGE_ADMINS"] },
    ],
  },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface SidebarProps {
  userName?: string;
  onClose?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Sidebar({ userName = "Administrator", onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { can, user, adminType } = useAuth();

  // Derive display name from name or email prefix
  const displayName = (() => {
    if (user?.name && user.name.trim()) {
      const parts = user.name.trim().split(" ");
      if (parts.length >= 2) return `${parts[0]} ${parts[1][0]}.`;
      return parts[0];
    }
    if (user?.email) {
      return user.email.split("@")[0];
    }
    return userName !== "Administrator" ? userName : "Admin";
  })();

  // Map adminType to a human-readable label + badge colour
  const getRoleDisplay = (type: string | null) => {
    switch (type) {
      case "SUPER_ADMIN":   return { label: "Super Admin",   color: "text-rose-600 bg-rose-50 border-rose-200" };
      case "ADMIN":         return { label: "Admin",         color: "text-blue-600 bg-blue-50 border-blue-200" };
      case "CONTENT_ADMIN": return { label: "Content Admin", color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
      case "PRODUCT_ADMIN": return { label: "Product Admin", color: "text-amber-600 bg-amber-50 border-amber-200" };
      default:              return { label: "Administrator",  color: "text-zinc-500 bg-zinc-100 border-zinc-200" };
    }
  };
  const roleDisplay = getRoleDisplay(adminType);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } catch {
      // Even if the API call fails, redirect to login
    } finally {
      router.push("/login");
    }
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  // Filter sections: keep only items the current user has permission to see.
  // Hide entire section headers if they have no visible items.
  const visibleSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) => item.permissions.length === 0 || can(item.permissions)
    ),
  })).filter((section) => section.items.length > 0);

  return (
    <aside className="sticky top-0 h-screen w-[240px] flex flex-col bg-white border-r border-zinc-100 shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-zinc-100 flex items-center justify-between">
        <Image
          src="/logogo.png"
          alt="Bentlab Kids TV"
          width={150}
          height={48}
          className="h-12 w-auto object-contain"
          priority
        />
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600 md:hidden transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin scrollbar-thumb-zinc-100">
        {visibleSections.map((section) => (
          <div key={section.label}>
            {/* Section Label */}
            <p className="px-3 mb-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              {section.label}
            </p>

            {/* Items */}
            <ul className="space-y-0.5">
              {section.items.map(({ label, href, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group
                        ${
                          active
                            ? "bg-[#FFF0F2] text-[#B31046]"
                            : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
                        }`}
                    >
                      <Icon
                        className={`w-4.5 h-4.5 shrink-0 transition-colors
                          ${active ? "text-[#B31046]" : "text-zinc-400 group-hover:text-zinc-600"}`}
                        size={18}
                      />
                      <span className="truncate">{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer: User + Logout */}
      <div className="border-t border-zinc-100 px-3 py-4 space-y-1">
        {/* User row */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
          <div className="w-9 h-9 rounded-full bg-[#FFF0F2] flex items-center justify-center shrink-0 text-[#B31046] font-extrabold text-sm select-none">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-zinc-800 truncate leading-tight">{displayName}</span>
            <span className={`mt-0.5 inline-block self-start px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border ${roleDisplay.color}`}>
              {roleDisplay.label}
            </span>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-bold text-[#B31046] hover:bg-[#FFF0F2] transition-all duration-150 cursor-pointer disabled:opacity-60"
        >
          <LogOut className="w-4.5 h-4.5 shrink-0" size={18} />
          <span>{isSigningOut ? "Signing out..." : "Logout"}</span>
        </button>
      </div>
    </aside>
  );
}
