"use client";

import React, { useState, useEffect } from "react";
import { X, FileVideo, FileImage } from "lucide-react";
import { getUploads, resolveAssetUrl } from "@/lib/api";

export interface MediaFile {
  id: string;
  name: string;
  gradient?: string;
  type?: string;
  url?: string;
  duration?: string; // for video files
  size?: string; // for video files
}

interface MediaSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (media: MediaFile) => void;
  selectedId?: string | null;
  title?: string;
  type?: "image" | "video";
}

// Helpers for media mapping
function getCloudinaryFileInfo(url: string, publicId: string) {
  const parts = url.split(".");
  const ext = parts[parts.length - 1]?.toUpperCase() || "JPG";
  const type = ext === "PNG" ? "PNG" : ext === "WEBP" ? "WEBP" : "JPG";
  
  const publicIdParts = publicId.split("/");
  const name = publicIdParts[publicIdParts.length - 1] || "image";
  return { name: `${name}.${type.toLowerCase()}`, type };
}

function getAvatarBg(title: string) {
  const colors = [
    "from-orange-400 via-red-500 to-teal-600",
    "from-amber-600 via-yellow-700 to-amber-900",
    "from-sky-300 via-indigo-400 to-violet-500",
    "from-amber-800 via-yellow-900 to-stone-800",
    "from-zinc-700 via-slate-800 to-zinc-900",
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

const getMockVideoSize = (durationSeconds: number | null) => {
  if (!durationSeconds) return "2.5MB";
  const mb = (durationSeconds * 0.15).toFixed(1);
  return `${mb}MB`;
};

export default function MediaSelectModal({
  isOpen,
  onClose,
  onConfirm,
  selectedId = null,
  title = "Select Media",
  type = "image",
}: MediaSelectModalProps) {
  const [mediaList, setMediaList] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(selectedId);

  // Sync selectedId prop change
  useEffect(() => {
    setSelectedMediaId(selectedId);
  }, [selectedId]);

  // Fetch media library items
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    
    // For video search we fetch type: "all" or specific video limits to populate res.data.videos
    const fetchType = type === "video" ? "all" : "image";

    getUploads({ type: fetchType, videoLimit: 100, imageCursor: "" })
      .then((res) => {
        if (!res?.success || !res.data) return;

        if (type === "video") {
          // Parse video objects
          if (res.data.videos?.data) {
            const vids: MediaFile[] = res.data.videos.data.map((vid) => {
              const ext = (vid.playbackUrl || "").split(".").pop()?.toUpperCase() || "MP4";
              return {
                id: vid.id,
                name: vid.title + (ext === "MOV" ? ".mov" : ".mp4"),
                url: resolveAssetUrl(vid.playbackUrl),
                duration: vid.durationSeconds 
                  ? `${Math.floor(vid.durationSeconds / 60)}:${String(vid.durationSeconds % 60).padStart(2, "0")}` 
                  : "0:00",
                size: getMockVideoSize(vid.durationSeconds),
                type: ext,
              };
            });
            setMediaList(vids);
          }
        } else {
          // Parse image objects
          if (res.data.images?.images) {
            const imgs: MediaFile[] = res.data.images.images.map((img) => {
              const info = getCloudinaryFileInfo(img.url, img.publicId);
              return {
                id: img.publicId,
                name: info.name,
                gradient: getAvatarBg(img.publicId),
                type: info.type,
                url: resolveAssetUrl(img.url),
              };
            });
            setMediaList(imgs);
          }
        }
      })
      .catch((err) => {
        console.warn(`Failed to load uploads list of type ${type} inside MediaSelectModal`, err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, type]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    const media = mediaList.find((m) => m.id === selectedMediaId);
    if (media) {
      onConfirm(media);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-2xl border border-zinc-100 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-1">
          <h3 className="text-lg font-black text-zinc-900">{title}</h3>
          <p className="text-xs text-zinc-400">
            Choose an asset from your media library uploads.
          </p>
        </div>

        {/* List of files */}
        {loading ? (
          <div className="py-16 text-center text-sm font-semibold text-zinc-400 animate-pulse">
            Loading library files...
          </div>
        ) : mediaList.length === 0 ? (
          <div className="py-16 text-center text-sm font-semibold text-zinc-400">
            {type === "video"
              ? "No videos found. Upload videos in Media Library first."
              : "No images found. Upload images in Media Library first."}
          </div>
        ) : type === "video" ? (
          // Video list layout
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto pr-1 py-1 my-2">
            {mediaList.map((v) => {
              const isSelected = selectedMediaId === v.id;
              return (
                <div
                  key={v.id}
                  onClick={() => setSelectedMediaId(v.id)}
                  className={`p-4 rounded-2xl border-2 flex items-center gap-3 cursor-pointer select-none transition-all ${
                    isSelected
                      ? "border-[#B31046] bg-[#FFF0F2]/10 ring-4 ring-[#B31046]/10"
                      : "border-zinc-200 hover:border-zinc-300 bg-white"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? "bg-[#B31046] text-white" : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    <FileVideo className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-extrabold text-zinc-800 truncate">{v.name}</p>
                    <p className="text-[10px] font-bold text-zinc-400 mt-0.5">
                      {v.size} • {v.duration}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#B31046] flex items-center justify-center shrink-0">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          // Image grid layout
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 overflow-y-auto pr-1 py-1 my-2">
            {mediaList.map((media) => {
              const isSelected = selectedMediaId === media.id;
              return (
                <div
                  key={media.id}
                  onClick={() => setSelectedMediaId(media.id)}
                  className={`relative aspect-[4/3] rounded-2xl bg-gradient-to-br ${
                    media.gradient || "from-zinc-100 to-zinc-200"
                  } cursor-pointer overflow-hidden border-2 transition-all select-none ${
                    isSelected
                      ? "border-[#B31046] ring-4 ring-[#B31046]/10 scale-[1.02]"
                      : "border-transparent hover:border-zinc-200"
                  }`}
                >
                  {media.url && (
                    <img
                      src={media.url}
                      alt={media.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#B31046] flex items-center justify-center z-10">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                  <div className="flex flex-col items-center text-center p-3 z-10 relative">
                    <span
                      className={`text-[10px] font-extrabold truncate max-w-[120px] ${
                        media.url
                          ? "text-white bg-black/40 px-2 py-0.5 rounded"
                          : "text-white"
                      }`}
                    >
                      {media.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-zinc-250 text-zinc-650 hover:bg-zinc-50 font-bold text-xs rounded-full cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedMediaId}
            className="px-6 py-2.5 bg-[#B31046] hover:bg-[#960d3a] text-white font-bold text-xs rounded-full shadow-md active:scale-[0.98] cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {type === "video" ? "Confirm Video" : "Confirm Selection"}
          </button>
        </div>
      </div>
    </div>
  );
}
