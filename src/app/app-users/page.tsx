"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Users,
  UserPlus,
  Zap,
  ChevronDown,
  Calendar,
} from "lucide-react";
import { AppUser, getStoredAppUsers, saveStoredAppUsers } from "@/lib/app-users-data";

export default function AppUsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("All Time");
  const [sortBy, setSortBy] = useState("Newest First");
  const [page, setPage] = useState(1);
  const itemsPerPage = 5; // Design specifies 5 rows per page

  useEffect(() => {
    setUsers(getStoredAppUsers());
  }, []);

  // Filter logic
  const filteredUsers = users.filter((u) => {
    // Search query match
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());

    // Date joined match
    if (dateFilter === "Today") {
      // Mock today is Dec 6, 2023 (latest seeded date)
      return matchesSearch && u.dateJoined === "2023-12-06";
    }
    if (dateFilter === "This Month") {
      // Dec 2023
      return matchesSearch && u.dateJoined.startsWith("2023-12");
    }
    if (dateFilter === "This Year") {
      // 2023
      return matchesSearch && u.dateJoined.startsWith("2023");
    }

    return matchesSearch;
  });

  // Sorting logic
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortBy === "Newest First") {
      return new Date(b.dateJoined).getTime() - new Date(a.dateJoined).getTime();
    }
    if (sortBy === "Oldest First") {
      return new Date(a.dateJoined).getTime() - new Date(b.dateJoined).getTime();
    }
    if (sortBy === "Total Orders") {
      return b.totalOrders - a.totalOrders;
    }
    // Default to dateJoined descending
    return new Date(b.dateJoined).getTime() - new Date(a.dateJoined).getTime();
  });

  // Pagination calculation
  const totalItems = sortedUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedUsers = sortedUsers.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Reset page on search/filter changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery, dateFilter, sortBy]);

  // Format date helper (e.g. "Oct 12, 2023")
  const formatDate = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "2-digit",
      year: "numeric",
    };
    return new Date(dateStr).toLocaleDateString("en-US", options);
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-3xl font-black text-zinc-900 tracking-tight">App Users</h1>
        <p className="text-sm text-zinc-400 font-semibold leading-relaxed">
          All registered users of the Bentlab Kids mobile app
        </p>
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
              +12%
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-extrabold text-zinc-400 block">Total Users</span>
            <span className="text-3xl font-black text-zinc-800 tracking-tight block mt-1">
              42,890
            </span>
          </div>
        </div>

        {/* Card 2: New Users (This Month) */}
        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-xs relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-blue-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5">
              +5%
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-extrabold text-zinc-400 block">New Users (This Month)</span>
            <span className="text-3xl font-black text-zinc-800 tracking-tight block mt-1">
              1,204
            </span>
          </div>
        </div>

        {/* Card 3: Active Users */}
        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-xs relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-emerald-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xs font-extrabold text-zinc-400 block">Active Users</span>
            <span className="text-3xl font-black text-zinc-800 tracking-tight block mt-1">
              28,450
            </span>
          </div>
        </div>
      </div>

      {/* ── Control & Search Bar ── */}
      <div className="bg-[#FFF0F2]/40 border border-[#FFF0F2]/60 rounded-3xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-zinc-200/80 rounded-2xl p-2.5 pl-10 text-xs font-semibold text-zinc-800 placeholder-zinc-400 focus:border-[#B31046] focus:ring-1 focus:ring-[#B31046] outline-none transition-all"
              placeholder="Search by name or email"
            />
          </div>

          {/* Date Joined Select */}
          <div className="relative w-full sm:w-auto">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full sm:w-auto appearance-none bg-white border border-zinc-200/80 rounded-2xl p-2.5 px-4 pr-10 text-xs font-extrabold text-zinc-600 outline-none focus:border-[#B31046] cursor-pointer transition-all"
            >
              <option value="All Time">Date Joined: All Time</option>
              <option value="Today">Today</option>
              <option value="This Month">This Month</option>
              <option value="This Year">This Year</option>
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
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-white border border-zinc-200/80 rounded-2xl p-2.5 px-4 pr-10 text-xs font-black text-[#B31046] outline-none focus:border-[#B31046] cursor-pointer transition-all min-w-[140px]"
            >
              <option value="Newest First">Newest First</option>
              <option value="Oldest First">Oldest First</option>
              <option value="Total Orders">Total Orders</option>
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
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-wider">Date Joined</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-wider">Last Activity</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-wider">Total Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className="group hover:bg-[#FFF0F2]/10 transition-colors">
                    {/* User profile details */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs shrink-0 select-none ${user.avatarColorBg} ${user.avatarColorText}`}>
                          {user.avatarInitials}
                        </div>
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

                    {/* Date Joined */}
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-zinc-400">
                      {formatDate(user.dateJoined)}
                    </td>

                    {/* Last Activity */}
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-zinc-400">
                      {user.lastActivity}
                    </td>

                    {/* Total Orders */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-zinc-700">
                      {user.totalOrders}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-xs font-extrabold text-zinc-400">
                    No registered users match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Table Footer & Pagination ── */}
        <div className="p-4 border-t border-zinc-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <span className="text-xs font-extrabold text-zinc-400">
            Showing {totalItems === 0 ? 0 : (page - 1) * itemsPerPage + 1}-
            {Math.min(page * itemsPerPage, totalItems)} of {totalItems} users
          </span>

          {/* Pagination selectors */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                return (
                  <button
                    key={pageNum}
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
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
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
