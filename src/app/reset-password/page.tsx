"use client";

import React, { useState, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { ToastContainer, ToastItem } from "@/components/Toast";
import { resetPassword, type ApiError } from "@/lib/api";

type Step = "set_password" | "success";

// Inner component that uses useSearchParams (must be wrapped in Suspense)
function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [step, setStep] = useState<Step>("set_password");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Toast State
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!newPassword || !confirmPassword) {
      setError("Please fill out both password fields");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!token) {
      setError("Reset token is missing. Please use the link from your email.");
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword({ token, password: newPassword });
      setStep("success");
      showToast("Password updated successfully!", "success");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const apiErr = err as ApiError;
      const message = apiErr?.message ?? "Could not reset password. Please try again.";
      setError(message);
      showToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-gradient-to-tr from-[#F1F3F9] via-[#F6F7FA] to-[#F1F3F9] font-sans">
      {/* Top Logo */}
      <div className="mb-6 animate-fade-in">
        <Image
          src="/logogo.png"
          alt="Bentlab Kids TV Logo"
          width={180}
          height={60}
          className="h-14 w-auto object-contain"
          priority
        />
      </div>

      {/* Card */}
      <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl max-w-md w-full border border-zinc-100/80 flex flex-col items-center text-center space-y-6 animate-fade-in relative">

        {error && (
          <div className="w-full flex items-center gap-2 p-4 text-xs font-semibold text-red-600 bg-red-50 border border-red-150 rounded-xl animate-shake">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 3: Set New Password */}
        {step === "set_password" && (
          <>
            <div className="bg-[#FFF0F2] text-[#B31046] rounded-full p-4 w-16 h-16 flex items-center justify-center shadow-inner">
              <Lock className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
                Set a new password
              </h1>
              <p className="text-sm font-medium text-zinc-500 leading-relaxed">
                Your new password must be at least 8 characters.
              </p>
            </div>

            <form onSubmit={handleResetSubmit} className="w-full space-y-4 pt-2">
              {/* New Password */}
              <div className="relative text-left space-y-1">
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full pl-4 pr-12 py-3 bg-[#FFF0F2] text-[#B31046] border-2 border-transparent rounded-xl focus:bg-white focus:border-[#B31046]/45 focus:outline-none placeholder-[#B31046]/35 font-semibold text-base shadow-inner transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-3 text-zinc-400 hover:text-[#B31046] transition-colors"
                >
                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Confirm Password */}
              <div className="relative text-left space-y-1">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-4 pr-12 py-3 bg-[#FFF0F2] text-[#B31046] border-2 border-transparent rounded-xl focus:bg-white focus:border-[#B31046]/45 focus:outline-none placeholder-[#B31046]/35 font-semibold text-base shadow-inner transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-3 text-zinc-400 hover:text-[#B31046] transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center py-4 px-6 border border-transparent rounded-full text-white bg-[#B31046] hover:bg-[#960d3a] active:scale-[0.98] focus:outline-none transition-all font-bold text-base shadow-md disabled:opacity-75 cursor-pointer mt-4"
              >
                {isLoading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : null}
                {isLoading ? "Updating..." : "Update password"}
              </button>
            </form>

            <button
              onClick={() => router.push("/login")}
              className="text-sm font-semibold text-zinc-500 hover:text-zinc-800 transition-colors flex items-center gap-1.5 select-none focus:outline-none pt-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to login</span>
            </button>
          </>
        )}

        {/* STEP 4: Success */}
        {step === "success" && (
          <>
            <div className="bg-[#FFF0F2] text-[#B31046] rounded-full p-4 w-16 h-16 flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black text-zinc-900 tracking-tight animate-bounce">
                Password updated
              </h1>
              <p className="text-sm font-medium text-zinc-500 leading-relaxed px-4">
                Your password has been changed successfully. You can now sign in with your new password.
              </p>
            </div>

            <div className="w-full pt-4">
              <button
                onClick={() => router.push("/login")}
                className="w-full py-4 px-6 border border-transparent rounded-full text-white bg-[#B31046] hover:bg-[#960d3a] active:scale-[0.98] transition-all font-bold text-base shadow-md cursor-pointer"
              >
                Back to login
              </button>
            </div>
          </>
        )}
      </div>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </main>
  );
}

// Wrap in Suspense — required by Next.js when useSearchParams is used in a page
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-[#F1F3F9] via-[#F6F7FA] to-[#F1F3F9]">
        <div className="w-10 h-10 border-4 border-[#B31046] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
