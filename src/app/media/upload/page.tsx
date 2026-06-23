"use client";

import React, { useState, useRef, useCallback, useId } from "react";
import Link from "next/link";
import {
  CloudUpload,
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
  Film,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type UploadStatus = "queued" | "uploading" | "complete" | "error";

interface UploadFile {
  id: string;
  name: string;
  sizeMB: string;
  mimeType: string;
  typeLabel: string;
  progress: number;
  status: UploadStatus;
  errorMessage?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "video/mp4"];
const IMAGE_MAX_MB = 5;
const VIDEO_MAX_MB = 500;

function maxSizeForType(mime: string) {
  return mime === "video/mp4" ? VIDEO_MAX_MB : IMAGE_MAX_MB;
}

function typeLabel(mime: string): string {
  if (mime === "image/jpeg" || mime === "image/jpg") return "JPG Image";
  if (mime === "image/png")       return "PNG Image";
  if (mime === "image/webp")      return "WEBP Image";
  if (mime === "video/mp4")       return "MP4 Video";
  return "File";
}

function formatSize(bytes: number) {
  const mb = bytes / (1024 * 1024);
  return mb < 1 ? `${(mb * 1024).toFixed(0)} KB` : `${mb.toFixed(1)} MB`;
}

function uploadFileWithProgress(
  file: File,
  token: string | null,
  onProgress: (progress: number) => void,
  onComplete: () => void,
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
      onComplete();
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UploadMediaPage() {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrsRef = useRef<Map<string, XMLHttpRequest>>(new Map());

  const hasFiles = files.length > 0;
  const completeCount = files.filter((f) => f.status === "complete").length;
  const allComplete = hasFiles && completeCount === files.length;

  // ── File processing ─────────────────────────────────────────────────────────

  const addFiles = useCallback((incoming: File[]) => {
    const rejected = incoming.filter(
      (f) => !ACCEPTED.includes(f.type) || f.size / (1024 * 1024) > maxSizeForType(f.type)
    );

    if (rejected.length > 0) {
      alert("Only JPG, PNG, or WEBP images (up to 5MB) and MP4 videos (up to 500MB) are accepted.");
    }

    const valid = incoming.filter(
      (f) => ACCEPTED.includes(f.type) && f.size / (1024 * 1024) <= maxSizeForType(f.type)
    );

    const newEntries = valid.map((f) => {
      const id = crypto.randomUUID();
      return {
        id,
        file: f,
        entry: {
          id,
          name: f.name,
          sizeMB: formatSize(f.size),
          mimeType: f.type,
          typeLabel: typeLabel(f.type),
          progress: 0,
          status: "queued" as UploadStatus,
        }
      };
    });

    setFiles((prev) => [...prev, ...newEntries.map(e => e.entry)]);

    // Start real upload for each
    newEntries.forEach(({ id, file }) => {
      setTimeout(() => {
        setFiles((prev) =>
          prev.map((f) => f.id === id ? { ...f, status: "uploading" } : f)
        );
        
        const token = typeof window !== "undefined" ? localStorage.getItem("session_token") : null;
        const xhr = uploadFileWithProgress(
          file,
          token,
          (progress) => {
            setFiles((prev) =>
              prev.map((f) => f.id === id ? { ...f, progress } : f)
            );
          },
          () => {
            setFiles((prev) =>
              prev.map((f) => f.id === id ? { ...f, status: "complete", progress: 100 } : f)
            );
            xhrsRef.current.delete(id);
          },
          (errorMsg) => {
            setFiles((prev) =>
              prev.map((f) => f.id === id ? { ...f, status: "error", progress: 0, errorMessage: errorMsg } : f)
            );
            xhrsRef.current.delete(id);
          }
        );
        xhrsRef.current.set(id, xhr);
      }, 300);
    });
  }, []);

  const removeFile = (id: string) => {
    const xhr = xhrsRef.current.get(id);
    if (xhr) { xhr.abort(); xhrsRef.current.delete(id); }
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const cancelAll = () => {
    xhrsRef.current.forEach((xhr) => xhr.abort());
    xhrsRef.current.clear();
    setFiles([]);
  };

  // ── Drag & Drop ─────────────────────────────────────────────────────────────

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  }, [addFiles]);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);

  const onBrowse = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
    e.target.value = "";
  };

  // ── Progress bar color ───────────────────────────────────────────────────────

  function barColor(status: UploadStatus) {
    if (status === "complete") return "bg-emerald-500";
    if (status === "error")    return "bg-red-500";
    return "bg-[#B31046]";
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-full p-8 font-sans space-y-6">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between">
        <Link
          href="/media"
          className="flex items-center gap-1.5 text-sm font-semibold text-zinc-500 hover:text-zinc-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Media Library
        </Link>

        {hasFiles && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            Safe Cloud Storage Active
          </div>
        )}
      </div>

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Upload Media</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Add new images and videos to your media library</p>
      </div>

      {/* ── Drop Zone ── */}
      {!hasFiles ? (
        // LARGE empty state drop zone
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={`flex flex-col items-center justify-center gap-4 py-20 rounded-3xl border-2 border-dashed transition-all
            ${isDragging
              ? "border-[#B31046] bg-[#FFF0F2]"
              : "border-zinc-200 bg-zinc-50/60"
            }`}
        >
          <div className="w-16 h-16 rounded-full bg-[#FFF0F2] flex items-center justify-center">
            <CloudUpload className="w-8 h-8 text-[#B31046]" />
          </div>

          <div className="text-center space-y-1">
            <p className="text-lg font-bold text-zinc-800">Drag and drop your files here</p>
            <p className="text-sm text-zinc-400">or</p>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2.5 border-2 border-[#B31046] text-[#B31046] font-bold text-sm rounded-full hover:bg-[#FFF0F2] active:scale-[0.98] transition-all"
          >
            Browse files
          </button>

          <p className="text-xs text-zinc-400">
            Supported: JPG, PNG, WEBP (max {IMAGE_MAX_MB}MB) · MP4 (max {VIDEO_MAX_MB}MB)
          </p>
        </div>
      ) : (
        // COMPACT drop zone when files are queued
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={`flex items-center justify-center gap-2 py-5 rounded-2xl border-2 border-dashed transition-all
            ${isDragging ? "border-[#B31046] bg-[#FFF0F2]" : "border-[#B31046]/30 bg-[#FFF0F2]/40"}`}
        >
          <CloudUpload className="w-5 h-5 text-[#B31046]" />
          <p className="text-sm font-semibold text-zinc-700">
            Drop more files to add to queue or{" "}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-[#B31046] font-bold hover:underline"
            >
              Browse
            </button>
          </p>
          <p className="text-xs text-zinc-400 ml-1">JPG, PNG, WEBP · MP4</p>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.webp,.mp4,video/mp4"
        className="hidden"
        onChange={onBrowse}
      />

      {/* ── File List ── */}
      {hasFiles && (
        <div className="space-y-4">
          {/* List header */}
          <div className="flex items-center justify-between">
            <p className="text-base font-bold text-zinc-800">
              Uploading {files.length} file{files.length !== 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600">
              <AlertTriangle className="w-4 h-4" />
              Do not close this page
            </div>
          </div>

          {/* File rows */}
          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.id}
                className={`bg-white rounded-2xl border px-5 py-4 space-y-2.5 transition-colors
                  ${file.status === "complete" ? "border-emerald-100" : "border-zinc-100"}`}
              >
                <div className="flex items-center gap-3">
                  {/* File icon */}
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                    file.mimeType === "video/mp4"
                      ? "bg-purple-50 border-purple-100 text-purple-600"
                      : "bg-blue-50 border-blue-100 text-blue-600"
                  }`}>
                    {file.mimeType === "video/mp4"
                      ? <Film className="w-4.5 h-4.5" size={18} />
                      : <ImageIcon className="w-4.5 h-4.5" size={18} />}
                  </div>

                  {/* Name + size */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-800 truncate">{file.name}</p>
                    <p className="text-xs text-zinc-400">
                      {file.sizeMB} · {file.typeLabel}
                      {file.errorMessage && (
                        <span className="text-red-500 ml-2 font-medium">({file.errorMessage})</span>
                      )}
                    </p>
                  </div>

                  {/* Status */}
                  {file.status === "complete" ? (
                    <div className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                      COMPLETE
                    </div>
                  ) : file.status === "error" ? (
                    <div className="text-xs font-bold text-red-500">
                      FAILED
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-[#B31046]">{file.progress}%</span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${barColor(file.status)}`}
                    style={{ width: `${file.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm font-semibold text-zinc-500">
              {completeCount} of {files.length} files complete
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={cancelAll}
                disabled={allComplete}
                className="px-4 py-2 text-sm font-bold border-2 border-[#B31046] text-[#B31046] rounded-full hover:bg-[#FFF0F2] active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Cancel all
              </button>
              <Link
                href="/media"
                className="px-4 py-2 text-sm font-bold bg-[#B31046] text-white rounded-full hover:bg-[#960d3a] active:scale-[0.98] transition-all shadow-sm"
              >
                Back to Media Library
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
