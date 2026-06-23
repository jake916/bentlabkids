"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { ToastContainer, ToastItem } from "@/components/Toast";
import { signIn, type ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email address");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    if (!password) {
      setError("Please enter your password");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      const response = await signIn({ email, password });
      if (response?.data?.session?.id) {
        localStorage.setItem("session_token", response.data.session.id);
      }
      showToast("Welcome back, administrator!", "success");
      // Go straight to dashboard
      router.push("/dashboard");
    } catch (err) {
      const apiErr = err as ApiError;
      const message = apiErr?.message ?? "Something went wrong. Please try again.";
      setError(message);
      showToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex flex-col lg:grid lg:grid-cols-2 overflow-hidden bg-white">
      {/* Left Pane: Branding & Hero Illustration (hidden on mobile) */}
      <section className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-zinc-950">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-[url('/login-bg.png')] bg-cover bg-center opacity-85 scale-105"
        />

        {/* Color Overlay Stack */}
        <div className="absolute inset-0 bg-[#B31046]/75 mix-blend-multiply" />

        <div
          className="absolute inset-0 opacity-80 mix-blend-screen"
          style={{
            background: "radial-gradient(circle at top left, rgba(59, 130, 246, 0.8), transparent 55%)"
          }}
        />

        <div
          className="absolute inset-0 opacity-75 mix-blend-screen"
          style={{
            background: "radial-gradient(circle at bottom right, rgba(16, 185, 129, 0.85), transparent 60%)"
          }}
        />

        {/* Branding Container (Top Left) */}
        <div className="relative z-10 flex items-center gap-2">
          <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/25 uppercase tracking-wider">
            Admin Portal
          </span>
        </div>

        {/* Center Content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center self-center max-w-md">
          {/* Pulse animation wrapper for logo */}
          <div className="relative mb-6 group cursor-pointer flex justify-center">
            <div className="absolute inset-0 bg-white/20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-500" />
            <Image
              src="/icon.png"
              alt="Bentlab Kids TV Icon"
              width={100}
              height={100}
              className="relative transition-transform duration-500 group-hover:scale-105 object-contain"
            />
          </div>

          <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-sm mb-3">
            Bentlab Kids TV
          </h1>
          <p className="text-white/95 text-lg font-medium tracking-wide">
            Manage your content. Inspire young hearts.
          </p>
        </div>

        {/* Bottom Glassmorphism Card */}
        <div className="relative z-10 self-start max-w-sm backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6 shadow-xl transform hover:translate-y-[-4px] transition-all duration-300">
          <p className="text-white text-sm leading-relaxed font-medium">
            &ldquo;Bringing world-class educational entertainment to the next generation of curious minds.&rdquo;
          </p>
        </div>
      </section>

      {/* Right Pane: Login Form */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-12 md:px-12 lg:px-20 bg-white font-sans">
        <div className="w-full max-w-md space-y-8">
          {/* Logo & Greeting */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left space-y-4 animate-fade-in">
            <div className="mb-4 flex justify-center lg:justify-start">
              <Image
                src="/logogo.png"
                alt="Bentlab Kids TV Logo"
                width={200}
                height={60}
                className="h-16 w-auto object-contain hover:opacity-95 transition-opacity"
                priority
              />
            </div>

            <div className="space-y-1">
              <h2 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
                Welcome back
              </h2>
              <p className="text-sm font-medium text-zinc-500">
                Sign in to your admin account
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 p-4 text-sm font-medium text-red-600 bg-red-50 border border-red-150 rounded-xl animate-shake">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Email Address */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-bold text-zinc-700 ml-1"
                >
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-[#B31046]" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@bentlab.tv"
                    className="block w-full pl-12 pr-4 py-3.5 bg-[#FFF0F2] text-[#B31046] border-2 border-transparent rounded-full focus:bg-white focus:border-[#B31046]/45 focus:outline-none placeholder-[#B31046]/40 transition-all font-semibold text-base shadow-inner focus:shadow-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label
                    htmlFor="password"
                    className="block text-sm font-bold text-zinc-700"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => router.push("/forgot-password")}
                    className="text-xs font-semibold text-[#B31046] hover:underline focus:outline-none cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-[#B31046]" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="************"
                    className="block w-full pl-12 pr-12 py-3.5 bg-[#FFF0F2] text-[#B31046] border-2 border-transparent rounded-full focus:bg-white focus:border-[#B31046]/45 focus:outline-none placeholder-[#B31046]/40 transition-all font-semibold text-base shadow-inner focus:shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-[#B31046] transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center py-4 px-6 border border-transparent rounded-full text-white bg-[#B31046] hover:bg-[#960d3a] active:scale-[0.98] focus:outline-none transition-all font-bold text-base shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : null}
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </form>
        </div>
      </section>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </main>
  );
}
