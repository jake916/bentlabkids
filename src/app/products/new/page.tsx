"use client";

import React, { useState, useEffect, Suspense, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  X,
  Upload,
  Plus,
  ChevronDown,
  ShoppingBag,
  Sparkles,
  ChevronRight,
  Image as ImageIcon,
} from "lucide-react";
import { ToastContainer, ToastItem } from "@/components/Toast";
import RichTextEditor from "@/components/RichTextEditor";
import { resolveAssetUrl } from "@/lib/api";
import MediaSelectModal, { MediaFile } from "@/components/MediaSelectModal";

type PublishStatus = "Active" | "Draft" | "Out of Stock";

function getAvatarBg(title: string) {
  const colors = [
    "from-orange-400 via-red-500 to-teal-600",
    "from-amber-600 via-yellow-700 to-amber-900",
    "from-sky-300 via-indigo-400 to-violet-500",
    "from-amber-800 via-yellow-900 to-stone-800",
    "from-black-700 via-slate-800 to-black-900",
    "from-blue-500 via-teal-500 to-indigo-600",
    "from-pink-500 via-rose-500 to-amber-500",
    "from-sky-300 via-indigo-400 to-purple-500",
    "from-purple-400 via-indigo-500 to-blue-600",
  ];
  let sum = 0;
  for (let i = 0; i < title.length; i++) {
    sum += title.charCodeAt(i);
  }
  return colors[sum % colors.length];
}

const MOCK_PRODUCTS = [
  { id: "1", title: "Kids Faith Tote Bag", price: "3500", salesPrice: "3000", inventory: "24", ageRecommendation: "3-8 years", shortDescription: "A catchy one-liner about this beautiful pink tote bag.", category: "Accessories", status: "Active" as PublishStatus, description: "A beautiful pink tote bag with the words 'Shine your light' written on it. Perfect for kids to carry their bible and writing materials." },
  { id: "2", title: "Jesus Loves Me Socks", price: "1200", salesPrice: "", inventory: "0", ageRecommendation: "All ages", shortDescription: "Soft, comfortable socks in pink and light blue.", category: "Apparel", status: "Out of Stock" as PublishStatus, description: "Soft, comfortable socks in pink and light blue with heart details." },
];

const CATEGORIES = ["Accessories", "Apparel", "Books", "Stationery"];

// ─── Skeleton Screen Helpers ──────────────────────────────────────────────────

function SkeletonPulse({ className }: { className: string }) {
  return (
    <div
      className={`rounded-lg ${className}`}
      style={{
        backgroundImage: "linear-gradient(90deg, #e4e4e7 25%, #f0f0f2 50%, #e4e4e7 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s ease-in-out infinite",
      }}
    />
  );
}

function CreateProductForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  // State
  const [title, setTitle]                         = useState("");
  const [ageRecommendation, setAgeRecommendation] = useState("");
  const [shortDescription, setShortDescription]   = useState("");
  const [description, setDescription]             = useState("");
  const [price, setPrice]                         = useState("");
  const [salesPrice, setSalesPrice]               = useState("");
  const [inventory, setInventory]                 = useState("");
  const [status, setStatus]                       = useState<PublishStatus>("Active");
  const [category, setCategory]                   = useState("");
  const [featuredImage, setFeaturedImage]         = useState<MediaFile | null>(null);
  
  // 4 additional images slots
  const [additionalImages, setAdditionalImages]   = useState<(MediaFile | null)[]>([null, null, null, null]);
  const [activeSlotIndex, setActiveSlotIndex]     = useState<number | null>(null); // null means featured image, number 0-3 means additional slot

  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaModalMode, setMediaModalMode] = useState<"featured" | "additional" | "editor">("featured");
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const editorImageInsert = useRef<((url: string) => void) | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);



  const addToast = (type: "success" | "error" | "info", msg: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((p) => [...p, { id, type, message: msg }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  };
  const removeToast = (id: string) => setToasts((p) => p.filter((t) => t.id !== id));

  // Edit hydration
  useEffect(() => {
    if (!editId) {
      // Default initial states if new product
      setAgeRecommendation("");
      setShortDescription("");
      return;
    }
    setIsLoadingDetails(true);
    const timer = setTimeout(() => {
      const found = MOCK_PRODUCTS.find((p) => p.id === editId);
      if (found) {
        setTitle(found.title);
        setPrice(found.price);
        setSalesPrice(found.salesPrice);
        setInventory(found.inventory);
        setAgeRecommendation(found.ageRecommendation);
        setShortDescription(found.shortDescription);
        setCategory(found.category);
        setDescription(found.description);
        setStatus(found.status);
        
        // Setup mock featured image
        setFeaturedImage({
          id: `mock-img-${found.id}`,
          name: `${found.title.toLowerCase().replace(/ /g, "_")}.jpg`,
          gradient: getAvatarBg(found.title),
          type: "JPG",
          url: `https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=350` // placeholder fallback
        });

        // Setup mock additional images
        setAdditionalImages([
          {
            id: `mock-add-1`,
            name: "product_detail_1.jpg",
            gradient: "from-sky-300 via-indigo-400 to-violet-500",
            type: "JPG",
            url: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?q=80&w=250"
          },
          null,
          null,
          null
        ]);
      }
      setIsLoadingDetails(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [editId]);

  const handleEditorImageRequest = useCallback((insert: (url: string) => void) => {
    editorImageInsert.current = insert;
    setSelectedMediaId(null);
    setMediaModalMode("editor");
    setIsMediaModalOpen(true);
  }, []);

  const openFeaturedImageModal = () => {
    setSelectedMediaId(featuredImage?.id ?? null);
    setMediaModalMode("featured");
    setActiveSlotIndex(null);
    setIsMediaModalOpen(true);
  };

  const openAdditionalImageModal = (index: number) => {
    setSelectedMediaId(additionalImages[index]?.id ?? null);
    setMediaModalMode("additional");
    setActiveSlotIndex(index);
    setIsMediaModalOpen(true);
  };

  const removeAdditionalImage = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setAdditionalImages((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  };

  const handleMediaConfirm = (media: MediaFile) => {
    if (mediaModalMode === "featured") {
      setFeaturedImage(media);
    } else if (mediaModalMode === "additional" && activeSlotIndex !== null) {
      setAdditionalImages((prev) => {
        const next = [...prev];
        next[activeSlotIndex] = media;
        return next;
      });
    } else if (mediaModalMode === "editor" && editorImageInsert.current && media.url) {
      editorImageInsert.current(media.url);
      editorImageInsert.current = null;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { addToast("error", "Product name is required."); return; }
    if (!price || parseFloat(price) <= 0) { addToast("error", "Please enter a valid price."); return; }
    
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      addToast("success", editId ? `Product "${title}" updated successfully!` : `Product "${title}" added to store!`);
      setTimeout(() => router.push("/products"), 1200);
    }, 1000);
  };

  const inputCls = "w-full bg-[#FFF0F2]/20 border border-[#FFF0F2]/60 hover:bg-[#FFF0F2]/30 focus:bg-white focus:border-[#B31046] focus:ring-2 focus:ring-[#B31046]/5 px-5 py-3.5 rounded-2xl text-sm font-semibold text-zinc-900 placeholder-zinc-400 outline-none transition-all";
  const inputIconCls = "w-full bg-[#FFF0F2]/20 border border-[#FFF0F2]/60 hover:bg-[#FFF0F2]/30 focus:bg-white focus:border-[#B31046] focus:ring-2 focus:ring-[#B31046]/5 pl-12 pr-4 py-3.5 rounded-2xl text-sm font-semibold text-zinc-900 placeholder-zinc-400 outline-none transition-all";

  return (
    <div className="min-h-full p-8 space-y-6 font-sans relative bg-[#FAF9FA]">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <header className="flex items-center justify-between border-b border-zinc-100 pb-4 bg-[#FAF9FA] -mx-8 px-8 -mt-8 pt-8 sticky top-0 z-30">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
            {editId ? "Edit Product" : "Add New Product"}
          </h1>
          <p className="text-xs text-zinc-500">
            {editId ? "Update details of this product in store catalog" : "Add a new product to the Bentlab Kids store"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/products")}
          className="px-6 py-2.5 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-bold text-xs rounded-full transition-all cursor-pointer shadow-xs"
        >
          Cancel
        </button>
      </header>

      {isLoadingDetails ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <style>{`
            @keyframes shimmer {
              0%   { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
          `}</style>
          {/* Left Column Skeleton */}
          <div className="lg:col-span-8 space-y-6 animate-pulse">
            <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-xs space-y-6">
              <div className="space-y-2">
                <SkeletonPulse className="h-4 w-32" />
                <SkeletonPulse className="h-12 w-full rounded-2xl" />
              </div>
              <div className="space-y-2">
                <SkeletonPulse className="h-4 w-40" />
                <SkeletonPulse className="h-12 w-full rounded-2xl" />
              </div>
              <div className="space-y-2">
                <SkeletonPulse className="h-4 w-28" />
                <SkeletonPulse className="h-12 w-full rounded-2xl" />
              </div>
              <div className="space-y-2">
                <SkeletonPulse className="h-4 w-24" />
                <SkeletonPulse className="h-40 w-full rounded-2xl" />
              </div>
            </div>
          </div>

          {/* Right Column Skeleton */}
          <div className="lg:col-span-4 space-y-6 animate-pulse">
            <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-xs space-y-4">
              <SkeletonPulse className="h-5 w-24 rounded-lg" />
              <SkeletonPulse className="h-10 w-full rounded-full" />
            </div>
            <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-xs space-y-4">
              <SkeletonPulse className="h-5 w-20 rounded-lg" />
              <SkeletonPulse className="h-10 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-16">
          
          {/* ── Left Column ── */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Card 1: Product Information */}
            <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-xs space-y-6">
              <h3 className="text-base font-black text-zinc-950 flex items-center border-l-4 border-[#B31046] pl-3 leading-none select-none">
                Product Information
              </h3>
              
              {/* Product Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-zinc-800 tracking-wide block">Product Name</label>
                <input
                  type="text"
                  placeholder="e.g. Bentlab Magic Drawing Pad"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputCls}
                />
              </div>

              {/* Age Recommendation */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-zinc-800 tracking-wide block">Age Recommendation</label>
                <input
                  type="text"
                  placeholder="e.g. 3-5 years"
                  value={ageRecommendation}
                  onChange={(e) => setAgeRecommendation(e.target.value)}
                  className={inputCls}
                />
              </div>

              {/* Short Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-zinc-800 tracking-wide block">Short Description</label>
                <input
                  type="text"
                  placeholder="Unlock your child's creativity with zero mess."
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className={inputCls}
                />
                <span className="text-[10px] font-bold text-zinc-400 block mt-1">A catchy one-liner that appears in search results.</span>
              </div>

              {/* Full Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#B31046] tracking-wide block">Full Description</label>
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Tell the story of this product..."
                  onImageRequest={handleEditorImageRequest}
                />
              </div>
            </div>

            {/* Card 2: Product Media */}
            <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-xs space-y-6">
              <h3 className="text-base font-black text-zinc-950 flex items-center border-l-4 border-[#B31046] pl-3 leading-none select-none">
                Product Media
              </h3>

              <div className="space-y-2">
                <label className="text-xs font-extrabold text-zinc-800 tracking-wide block">Main product image</label>
                {featuredImage ? (
                  <div className="relative rounded-3xl aspect-[16/9] overflow-hidden group border border-zinc-100 bg-zinc-50 flex items-center justify-center p-4">
                    {featuredImage.url ? (
                      <img src={featuredImage.url} alt={featuredImage.name} className="w-1/2 h-full object-contain" />
                    ) : (
                      <div className={`absolute inset-0 bg-gradient-to-br ${featuredImage.gradient}`} />
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-all duration-200">
                      <button
                        type="button"
                        onClick={openFeaturedImageModal}
                        className="px-4 py-2 bg-white text-zinc-800 text-xs font-bold rounded-full hover:bg-zinc-100 cursor-pointer shadow"
                      >
                        Change Image
                      </button>
                      <button
                        type="button"
                        onClick={() => setFeaturedImage(null)}
                        className="p-2 bg-[#B31046] text-white rounded-full hover:bg-[#960d3a] cursor-pointer shadow"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={openFeaturedImageModal}
                    className="border-2 border-dashed border-[#FFF0F2] hover:border-[#B31046]/30 bg-[#FFF0F2]/10 rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-[#FFF0F2]/20 space-y-3"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#FFF0F2] flex items-center justify-center text-[#B31046]">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-sm font-extrabold text-zinc-800 block">Click to upload or drag and drop</span>
                      <span className="text-xs font-bold text-zinc-400 block mt-1">PNG, JPG or WebP (max. 10MB)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Images Section */}
              <div className="space-y-3">
                <label className="text-xs font-extrabold text-zinc-800 tracking-wide block">Additional images</label>
                <div className="grid grid-cols-4 gap-4">
                  {additionalImages.map((slot, idx) => (
                    <div key={idx} className="aspect-square relative rounded-2xl overflow-hidden bg-zinc-50 border border-zinc-100 flex items-center justify-center">
                      {slot ? (
                        <>
                          {slot.url ? (
                            <img src={slot.url} alt={slot.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className={`absolute inset-0 bg-gradient-to-br ${slot.gradient}`} />
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-all duration-200">
                            <button
                              type="button"
                              onClick={(e) => removeAdditionalImage(idx, e)}
                              className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full cursor-pointer shadow"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openAdditionalImageModal(idx)}
                          className="w-full h-full border-2 border-dashed border-zinc-200 hover:border-[#B31046]/30 flex items-center justify-center cursor-pointer hover:bg-[#FFF0F2]/10 transition-all text-zinc-400 hover:text-[#B31046]"
                        >
                          <Plus className="w-6 h-6 text-[#B31046]" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* ── Right Column ── */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Card 1: Publish Settings */}
            <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-xs space-y-6">
              <h3 className="text-sm font-black text-zinc-900 border-b border-zinc-50 pb-2">
                Publish Settings
              </h3>

              <div className="space-y-4">
                {([
                  { key: "Active", label: "Active", sub: "Visible on store immediately" },
                  { key: "Draft", label: "Draft", sub: "Hidden from customers" },
                  { key: "Out of Stock", label: "Out of Stock", sub: "Visible but not purchasable" },
                ] as { key: PublishStatus; label: string; sub: string }[]).map((opt) => (
                  <label key={opt.key} className="flex items-start gap-3.5 cursor-pointer group select-none">
                    <input
                      type="radio"
                      name="status-opt"
                      checked={status === opt.key}
                      onChange={() => setStatus(opt.key)}
                      className="sr-only"
                    />
                    <div className="pt-0.5">
                      <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center transition-all ${status === opt.key ? "border-[#B31046] ring-4 ring-[#B31046]/10" : "border-zinc-300 group-hover:border-zinc-400"}`}>
                        {status === opt.key && <div className="w-2.5 h-2.5 rounded-full bg-[#B31046]" />}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-black text-zinc-800 leading-tight">
                        {opt.label}
                      </div>
                      <div className="text-[10px] font-bold text-zinc-400 mt-0.5">
                        {opt.sub}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-[#B31046] hover:bg-[#960d3a] text-white font-extrabold text-sm rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : editId ? "Save Changes" : "Publish Product"}
              </button>
            </div>

            {/* Card 2: Pricing & Stock */}
            <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-xs space-y-5">
              <h3 className="text-sm font-black text-zinc-900 border-b border-zinc-50 pb-2">
                Pricing & Stock
              </h3>

              {/* Price */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-zinc-800 block">Price</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-sm font-extrabold text-zinc-400 select-none">₦</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className={inputIconCls}
                  />
                </div>
              </div>

              {/* Sales Price */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-zinc-800 block">Sales Price</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-sm font-extrabold text-zinc-400 select-none">₦</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={salesPrice}
                    onChange={(e) => setSalesPrice(e.target.value)}
                    className={inputIconCls}
                  />
                </div>
              </div>

              {/* Inventory */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-zinc-800 block">Inventory</label>
                <input
                  type="number"
                  placeholder="0"
                  value={inventory}
                  onChange={(e) => setInventory(e.target.value)}
                  className={inputCls}
                />
                <span className="text-[10px] font-bold text-zinc-400 block mt-1">Quantity currently in warehouse.</span>
              </div>
            </div>

            {/* Card 3: Categorization */}
            <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-zinc-900 border-b border-zinc-50 pb-2">
                Categorization
              </h3>
              
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-zinc-800 block">Category</label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#FFF0F2]/20 border border-[#FFF0F2]/60 hover:bg-[#FFF0F2]/30 focus:bg-white focus:border-[#B31046] focus:ring-2 focus:ring-[#B31046]/5 px-4 py-3.5 rounded-2xl text-xs font-semibold text-zinc-900 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select Category</option>
                    {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                </div>
                <span className="text-[10px] font-bold text-zinc-400 block">Assign this product for easier navigation.</span>
              </div>
            </div>

          </div>

        </form>
      )}

      {/* ── Reusable Media Library Modal ── */}
      <MediaSelectModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onConfirm={handleMediaConfirm}
        selectedId={selectedMediaId}
        title={
          mediaModalMode === "editor"
            ? "Insert Image"
            : mediaModalMode === "featured"
            ? "Select Main Product Image"
            : "Select Additional Image"
        }
        type="image"
      />
    </div>
  );
}

export default function CreateProductPage() {
  return (
    <Suspense fallback={<div className="min-h-full flex items-center justify-center p-8 bg-[#FAF9FA]"><div className="w-8 h-8 border-4 border-[#B31046] border-t-transparent rounded-full animate-spin" /></div>}>
      <CreateProductForm />
    </Suspense>
  );
}
