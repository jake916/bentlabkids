"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  Check,
  CreditCard,
  Printer,
  Truck,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  X,
  ShoppingBag,
} from "lucide-react";
import { ToastContainer, ToastItem } from "@/components/Toast";
import {
  Order,
  OrderStatus,
  PaymentStatus,
  getStoredOrders,
  saveStoredOrders,
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

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);

  // Load orders and find active one
  useEffect(() => {
    const allOrders = getStoredOrders();
    setOrders(allOrders);
    const found = allOrders.find((o) => o.id === orderId);
    if (found) {
      setOrder(found);
    }
  }, [orderId]);

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

  const updateOrderInList = (updatedOrder: Order) => {
    const updatedList = orders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o));
    setOrders(updatedList);
    saveStoredOrders(updatedList);
    setOrder(updatedOrder);
  };

  const handleUpdateStatus = (newStatus: OrderStatus) => {
    if (!order) return;
    const updated = { ...order, status: newStatus };
    updateOrderInList(updated);
    addToast("success", `Order status updated to ${newStatus}`);
    setShowStatusModal(false);
  };

  const handleUpdatePaymentStatus = (newPaymentStatus: PaymentStatus) => {
    if (!order) return;
    const updated = { ...order, paymentStatus: newPaymentStatus };
    updateOrderInList(updated);
    addToast("success", `Payment status updated to ${newPaymentStatus}`);
  };

  const handleIssueRefund = () => {
    if (!order) return;
    const updated = { ...order, paymentStatus: "FAILED" as PaymentStatus };
    updateOrderInList(updated);
    addToast("success", "Refund processed successfully. Payment status marked as FAILED.");
    setShowRefundModal(false);
  };

  const handleCancelOrder = () => {
    if (!order) return;
    const updated = { ...order, status: "CANCELLED" as OrderStatus };
    updateOrderInList(updated);
    addToast("info", "Order has been cancelled.");
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-[#FAF9FA] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-[#B31046] mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-extrabold text-zinc-800">Order Not Found</h2>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm">
          We couldn't retrieve the details for order ID <strong className="text-zinc-700">"{orderId}"</strong>.
        </p>
        <Link
          href="/orders"
          className="mt-6 px-6 py-2.5 bg-[#B31046] text-white text-xs font-bold rounded-full hover:bg-[#960d3a] transition-colors"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  const totalQty = order.items.reduce((acc, item) => acc + item.quantity, 0);

  // Status mapping for color pills
  const statusColorClass = (s: OrderStatus) => {
    switch (s) {
      case "DELIVERED":
        return "bg-emerald-50 border-emerald-200 text-emerald-700";
      case "PROCESSING":
        return "bg-amber-50 border-amber-200 text-amber-700";
      case "PENDING":
        return "bg-blue-50 border-blue-200 text-blue-700";
      case "CANCELLED":
        return "bg-red-50 border-red-200 text-red-700";
      default:
        return "bg-zinc-50 border-zinc-200 text-zinc-500";
    }
  };

  const paymentColorClass = (p: PaymentStatus) => {
    switch (p) {
      case "PAID":
        return "bg-emerald-50 border-emerald-200 text-emerald-700";
      case "PENDING":
        return "bg-amber-50 border-amber-200 text-amber-700";
      case "FAILED":
        return "bg-red-50 border-red-200 text-red-700";
      default:
        return "bg-zinc-50 border-zinc-200 text-zinc-500";
    }
  };

  return (
    <div className="min-h-full bg-[#FAF9FA] p-8 space-y-6 font-sans relative">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* ── Breadcrumb & Header ── */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-100 pb-5">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/orders")}
            className="p-3 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-full transition-all text-zinc-600 cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">
              <span>Orders</span>
              <span>/</span>
              <span className="text-[#B31046]">#{order.id}</span>
            </div>
            <h1 className="text-2xl font-black text-zinc-900 mt-1">Order Details</h1>
          </div>
        </div>

        {/* Status display / modifiers */}
        <div className="flex items-center gap-3">
          {/* Order Status Select-dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowStatusModal(!showStatusModal)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer select-none ${statusColorClass(
                order.status
              )}`}
            >
              <span className="w-2 h-2 rounded-full bg-current" />
              <span className="capitalize">{order.status.toLowerCase()}</span>
              <ChevronDown className="w-4.5 h-4.5 opacity-60" />
            </button>

            {showStatusModal && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowStatusModal(false)} />
                <div className="absolute right-0 mt-2 w-44 bg-white border border-zinc-100 rounded-2xl shadow-xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                  {(["PENDING", "PROCESSING", "DELIVERED", "CANCELLED"] as OrderStatus[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(st)}
                      className={`w-full text-left px-5 py-3 text-xs font-bold transition-colors cursor-pointer flex items-center justify-between ${
                        order.status === st
                          ? "bg-[#FFF0F2]/60 text-[#B31046]"
                          : "text-zinc-600 hover:bg-zinc-50"
                      }`}
                    >
                      <span className="capitalize">{st.toLowerCase()}</span>
                      {order.status === st && <Check className="w-4 h-4 text-[#B31046]" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Payment Status display */}
          <div className="relative">
            <span
              className={`flex items-center gap-1.5 px-4 py-2 border rounded-full text-xs font-bold select-none ${paymentColorClass(
                order.paymentStatus
              )}`}
            >
              {order.paymentStatus === "PAID" && <Check className="w-4 h-4" />}
              <span>{order.paymentStatus === "PAID" ? "Paid" : order.paymentStatus === "PENDING" ? "Payment Pending" : "Payment Failed"}</span>
            </span>
          </div>
        </div>
      </header>

      {/* ── Main Layout Columns ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Cards */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card: Items in order */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-xs space-y-5">
            <div className="flex justify-between items-center border-b border-zinc-50 pb-3">
              <h2 className="text-base font-extrabold text-zinc-900">Items in this order</h2>
              <span className="text-xs font-bold text-zinc-400">{totalQty} {totalQty === 1 ? "Item" : "Items"} Total</span>
            </div>

            <div className="divide-y divide-zinc-50 space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 py-3 group">
                  {/* Item Image */}
                  <div className="w-16 h-16 rounded-2xl border border-zinc-100 bg-zinc-50 flex items-center justify-center shrink-0 overflow-hidden relative">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <ShoppingBag className="w-6 h-6 text-zinc-400" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-extrabold text-zinc-800 group-hover:text-[#B31046] transition-colors truncate">
                      {item.name}
                    </h4>
                    {item.details && (
                      <p className="text-xs text-zinc-400 mt-1 font-semibold">{item.details}</p>
                    )}
                  </div>

                  {/* Qty & Price */}
                  <div className="flex items-center gap-10 shrink-0 text-right">
                    <span className="text-xs font-extrabold text-zinc-400">x{item.quantity}</span>
                    <div className="w-24">
                      <span className="text-xs text-zinc-400 font-semibold block">{formatNaira(item.price)}</span>
                      <span className="text-sm font-extrabold text-zinc-800 block mt-0.5">
                        {formatNaira(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card: Payment Information */}
          <div
            className={`bg-white rounded-3xl p-6 border border-zinc-100 shadow-xs space-y-5 border-l-4 ${
              order.paymentStatus === "PAID" ? "border-l-emerald-500" : order.paymentStatus === "PENDING" ? "border-l-amber-500" : "border-l-red-500"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-zinc-900">Payment Information</h2>
                <p className="text-xs text-zinc-400 mt-0.5 font-medium">
                  {order.paymentStatus === "PAID" ? "Transaction verified successfully" : "Awaiting user checkout completion"}
                </p>
              </div>
              <span
                className={`text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase border ${
                  order.paymentStatus === "PAID"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : order.paymentStatus === "PENDING"
                    ? "bg-amber-50 border-amber-200 text-amber-700"
                    : "bg-red-50 border-red-200 text-red-700"
                }`}
              >
                {order.paymentStatus}
              </span>
            </div>

            {/* Inner highlights card */}
            <div className="bg-[#FFF0F2]/30 border border-[#FFF0F2]/40 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide block mb-1">Method</span>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#B31046]" />
                  <span className="text-xs font-bold text-zinc-700">{order.paymentMethod}</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide block mb-1">Transaction Ref</span>
                <span className="text-xs font-extrabold text-zinc-700">TXN-{order.id.replace("ORD-", "")}8392</span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide block mb-1">Date Paid</span>
                <span className="text-xs font-bold text-zinc-700">{order.date} • 14:20</span>
              </div>
            </div>

            {/* Paystack settlement note */}
            <div className="flex items-start gap-3 bg-zinc-50 border border-zinc-100 rounded-xl p-3.5">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-zinc-600 leading-relaxed font-medium">
                Note: This payment was processed via Paystack. Funds have been cleared and settled to the operational account.
              </p>
            </div>
          </div>

          {/* Card: Order Progress timeline */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-xs space-y-5">
            <h2 className="text-base font-extrabold text-zinc-900">Order Progress</h2>

            <div className="relative pl-8 space-y-8 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-zinc-100">
              {/* Event 1: Order Placed */}
              <div className="relative">
                <span className="absolute -left-[25px] top-0.5 w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center ring-4 ring-white shadow-xs">
                  <Check className="w-3.5 h-3.5 text-white" />
                </span>
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-zinc-800">Order Placed</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed font-semibold">
                    The customer successfully placed the order via the mobile app.
                  </p>
                  <p className="text-[10px] text-zinc-400 font-bold">{order.date} • 14:15</p>
                </div>
              </div>

              {/* Event 2: Processing */}
              <div className="relative">
                <span
                  className={`absolute -left-[25px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white shadow-xs ${
                    order.status === "PROCESSING" || order.status === "DELIVERED"
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-200 text-zinc-400"
                  }`}
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${order.status === "PROCESSING" ? "animate-spin" : ""}`} />
                </span>
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-zinc-800">Processing</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed font-semibold">
                    Warehouse team is currently picking and packing the items for dispatch.
                  </p>
                  {(order.status === "PROCESSING" || order.status === "DELIVERED") && (
                    <p className="text-[10px] text-blue-600 font-bold">Active Now</p>
                  )}
                </div>
              </div>

              {/* Event 3: Shipped */}
              <div className="relative">
                <span
                  className={`absolute -left-[25px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white shadow-xs ${
                    order.status === "DELIVERED" ? "bg-emerald-600 text-white" : "bg-zinc-200 text-zinc-400"
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                </span>
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-zinc-800">Shipped / Delivered</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed font-semibold">
                    {order.status === "DELIVERED"
                      ? "Package has been dispatched and delivered successfully."
                      : "Waiting for courier pickup and tracking ID generation."}
                  </p>
                </div>
              </div>

              {/* Event 4: Cancelled (conditional) */}
              {order.status === "CANCELLED" && (
                <div className="relative">
                  <span className="absolute -left-[25px] top-0.5 w-6 h-6 rounded-full bg-red-600 flex items-center justify-center ring-4 ring-white shadow-xs">
                    <X className="w-3.5 h-3.5 text-white" />
                  </span>
                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold text-red-600">Order Cancelled</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed font-semibold">
                      This order was cancelled by the administrator. Refund status has been processed if paid.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar Panels */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card: Summary (dark brand theme) */}
          <div className="bg-[#B31046] text-white rounded-3xl p-6 shadow-md relative overflow-hidden space-y-6">
            {/* Subtle light effect */}
            <div className="absolute -right-16 -top-16 w-44 h-44 rounded-full bg-white/5 pointer-events-none" />

            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black tracking-widest uppercase opacity-75">Summary</span>
              <span className="text-xs font-bold bg-white/10 border border-white/10 px-3 py-1 rounded-full uppercase">
                #{order.id}
              </span>
            </div>

            {/* List key-values */}
            <div className="space-y-4 text-sm font-semibold">
              <div className="flex justify-between items-center">
                <span className="opacity-75">Total Items</span>
                <span className="font-extrabold">{totalQty}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="opacity-75">Order Date</span>
                <span className="font-extrabold">{order.date}</span>
              </div>
            </div>

            <hr className="border-white/15" />

            {/* Big price display */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider opacity-75">Total Amount</span>
                <p className="text-3xl font-black mt-1">{formatNaira(order.totalAmount)}</p>
              </div>

              {/* Status mini pills stack */}
              <div className="flex flex-col gap-1.5 items-end">
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-white text-[#B31046]">
                  {order.status}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-white">
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Card: Customer Details */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-xs space-y-5">
            {/* Avatar header row */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-rose-50 flex items-center justify-center text-[#B31046] font-bold shrink-0 relative">
                {order.customerAvatarUrl ? (
                  <img
                    src={order.customerAvatarUrl}
                    alt={order.customerName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{order.customerName.charAt(0)}</span>
                )}
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900">{order.customerName}</h3>
                <p className="text-[10px] text-zinc-400 font-bold">
                  Customer since {order.customerSince || "2023"}
                </p>
              </div>
            </div>

            {/* Contact details */}
            <div className="space-y-4 pt-2 border-t border-zinc-50 text-xs font-semibold text-zinc-600">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-zinc-400 shrink-0" />
                <span className="truncate">{order.customerEmail}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-zinc-400 shrink-0" />
                <span>{order.customerPhone}</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed text-zinc-500 font-medium">
                  {order.shippingAddress}
                </span>
              </div>
            </div>
          </div>

          {/* Card: Operations */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-xs space-y-4">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2">
              Operations
            </span>

            <div className="space-y-3">
              {/* Button: Update Status */}
              <button
                onClick={() => setShowStatusModal(true)}
                className="w-full py-3 bg-[#B31046] hover:bg-[#960d3a] text-white text-xs font-bold rounded-full transition-all shadow-sm active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Update Order Status</span>
              </button>

              {/* Button: Issue Refund */}
              <button
                onClick={() => setShowRefundModal(true)}
                disabled={order.paymentStatus === "FAILED"}
                className="w-full py-3 bg-[#FFF0F2] hover:bg-[#ffe2e6] text-[#B31046] disabled:opacity-50 disabled:hover:bg-[#FFF0F2] text-xs font-extrabold rounded-full transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>Issue Refund</span>
              </button>

              {/* Button: Contact Customer */}
              <a
                href={`mailto:${order.customerEmail}`}
                className="w-full py-3 bg-[#FFF0F2] hover:bg-[#ffe2e6] text-[#B31046] text-xs font-extrabold rounded-full transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Contact Customer</span>
              </a>

              {/* Button: Print Invoice */}
              <button
                onClick={() => window.print()}
                className="w-full py-3 bg-[#FFF0F2] hover:bg-[#ffe2e6] text-[#B31046] text-xs font-extrabold rounded-full transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Invoice</span>
              </button>

              <hr className="border-zinc-100 my-2" />

              {/* Button: Cancel Order */}
              <button
                onClick={handleCancelOrder}
                disabled={order.status === "CANCELLED"}
                className="w-full py-3 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:hover:bg-transparent text-xs font-extrabold rounded-full transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                <span>Cancel Order</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Refund Confirmation Modal ── */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-zinc-100 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200 text-center">
            <button
              onClick={() => setShowRefundModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-zinc-900">Process Refund?</h3>
              <p className="text-xs text-zinc-500 leading-relaxed font-semibold">
                Are you sure you want to issue a refund for this order? This will mark the payment status as <strong className="text-red-600">FAILED</strong> and trigger Paystack reverse-credit protocols.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowRefundModal(false)}
                className="flex-1 py-3 border border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-bold text-xs rounded-full transition-all active:scale-[0.98] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleIssueRefund}
                className="flex-1 py-3 bg-[#B31046] hover:bg-[#960d3a] text-white font-bold text-xs rounded-full transition-all shadow-md active:scale-[0.98] cursor-pointer"
              >
                Issue Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
