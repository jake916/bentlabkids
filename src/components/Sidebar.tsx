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
  CircleUserRound,
} from "lucide-react";
import { signOut } from "@/lib/api";

// ─── Nav Data ─────────────────────────────────────────────────────────────────

const NAV_SECTIONS = [
  {
    label: "MAIN",
    items: [
      { label: "Home", href: "/dashboard", icon: LayoutDashboard },
      { label: "Media", href: "/media", icon: Tv },
    ],
  },
  {
    label: "CONTENT",
    items: [
      { label: "Content Categories", href: "/categories", icon: LayoutGrid },
      { label: "Bible Stories", href: "/bible-stories", icon: BookOpen },
      { label: "Prayers", href: "/prayers", icon: HandHeart },
      { label: "Videos", href: "/videos", icon: Video },
    ],
  },
  {
    label: "STORE",
    items: [
      { label: "Products", href: "/products", icon: ShoppingBag },
      { label: "Product Categories", href: "/dashboard/product-categories", icon: Tag },
      { label: "Orders", href: "/dashboard/orders", icon: ClipboardList },
      { label: "Customers", href: "/dashboard/customers", icon: Users },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
      { label: "Admin Management", href: "/dashboard/admin-management", icon: ShieldCheck },
      { label: "App Users", href: "/dashboard/app-users", icon: UserCog },
      { label: "Support", href: "/dashboard/support", icon: Headphones },
    ],
  },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface SidebarProps {
  userName?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Sidebar({ userName = "Administrator" }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Show only first name + initial for the user label
  const displayName = (() => {
    const parts = userName.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0]} ${parts[1][0]}.`;
    }
    return parts[0];
  })();

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } catch {
      // Even if the API call fails, clear session and redirect
    } finally {
      router.push("/login");
    }
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside className="sticky top-0 h-screen w-[240px] flex flex-col bg-white border-r border-zinc-100 shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-zinc-100">
        <Image
          src="/logogo.png"
          alt="Bentlab Kids TV"
          width={150}
          height={48}
          className="h-12 w-auto object-contain"
          priority
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin scrollbar-thumb-zinc-100">
        {NAV_SECTIONS.map((section) => (
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
          <div className="w-8 h-8 rounded-full bg-[#FFF0F2] flex items-center justify-center shrink-0">
            <CircleUserRound className="w-5 h-5 text-[#B31046]" />
          </div>
          <span className="text-sm font-semibold text-zinc-700 truncate">{displayName}</span>
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
