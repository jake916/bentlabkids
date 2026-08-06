"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Users,
  UserPlus,
  Zap,
  ChevronDown,
  RotateCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Ban,
} from "lucide-react";
import { getAppUsers, AppUserBackend } from "@/lib/api";
import { getStoredAppUsers } from "@/lib/app-users-data";

export interface MappedAppUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  phone: string;
  location: string;
  dateJoined: string;
  lastActive: string;
  rawDateJoined: string;
  totalOrders: number;
  status: "ACTIVE" | "PENDING_INVITATION" | "SUSPENDED";
  avatarInitials: string;
  avatarColorBg: string;
  avatarColorText: string;
}

function getAvatarStyle(name: string, email: string) {
  const displayName = (name || email.split("@")[0] || "User").trim();
  const parts = displayName.split(" ").filter(Boolean);
  let initials = "?";
  if (parts.length >= 2) {
    initials = (parts[0][0] + parts[1][0]).toUpperCase();
  } else if (parts.length === 1 && parts[0].length > 0) {
    initials = parts[0].slice(0, 2).toUpperCase();
  }

  const palette = [
    { bg: "bg-[#FFF0F2]", text: "text-[#B31046]" },
    { bg: "bg-blue-50", text: "text-blue-600" },
    { bg: "bg-emerald-50", text: "text-emerald-700" },
    { bg: "bg-amber-50", text: "text-amber-700" },
    { bg: "bg-indigo-50", text: "text-indigo-700" },
    { bg: "bg-purple-50", text: "text-purple-700" },
  ];

  let sum = 0;
  for (let i = 0; i < displayName.length; i++) {
    sum += displayName.charCodeAt(i);
  }

  const picked = palette[sum % palette.length];
  return {
    initials,
    bg: picked.bg,
    text: picked.text,
  };
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatLastActive(dateStr?: string | null): string {
  if (!dateStr) return "Never";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    if (diffMs < 0) return formatDate(dateStr);

    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 2) return "Just now";
    if (diffMins < 60) return `${diffMins} mins ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return formatDate(dateStr);
  } catch {
    return dateStr;
  }
}

function mapBackendUserToAppUser(u: AppUserBackend): MappedAppUser {
  const avatar = getAvatarStyle(u.name || "", u.email);
  return {
    id: u.id,
    name: u.name || u.email.split("@")[0] || "App User",
    email: u.email,
    image: u.image || null,
    phone: u.phone || "N/A",
    location: u.location || "N/A",
    rawDateJoined: u.dateJoined,
    dateJoined: formatDate(u.dateJoined),
    lastActive: formatLastActive(u.lastActive),
    totalOrders: u.totalOrders ?? 0,
    status: u.status || "ACTIVE",
    avatarInitials: avatar.initials,
    avatarColorBg: avatar.bg,
    avatarColorText: avatar.text,
  };
}

function mapLocalUserToAppUser(u: any): MappedAppUser {
  const avatar = getAvatarStyle(u.name || "", u.email);
  let status: "ACTIVE" | "PENDING_INVITATION" | "SUSPENDED" = "ACTIVE";
  if (u.status === "New") status = "PENDING_INVITATION";
  else if (u.status === "Inactive") status = "SUSPENDED";

  return {
    id: u.id,
    name: u.name,
    email: u.email,
    image: null,
    phone: u.phone || "N/A",
    location: u.location || "N/A",
    rawDateJoined: u.dateJoined,
    dateJoined: formatDate(u.dateJoined),
    lastActive: u.lastActivity || "N/A",
    totalOrders: u.totalOrders || 0,
    status,
    avatarInitials: avatar.initials,
    avatarColorBg: avatar.bg,
    avatarColorText: avatar.text,
  };
}

export default function AppUsersPage() {
  const [users, setUsers] = useState<MappedAppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  // Filters & Pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: itemsPerPage,
    totalPages: 1,
  });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAppUsers({
        search: searchQuery.trim() || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        sort: sortBy,
        page,
        limit: itemsPerPage,
      });

      if (res && res.success && Array.isArray(res.data)) {
        setUsers(res.data.map(mapBackendUserToAppUser));
        setMeta({
          total: res.meta?.total ?? res.data.length,
          page: res.meta?.page ?? page,
          limit: res.meta?.limit ?? itemsPerPage,
          totalPages: res.meta?.totalPages ?? (Math.ceil((res.meta?.total ?? res.data.length) / itemsPerPage) || 1),
        });
        setIsUsingFallback(false);
      } else {
        throw new Error("Invalid API response structure");
      }
    } catch (err) {
      console.warn("Failed to fetch users from API, using fallback data:", err);
      setIsUsingFallback(true);

      const localData = getStoredAppUsers().map(mapLocalUserToAppUser);
      const filtered = localData.filter((u) => {
        const matchesSearch =
          !searchQuery.trim() ||
          u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus =
          statusFilter === "ALL" || u.status === statusFilter;

        return matchesSearch && matchesStatus;
      });

      filtered.sort((a, b) => {
        if (sortBy === "oldest") {
          return new Date(a.rawDateJoined).getTime() - new Date(b.rawDateJoined).getTime();
        }
        return new Date(b.rawDateJoined).getTime() - new Date(a.rawDateJoined).getTime();
      });

      const total = filtered.length;
      const totalPages = Math.ceil(total / itemsPerPage) || 1;
      const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

      setUsers(paginated);
      setMeta({
        total,
        page,
        limit: itemsPerPage,
        totalPages,
      });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, sortBy, page, itemsPerPage]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Reset page when filters change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as "newest" | "oldest");
    setPage(1);
  };

  // Helper status badge renderer
  const renderStatusBadge = (status: "ACTIVE" | "PENDING_INVITATION" | "SUSPENDED") => {
    if (status === "ACTIVE") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-emerald-50 text-emerald-700 border border-emerald-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Active
        </span>
      );
    }
    if (status === "PENDING_INVITATION") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-amber-50 text-amber-700 border border-amber-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Pending Invite
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-rose-50 text-rose-700 border border-rose-200/80">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        Suspended
      </span>
    );
  };

  const activeCount = users.filter((u) => u.status === "ACTIVE").length;
  const pendingCount = users.filter((u) => u.status === "PENDING_INVITATION").length;

  return (
    <div className="min-h-full p-8 space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">App Users</h1>
          <p className="text-sm text-zinc-400 font-semibold leading-relaxed">
            All registered users of the Bentlab Kids mobile app
          </p>
        </div>

        <button
          onClick={loadUsers}
          disabled={loading}
          className="self-start sm:self-auto px-4 py-2.5 bg-white border border-zinc-200 hover:border-[#B31046] text-zinc-700 hover:text-[#B31046] text-xs font-bold rounded-2xl transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#B31046]" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Total Users */}
        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-xs relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-[#B31046] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-full bg-[#FFF0F2] flex items-center justify-center text-[#B31046] shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5">
              Live
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-extrabold text-zinc-400 block">Total Signed-Up Users</span>
            <span className="text-3xl font-black text-zinc-800 tracking-tight block mt-1">
              {loading ? "..." : meta.total.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Card 2: Active Users */}
        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-xs relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-emerald-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5">
              Active Status
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-extrabold text-zinc-400 block">Active Users (Page)</span>
            <span className="text-3xl font-black text-zinc-800 tracking-tight block mt-1">
              {loading ? "..." : activeCount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Card 3: Pending Invitations */}
        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-xs relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-amber-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <span className="bg-amber-50 text-amber-600 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5">
              Pending
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-extrabold text-zinc-400 block">Pending Invitations (Page)</span>
            <span className="text-3xl font-black text-zinc-800 tracking-tight block mt-1">
              {loading ? "..." : pendingCount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* ── Control & Search Bar ── */}
      <div className="bg-[#FFF0F2]/40 border border-[#FFF0F2]/60 rounded-3xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center">
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full bg-white border border-zinc-200/80 rounded-2xl p-2.5 pl-10 text-xs font-semibold text-zinc-800 placeholder-zinc-400 focus:border-[#B31046] focus:ring-1 focus:ring-[#B31046] outline-none transition-all"
              placeholder="Search by name or email..."
            />
          </div>

          {/* Status Filter */}
          <div className="relative w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              className="w-full sm:w-auto appearance-none bg-white border border-zinc-200/80 rounded-2xl p-2.5 px-4 pr-10 text-xs font-extrabold text-zinc-600 outline-none focus:border-[#B31046] cursor-pointer transition-all min-w-[160px]"
            >
              <option value="ALL">Status: All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING_INVITATION">Pending Invitation</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
          </div>
        </div>

        {/* Sort by dropdown */}
        <div className="relative w-full sm:w-auto flex items-center justify-end gap-2">
          <span className="text-xs font-extrabold text-zinc-400">Sort by:</span>
          <div className="relative">
            <select
              value={sortBy}
              onChange={handleSortChange}
              className="appearance-none bg-white border border-zinc-200/80 rounded-2xl p-2.5 px-4 pr-10 text-xs font-black text-[#B31046] outline-none focus:border-[#B31046] cursor-pointer transition-all min-w-[170px]"
            >
              <option value="newest">Date Joined: Newest First</option>
              <option value="oldest">Date Joined: Oldest First</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#B31046] pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── Users Table ── */}
      <div className="bg-white rounded-3xl border border-zinc-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-wider">Date Joined</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-wider">Last Active</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-wider text-center">Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-200 shrink-0" />
                        <div className="space-y-1.5">
                          <div className="w-28 h-3.5 bg-zinc-200 rounded-md" />
                          <div className="w-36 h-3 bg-zinc-100 rounded-md" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-24 h-3 bg-zinc-150 bg-zinc-200 rounded-md" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-24 h-3 bg-zinc-200 rounded-md" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-20 h-5 bg-zinc-200 rounded-full" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-20 h-3 bg-zinc-200 rounded-md" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-20 h-3 bg-zinc-200 rounded-md" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="w-8 h-4 bg-zinc-200 rounded-md mx-auto" />
                    </td>
                  </tr>
                ))
              ) : users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id} className="group hover:bg-[#FFF0F2]/10 transition-colors">
                    {/* User profile details */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover shrink-0 border border-zinc-200"
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs shrink-0 select-none ${user.avatarColorBg} ${user.avatarColorText}`}>
                            {user.avatarInitials}
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-extrabold text-zinc-800 group-hover:text-[#B31046] transition-colors truncate">
                            {user.name}
                          </span>
                          <span className="text-xs text-zinc-400 truncate">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Phone number */}
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-zinc-500 leading-relaxed">
                      {user.phone}
                    </td>

                    {/* Location */}
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-zinc-500">
                      {user.location}
                    </td>

                    {/* Status badge */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderStatusBadge(user.status)}
                    </td>

                    {/* Date Joined */}
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-zinc-500">
                      {user.dateJoined}
                    </td>

                    {/* Last Active */}
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-zinc-400">
                      {user.lastActive}
                    </td>

                    {/* Total Orders */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-zinc-700 text-center">
                      {user.totalOrders}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-[#FFF0F2] flex items-center justify-center text-[#B31046]">
                        <Users className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-extrabold text-zinc-800 mt-2">No Registered Users Found</h4>
                      <p className="text-xs text-zinc-400 max-w-xs">
                        No signed-up users match your current search query or filter parameters.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Table Footer & Pagination ── */}
        <div className="p-4 border-t border-zinc-100 flex flex-col sm:flex-row gap-4 items-center justify-between bg-zinc-50/30">
          <span className="text-xs font-extrabold text-zinc-400">
            Showing {meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1}-
            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} registered users
          </span>

          {/* Pagination buttons */}
          {meta.totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                disabled={page === 1 || loading}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: meta.totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                // Render condensed page numbers if totalPages > 7
                if (
                  meta.totalPages > 7 &&
                  pageNum !== 1 &&
                  pageNum !== meta.totalPages &&
                  Math.abs(pageNum - page) > 1
                ) {
                  if (pageNum === 2 && page > 3) return <span key="dots-1" className="text-xs text-zinc-400 px-1">...</span>;
                  if (pageNum === meta.totalPages - 1 && page < meta.totalPages - 2) return <span key="dots-2" className="text-xs text-zinc-400 px-1">...</span>;
                  return null;
                }

                return (
                  <button
                    key={pageNum}
                    disabled={loading}
                    onClick={() => setPage(pageNum)}
                    className={`w-7 h-7 rounded-full text-xs font-black transition-all cursor-pointer ${
                      page === pageNum
                        ? "bg-[#B31046] text-white shadow-xs"
                        : "hover:bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                disabled={page === meta.totalPages || loading}
                onClick={() => setPage((p) => Math.min(p + 1, meta.totalPages))}
                className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

