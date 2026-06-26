"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  TrendingUp,
  Users,
  UserPlus,
  ArrowLeftRight,
  SlidersHorizontal,
  X,
  ShoppingBag,
  CreditCard,
  Calendar,
} from "lucide-react";
import { Customer, getStoredCustomers } from "@/lib/customers-data";

// Helper to format currency
const formatNaira = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace("NGN", "₦");
};

// Simple helper to get status style
const getOrderStatusStyle = (status: string) => {
  switch (status.toUpperCase()) {
    case "DELIVERED":
      return "bg-emerald-50 border-emerald-100 text-emerald-700";
    case "PROCESSING":
      return "bg-blue-50 border-blue-100 text-blue-700";
    case "PENDING":
      return "bg-amber-50 border-amber-100 text-amber-700";
    default:
      return "bg-zinc-50 border-zinc-100 text-zinc-500";
  }
};

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  
  // Filter states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState("Default"); // Default, Spend: High to Low, Spend: Low to High, Orders: High to Low, Name: A-Z, Name: Z-A
  const [ordersFilter, setOrdersFilter] = useState("All"); // All, 0, 1-5, 6-10, 10+
  const [spendFilter, setSpendFilter] = useState("All"); // All, 0, Under 20k, 20k-100k, Over 100k

  const itemsPerPage = 8;

  useEffect(() => {
    setCustomers(getStoredCustomers());
  }, []);

  // Filter & Sort Logic
  const filteredCustomers = customers.filter((cust) => {
    // 1. Search Query
    const matchesSearch =
      cust.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.phone.includes(searchTerm);

    // 2. Orders Filter
    let matchesOrders = true;
    if (ordersFilter === "0") {
      matchesOrders = cust.totalOrders === 0;
    } else if (ordersFilter === "1-5") {
      matchesOrders = cust.totalOrders >= 1 && cust.totalOrders <= 5;
    } else if (ordersFilter === "6-10") {
      matchesOrders = cust.totalOrders >= 6 && cust.totalOrders <= 10;
    } else if (ordersFilter === "10+") {
      matchesOrders = cust.totalOrders > 10;
    }

    // 3. Spend Filter
    let matchesSpend = true;
    if (spendFilter === "0") {
      matchesSpend = cust.totalSpend === 0;
    } else if (spendFilter === "Under 20k") {
      matchesSpend = cust.totalSpend > 0 && cust.totalSpend < 20000;
    } else if (spendFilter === "20k-100k") {
      matchesSpend = cust.totalSpend >= 20000 && cust.totalSpend <= 100000;
    } else if (spendFilter === "Over 100k") {
      matchesSpend = cust.totalSpend > 100000;
    }

    return matchesSearch && matchesOrders && matchesSpend;
  });

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    if (sortBy === "Spend: High to Low") {
      return b.totalSpend - a.totalSpend;
    } else if (sortBy === "Spend: Low to High") {
      return a.totalSpend - b.totalSpend;
    } else if (sortBy === "Orders: High to Low") {
      return b.totalOrders - a.totalOrders;
    } else if (sortBy === "Name: A-Z") {
      return a.name.localeCompare(b.name);
    } else if (sortBy === "Name: Z-A") {
      return b.name.localeCompare(a.name);
    }
    return 0; // Default ordering (as in INITIAL_CUSTOMERS)
  });

  // Reset page when search or filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, sortBy, ordersFilter, spendFilter]);

  // Pagination calculations
  const totalCount = sortedCustomers.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedCustomers = sortedCustomers.slice(startIndex, startIndex + itemsPerPage);

  // Stats Calculations (dynamic based on current list or hardcoded mockup totals)
  // To keep exact mockup numbers: Total 4280, New 124, Returning 85%
  // We can calculate actual dynamic stats of our local state too, but showing mockup values maintains visual fidelity.
  const displayTotalCustomers = 4280;
  const displayNewCustomers = 124;
  const displayReturningRate = 85;

  return (
    <div className="min-h-full p-8 space-y-6 font-sans relative bg-[#F8F9FC]">
      {/* ── Header Row ── */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#B31046] tracking-tight">Customers</h1>
          <p className="text-sm text-zinc-500 mt-0.5 font-medium">Manage and view all customer information</p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80 shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-full focus:bg-white focus:border-[#B31046] focus:ring-2 focus:ring-[#B31046]/5 outline-none transition-all placeholder-zinc-400 font-semibold text-zinc-800"
          />
        </div>
      </header>

      {/* ── Statistics Cards ── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Customers */}
        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Total Customers</span>
            <span className="text-3xl font-black text-zinc-900 block">{displayTotalCustomers.toLocaleString()}</span>
            <div className="flex items-center gap-1 text-emerald-600 text-[11px] font-bold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+12% from last year</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#FFF0F2] flex items-center justify-center text-[#B31046]">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* New Customers */}
        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">New Customers</span>
            <span className="text-3xl font-black text-zinc-900 block">{displayNewCustomers}</span>
            <span className="text-[11px] font-semibold text-zinc-400 block">Registration this month</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
            <UserPlus className="w-6 h-6" />
          </div>
        </div>

        {/* Returning Customers */}
        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Returning Customers</span>
            <span className="text-3xl font-black text-zinc-900 block">{displayReturningRate}%</span>
            {/* Progress bar */}
            <div className="w-4/5 h-2 bg-zinc-100 rounded-full overflow-hidden mt-1.5">
              <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${displayReturningRate}%` }} />
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
        </div>
      </section>

      {/* ── Directory Table Panel ── */}
      <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
        {/* Table Header / Action Row */}
        <div className="px-6 py-5 flex items-center justify-between border-b border-zinc-50">
          <h2 className="text-lg font-black text-zinc-800 tracking-tight">Customer Directory</h2>
          
          {/* Filter Popover Toggle */}
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-full border transition-all cursor-pointer select-none
                ${isFilterOpen 
                  ? "bg-[#FFF0F2] border-[#B31046]/30 text-[#B31046]" 
                  : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filter</span>
              {(sortBy !== "Default" || ordersFilter !== "All" || spendFilter !== "All") && (
                <span className="w-2 h-2 rounded-full bg-[#B31046]" />
              )}
            </button>

            {/* Filter Menu Popover */}
            {isFilterOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)} />
                <div className="absolute right-0 mt-2 w-72 bg-white border border-zinc-100 rounded-2xl shadow-xl z-20 p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-50">
                    <span className="text-sm font-extrabold text-zinc-800">Filter Directory</span>
                    <button 
                      onClick={() => {
                        setSortBy("Default");
                        setOrdersFilter("All");
                        setSpendFilter("All");
                      }}
                      className="text-[10px] font-extrabold text-[#B31046] hover:underline cursor-pointer"
                    >
                      Reset All
                    </button>
                  </div>

                  {/* Sort By */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Sort By</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full text-xs font-semibold text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 outline-none focus:border-[#B31046]"
                    >
                      <option value="Default">Default</option>
                      <option value="Spend: High to Low">Spend: High to Low</option>
                      <option value="Spend: Low to High">Spend: Low to High</option>
                      <option value="Orders: High to Low">Orders: High to Low</option>
                      <option value="Name: A-Z">Name: A-Z</option>
                      <option value="Name: Z-A">Name: Z-A</option>
                    </select>
                  </div>

                  {/* Total Orders Filter */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Total Orders</label>
                    <div className="grid grid-cols-2 gap-2">
                      {["All", "0", "1-5", "6-10", "10+"].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setOrdersFilter(opt)}
                          className={`px-3 py-1.5 text-xs font-bold border rounded-lg transition-all cursor-pointer text-center
                            ${ordersFilter === opt
                              ? "bg-[#FFF0F2] border-[#B31046] text-[#B31046]"
                              : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"
                            }`}
                        >
                          {opt === "All" ? "All Orders" : opt === "0" ? "0 Orders" : `${opt} Orders`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Total Spend Filter */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Total Spend</label>
                    <div className="flex flex-wrap gap-1.5">
                      {["All", "0", "Under 20k", "20k-100k", "Over 100k"].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setSpendFilter(opt)}
                          className={`px-2.5 py-1.5 text-[10px] font-bold border rounded-lg transition-all cursor-pointer text-center
                            ${spendFilter === opt
                              ? "bg-[#FFF0F2] border-[#B31046] text-[#B31046]"
                              : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"
                            }`}
                        >
                          {opt === "All" ? "All Spend" : opt === "0" ? "₦0 Spend" : opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/50">
                <th className="px-6 py-4 text-[10px] font-extrabold text-zinc-400 tracking-wider uppercase">Customer</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-zinc-400 tracking-wider uppercase">Phone Number</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-zinc-400 tracking-wider uppercase">Total Orders</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-zinc-400 tracking-wider uppercase">Total Spend</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-zinc-400 tracking-wider uppercase">Last Order</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-zinc-400 tracking-wider uppercase text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {paginatedCustomers.length > 0 ? (
                paginatedCustomers.map((cust) => (
                  <tr
                    key={cust.id}
                    className="hover:bg-zinc-50/40 transition-colors group cursor-pointer"
                    onClick={() => router.push(`/customers/${cust.id}`)}
                  >
                    {/* Customer Info (Avatar Initials + Name + Email) */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-xs shrink-0 select-none ${cust.avatarColorBg} ${cust.avatarColorText}`}>
                          {cust.avatarInitials}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-extrabold text-zinc-800 group-hover:text-[#B31046] transition-colors truncate">
                            {cust.name}
                          </span>
                          <span className="text-xs text-zinc-400 truncate">
                            {cust.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Phone Number */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-zinc-500">
                      {cust.phone}
                    </td>

                    {/* Total Orders */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-extrabold text-zinc-800">
                      {cust.totalOrders}
                    </td>

                    {/* Total Spend */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-extrabold text-zinc-900">
                      {formatNaira(cust.totalSpend)}
                    </td>

                    {/* Last Order Date */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-zinc-500">
                      {cust.lastOrderDate}
                    </td>

                    {/* Action (Eye Icon) */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/customers/${cust.id}`);
                        }}
                        className="p-2 rounded-full hover:bg-[#FFF0F2] text-[#B31046] transition-all cursor-pointer"
                        title="View Details"
                      >
                        <Eye className="w-4.5 h-4.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-[#FFF0F2] flex items-center justify-center text-[#B31046]">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-800">No customers found</p>
                        <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto leading-relaxed">
                          We couldn't find any customers matching your filters or search query.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination Footer ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-50 bg-zinc-50/10">
            <span className="text-xs font-semibold text-zinc-400">
              Showing {paginatedCustomers.length} of {totalCount} customers
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-zinc-200 hover:border-zinc-300 rounded-full text-zinc-500 hover:text-zinc-800 disabled:opacity-40 disabled:hover:border-zinc-200 transition-all cursor-pointer select-none"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-full text-xs font-bold transition-all select-none cursor-pointer ${
                      page === pageNum
                        ? "bg-[#B31046] text-white shadow-sm"
                        : "border border-zinc-200 hover:border-zinc-300 text-zinc-600 hover:text-zinc-900"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 border border-zinc-200 hover:border-zinc-300 rounded-full text-zinc-500 hover:text-zinc-800 disabled:opacity-40 disabled:hover:border-zinc-200 transition-all cursor-pointer select-none"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>


    </div>
  );
}
