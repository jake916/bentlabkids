"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  FileVideo,
  CloudUpload,
  Film,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { getUploads, resolveAssetUrl, getBunnyThumbnailUrl } from "@/lib/api";

export interface MediaFile {
  id: string;
  name: string;
  gradient?: string;
  type?: string;
  url?: string;
  thumbnailUrl?: string | null;
  duration?: string;
  size?: string;
  processingStatus?: string;
}

interface MediaSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (media: MediaFile) => void;
  selectedId?: string | null;
  title?: string;
  type?: "image" | "video";
}

type UploadStatus = "queued" | "uploading" | "processing" | "complete" | "error";

interface LocalUploadFile {
  id: string;
  name: string;
  progress: number;
  status: UploadStatus;
  errorMessage?: string;
}

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

async function uploadFileWithProgress(
  file: File,
  token: string | null,
  onProgress: (progress: number) => void,
  onComplete: (resBody?: any) => void,
  onError: (error: string) => void
) {
  const xhr = new XMLHttpRequest();
  
  const fallbackApiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const url = typeof window !== "undefined" && window.location.origin
    ? `${window.location.origin}/api/v1/admin/upload`
    : `${fallbackApiUrl}/api/v1/admin/upload`;

  xhr.open("POST", url, true);
  xhr.withCredentials = true;
  if (token) {
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  }

  xhr.upload.onprogress = (event) => {
    if (event.lengthComputable) {
      const percent = Math.round((event.loaded / event.total) * 100);
      onProgress(percent);
    }
  };

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      let resBody: any = null;
      try {
        resBody = JSON.parse(xhr.responseText);
        if (resBody) {
          if (resBody.success === false) {
            onError(resBody.message || resBody.error || "Upload failed.");
            return;
          }
          if (resBody.data?.video?.processingStatus === "FAILED") {
            onError(resBody.data.video.failureReason || "Video processing failed on backend server.");
            return;
          }
        }
      } catch (err) {
        // Fallback
      }
      onComplete(resBody);
    } else {
      let msg = `Upload failed with status ${xhr.status}`;
      try {
        const body = JSON.parse(xhr.responseText);
        msg = body?.message || body?.error || msg;
      } catch {}
      onError(msg);
    }
  };

  xhr.onerror = () => {
    onError("Network error during upload.");
  };

  const formData = new FormData();
  if (file.type.startsWith("video/")) {
    formData.append("video", file);
    const titleWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    formData.append("title", titleWithoutExt);
  } else {
    formData.append("images", file);
  }
  xhr.send(formData);

  return xhr;
}

export default function MediaSelectModal({
  isOpen,
  onClose,
  onConfirm,
  selectedId = null,
  title = "Select Media",
  type = "image",
}: MediaSelectModalProps) {
  const [activeTab, setActiveTab] = useState<"library" | "upload">("library");
  const [mediaList, setMediaList] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(selectedId);
  const [uploadingFiles, setUploadingFiles] = useState<LocalUploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedMediaId(selectedId);
  }, [selectedId]);

  const fetchLibraryFiles = useCallback(() => {
    setLoading(true);
    const fetchType = type === "video" ? "all" : "image";

    getUploads({ type: fetchType, videoLimit: 100, imageCursor: "" })
      .then((res) => {
        if (!res?.success || !res.data) return;

        if (type === "video") {
          if (res.data.videos?.data) {
            const vids: MediaFile[] = res.data.videos.data.map((vid) => {
              const ext = (vid.playbackUrl || "").split(".").pop()?.toUpperCase() || "MP4";
              const rawThumb = (vid as any).thumbnailUrl;
              const thumbnailUrl = rawThumb
                ? resolveAssetUrl(rawThumb)
                : getBunnyThumbnailUrl(vid.playbackUrl);
              return {
                id: vid.id,
                name: vid.title,
                url: resolveAssetUrl(vid.playbackUrl),
                thumbnailUrl,
                duration: vid.durationSeconds
                  ? `${Math.floor(vid.durationSeconds / 60)}:${String(vid.durationSeconds % 60).padStart(2, "0")}`
                  : "0:00",
                size: getMockVideoSize(vid.durationSeconds),
                type: ext,
                processingStatus: vid.processingStatus,
              };
            });
            setMediaList(vids);
          }
        } else {
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
  }, [type]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab("library");
      fetchLibraryFiles();
    }
  }, [isOpen, fetchLibraryFiles]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    const media = mediaList.find((m) => m.id === selectedMediaId);
    if (media) {
      onConfirm(media);
    }
    onClose();
  };

  const addFiles = (incoming: File[]) => {
    const acceptedTypes = type === "video" ? ["video/mp4"] : ["image/jpeg", "image/png", "image/webp"];
    const maxMB = type === "video" ? 500 : 5;

    const rejected = incoming.filter(
      (f) => !acceptedTypes.includes(f.type) || f.size / (1024 * 1024) > maxMB
    );

    if (rejected.length > 0) {
      alert(
        type === "video"
          ? "Only MP4 videos up to 500MB are accepted."
          : "Only JPG, PNG, or WEBP images up to 5MB are accepted."
      );
    }

    const valid = incoming.filter(
      (f) => acceptedTypes.includes(f.type) && f.size / (1024 * 1024) <= maxMB
    );

    const newEntries = valid.map((f) => {
      const id = crypto.randomUUID();
      return {
        id,
        file: f,
        entry: {
          id,
          name: f.name,
          progress: 0,
          status: "queued" as UploadStatus,
        },
      };
    });

    setUploadingFiles((prev) => [...prev, ...newEntries.map((e) => e.entry)]);

    newEntries.forEach(({ id, file }) => {
      setTimeout(async () => {
        setUploadingFiles((prev) =>
          prev.map((f) => (f.id === id ? { ...f, status: "uploading" } : f))
        );

        const token = typeof window !== "undefined" ? localStorage.getItem("session_token") : null;
        try {
          await uploadFileWithProgress(
            file,
            token,
            (progress) => {
              setUploadingFiles((prev) =>
                prev.map((f) => (f.id === id ? { ...f, progress } : f))
              );
            },
            async (resBody) => {
              setUploadingFiles((prev) =>
                prev.map((f) => (f.id === id ? { ...f, status: "complete", progress: 100 } : f))
              );

              // Reload library
              fetchLibraryFiles();

              // Auto select uploaded item
              if (resBody && resBody.success && resBody.data) {
                if (type === "video" && resBody.data.video) {
                  setSelectedMediaId(resBody.data.video.id);
                } else if (type === "image" && resBody.data.image) {
                  setSelectedMediaId(resBody.data.image.publicId);
                }
              }

              // Switch to library view
              setTimeout(() => {
                setActiveTab("library");
                setUploadingFiles([]);
              }, 800);
            },
            (errorMsg) => {
              setUploadingFiles((prev) =>
                prev.map((f) => (f.id === id ? { ...f, status: "error", progress: 0, errorMessage: errorMsg } : f))
              );
            }
          );
        } catch (e: any) {
          setUploadingFiles((prev) =>
            prev.map((f) => (f.id === id ? { ...f, status: "error", progress: 0, errorMessage: e?.message || "Upload failed." } : f))
          );
        }
      }, 200);
    });
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onBrowse = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
    e.target.value = "";
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className={`bg-white rounded-3xl shadow-2xl relative flex flex-col animate-in fade-in zoom-in-95 duration-200 ${
          type === "video"
            ? "w-full max-w-6xl max-h-[92vh]"
            : "w-full max-w-3xl max-h-[88vh]"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-7 pt-6 pb-2 border-b border-zinc-100 shrink-0">
          <div>
            <h3 className="text-xl font-black text-zinc-900">{title}</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {type === "video"
                ? "Choose or upload a video for your product library."
                : "Select an image or upload a new one to use."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer shrink-0 ml-4"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Bar Selector */}
        <div className="flex px-7 pt-3 pb-1 border-b border-zinc-50 gap-6 shrink-0 bg-zinc-50/50">
          <button
            type="button"
            onClick={() => setActiveTab("library")}
            className={`pb-2.5 text-xs font-extrabold tracking-wider uppercase transition-all border-b-2 cursor-pointer ${
              activeTab === "library"
                ? "border-[#B31046] text-[#B31046]"
                : "border-transparent text-zinc-400 hover:text-zinc-700"
            }`}
          >
            Library Files
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`pb-2.5 text-xs font-extrabold tracking-wider uppercase transition-all border-b-2 cursor-pointer ${
              activeTab === "upload"
                ? "border-[#B31046] text-[#B31046]"
                : "border-transparent text-zinc-400 hover:text-zinc-700"
            }`}
          >
            Upload New
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 px-7 py-5">
          {activeTab === "library" ? (
            loading ? (
              <div className="py-20 text-center">
                <div className="inline-flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-[#B31046]/30 border-t-[#B31046] rounded-full animate-spin" />
                  <p className="text-sm font-semibold text-zinc-400">Loading library files…</p>
                </div>
              </div>
            ) : mediaList.length === 0 ? (
              <div className="py-20 text-center text-sm font-semibold text-zinc-400">
                {type === "video"
                  ? "No videos found. Upload videos using the Upload New tab."
                  : "No images found. Upload images using the Upload New tab."}
              </div>
            ) : type === "video" ? (
              /* ── Video Thumbnail Card Grid ── */
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                {mediaList.map((v) => {
                  const isSelected = selectedMediaId === v.id;
                  const isProcessing =
                    v.processingStatus === "PROCESSING" ||
                    v.processingStatus === "QUEUED" ||
                    v.processingStatus === "UPLOADING";
                  const isFailed = v.processingStatus === "FAILED";
                  const isReady = !isProcessing && !isFailed;

                  return (
                    <div
                      key={v.id}
                      onClick={() => {
                        if (isFailed || isProcessing) return;
                        setSelectedMediaId(v.id);
                      }}
                      className={`group relative rounded-2xl overflow-hidden border-2 transition-all select-none shadow-sm ${
                        isSelected
                          ? "border-[#B31046] ring-4 ring-[#B31046]/20 scale-[1.02] shadow-lg"
                          : isFailed || isProcessing
                          ? "border-zinc-200 opacity-60 cursor-not-allowed"
                          : "border-zinc-200 hover:border-[#B31046]/50 hover:scale-[1.01] hover:shadow-md cursor-pointer"
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="relative aspect-video bg-zinc-900 overflow-hidden">
                        {v.thumbnailUrl && isReady ? (
                          <img
                            src={v.thumbnailUrl}
                            alt={v.name}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                            <FileVideo className="w-10 h-10 text-zinc-600" />
                          </div>
                        )}

                        {/* Bottom gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Processing overlay */}
                        {isProcessing && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                            <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider animate-pulse bg-black/60 px-3 py-1.5 rounded-full">
                              Processing…
                            </span>
                          </div>
                        )}

                        {/* Failed overlay */}
                        {isFailed && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                            <span className="text-xs font-extrabold text-red-400 uppercase tracking-wider bg-black/60 px-3 py-1.5 rounded-full">
                              Failed
                            </span>
                          </div>
                        )}

                        {/* Duration badge */}
                        {isReady && v.duration && v.duration !== "0:00" && (
                          <div className="absolute bottom-2 right-2 text-[10px] font-bold text-white bg-black/70 px-2 py-0.5 rounded-md">
                            {v.duration}
                          </div>
                        )}

                        {/* Play icon on hover */}
                        {isReady && !isSelected && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/40">
                              <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[10px] border-l-white ml-1" />
                            </div>
                          </div>
                        )}

                        {/* Selected indicator */}
                        {isSelected && (
                          <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-[#B31046] flex items-center justify-center shadow-lg z-10 ring-2 ring-white">
                            <div className="w-2.5 h-2.5 rounded-full bg-white" />
                          </div>
                        )}
                      </div>

                      {/* Info bar */}
                      <div
                        className={`px-3 py-2.5 transition-colors ${
                          isSelected ? "bg-[#FFF0F5]" : "bg-white"
                        }`}
                      >
                        <p className="text-xs font-bold text-zinc-800 truncate leading-tight">
                          {v.name}
                        </p>
                        <p className="text-[10px] mt-0.5">
                          {isProcessing ? (
                            <span className="text-amber-500 font-semibold">Processing…</span>
                          ) : isFailed ? (
                            <span className="text-red-500 font-semibold">Failed</span>
                          ) : (
                            <span className="text-zinc-400">{v.size}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* ── Image Grid ── */
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
                          : "border-transparent hover:border-zinc-300 hover:scale-[1.01]"
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
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#B31046] flex items-center justify-center z-10 ring-2 ring-white">
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                        <span className="text-[10px] font-bold text-white truncate block">
                          {media.name}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* ── Upload Panel ── */
            <div className="space-y-6">
              {/* Dropzone */}
              <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-3.5 py-12 rounded-2xl border-2 border-dashed transition-all cursor-pointer select-none
                  ${isDragging
                    ? "border-[#B31046] bg-[#FFF0F2]"
                    : "border-zinc-200 bg-zinc-50/50 hover:bg-zinc-50"
                  }`}
              >
                <div className="w-12 h-12 rounded-full bg-[#FFF0F2] flex items-center justify-center">
                  <CloudUpload className="w-6 h-6 text-[#B31046]" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-extrabold text-zinc-700">Drag and drop file here, or click to browse</p>
                  <p className="text-xs text-zinc-400">
                    {type === "video"
                      ? "Supported: MP4 (max 500MB)"
                      : "Supported: JPG, PNG, WEBP (max 5MB)"}
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={type === "video" ? ".mp4" : ".jpg,.jpeg,.png,.webp"}
                  className="hidden"
                  onChange={onBrowse}
                />
              </div>

              {/* Upload queue list */}
              {uploadingFiles.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-extrabold text-zinc-500 tracking-wider uppercase">
                    Uploading files ({uploadingFiles.length})
                  </p>
                  <div className="space-y-2">
                    {uploadingFiles.map((file) => (
                      <div
                        key={file.id}
                        className="bg-white rounded-xl border border-zinc-100 p-4 space-y-2.5 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                            type === "video"
                              ? "bg-purple-50 border-purple-100 text-purple-600"
                              : "bg-blue-50 border-blue-100 text-blue-600"
                          }`}>
                            {type === "video" ? (
                              <Film className="w-4 h-4" />
                            ) : (
                              <ImageIcon className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-zinc-800 truncate">{file.name}</p>
                            {file.errorMessage && (
                              <p className="text-[10px] text-red-500 font-semibold">{file.errorMessage}</p>
                            )}
                          </div>
                          <div>
                            {file.status === "complete" ? (
                              <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                COMPLETE
                              </div>
                            ) : file.status === "error" ? (
                              <span className="text-[10px] font-black text-red-500">FAILED</span>
                            ) : (
                              <span className="text-[10px] font-black text-[#B31046]">{file.progress}%</span>
                            )}
                          </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full h-1 bg-zinc-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-200 ${
                              file.status === "complete"
                                ? "bg-emerald-500"
                                : file.status === "error"
                                ? "bg-red-500"
                                : "bg-[#B31046]"
                            }`}
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-7 py-4 border-t border-zinc-100 shrink-0">
          <p className="text-xs text-zinc-400">
            {selectedMediaId
              ? `1 ${type} selected`
              : `Select a ${type} to continue`}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-bold text-xs rounded-full cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedMediaId || activeTab === "upload"}
              className="px-6 py-2.5 bg-[#B31046] hover:bg-[#960d3a] text-white font-bold text-xs rounded-full shadow-md active:scale-[0.98] cursor-pointer transition-all disabled:opacity-45 disabled:cursor-not-allowed"
            >
              {type === "video" ? "Confirm Video" : "Confirm Selection"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
