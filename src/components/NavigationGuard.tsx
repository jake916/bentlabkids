"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";

interface NavigationGuardProps {
  isDirty: boolean;
  onSaveAsDraft: () => Promise<boolean>;
  onDiscard: () => void;
}

export default function NavigationGuard({
  isDirty,
  onSaveAsDraft,
  onDiscard,
}: NavigationGuardProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [targetUrl, setTargetUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    const handleAnchorClick = (e: MouseEvent) => {
      let target = e.target as HTMLElement | null;
      while (target && target.tagName !== "A") {
        target = target.parentElement;
      }

      if (target && target instanceof HTMLAnchorElement) {
        const href = target.getAttribute("href");
        
        if (
          href &&
          (href.startsWith("/") || href.startsWith(window.location.origin)) &&
          !href.startsWith("#") &&
          !href.startsWith("javascript:")
        ) {
          // Check if it's the exact current page to avoid double intercepting
          const cleanHref = href.split("?")[0].split("#")[0];
          const cleanCurrent = window.location.pathname;
          if (cleanHref === cleanCurrent) return;

          e.preventDefault();
          e.stopPropagation();

          setTargetUrl(href);
          setShowModal(true);
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleAnchorClick, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleAnchorClick, true);
    };
  }, [isDirty]);

  const handleConfirmSave = async () => {
    setIsSaving(true);
    try {
      const success = await onSaveAsDraft();
      if (success) {
        setShowModal(false);
        if (targetUrl) {
          router.push(targetUrl);
        }
      }
    } catch (err) {
      console.error("Failed to auto-save draft:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDiscard = () => {
    onDiscard();
    setShowModal(false);
    if (targetUrl) {
      router.push(targetUrl);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setTargetUrl(null);
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-zinc-100 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-[#FFF0F2] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-[#B31046]" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-extrabold text-zinc-900">Unsaved Changes</h3>
            <p className="text-xs font-semibold text-zinc-500 leading-relaxed">
              You are not done creating or editing. Would you like to save your progress as a draft, or discard your changes?
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={handleConfirmSave}
            disabled={isSaving}
            className="w-full py-3 bg-[#B31046] hover:bg-[#960d3a] text-white font-extrabold text-sm rounded-full shadow-md active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer select-none disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Save as Draft"
            )}
          </button>
          <button
            onClick={handleConfirmDiscard}
            disabled={isSaving}
            className="w-full py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-extrabold text-sm rounded-full active:scale-[0.98] transition-all cursor-pointer select-none disabled:opacity-50"
          >
            Don't Save
          </button>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="w-full py-3 border border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-extrabold text-sm rounded-full active:scale-[0.98] transition-all cursor-pointer select-none disabled:opacity-50"
          >
            Keep Editing
          </button>
        </div>
      </div>
    </div>
  );
}
