"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Paperclip,
  Send,
  Zap,
  ChevronDown,
  Circle,
  AlertCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { SupportTicket, ChatMessage, getStoredTickets, saveStoredTickets } from "@/lib/support-data";

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState("1");
  const [activeTab, setActiveTab] = useState<"All Tickets" | "Open" | "In Progress" | "Resolved">("All Tickets");
  const [sortBy, setSortBy] = useState("Newest");
  const [messageInput, setMessageInput] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load tickets on mount
  useEffect(() => {
    setTickets(getStoredTickets());
  }, []);

  // Find currently active ticket
  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];

  // Mark ticket as read when selected
  useEffect(() => {
    if (selectedTicket && selectedTicket.unread) {
      const updated = tickets.map((t) => {
        if (t.id === selectedTicket.id) {
          return { ...t, unread: false };
        }
        return t;
      });
      setTickets(updated);
      saveStoredTickets(updated);
    }
  }, [selectedTicketId]);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedTicket?.messages]);

  // Filter logic
  const filteredTickets = tickets.filter((t) => {
    if (activeTab === "All Tickets") return true;
    return t.status === activeTab;
  });

  // Sort logic
  const sortedTickets = [...filteredTickets].sort((a, b) => {
    // For simplicity, we sort by ID or priority
    if (sortBy === "Newest") {
      return b.id.localeCompare(a.id);
    }
    return a.id.localeCompare(b.id);
  });

  // Send message handler
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() || !selectedTicket) return;

    const timeString = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: "admin",
      text: messageInput.trim(),
      time: timeString,
    };

    const updated = tickets.map((t) => {
      if (t.id === selectedTicket.id) {
        return {
          ...t,
          snippet: messageInput.trim(),
          messages: [...t.messages, newMsg],
          timeAgo: "Just now",
        };
      }
      return t;
    });

    setTickets(updated);
    saveStoredTickets(updated);
    setMessageInput("");
  };

  // Change status handler
  const handleStatusChange = (newStatus: "Open" | "In Progress" | "Resolved") => {
    if (!selectedTicket) return;
    const updated = tickets.map((t) => {
      if (t.id === selectedTicket.id) {
        return { ...t, status: newStatus };
      }
      return t;
    });
    setTickets(updated);
    saveStoredTickets(updated);
  };

  // Get status pill style
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-amber-50 text-amber-600 border border-amber-100";
      case "In Progress":
        return "bg-blue-50 text-blue-600 border border-blue-100";
      case "Resolved":
        return "bg-emerald-50 text-emerald-600 border border-emerald-100";
      default:
        return "bg-zinc-50 text-zinc-600 border border-zinc-100";
    }
  };

  // Count active tickets (Open + In Progress)
  const activeTicketsCount = tickets.filter(
    (t) => t.status === "Open" || t.status === "In Progress"
  ).length;

  return (
    <div className="min-h-full p-8 space-y-6">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Support</h1>
        <p className="text-sm text-zinc-400 font-semibold leading-relaxed">
          Manage and respond to user support requests
        </p>
      </div>

      {/* ── Filters & Sorting ── */}
      <div className="bg-[#FFF0F2]/40 border border-[#FFF0F2]/60 rounded-3xl p-3 flex items-center justify-between flex-wrap gap-4">
        {/* Left Tabs */}
        <div className="flex items-center gap-1.5 bg-white/40 p-1 rounded-2xl border border-zinc-200/40">
          {(["All Tickets", "Open", "In Progress", "Resolved"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === tab
                  ? "bg-white text-[#B31046] shadow-xs"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Right Sort */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-zinc-400">Sort:</span>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-white border border-zinc-200/80 rounded-2xl p-2 px-4 pr-10 text-xs font-black text-[#B31046] outline-none cursor-pointer transition-all min-w-[120px]"
            >
              <option value="Newest">Newest First</option>
              <option value="Oldest">Oldest First</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#B31046] pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── Split Layout ── */}
      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-280px)] min-h-[580px]">
        {/* ── Left Sidebar: Recent Activity ── */}
        <div className="col-span-12 lg:col-span-4 flex flex-col bg-white rounded-3xl border border-zinc-100 shadow-xs overflow-hidden h-full">
          {/* Header */}
          <div className="p-4 border-b border-zinc-50 flex items-center justify-between">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">
              Recent Activity
            </span>
            <span className="bg-[#FFF0F2] text-[#B31046] text-[10px] font-black px-2 py-0.5 rounded-full">
              {activeTicketsCount} Active
            </span>
          </div>

          {/* Ticket Cards List */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-50/50">
            {sortedTickets.length > 0 ? (
              sortedTickets.map((ticket) => {
                const isSelected = ticket.id === selectedTicketId;
                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={`p-4 flex gap-3 relative cursor-pointer transition-all ${
                      isSelected
                        ? "bg-[#FFF0F2]/10 border-l-[3px] border-[#B31046]"
                        : "hover:bg-zinc-50/50 border-l-[3px] border-transparent"
                    }`}
                  >
                    {/* User Avatar */}
                    <div className="relative shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs select-none ${ticket.avatarColorBg} ${ticket.avatarColorText}`}>
                        {ticket.avatarInitials}
                      </div>
                      {/* Unread Indicator */}
                      {ticket.unread && (
                        <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#B31046] rounded-full border-2 border-white" />
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-zinc-800 truncate">
                          {ticket.customerName}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-400 shrink-0">
                          {ticket.timeAgo}
                        </span>
                      </div>
                      <span className="text-xs font-extrabold text-zinc-700 block truncate mt-1">
                        {ticket.title}
                      </span>
                      <p className="text-[11px] text-zinc-400 font-medium truncate mt-0.5">
                        {ticket.snippet}
                      </p>

                      {/* Badges */}
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getStatusBadgeStyle(ticket.status)}`}>
                          {ticket.status}
                        </span>
                        {ticket.priority === "High" && (
                          <span className="bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                            High Priority
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs font-extrabold text-zinc-400 leading-normal">
                No tickets matching this status.
              </div>
            )}
          </div>
        </div>

        {/* ── Right Panel: Chat Thread & Info ── */}
        <div className="col-span-12 lg:col-span-8 flex flex-col bg-white rounded-3xl border border-zinc-100 shadow-xs overflow-hidden h-full">
          {selectedTicket ? (
            <>
              {/* Card Header Info */}
              <div className="p-5 border-b border-zinc-100/80 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-sm select-none ${selectedTicket.avatarColorBg} ${selectedTicket.avatarColorText}`}>
                    {selectedTicket.avatarInitials}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-zinc-800">
                      {selectedTicket.customerName}
                    </h3>
                    <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
                      {selectedTicket.customerEmail}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {/* Status Dropdown */}
                  <div className="relative flex-1 sm:flex-initial">
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleStatusChange(e.target.value as any)}
                      className="w-full appearance-none bg-zinc-50 border border-zinc-200/80 rounded-2xl p-2 px-4 pr-10 text-xs font-extrabold text-zinc-700 outline-none cursor-pointer focus:border-[#B31046]"
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
                  </div>

                  {/* Assignee Badge */}
                  <div className="flex items-center gap-1.5 bg-[#FFF0F2]/40 border border-[#FFF0F2]/60 rounded-2xl p-2 px-3 text-xs font-black text-[#B31046] shrink-0 select-none">
                    <div className="w-5 h-5 rounded-full bg-[#B31046] text-white flex items-center justify-center text-[9px] font-black">
                      AD
                    </div>
                    <span>Me (Admin)</span>
                  </div>
                </div>
              </div>

              {/* Chat Messages Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-zinc-50/20">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-100/80 px-3 py-1 rounded-full w-max mx-auto block select-none">
                  Today, 10:42 AM
                </span>

                {selectedTicket.messages.map((msg) => {
                  const isAdmin = msg.sender === "admin";
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 max-w-[85%] ${
                        isAdmin ? "ml-auto justify-end flex-row-reverse" : "mr-auto"
                      }`}
                    >
                      {/* Avatar */}
                      <div className="shrink-0 select-none">
                        {isAdmin ? (
                          <div className="w-8 h-8 rounded-full bg-[#B31046] text-white flex items-center justify-center text-[10px] font-black shadow-xs">
                            AD
                          </div>
                        ) : (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] ${selectedTicket.avatarColorBg} ${selectedTicket.avatarColorText}`}>
                            {selectedTicket.avatarInitials}
                          </div>
                        )}
                      </div>

                      {/* Bubble */}
                      <div className="space-y-1">
                        <div
                          className={`p-3.5 rounded-3xl text-xs font-semibold leading-relaxed ${
                            isAdmin
                              ? "bg-[#B31046] text-white rounded-tr-none shadow-xs"
                              : "bg-[#FFF0F2]/50 border border-zinc-200/40 text-zinc-800 rounded-tl-none"
                          }`}
                        >
                          {msg.text}
                        </div>
                        <span className={`text-[9px] text-zinc-400 font-bold block ${isAdmin ? "text-right" : "text-left"}`}>
                          {msg.time}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Typing Indicator simulation */}
                {selectedTicket.status !== "Resolved" && (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 select-none pt-2">
                    <span className="animate-pulse">✍️</span>
                    <span>Admin is typing...</span>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Footer */}
              <div className="p-4 border-t border-zinc-100 shrink-0 space-y-3">
                <form onSubmit={handleSendMessage} className="flex gap-2 items-center bg-[#FFF0F2]/30 border border-[#FFF0F2]/60 rounded-2xl p-2 pl-3">
                  <button
                    type="button"
                    className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-full hover:bg-zinc-100 shrink-0 cursor-pointer"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type your response..."
                    className="flex-1 bg-transparent outline-none text-xs font-semibold text-zinc-800 placeholder-zinc-400/80 px-2"
                  />
                  <button
                    type="submit"
                    className="bg-[#B31046] hover:bg-[#960d3a] text-white text-xs font-bold py-2 px-4 rounded-full flex items-center gap-1 transition-all cursor-pointer shrink-0 shadow-sm"
                  >
                    <span>Send</span>
                    <Send className="w-3 h-3" />
                  </button>
                </form>

              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-zinc-400 text-xs font-extrabold">
              Select a ticket to begin response.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
