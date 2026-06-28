"use client";

import React from "react";

export default function DashboardSkeleton() {
  return (
    <div className="min-h-full p-8 space-y-8 font-sans animate-pulse">
      {/* ── Header Skeleton ── */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          {/* Dashboard title skeleton */}
          <div className="h-8 w-36 bg-zinc-200 rounded-lg"></div>
          {/* Welcome back subtitle skeleton */}
          <div className="h-4 w-48 bg-zinc-200 rounded-lg"></div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
          {/* Search bar skeleton */}
          <div className="h-9 flex-1 md:flex-none md:w-52 bg-zinc-200 rounded-full"></div>

          <div className="flex items-center gap-4 shrink-0">
            {/* Bell button skeleton */}
            <div className="h-9 w-9 bg-zinc-200 rounded-full"></div>
            {/* Avatar skeleton */}
            <div className="h-9 w-9 bg-zinc-200 rounded-full"></div>
          </div>
        </div>
      </header>

      {/* ── Stats Row Skeleton ── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-100 space-y-4"
          >
            <div className="flex items-center gap-3">
              {/* Stat Icon Box */}
              <div className="w-10 h-10 rounded-xl bg-zinc-200 shrink-0"></div>
              {/* Stat Label */}
              <div className="h-4 w-20 bg-zinc-200 rounded-lg"></div>
            </div>
            <div className="space-y-2">
              {/* Stat Value */}
              <div className="h-8 w-16 bg-zinc-200 rounded-lg"></div>
              {/* Stat Subtext */}
              <div className="h-3 w-24 bg-zinc-200 rounded-lg"></div>
            </div>
          </div>
        ))}
      </section>

      {/* ── Quick Actions Skeleton ── */}
      <section className="space-y-4">
        {/* Section title */}
        <div className="h-5 w-28 bg-zinc-200 rounded-lg"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 flex flex-col items-center gap-4 border border-zinc-100 shadow-sm"
            >
              {/* Action Icon Box */}
              <div className="w-14 h-14 rounded-2xl bg-zinc-200"></div>
              {/* Action Label */}
              <div className="h-4 w-20 bg-zinc-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom Row Skeleton ── */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-8">
        
        {/* Recent Bible Stories Skeleton */}
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-50">
            {/* Title */}
            <div className="h-5 w-36 bg-zinc-200 rounded-lg"></div>
            {/* View all button */}
            <div className="h-4 w-12 bg-zinc-200 rounded-lg"></div>
          </div>

          <div className="p-6 space-y-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Story Avatar */}
                  <div className="w-10 h-10 rounded-full bg-zinc-200 shrink-0"></div>
                  <div className="space-y-2">
                    {/* Story Title */}
                    <div className="h-4 w-48 bg-zinc-200 rounded-lg"></div>
                    {/* Story Meta */}
                    <div className="h-3.5 w-32 bg-zinc-200 rounded-lg"></div>
                  </div>
                </div>
                {/* Story Status Badge */}
                <div className="h-6 w-16 bg-zinc-200 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders / Activity Skeleton */}
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-50">
            {/* Title */}
            <div className="h-5 w-28 bg-zinc-200 rounded-lg"></div>
            {/* View all button */}
            <div className="h-4 w-12 bg-zinc-200 rounded-lg"></div>
          </div>

          <div className="p-6 space-y-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="space-y-2">
                  {/* Item Description */}
                  <div className="h-4 w-40 bg-zinc-200 rounded-lg"></div>
                  {/* Item Subtitle */}
                  <div className="h-3.5 w-24 bg-zinc-200 rounded-lg"></div>
                </div>
                {/* Item Status/Price Badge */}
                <div className="h-6 w-16 bg-zinc-200 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>

      </section>
    </div>
  );
}
