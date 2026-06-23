"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  HandHeart,
  Video,
  ShoppingBag,
  Package,
  TrendingUp,
  Search,
  Bell,
  CircleUserRound,
  Plus,
  Play,
  LayoutGrid,
} from "lucide-react";
import { getCurrentUser, getAdminStats, AdminStatsResponse, getStories } from "@/lib/api";
import DashboardSkeleton from "@/components/DashboardSkeleton";

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus = "Pending" | "Processing" | "Delivered";
type StoryStatus = "Published" | "Draft" | "Scheduled";

interface StatCard {
  label: string;
  value: number;
  change?: number;
  note?: string;
  attention?: boolean;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

interface Story {
  id: string;
  title: string;
  ageRange: string;
  book: string;
  status: StoryStatus;
  avatarBg: string;
  initials: string;
}

interface Order {
  id: string;
  customer: string;
  product: string;
  status: OrderStatus;
}

// ─── Static Data ─────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  {
    label: "New Story",
    href: "/bible-stories/new",
    icon: BookOpen,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-500",
  },
  {
    label: "Add Prayer",
    href: "/prayers/new",
    icon: HandHeart,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
  },
  {
    label: "Upload Video",
    href: "/videos/new",
    icon: Play,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-500",
  },
  {
    label: "Add Product",
    href: "/dashboard/products/new",
    icon: ShoppingBag,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
  },
];

// Stories are loaded dynamically from the backend

const RECENT_ORDERS: Order[] = [
  {
    id: "0841",
    customer: "Adaeze Obi",
    product: "Kids Faith Tote Bag x2",
    status: "Pending",
  },
  {
    id: "0840",
    customer: "Emeka Williams",
    product: "Bible Story Book Set",
    status: "Processing",
  },
  {
    id: "0839",
    customer: "Chioma Balogun",
    product: "Jesus Loves Me Socks x3",
    status: "Delivered",
  },
  {
    id: "0838",
    customer: "Funke Adeyemi",
    product: "Armour of God T-shirt",
    status: "Delivered",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAgeGroupLabel(group?: string) {
  if (!group) return "All Ages";
  switch (group.toUpperCase()) {
    case "TODDLER": return "Ages 1–3";
    case "PRESCHOOL": return "Ages 3–5";
    case "EARLY": return "Ages 6–8";
    case "KIDS": return "Ages 9–12";
    default: return group;
  }
}

function getAvatarBg(title: string) {
  const colors = [
    "bg-orange-400",
    "bg-zinc-600",
    "bg-slate-400",
    "bg-amber-700",
    "bg-rose-500",
    "bg-blue-500",
    "bg-emerald-500",
    "bg-purple-500",
    "bg-sky-500",
  ];
  let sum = 0;
  for (let i = 0; i < title.length; i++) {
    sum += title.charCodeAt(i);
  }
  return colors[sum % colors.length];
}

function storyStatusStyle(status: StoryStatus) {
  switch (status) {
    case "Published":
      return "bg-emerald-50 text-emerald-600 border border-emerald-200";
    case "Scheduled":
      return "bg-blue-50 text-blue-600 border border-blue-200";
    case "Draft":
    default:
      return "bg-zinc-100 text-zinc-500 border border-zinc-200";
  }
}

function orderStatusStyle(status: OrderStatus) {
  switch (status) {
    case "Pending":
      return "bg-amber-50 text-amber-600 border border-amber-200";
    case "Processing":
      return "bg-blue-50 text-blue-600 border border-blue-200";
    case "Delivered":
      return "bg-emerald-50 text-emerald-600 border border-emerald-200";
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [userName, setUserName] = useState<string>("Curator");
  const [statsData, setStatsData] = useState<AdminStatsResponse["data"] | null>(null);
  const [recentStories, setRecentStories] = useState<Story[]>([]);
  const [loadingStories, setLoadingStories] = useState<boolean>(true);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);

  useEffect(() => {
    getCurrentUser()
      .then((res) => {
        const name = res?.data?.user?.name;
        if (name) setUserName(name.split(" ")[0]); // use first name only
      })
      .catch(() => {
        // silently fall back to default
      })
      .finally(() => {
        setLoadingUser(false);
      });

    getAdminStats()
      .then((res) => {
        if (res?.success) {
          setStatsData(res.data);
        }
      })
      .catch((err) => {
        console.warn("Could not retrieve live dashboard stats. Dashboard is in empty state.", err);
      })
      .finally(() => {
        setLoadingStats(false);
      });

    setLoadingStories(true);
    getStories()
      .then((res) => {
        if (res?.success && res.data) {
          // Sort by createdAt descending and take top 4
          const sorted = [...res.data]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 4);

          const mapped: Story[] = sorted.map((item) => {
            const initials = item.title ? item.title.charAt(0).toUpperCase() : "?";
            const avatarBg = getAvatarBg(item.title || "");
            
            // Format status: DRAFT -> Draft, PUBLISHED -> Published, SCHEDULED -> Scheduled
            let status: StoryStatus = "Draft";
            if (item.status === "PUBLISHED") status = "Published";
            if (item.status === "SCHEDULED") status = "Scheduled";

            return {
              id: item.id,
              title: item.title,
              ageRange: getAgeGroupLabel(item.ageGroup || undefined),
              book: item.verseReference || item.category?.name || "Bible Story",
              status,
              avatarBg,
              initials,
            };
          });
          setRecentStories(mapped);
        }
      })
      .catch((err) => {
        console.warn("Could not retrieve live recent stories.", err);
      })
      .finally(() => {
        setLoadingStories(false);
      });
  }, []);

  const isReady = !loadingUser && !loadingStats && !loadingStories;

  if (!isReady) {
    return <DashboardSkeleton />;
  }

  const statsList = [
    {
      label: "Bible Stories",
      value: statsData?.bibleStories?.count ?? 0,
      change: statsData?.bibleStories?.thisweek ?? 0,
      icon: BookOpen,
      iconBg: "bg-rose-50",
      iconColor: "text-rose-500",
    },
    {
      label: "Prayers",
      value: statsData?.prayers?.count ?? 0,
      change: statsData?.prayers?.thisweek ?? 0,
      icon: HandHeart,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
    },
    {
      label: "Videos",
      value: statsData?.videos?.count ?? 0,
      change: statsData?.videos?.thisweek ?? 0,
      icon: Play,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-500",
    },
    {
      label: "Categories",
      value: statsData?.categories?.count ?? 0,
      icon: LayoutGrid,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-500",
    },
    {
      label: "App Users",
      value: statsData?.users?.count ?? 0,
      change: statsData?.users?.thisweek ?? 0,
      icon: CircleUserRound,
      iconBg: "bg-pink-50",
      iconColor: "text-pink-500",
    },
  ];
  return (
    <div className="min-h-full p-8 space-y-8 font-sans">

      {/* ── Header ── */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#B31046] tracking-tight">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Welcome back, {userName}.</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search content..."
              className="pl-9 pr-4 py-2 text-sm bg-[#FFF0F2]/60 border border-zinc-200 rounded-full focus:outline-none focus:border-[#B31046]/40 focus:bg-white transition-all w-52 placeholder-zinc-400"
            />
          </div>

          {/* Bell */}
          <button className="relative p-2 rounded-full hover:bg-zinc-100 transition-colors">
            <Bell className="w-5 h-5 text-zinc-500" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#B31046] rounded-full" />
          </button>

          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-[#FFF0F2] flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-[#B31046]/30 transition-all">
            <CircleUserRound className="w-6 h-6 text-[#B31046]" />
          </div>
        </div>
      </header>

      {/* ── Stats Row ── */}
      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {statsList.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-100 space-y-3 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
                <span className="text-sm font-semibold text-zinc-600">{stat.label}</span>
              </div>

              <div>
                <p className="text-3xl font-extrabold text-zinc-900">{stat.value}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-zinc-400">this week</span>
                  {stat.change !== undefined && stat.change > 0 && (
                    <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-500">
                      <TrendingUp className="w-3 h-3" />
                      {stat.change}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* ── Quick Actions ── */}
      <section>
        <h2 className="text-base font-bold text-zinc-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className="bg-white rounded-2xl p-6 flex flex-col items-center gap-4 border border-zinc-100 shadow-sm hover:shadow-md hover:border-[#B31046]/20 active:scale-[0.98] transition-all group"
              >
                <div className={`w-14 h-14 rounded-2xl ${action.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-7 h-7 ${action.iconColor}`} />
                </div>
                <span className="text-sm font-semibold text-zinc-700">{action.label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Bottom Row ── */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-8">

        {/* Recent Bible Stories */}
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-50">
            <h2 className="text-base font-bold text-zinc-800">Recent Bible Stories</h2>
            <Link
              href="/bible-stories"
              className="text-sm font-semibold text-[#B31046] hover:underline"
            >
              View All
            </Link>
          </div>

          <ul className="divide-y divide-zinc-50">
            {loadingStories ? (
              <li className="px-6 py-8 text-center text-sm text-zinc-400">
                Loading recent stories...
              </li>
            ) : recentStories.length === 0 ? (
              <li className="px-6 py-8 text-center text-sm text-zinc-400">
                No recent stories found.
              </li>
            ) : (
              recentStories.map((story) => (
                <li key={story.id} className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-50 transition-colors">
                  {/* Thumbnail */}
                  <div className={`w-10 h-10 rounded-full ${story.avatarBg} flex items-center justify-center shrink-0 text-white font-bold text-sm`}>
                    {story.initials}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-800 truncate">{story.title}</p>
                    <p className="text-xs text-zinc-400">{story.ageRange} · {story.book}</p>
                  </div>

                  {/* Badge */}
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full shrink-0 ${storyStatusStyle(story.status)}`}>
                    {story.status}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-50">
            <h2 className="text-base font-bold text-zinc-800">Recent Orders</h2>
            <Link
              href="/dashboard/orders"
              className="text-sm font-semibold text-[#B31046] hover:underline"
            >
              View All
            </Link>
          </div>

          <ul className="divide-y divide-zinc-50">
            {RECENT_ORDERS.map((order) => (
              <li key={order.id} className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-50 transition-colors">
                {/* Order ID */}
                <span className="text-xs font-bold text-[#B31046] shrink-0">#{order.id}</span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-800">{order.customer}</p>
                  <p className="text-xs text-zinc-400 truncate">{order.product}</p>
                </div>

                {/* Badge */}
                <span className={`text-xs font-semibold px-3 py-1 rounded-full shrink-0 ${orderStatusStyle(order.status)}`}>
                  {order.status}
                </span>
              </li>
            ))}
          </ul>
        </div>

      </section>
    </div>
  );
}
