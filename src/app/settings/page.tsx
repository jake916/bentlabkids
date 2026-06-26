"use client";

import React, { useState, useEffect } from "react";
import {
  Store,
  Banknote,
  Truck,
  MapPin,
  Globe,
  Plane,
  X,
  Plus,
  Image as ImageIcon,
  Check,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { ToastContainer, ToastItem } from "@/components/Toast";
import { StoreSettings, getStoredSettings, saveStoredSettings } from "@/lib/settings-data";
import { getStoreSettings, updateStoreSettings, StoreSettingsApiData } from "@/lib/api";
import MediaSelectModal, { MediaFile } from "@/components/MediaSelectModal";

function mapApiToSettings(api: StoreSettingsApiData, local: StoreSettings): StoreSettings {
  let returnWindow = "30 Days";
  if (api.returnWindowDays === 14) returnWindow = "14 Days";
  else if (api.returnWindowDays === 60) returnWindow = "60 Days";

  let returnProcessingTime = "3-5 Days";
  if (api.processingDaysMin === 1 && api.processingDaysMax === 2) returnProcessingTime = "1-2 Days";
  else if (api.processingDaysMin === 7 && api.processingDaysMax === 10) returnProcessingTime = "7-10 Days";

  let defaultOrderStatus = "Pending";
  if (api.defaultOrderStatus === "PROCESSING") defaultOrderStatus = "Processing";
  else if (api.defaultOrderStatus === "DELIVERED") defaultOrderStatus = "Delivered";

  return {
    ...local,
    storeName: api.name || "",
    contactEmail: api.email || "",
    phone: api.phone || "",
    website: api.website || "",
    physicalAddress: api.address || "",
    defaultCurrency: api.defaultCurrency || "USD",
    autoDetectLocation: api.autoDetectLocationAndCurrency,
    allowManualCurrency: api.allowManualCurrencySwitching,
    logoUrl: api.logoUrl || "/logo-placeholder.png",
    baseDeliveryFee: api.baseDeliveryFee,
    enableFreeDelivery: api.freeDeliveryEnabled,
    freeDeliveryThreshold: api.freeDeliveryThreshold,
    returnPolicySummary: api.refundPolicy || "",
    returnWindow,
    returnProcessingTime,
    defaultOrderStatus,
    autoUpdateInventory: api.autoUpdateInventory,
  };
}

function mapSettingsToApi(settings: StoreSettings): Partial<Omit<StoreSettingsApiData, "id" | "createdAt" | "updatedAt" | "lastUpdatedBy">> {
  let returnWindowDays = 30;
  if (settings.returnWindow === "14 Days") returnWindowDays = 14;
  else if (settings.returnWindow === "60 Days") returnWindowDays = 60;

  let processingDaysMin = 3;
  let processingDaysMax = 5;
  if (settings.returnProcessingTime === "1-2 Days") {
    processingDaysMin = 1;
    processingDaysMax = 2;
  } else if (settings.returnProcessingTime === "7-10 Days") {
    processingDaysMin = 7;
    processingDaysMax = 10;
  }

  const defaultOrderStatus = settings.defaultOrderStatus.toUpperCase();

  return {
    name: settings.storeName,
    email: settings.contactEmail,
    phone: settings.phone,
    website: settings.website,
    address: settings.physicalAddress,
    defaultCurrency: settings.defaultCurrency,
    autoDetectLocationAndCurrency: settings.autoDetectLocation,
    allowManualCurrencySwitching: settings.allowManualCurrency,
    logoUrl: settings.logoUrl,
    baseDeliveryFee: settings.baseDeliveryFee,
    freeDeliveryEnabled: settings.enableFreeDelivery,
    freeDeliveryThreshold: settings.freeDeliveryThreshold,
    refundPolicy: settings.returnPolicySummary,
    returnWindowDays,
    processingDaysMin,
    processingDaysMax,
    defaultOrderStatus,
    autoUpdateInventory: settings.autoUpdateInventory,
  };
}

// Helper to format currency
const formatNaira = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace("NGN", "₦");
};

export default function AccountSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  
  // Add Currency modal/popover state
  const [isAddCurrencyOpen, setIsAddCurrencyOpen] = useState(false);
  const [newCurrencyInput, setNewCurrencyInput] = useState("");

  // Media selection modal state
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  // Load settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const localData = getStoredSettings();
        const apiRes = await getStoreSettings();
        if (apiRes && apiRes.success && apiRes.data) {
          const merged = mapApiToSettings(apiRes.data, localData);
          setSettings(merged);
        } else {
          setSettings(localData);
        }
      } catch (e) {
        console.error("Failed to load settings from API, falling back to local storage", e);
        setSettings(getStoredSettings());
      }
    }
    loadSettings();
  }, []);

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

  // Generic change handlers
  const handleInputChange = (field: keyof StoreSettings, value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [field]: value,
    });
  };

  const handleCheckboxToggle = (field: "availableMethods" | "returnEligibility", option: string) => {
    if (!settings) return;
    const currentList = settings[field] as string[];
    const updatedList = currentList.includes(option)
      ? currentList.filter((item) => item !== option)
      : [...currentList, option];
    
    setSettings({
      ...settings,
      [field]: updatedList,
    });
  };

  const handleAddCurrency = () => {
    if (!settings || !newCurrencyInput.trim()) return;
    const cleanCode = newCurrencyInput.trim().toUpperCase();
    
    if (settings.supportedCurrencies.includes(cleanCode)) {
      addToast("error", `${cleanCode} is already a supported currency`);
      return;
    }
    
    if (cleanCode.length !== 3) {
      addToast("error", "Currency code must be exactly 3 letters");
      return;
    }

    setSettings({
      ...settings,
      supportedCurrencies: [...settings.supportedCurrencies, cleanCode],
    });
    setNewCurrencyInput("");
    setIsAddCurrencyOpen(false);
    addToast("success", `Added currency ${cleanCode}`);
  };

  const handleRemoveCurrency = (code: string) => {
    if (!settings) return;
    if (settings.defaultCurrency === code) {
      addToast("error", `Cannot remove default currency (${code})`);
      return;
    }
    setSettings({
      ...settings,
      supportedCurrencies: settings.supportedCurrencies.filter((c) => c !== code),
    });
    addToast("info", `Removed currency ${code}`);
  };

  const handleSaveChanges = async () => {
    if (!settings) return;
    // Validate email
    if (settings.contactEmail && !settings.contactEmail.includes("@")) {
      addToast("error", "Please enter a valid store contact email");
      return;
    }

    try {
      const apiPayload = mapSettingsToApi(settings);
      const res = await updateStoreSettings(apiPayload);
      if (res.success) {
        saveStoredSettings(settings);
        addToast("success", "Settings changes saved successfully!");
      } else {
        addToast("error", "Failed to save settings to server.");
      }
    } catch (err: any) {
      console.error("Failed to update store settings:", JSON.stringify(err));
      const validationDetails = err?.errors && Array.isArray(err.errors)
        ? ": " + err.errors.map((e: any) => `${e.path || e.field || ""}: ${e.message || ""}`).join(", ")
        : "";
      addToast("error", (err?.message || "Failed to update store settings") + validationDetails);
    }
  };

  const handleCancel = async () => {
    try {
      const localData = getStoredSettings();
      const apiRes = await getStoreSettings();
      if (apiRes && apiRes.success && apiRes.data) {
        const merged = mapApiToSettings(apiRes.data, localData);
        setSettings(merged);
        addToast("info", "Settings reverted to last saved state");
      } else {
        setSettings(localData);
        addToast("info", "Settings reverted to last saved state");
      }
    } catch (e) {
      setSettings(getStoredSettings());
      addToast("info", "Settings reverted to last saved state");
    }
  };

  const handleReplaceLogo = () => {
    setIsMediaModalOpen(true);
  };

  const handleMediaConfirm = (media: MediaFile) => {
    if (media.url) {
      handleInputChange("logoUrl", media.url);
    }
    setIsMediaModalOpen(false);
  };

  if (!settings) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-8 h-8 rounded-full border-4 border-[#B31046] border-t-transparent animate-spin mb-4" />
        <h2 className="text-sm font-bold text-zinc-700">Loading configurations...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#F8F9FC] p-8 space-y-6 font-sans relative">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* ── Header ── */}
      <header className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Account Settings</h1>
          <p className="text-xs font-semibold text-zinc-500 mt-1 max-w-xl leading-relaxed">
            Manage your platform configuration, store preferences, and brand identity settings from this central dashboard.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleCancel}
            className="px-5 py-2.5 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 text-xs font-extrabold rounded-full transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveChanges}
            className="px-5 py-2.5 bg-[#B31046] hover:bg-[#960d3a] text-white text-xs font-bold rounded-full transition-all shadow-sm cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </header>

      {/* ── Tabs Row ── */}
      <div className="border-b border-zinc-100 flex items-center gap-6">
        <button className="text-xs font-extrabold text-[#B31046] pb-3 border-b-2 border-[#B31046] select-none cursor-pointer">
          Store Settings
        </button>
      </div>

      {/* ── Grid Layout columns split ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (span 7): Main Settings Forms */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Store Information */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FFF0F2] flex items-center justify-center text-[#B31046] shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <h2 className="text-base font-extrabold text-zinc-800 tracking-tight">Store Information</h2>
            </div>

            <div className="space-y-4">
              {/* Store Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Store Name</label>
                <input
                  type="text"
                  value={settings.storeName}
                  onChange={(e) => handleInputChange("storeName", e.target.value)}
                  className="w-full bg-[#FFF0F2]/30 border border-zinc-200/60 rounded-2xl p-3 px-4 font-semibold text-zinc-800 text-xs focus:border-[#B31046] focus:ring-1 focus:ring-[#B31046] focus:bg-white transition-all outline-none"
                  placeholder="Enter store name"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Contact Email</label>
                  <input
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                    className="w-full bg-[#FFF0F2]/30 border border-zinc-200/60 rounded-2xl p-3 px-4 font-semibold text-zinc-800 text-xs focus:border-[#B31046] focus:ring-1 focus:ring-[#B31046] focus:bg-white transition-all outline-none"
                    placeholder="store@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Phone</label>
                  <input
                    type="text"
                    value={settings.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="w-full bg-[#FFF0F2]/30 border border-zinc-200/60 rounded-2xl p-3 px-4 font-semibold text-zinc-800 text-xs focus:border-[#B31046] focus:ring-1 focus:ring-[#B31046] focus:bg-white transition-all outline-none"
                    placeholder="+234..."
                  />
                </div>
              </div>

              {/* Website */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Website</label>
                <input
                  type="text"
                  value={settings.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  className="w-full bg-[#FFF0F2]/30 border border-zinc-200/60 rounded-2xl p-3 px-4 font-semibold text-zinc-800 text-xs focus:border-[#B31046] focus:ring-1 focus:ring-[#B31046] focus:bg-white transition-all outline-none"
                  placeholder="https://..."
                />
              </div>

              {/* Physical Address */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Physical Address</label>
                <textarea
                  rows={2}
                  value={settings.physicalAddress}
                  onChange={(e) => handleInputChange("physicalAddress", e.target.value)}
                  className="w-full bg-[#FFF0F2]/30 border border-zinc-200/60 rounded-2xl p-3 px-4 font-semibold text-zinc-800 text-xs focus:border-[#B31046] focus:ring-1 focus:ring-[#B31046] focus:bg-white transition-all outline-none resize-none"
                  placeholder="Enter physical address..."
                />
              </div>
            </div>
          </div>

          {/* Card 2: Currency & Pricing */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <Banknote className="w-5 h-5" />
              </div>
              <h2 className="text-base font-extrabold text-zinc-800 tracking-tight">Currency & Pricing</h2>
            </div>

            <div className="space-y-5">
              {/* Default Currency Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Default Currency</label>
                <select
                  value={settings.defaultCurrency}
                  onChange={(e) => handleInputChange("defaultCurrency", e.target.value)}
                  className="w-full bg-[#FFF0F2]/30 border border-zinc-200/60 rounded-2xl p-3 px-4 font-semibold text-zinc-800 text-xs focus:border-[#B31046] focus:ring-1 focus:ring-[#B31046] focus:bg-white transition-all outline-none cursor-pointer"
                >
                  <option value="USD">USD - US Dollar ($)</option>
                  <option value="NGN">NGN - Nigerian Naira (₦)</option>
                  <option value="GBP">GBP - British Pound Sterling (£)</option>
                  <option value="EUR">EUR - Euro (€)</option>
                </select>
              </div>

              {/* Supported Currencies Tag List */}
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Supported Currencies</label>
                <div className="flex flex-wrap gap-2 items-center">
                  {settings.supportedCurrencies.map((code) => (
                    <span
                      key={code}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF0F2] text-[#B31046] text-xs font-extrabold rounded-full select-none"
                    >
                      <span>{code}</span>
                      <button
                        onClick={() => handleRemoveCurrency(code)}
                        className="hover:bg-rose-100 rounded-full p-0.5 cursor-pointer text-rose-800"
                        title="Remove supported currency"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}

                  {/* Add Currency Tag Trigger */}
                  <div className="relative">
                    <button
                      onClick={() => setIsAddCurrencyOpen(!isAddCurrencyOpen)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800 text-xs font-bold rounded-full transition-all cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Currency</span>
                    </button>

                    {isAddCurrencyOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsAddCurrencyOpen(false)} />
                        <div className="absolute left-0 mt-2 w-48 bg-white border border-zinc-100 rounded-2xl shadow-xl z-20 p-3.5 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
                          <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider block">Add Currency Code</span>
                          <input
                            type="text"
                            maxLength={3}
                            placeholder="e.g. EUR"
                            value={newCurrencyInput}
                            onChange={(e) => setNewCurrencyInput(e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2 px-3 text-xs font-bold uppercase outline-none focus:border-[#B31046]"
                          />
                          <button
                            onClick={handleAddCurrency}
                            className="w-full py-2 bg-[#B31046] hover:bg-[#960d3a] text-white text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer"
                          >
                            Confirm Add
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-4 pt-2 border-t border-zinc-50">
                {/* Toggle 1: Auto detect */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-zinc-700">Auto-detect customer location & currency</span>
                  <button
                    onClick={() => handleInputChange("autoDetectLocation", !settings.autoDetectLocation)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-all duration-300 cursor-pointer ${
                      settings.autoDetectLocation ? "bg-[#B31046]" : "bg-zinc-200"
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                        settings.autoDetectLocation ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Toggle 2: Allow manual switching */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-zinc-700">Allow manual currency switching in storefront</span>
                  <button
                    onClick={() => handleInputChange("allowManualCurrency", !settings.allowManualCurrency)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-all duration-300 cursor-pointer ${
                      settings.allowManualCurrency ? "bg-[#B31046]" : "bg-zinc-200"
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                        settings.allowManualCurrency ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Shipping & Delivery Policies */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <h2 className="text-base font-extrabold text-zinc-800 tracking-tight">Shipping & Delivery Policies</h2>
            </div>

            <div className="space-y-5">
              {/* Delivery Policy Text */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Delivery Policy Text</label>
                <textarea
                  rows={3}
                  value={settings.deliveryPolicyText}
                  onChange={(e) => handleInputChange("deliveryPolicyText", e.target.value)}
                  className="w-full bg-[#FFF0F2]/30 border border-zinc-200/60 rounded-2xl p-3 px-4 font-semibold text-zinc-800 text-xs focus:border-[#B31046] focus:ring-1 focus:ring-[#B31046] focus:bg-white transition-all outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Coverage & Timelines */}
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Coverage & Timelines</label>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Lagos */}
                  <div className="bg-[#FFF0F2]/20 border border-zinc-100 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-1.5 text-[#B31046]">
                      <MapPin className="w-4 h-4" />
                      <span className="text-xs font-black">Lagos</span>
                    </div>
                    <input
                      type="text"
                      value={settings.timelineLagos}
                      onChange={(e) => handleInputChange("timelineLagos", e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded-xl p-2 px-3 text-[11px] font-bold text-zinc-700 focus:border-[#B31046] outline-none"
                      placeholder="e.g. 1-2 days"
                    />
                  </div>

                  {/* Nationwide */}
                  <div className="bg-[#FFF0F2]/20 border border-zinc-100 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-1.5 text-[#B31046]">
                      <Globe className="w-4 h-4" />
                      <span className="text-xs font-black">Nationwide</span>
                    </div>
                    <input
                      type="text"
                      value={settings.timelineNationwide}
                      onChange={(e) => handleInputChange("timelineNationwide", e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded-xl p-2 px-3 text-[11px] font-bold text-zinc-700 focus:border-[#B31046] outline-none"
                      placeholder="e.g. 3-5 days"
                    />
                  </div>

                  {/* International */}
                  <div className="bg-[#FFF0F2]/20 border border-zinc-100 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-1.5 text-[#B31046]">
                      <Plane className="w-4 h-4" />
                      <span className="text-xs font-black">International</span>
                    </div>
                    <input
                      type="text"
                      value={settings.timelineInternational}
                      onChange={(e) => handleInputChange("timelineInternational", e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded-xl p-2 px-3 text-[11px] font-bold text-zinc-700 focus:border-[#B31046] outline-none"
                      placeholder="e.g. 7-14 days"
                    />
                  </div>
                </div>
              </div>

              {/* Available Methods */}
              <div className="space-y-2 pt-2 border-t border-zinc-50">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Available Methods</label>
                
                <div className="flex flex-col sm:flex-row gap-4 pt-1">
                  {["Home Delivery", "Pickup Point", "Express Courier"].map((method) => {
                    const isChecked = settings.availableMethods.includes(method);
                    return (
                      <button
                        key={method}
                        onClick={() => handleCheckboxToggle("availableMethods", method)}
                        className="flex items-center gap-2 text-xs font-bold text-zinc-700 cursor-pointer select-none"
                      >
                        {isChecked ? (
                          <div className="w-4.5 h-4.5 rounded-full bg-[#B31046] flex items-center justify-center text-white shrink-0">
                            <Check className="w-3 h-3" />
                          </div>
                        ) : (
                          <div className="w-4.5 h-4.5 rounded-full border border-zinc-300 bg-white shrink-0" />
                        )}
                        <span>{method}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (span 5): Sidebar Settings */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: Store Branding */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm space-y-4">
            <h2 className="text-sm font-extrabold text-zinc-800 tracking-tight">Store Branding</h2>
            
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Store Logo</span>
              
              {/* Dash Frame Uploader Box */}
              <div className="border-2 border-dashed border-rose-200 bg-[#FFF0F2]/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-zinc-200 to-zinc-300 border border-zinc-100 flex items-center justify-center relative shadow-inner overflow-hidden">
                  {settings.logoUrl && settings.logoUrl !== "/logo-placeholder.png" ? (
                    <img src={settings.logoUrl} alt="Store Logo" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-white/80">
                        <ImageIcon className="w-4.5 h-4.5 text-zinc-400" />
                      </div>
                      <div className="absolute w-2 h-2 rounded-full bg-[#B31046] bottom-10" />
                    </>
                  )}
                </div>

                <div className="space-y-1">
                  <button
                    onClick={handleReplaceLogo}
                    className="text-xs font-extrabold text-[#B31046] hover:underline cursor-pointer block mx-auto"
                  >
                    Replace Logo
                  </button>
                  <span className="text-[9px] font-bold text-zinc-400 block">(SVG, PNG, or JPG (Max 2MB))</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Delivery Settings */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm space-y-5">
            <h2 className="text-sm font-extrabold text-zinc-800 tracking-tight">Delivery Settings</h2>

            <div className="space-y-4">
              {/* Base Delivery Fee */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Base Delivery Fee</label>
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[8px] font-extrabold tracking-wider uppercase border border-blue-100">Enabled</span>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.baseDeliveryFee}
                    onChange={(e) => handleInputChange("baseDeliveryFee", parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#FFF0F2]/30 border border-zinc-200/60 rounded-2xl p-3 pl-8 font-semibold text-zinc-800 text-xs focus:border-[#B31046] outline-none"
                  />
                </div>
              </div>

              {/* Enable Free Delivery Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-50">
                <span className="text-xs font-extrabold text-zinc-700">Enable Free Delivery</span>
                <button
                  onClick={() => handleInputChange("enableFreeDelivery", !settings.enableFreeDelivery)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-all duration-300 cursor-pointer ${
                    settings.enableFreeDelivery ? "bg-[#B31046]" : "bg-zinc-200"
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                      settings.enableFreeDelivery ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Threshold Amount */}
              {settings.enableFreeDelivery && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Threshold Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={settings.freeDeliveryThreshold}
                      onChange={(e) => handleInputChange("freeDeliveryThreshold", parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#FFF0F2]/30 border border-zinc-200/60 rounded-2xl p-3 pl-8 font-semibold text-zinc-800 text-xs focus:border-[#B31046] outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Return & Refund */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm space-y-5">
            <h2 className="text-sm font-extrabold text-zinc-800 tracking-tight">Return & Refund</h2>

            <div className="space-y-4">
              {/* Policy Summary */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Policy Summary</label>
                <textarea
                  rows={2}
                  value={settings.returnPolicySummary}
                  onChange={(e) => handleInputChange("returnPolicySummary", e.target.value)}
                  className="w-full bg-[#FFF0F2]/30 border border-zinc-200/60 rounded-2xl p-3 px-4 font-semibold text-zinc-800 text-xs focus:border-[#B31046] focus:ring-1 focus:ring-[#B31046] focus:bg-white transition-all outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Eligibility Criteria */}
              <div className="space-y-2 pt-2 border-t border-zinc-50">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Eligibility Criteria</label>
                
                <div className="flex flex-col gap-3">
                  {["Damaged Goods", "Wrong Item Received", "Missing Parts"].map((crit) => {
                    const isChecked = settings.returnEligibility.includes(crit);
                    return (
                      <button
                        key={crit}
                        onClick={() => handleCheckboxToggle("returnEligibility", crit)}
                        className="flex items-center gap-2 text-xs font-bold text-zinc-700 cursor-pointer select-none"
                      >
                        {isChecked ? (
                          <div className="w-4.5 h-4.5 rounded-full bg-[#B31046] flex items-center justify-center text-white shrink-0">
                            <Check className="w-3 h-3" />
                          </div>
                        ) : (
                          <div className="w-4.5 h-4.5 rounded-full border border-zinc-300 bg-white shrink-0" />
                        )}
                        <span>{crit}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Windows dropdown selections */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-50">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Return Window</label>
                  <select
                    value={settings.returnWindow}
                    onChange={(e) => handleInputChange("returnWindow", e.target.value)}
                    className="w-full bg-[#FFF0F2]/30 border border-zinc-200/60 rounded-xl p-2 px-3 font-semibold text-zinc-700 text-xs focus:border-[#B31046] outline-none cursor-pointer"
                  >
                    <option value="14 Days">14 Days</option>
                    <option value="30 Days">30 Days</option>
                    <option value="60 Days">60 Days</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Processing Time</label>
                  <select
                    value={settings.returnProcessingTime}
                    onChange={(e) => handleInputChange("returnProcessingTime", e.target.value)}
                    className="w-full bg-[#FFF0F2]/30 border border-zinc-200/60 rounded-xl p-2 px-3 font-semibold text-zinc-700 text-xs focus:border-[#B31046] outline-none cursor-pointer"
                  >
                    <option value="1-2 Days">1-2 Days</option>
                    <option value="3-5 Days">3-5 Days</option>
                    <option value="7-10 Days">7-10 Days</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Order Workflow */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm space-y-5">
            <h2 className="text-sm font-extrabold text-zinc-800 tracking-tight">Order Workflow</h2>

            <div className="space-y-4">
              {/* Default Order Status */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Default Order Status</label>
                <select
                  value={settings.defaultOrderStatus}
                  onChange={(e) => handleInputChange("defaultOrderStatus", e.target.value)}
                  className="w-full bg-[#FFF0F2]/30 border border-zinc-200/60 rounded-2xl p-3 px-4 font-semibold text-zinc-700 text-xs focus:border-[#B31046] outline-none cursor-pointer"
                >
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>

              {/* Auto-update Inventory Toggle */}
              <div className="flex items-start justify-between pt-2 border-t border-zinc-50">
                <div className="space-y-0.5">
                  <span className="text-xs font-extrabold text-zinc-700 block">Auto-update Inventory</span>
                  <span className="text-[10px] text-zinc-400 font-bold block">Update stock on checkout</span>
                </div>
                <button
                  onClick={() => handleInputChange("autoUpdateInventory", !settings.autoUpdateInventory)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-all duration-300 cursor-pointer shrink-0 mt-0.5 ${
                    settings.autoUpdateInventory ? "bg-[#B31046]" : "bg-zinc-200"
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                      settings.autoUpdateInventory ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <MediaSelectModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onConfirm={handleMediaConfirm}
        selectedId={null}
        title="Select Store Logo"
        type="image"
      />
    </div>
  );
}
