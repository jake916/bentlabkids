"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Mail, Send, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { ToastContainer, ToastItem } from "@/components/Toast";
import { forgotPassword, type ApiError } from "@/lib/api";

type Step = "enter_email" | "check_email";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("enter_email");
  const [recoveryEmail, setRecoveryEmail] = useState("");

  // Status States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!recoveryEmail) {
      setError("Please enter your admin email address");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(recoveryEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      await forgotPassword({ email: recoveryEmail, redirectTo });
      setStep("check_email");
      showToast("Reset link sent! Check your inbox.", "success");
    } catch (err) {
      const apiErr = err as ApiError;
      const message = apiErr?.message ?? "Could not send reset email. Please try again.";
      setError(message);
      showToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setIsLoading(true);
    setSuccessMessage("");
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      await forgotPassword({ email: recoveryEmail, redirectTo });
      setSuccessMessage("Reset email has been resent successfully!");
      showToast("Reset email resent!", "success");
    } catch (err) {
      const apiErr = err as ApiError;
      showToast(apiErr?.message ?? "Could not resend email.", "error");
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

      {/* Card Container */}
      <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl max-w-md w-full border border-zinc-100/80 flex flex-col items-center text-center space-y-6 animate-fade-in relative">

        {error && (
          <div className="w-full flex items-center gap-2 p-4 text-xs font-semibold text-red-600 bg-red-50 border border-red-150 rounded-xl animate-shake">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="w-full flex items-center gap-2 p-4 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-150 rounded-xl animate-fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* STEP 1: Enter Email */}
        {step === "enter_email" && (
          <>
            <div className="bg-[#FFF0F2] text-[#B31046] rounded-full p-4 w-16 h-16 flex items-center justify-center shadow-inner">
              <Mail className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
                Recover your account
              </h1>
              <p className="text-sm font-medium text-zinc-500 leading-relaxed px-2">
                Enter your admin email address and we&apos;ll send you a secure reset link.
              </p>
            </div>

            <form onSubmit={handleRecoverySubmit} className="w-full space-y-4 pt-2">
              <div className="space-y-1.5 text-left">
                <label htmlFor="recovery-email" className="block text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">
                  Admin Email
                </label>
                <input
                  id="recovery-email"
                  type="email"
                  required
                  placeholder="name@bentlab.com"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  className="block w-full px-4 py-3 bg-[#FFF0F2] text-[#B31046] border-2 border-transparent rounded-xl focus:bg-white focus:border-[#B31046]/45 focus:outline-none placeholder-[#B31046]/35 font-semibold text-base shadow-inner transition-all"
                />
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
                {isLoading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          </>
        )}

        {/* STEP 2: Check Email */}
        {step === "check_email" && (
          <>
            <div className="bg-[#FFF0F2] text-[#B31046] rounded-full p-4 w-16 h-16 flex items-center justify-center shadow-inner relative">
              <Send className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
                Check your email
              </h1>
              <p className="text-sm font-medium text-zinc-500 leading-relaxed px-4">
                We&apos;ve sent a secure reset link to <span className="font-bold text-zinc-700">{recoveryEmail}</span>. The link will expire in 30 minutes.
              </p>
            </div>

            <div className="w-full space-y-3 pt-4">
              <button
                onClick={handleResendEmail}
                disabled={isLoading}
                className="w-full py-4 px-6 border-2 border-[#B31046] text-[#B31046] bg-white hover:bg-[#FFF0F2] active:scale-[0.98] transition-all font-bold text-base rounded-full shadow-sm hover:shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? "Resending..." : "Resend email"}
              </button>
            </div>
          </>
        )}

        {/* Back to Login */}
        <button
          onClick={() => router.push("/login")}
          className="text-sm font-semibold text-zinc-500 hover:text-zinc-800 transition-colors flex items-center gap-1.5 select-none focus:outline-none pt-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to login</span>
        </button>
      </div>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </main>
  );
}
