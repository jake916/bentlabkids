export interface StoreSettings {
  storeName: string;
  contactEmail: string;
  phone: string;
  website: string;
  physicalAddress: string;
  
  defaultCurrency: string; // e.g. "USD"
  supportedCurrencies: string[]; // e.g. ["USD", "NGN", "GBP"]
  autoDetectLocation: boolean;
  allowManualCurrency: boolean;

  deliveryPolicyText: string;
  timelineLagos: string;
  timelineNationwide: string;
  timelineInternational: string;
  availableMethods: string[]; // e.g. ["Home Delivery", "Pickup Point", "Express Courier"]

  logoUrl: string;

  baseDeliveryFee: number;
  baseDeliveryFeeEnabled: boolean;
  enableFreeDelivery: boolean;
  freeDeliveryThreshold: number;

  returnPolicySummary: string;
  returnEligibility: string[]; // e.g. ["Damaged Goods", "Wrong Item Received", "Missing Parts"]
  returnWindow: string; // e.g. "30 Days"
  returnProcessingTime: string; // e.g. "3-5 Days"

  defaultOrderStatus: string; // e.g. "Processing"
  autoUpdateInventory: boolean;
}

export const INITIAL_SETTINGS: StoreSettings = {
  storeName: "Bentlab Kids Official Store",
  contactEmail: "store@bentlab.com",
  phone: "+234 812 345 6789",
  website: "https://shop.bentlabkids.com",
  physicalAddress: "12 Admiralty Way, Lekki Phase 1, Lagos, Nigeria",
  
  defaultCurrency: "USD",
  supportedCurrencies: ["USD", "NGN", "GBP"],
  autoDetectLocation: true,
  allowManualCurrency: true,

  deliveryPolicyText: "Our shipping policies are designed to provide the best value and speed for families. We handle all products with care, ensuring they reach your little ones in perfect condition.",
  timelineLagos: "1-2 days",
  timelineNationwide: "3-5 days",
  timelineInternational: "7-14 days",
  availableMethods: ["Home Delivery", "Pickup Point"],

  logoUrl: "/logo-placeholder.png", // Fallback placeholder path

  baseDeliveryFee: 15.00,
  baseDeliveryFeeEnabled: true,
  enableFreeDelivery: true,
  freeDeliveryThreshold: 150.00,

  returnPolicySummary: "Returns are accepted within 30 days of purchase for damaged or incorrect items.",
  returnEligibility: ["Damaged Goods", "Wrong Item Received"],
  returnWindow: "30 Days",
  returnProcessingTime: "3-5 Days",

  defaultOrderStatus: "Processing",
  autoUpdateInventory: true,
};

const LOCAL_STORAGE_KEY = "bentlab_store_settings_state";

export function getStoredSettings(): StoreSettings {
  if (typeof window === "undefined") return INITIAL_SETTINGS;
  try {
    const val = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (val) {
      return JSON.parse(val);
    }
  } catch (e) {
    console.error("Failed to read settings from localStorage", e);
  }
  return INITIAL_SETTINGS;
}

export function saveStoredSettings(settings: StoreSettings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save settings to localStorage", e);
  }
}
