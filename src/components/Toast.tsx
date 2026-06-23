import React from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export interface ToastItem {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

interface ToastProps {
  toasts: ToastItem[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastProps) {
  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 pointer-events-none w-full max-w-sm px-4 md:px-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center justify-between w-full p-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.06)] border border-zinc-100/90 animate-slide-in transition-all overflow-hidden"
          role="alert"
        >
          {/* Side color accent indicator */}
          <div 
            className={`absolute left-0 top-0 bottom-0 w-1.5 ${
              toast.type === "success" ? "bg-[#B31046]" : "bg-red-500"
            }`} 
          />

          <div className="flex items-center gap-3 pl-1">
            {toast.type === "success" ? (
              <div className="bg-[#FFF0F2] text-[#B31046] p-2 rounded-full flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            ) : (
              <div className="bg-red-50 text-red-600 p-2 rounded-full flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
            )}
            
            <p className="text-sm font-bold text-zinc-800 leading-snug">
              {toast.message}
            </p>
          </div>

          <button
            onClick={() => onClose(toast.id)}
            className="text-zinc-400 hover:text-zinc-700 p-1.5 hover:bg-zinc-50 rounded-lg transition-colors ml-3 shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
