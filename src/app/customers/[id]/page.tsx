"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShoppingBag,
  CreditCard,
  Clock,
  Info,
  X,
  AlertTriangle,
  Download,
} from "lucide-react";
import { ToastContainer, ToastItem } from "@/components/Toast";
import { Customer, getStoredCustomers, saveStoredCustomers } from "@/lib/customers-data";

// Helper to format currency
const formatNaira = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace("NGN", "₦");
};

// Generates mock orders based on customer metrics
const generateMockOrders = (customer: Customer) => {
  if (customer.id === "CUST-001") {
    // Sarah Johnson exact orders from the mockup
    return [
      { id: "BK-9021", date: "Apr 18, 2026", items: "3 items", total: 12500, status: "Delivered", payment: "Paid" },
      { id: "BK-8842", date: "Mar 12, 2026", items: "1 item", total: 4500, status: "Delivered", payment: "Paid" },
      { id: "BK-8519", date: "Feb 25, 2026", items: "4 items", total: 18000, status: "Delivered", payment: "Paid" },
      { id: "BK-8401", date: "Feb 10, 2026", items: "2 items", total: 6000, status: "Delivered", payment: "Paid" },
      { id: "BK-8112", date: "Jan 20, 2026", items: "1 item", total: 4000, status: "Delivered", payment: "Paid" },
    ];
  }

  const count = customer.totalOrders;
  if (count === 0) return [];

  const orders = [];
  let remainingSpend = customer.totalSpend;

  for (let i = 0; i < count; i++) {
    const isLast = i === count - 1;
    // Divide the remaining spend; make the last one take whatever is left
    const orderTotal = isLast 
      ? remainingSpend 
      : Math.max(2000, Math.floor((remainingSpend / (count - i)) * (0.6 + Math.random() * 0.8)));

    remainingSpend -= orderTotal;

    // Generate dates backwards from the lastOrderDate
    const date = new Date(customer.lastOrderDate === "—" ? "2026-04-01" : customer.lastOrderDate);
    date.setDate(date.getDate() - (i * 15 + Math.floor(Math.random() * 10)));

    const dateFormatted = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });

    const itemsCount = Math.floor(Math.random() * 4) + 1;

    orders.push({
      id: `BK-${8000 + Math.floor(Math.random() * 1900)}`,
      date: dateFormatted,
      items: `${itemsCount} ${itemsCount === 1 ? "item" : "items"}`,
      total: orderTotal,
      status: "Delivered",
      payment: "Paid"
    });
  }

  return orders;
};

export default function CustomerDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params?.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  
  // Editable address form state
  const [addressInput, setAddressInput] = useState("");

  // Load customer data
  useEffect(() => {
    const allCustomers = getStoredCustomers();
    setCustomers(allCustomers);
    const found = allCustomers.find((c) => c.id === customerId);
    if (found) {
      setCustomer(found);
      setAddressInput(found.shippingAddress || "");
    }
  }, [customerId]);

  const addToast = (type: "success" | "error" | "info", message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Update customer address in state & localStorage
  const handleSaveAddress = () => {
    if (!customer) return;
    const updatedCustomer = { ...customer, shippingAddress: addressInput };
    const updatedList = customers.map((c) => (c.id === customer.id ? updatedCustomer : c));
    
    setCustomers(updatedList);
    saveStoredCustomers(updatedList);
    setCustomer(updatedCustomer);
    
    addToast("success", "Delivery address updated successfully");
    setShowAddressModal(false);
  };

  const handleDeactivate = () => {
    if (!customer) return;
    addToast("info", `Account for ${customer.name} has been deactivated`);
    setShowDeactivateModal(false);
  };

  // CSV Exporter for order history
  const handleDownloadCSV = () => {
    if (!customer) return;
    const orders = generateMockOrders(customer);
    if (orders.length === 0) {
      addToast("error", "No orders found to download");
      return;
    }

    const headers = ["Order ID", "Date", "Items", "Total (NGN)", "Status", "Payment"];
    const rows = orders.map((o) => [o.id, o.date, o.items, o.total, o.status, o.payment]);
    
    const csvContent = 
      "data:text/csv;charset=utf-8," + 
      [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${customer.name.replace(/ /g, "_")}_order_history.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast("success", "CSV downloaded successfully");
  };

  if (!customer) {
    return (
      <div className="min-h-screen bg-[#FAF9FA] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-[#B31046] mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-extrabold text-zinc-800">Customer Not Found</h2>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm">
          We couldn't retrieve the details for customer ID <strong className="text-zinc-700">"{customerId}"</strong>.
        </p>
        <Link
          href="/customers"
          className="mt-6 px-6 py-2.5 bg-[#B31046] text-white text-xs font-bold rounded-full hover:bg-[#960d3a] transition-colors"
        >
          Back to Customers
        </Link>
      </div>
    );
  }

  const avgOrderValue = customer.totalOrders > 0 
    ? Math.round(customer.totalSpend / customer.totalOrders) 
    : 0;

  const mockOrdersList = generateMockOrders(customer);

  return (
    <div className="min-h-full bg-[#F8F9FC] p-8 space-y-6 font-sans relative">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* ── Breadcrumb & Header ── */}
      <header className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/customers"
            className="flex items-center gap-1 text-xs font-extrabold text-[#B31046] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Customers</span>
          </Link>
          <div>
            <h1 className="text-3xl font-black text-zinc-900 tracking-tight">{customer.name}</h1>
            <p className="text-xs font-semibold text-zinc-400 mt-0.5">
              Customer since {customer.customerSince}
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href={`/orders?search=${encodeURIComponent(customer.name)}`}
            className="px-5 py-2.5 bg-[#FFF0F2] hover:bg-[#ffe2e6] text-[#B31046] text-xs font-extrabold rounded-full transition-all shadow-xs cursor-pointer text-center"
          >
            View Orders
          </Link>

          <a
            href={`mailto:${customer.email}`}
            className="px-5 py-2.5 bg-[#B31046] hover:bg-[#960d3a] text-white text-xs font-bold rounded-full transition-all shadow-sm cursor-pointer text-center"
          >
            Contact Customer
          </a>
        </div>
      </header>

      {/* ── Metric Summary Cards ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Orders */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-sm space-y-1">
          <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Total Orders</span>
          <span className="text-2xl font-black text-zinc-900 block">{customer.totalOrders}</span>
        </div>

        {/* Total Spend */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-sm space-y-1">
          <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Total Spend</span>
          <span className="text-2xl font-black text-[#B31046] block">{formatNaira(customer.totalSpend)}</span>
        </div>

        {/* Last Order Date */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-sm space-y-1">
          <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Last Order</span>
          <span className="text-xl font-extrabold text-zinc-800 block leading-tight">{customer.lastOrderDate}</span>
        </div>

        {/* Average Order Value */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-sm space-y-1">
          <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Avg Order Value</span>
          <span className="text-2xl font-black text-[#B31046] block">{formatNaira(avgOrderValue)}</span>
        </div>
      </section>

      {/* ── Main Layout Column Split ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Transaction List */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
            {/* List Header */}
            <div className="px-6 py-5 flex items-center justify-between border-b border-zinc-50">
              <h2 className="text-base font-extrabold text-zinc-800 tracking-tight">Order History</h2>
              <button
                onClick={handleDownloadCSV}
                className="text-xs font-bold text-[#B31046] hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV</span>
              </button>
            </div>

            {/* List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#FFF0F2]/50 bg-[#FFF0F2]/20">
                    <th className="px-6 py-4 text-[10px] font-extrabold text-zinc-400 tracking-wider uppercase">Order ID</th>
                    <th className="px-6 py-4 text-[10px] font-extrabold text-zinc-400 tracking-wider uppercase">Date</th>
                    <th className="px-6 py-4 text-[10px] font-extrabold text-zinc-400 tracking-wider uppercase">Items</th>
                    <th className="px-6 py-4 text-[10px] font-extrabold text-zinc-400 tracking-wider uppercase">Total</th>
                    <th className="px-6 py-4 text-[10px] font-extrabold text-zinc-400 tracking-wider uppercase">Status</th>
                    <th className="px-6 py-4 text-[10px] font-extrabold text-zinc-400 tracking-wider uppercase">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {mockOrdersList.length > 0 ? (
                    mockOrdersList.map((ord) => (
                      <tr 
                        key={ord.id} 
                        className="hover:bg-zinc-50/40 cursor-pointer transition-colors group"
                        onClick={() => router.push(`/orders/${ord.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-extrabold text-[#B31046] group-hover:underline">
                          #{ord.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-zinc-500">
                          {ord.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-zinc-500">
                          {ord.items}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-extrabold text-zinc-800">
                          {formatNaira(ord.total).replace("₦", "")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 rounded-full text-[9px] font-extrabold border bg-emerald-50 border-emerald-100 text-emerald-700 uppercase tracking-wider">
                            {ord.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 rounded-full text-[9px] font-extrabold border bg-emerald-50 border-emerald-100 text-emerald-700 uppercase tracking-wider">
                            {ord.payment}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center text-zinc-400 font-semibold text-xs">
                        No orders recorded for this customer.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Widgets */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card: Customer Contact Profile */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-zinc-800 tracking-tight">{customer.name}</h3>
            
            <div className="space-y-3.5 text-xs font-bold text-zinc-500 pt-1">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-zinc-400 shrink-0" />
                <span className="truncate">{customer.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-zinc-400 shrink-0" />
                <span>{customer.phone}</span>
              </div>
            </div>
          </div>

          {/* Card: Delivery Address */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-zinc-800">
              <MapPin className="w-4.5 h-4.5 text-[#B31046]" />
              <h3 className="text-sm font-black tracking-tight">Delivery Address</h3>
            </div>

            <p className="text-xs font-semibold text-zinc-500 leading-relaxed">
              {customer.shippingAddress || "No shipping address specified."}
            </p>

            <button
              onClick={() => setShowAddressModal(true)}
              className="text-xs font-extrabold text-[#B31046] hover:underline cursor-pointer block"
            >
              Edit Address
            </button>
          </div>

          {/* Card: Insights */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-50 pb-3">
              <h3 className="text-sm font-black text-zinc-800 tracking-tight">Insights</h3>
              <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#B31046] text-white">
                {customer.insights?.tier || "STANDARD"}
              </span>
            </div>

            <div className="space-y-4 text-xs font-bold text-zinc-500">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Account Age</span>
                <span className="text-zinc-800">{customer.insights?.accountAge || "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Return Rate</span>
                <span className="text-zinc-800">{customer.insights?.returnRate || "0%"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Avg Score</span>
                <span className="text-zinc-800">{customer.insights?.avgScore || "—"}</span>
              </div>
            </div>
          </div>

          {/* Card: Deactivate */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm">
            <button
              onClick={() => setShowDeactivateModal(true)}
              className="w-full py-3 border border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700 text-xs font-bold rounded-full transition-all cursor-pointer text-center"
            >
              Deactivate Account
            </button>
          </div>
        </div>
      </div>

      {/* ── Edit Address Modal ── */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-zinc-100 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowAddressModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-base font-black text-zinc-900">Edit Delivery Address</h3>
              <p className="text-xs text-zinc-400 font-medium">Update the primary shipping destination for this customer</p>
            </div>

            <textarea
              rows={3}
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              className="w-full border border-zinc-200 rounded-2xl px-4 py-3 text-xs font-semibold focus:border-[#B31046] focus:ring-1 focus:ring-[#B31046] outline-none resize-none text-zinc-700 bg-zinc-50"
              placeholder="Enter shipping address..."
            />

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowAddressModal(false)}
                className="flex-1 py-3 border border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-bold text-xs rounded-full transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAddress}
                className="flex-1 py-3 bg-[#B31046] hover:bg-[#960d3a] text-white font-bold text-xs rounded-full transition-all shadow-md cursor-pointer"
              >
                Save Address
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Deactivate Account Warning Modal ── */}
      {showDeactivateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-zinc-100 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200 text-center">
            <button
              onClick={() => setShowDeactivateModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-black text-zinc-900">Deactivate Account?</h3>
              <p className="text-xs text-zinc-500 leading-relaxed font-semibold">
                Are you sure you want to deactivate <strong className="text-zinc-800">{customer.name}'s</strong> account? This will suspend all active services and block their login credentials.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowDeactivateModal(false)}
                className="flex-1 py-3 border border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-bold text-xs rounded-full transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivate}
                className="flex-1 py-3 bg-[#B31046] hover:bg-[#960d3a] text-white font-bold text-xs rounded-full transition-all shadow-md cursor-pointer"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
