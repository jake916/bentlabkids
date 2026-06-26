"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronDown,
  Calendar,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye,
  TrendingUp,
  Clock,
  Activity,
  ShoppingBag,
} from "lucide-react";
import { ToastContainer, ToastItem } from "@/components/Toast";
import {
  Order,
  OrderStatus,
  PaymentStatus,
  getStoredOrders,
} from "@/lib/orders-data";

// Helper to format currency
const formatNaira = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace("NGN", "₦");
};

// ─── Filter Dropdown Component ────────────────────────────────────────────────

function FilterDropdown({
  value,
  options,
  icon: Icon,
  onChange,
}: {
  value: string;
  options: string[];
  icon?: React.ComponentType<{ className?: string }>;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between gap-3.5 px-5 py-2.5 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-full hover:border-zinc-300 transition-all shadow-sm cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-3.5 h-3.5 text-zinc-400" />}
          <span>{value}</span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 mt-2 w-48 bg-white border border-zinc-100 rounded-2xl shadow-xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`w-full text-left px-5 py-3 text-xs font-bold transition-colors select-none cursor-pointer ${
                  opt === value
                    ? "bg-[#FFF0F2]/60 text-[#B31046] hover:bg-[#FFF0F2]"
                    : "text-zinc-600 hover:bg-zinc-50/70 hover:text-zinc-900"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Orders");
  const [dateFilter, setDateFilter] = useState("All Time");
  const [sortBy, setSortBy] = useState("Newest First");
  const [page, setPage] = useState(1);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const itemsPerPage = 8;

  // Load orders on mount
  useEffect(() => {
    setOrders(getStoredOrders());
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Filter & Search Logic
  const filteredOrders = orders.filter((order) => {
    // 1. Search Query
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Status filter
    let matchesStatus = true;
    if (statusFilter !== "All Orders") {
      matchesStatus = order.status === statusFilter.toUpperCase();
    }

    // 3. Date filter
    let matchesDate = true;
    const now = new Date();
    const orderDate = new Date(order.rawDateString);
    const orderTime = orderDate.getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    if (dateFilter === "Today") {
      matchesDate = now.toDateString() === orderDate.toDateString();
    } else if (dateFilter === "Yesterday") {
      const yesterday = new Date(now.getTime() - oneDay);
      matchesDate = yesterday.toDateString() === orderDate.toDateString();
    } else if (dateFilter === "Last 7 Days") {
      const sevenDaysAgo = now.getTime() - 7 * oneDay;
      matchesDate = orderTime >= sevenDaysAgo;
    } else if (dateFilter === "Last 30 Days") {
      const thirtyDaysAgo = now.getTime() - 30 * oneDay;
      matchesDate = orderTime >= thirtyDaysAgo;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Sorting Logic
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const aTime = new Date(a.rawDateString).getTime();
    const bTime = new Date(b.rawDateString).getTime();
    if (sortBy === "Newest First") {
      return bTime - aTime;
    } else if (sortBy === "Oldest First") {
      return aTime - bTime;
    } else if (sortBy === "Amount: High to Low") {
      return b.totalAmount - a.totalAmount;
    } else if (sortBy === "Amount: Low to High") {
      return a.totalAmount - b.totalAmount;
    }
    return 0;
  });

  // Pagination bounds
  const totalOrdersCount = sortedOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalOrdersCount / itemsPerPage));
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedOrders = sortedOrders.slice(startIndex, startIndex + itemsPerPage);

  // Dynamic Statistics Calculations (from paid orders)
  const totalPaidRevenue = orders
    .filter((o) => o.paymentStatus === "PAID")
    .reduce((acc, o) => acc + o.totalAmount, 0);

  const activeOrdersCount = orders.filter(
    (o) => o.status === "PENDING" || o.status === "PROCESSING"
  ).length;

  const totalPaidCount = orders.filter((o) => o.paymentStatus === "PAID").length;
  const avgOrderValue = totalPaidCount > 0 ? Math.round(totalPaidRevenue / totalPaidCount) : 0;

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, dateFilter, sortBy]);

  return (
    <div className="min-h-full p-8 space-y-6 font-sans relative">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* ── Header Row ── */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Orders</h1>
          <p className="text-sm text-zinc-500 mt-0.5 font-medium">Track and manage customer purchases</p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80 shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search orders, customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-full focus:bg-white focus:border-[#B31046] focus:ring-2 focus:ring-[#B31046]/5 outline-none transition-all placeholder-zinc-400 font-semibold text-zinc-800"
          />
        </div>
      </header>

      {/* ── Filters bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Dropdown: Status */}
          <FilterDropdown
            value={statusFilter}
            options={["All Orders", "Pending", "Processing", "Delivered", "Cancelled"]}
            onChange={setStatusFilter}
          />

          {/* Dropdown: Date Range */}
          <FilterDropdown
            value={dateFilter}
            options={["All Time", "Today", "Yesterday", "Last 7 Days", "Last 30 Days"]}
            icon={Calendar}
            onChange={setDateFilter}
          />
        </div>

        {/* Dropdown: Sort */}
        <FilterDropdown
          value={`Sort By: ${sortBy}`}
          options={["Newest First", "Oldest First", "Amount: High to Low", "Amount: Low to High"]}
          icon={SlidersHorizontal}
          onChange={setSortBy}
        />
      </div>

      {/* ── Statistics Summary Cards ── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Revenue Card */}
        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Total Revenue</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-zinc-900">
                {formatNaira(totalPaidRevenue)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 border border-emerald-100/60 px-3 py-1 rounded-full w-fit">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="text-[10px] font-extrabold tracking-wide">+12% vs last month</span>
          </div>
        </div>

        {/* Active Orders Card */}
        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Active Orders</span>
            <span className="text-2xl font-black text-zinc-900">{activeOrdersCount}</span>
          </div>
          <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 border border-blue-100/60 px-3 py-1 rounded-full w-fit">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[10px] font-extrabold tracking-wide">
              {orders.filter((o) => o.status === "PENDING").length} pending fulfillment
            </span>
          </div>
        </div>

        {/* Avg Order Value Card */}
        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Avg. Order Value</span>
            <span className="text-2xl font-black text-zinc-900">{formatNaira(avgOrderValue)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-600 bg-zinc-50 border border-zinc-100 px-3 py-1 rounded-full w-fit">
            <Activity className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-[10px] font-extrabold tracking-wide">Consistent performance</span>
          </div>
        </div>
      </section>

      {/* ── Orders Table Panel ── */}
      <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/50">
                <th className="px-6 py-4 text-[10px] font-extrabold text-zinc-400 tracking-wider uppercase">Order ID</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-zinc-400 tracking-wider uppercase">Customer</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-zinc-400 tracking-wider uppercase">Items</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-zinc-400 tracking-wider uppercase">Total Amount</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-zinc-400 tracking-wider uppercase">Status</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-zinc-400 tracking-wider uppercase">Payment</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-zinc-400 tracking-wider uppercase">Date</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-zinc-400 tracking-wider uppercase text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {paginatedOrders.length > 0 ? (
                paginatedOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-zinc-50/40 transition-colors group cursor-pointer"
                    onClick={() => router.push(`/orders/${order.id}`)}
                  >
                    {/* Order ID */}
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <span className="text-sm font-extrabold text-[#B31046] tracking-tight">
                        #{order.id}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="px-6 py-4.5">
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-extrabold text-zinc-800 truncate">
                          {order.customerName}
                        </span>
                        <span className="text-xs text-zinc-400 truncate">
                          {order.customerEmail}
                        </span>
                      </div>
                    </td>

                    {/* Items */}
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <span className="text-sm font-bold text-zinc-600">
                        {order.items.reduce((acc, it) => acc + it.quantity, 0)}{" "}
                        {order.items.reduce((acc, it) => acc + it.quantity, 0) === 1 ? "item" : "items"}
                      </span>
                    </td>

                    {/* Total Amount */}
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <span className="text-sm font-extrabold text-zinc-900">
                        {formatNaira(order.totalAmount)}
                      </span>
                    </td>

                    {/* Status badge */}
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-[9px] font-extrabold tracking-wider uppercase border ${
                          order.status === "DELIVERED"
                            ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                            : order.status === "PROCESSING"
                            ? "bg-blue-50 border-blue-100 text-blue-700"
                            : order.status === "PENDING"
                            ? "bg-amber-50 border-amber-100 text-amber-700"
                            : "bg-zinc-50 border-zinc-100 text-zinc-500"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>

                    {/* Payment status badge */}
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-[9px] font-extrabold tracking-wider uppercase border ${
                          order.paymentStatus === "PAID"
                            ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                            : order.paymentStatus === "PENDING"
                            ? "bg-amber-50 border-amber-100 text-amber-700"
                            : "bg-red-50 border-red-100 text-red-700"
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <span className="text-sm font-bold text-zinc-500">{order.date}</span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4.5 whitespace-nowrap text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/orders/${order.id}`);
                        }}
                        className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-800 transition-all cursor-pointer"
                        title="View Details"
                      >
                        <Eye className="w-4.5 h-4.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-[#FFF0F2] flex items-center justify-center text-[#B31046]">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-800">No orders found</p>
                        <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto leading-relaxed">
                          We couldn't find any orders matching your selected filter or search keyword.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-50 bg-zinc-50/10">
            <span className="text-xs font-semibold text-zinc-400">
              Showing {paginatedOrders.length} of {totalOrdersCount} orders
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
