"use client";

import React, { useCallback, useState, useRef, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Link2,
  Image as ImageIcon,
  X,
  ExternalLink,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** Called when the user clicks the image button.
   *  Receives a callback: call it with the chosen image URL to insert into the editor. */
  onImageRequest?: (insert: (url: string) => void) => void;
}

// ─── Link Modal ───────────────────────────────────────────────────────────────

interface LinkModalProps {
  initialUrl?: string;
  onConfirm: (url: string, text?: string) => void;
  onClose: () => void;
}

function LinkModal({ initialUrl = "", onConfirm, onClose }: LinkModalProps) {
  const [url, setUrl] = useState(initialUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus the input when modal opens
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleConfirm = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    const finalUrl = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
    onConfirm(finalUrl);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleConfirm();
    if (e.key === "Escape") onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-zinc-100 animate-in fade-in zoom-in-95 duration-200 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#FFF0F2] flex items-center justify-center shrink-0">
              <Link2 className="w-4 h-4 text-[#B31046]" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-zinc-900">Insert Link</h3>
              <p className="text-[11px] text-zinc-400">Paste or type the destination URL</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* URL Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-600 tracking-wide">URL</label>
          <div className="relative">
            <ExternalLink className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              ref={inputRef}
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 focus:border-[#B31046] focus:ring-2 focus:ring-[#B31046]/10 rounded-xl text-sm font-semibold text-zinc-800 placeholder-zinc-400 outline-none transition-all"
            />
          </div>
          <p className="text-[11px] text-zinc-400">
            Select text in the editor first to wrap it in the link, or the URL will be inserted as-is.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-bold text-xs rounded-full transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!url.trim()}
            className="flex-1 py-2.5 bg-[#B31046] hover:bg-[#960d3a] text-white font-bold text-xs rounded-full transition-all shadow-sm active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Insert Link
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Editor ──────────────────────────────────────────────────────────────

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Once upon a time, in a land filled with wonder...",
  onImageRequest,
}: RichTextEditorProps) {
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [existingLink, setExistingLink] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-[#B31046] underline cursor-pointer" },
      }),
      Image.configure({
        inline: false,
        HTMLAttributes: { class: "rounded-xl max-w-full my-2" },
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "min-h-[288px] p-5 text-sm font-semibold text-zinc-800 outline-none focus:outline-none",
      },
      // Paste plain text inline at the cursor — prevents HTML block nodes
      // from creating a new paragraph on every paste.
      handlePaste(view, event) {
        const text = event.clipboardData?.getData("text/plain");
        if (text !== undefined && text.length > 0) {
          event.preventDefault();
          view.dispatch(view.state.tr.insertText(text));
          return true;
        }
        return false;
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  // Keep editor content synchronized with external value updates (like async API loads)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  // Open link modal, pre-filling any existing href at cursor
  const openLinkModal = useCallback(() => {
    if (!editor) return;
    const existing = editor.getAttributes("link").href ?? "";
    setExistingLink(existing);
    setLinkModalOpen(true);
  }, [editor]);

  const handleLinkConfirm = useCallback(
    (url: string) => {
      if (!editor) return;
      setLinkModalOpen(false);
      editor.chain().focus().setLink({ href: url }).run();
    },
    [editor]
  );

  // Delegate image selection to the parent; parent calls insert(url) when done
  const handleImageRequest = useCallback(() => {
    if (!editor || !onImageRequest) return;
    onImageRequest((url: string) => {
      editor.chain().focus().setImage({ src: url }).run();
    });
  }, [editor, onImageRequest]);

  if (!editor) return null;

  const btn = (active: boolean) =>
    `p-1.5 rounded-md transition-colors cursor-pointer ${
      active
        ? "bg-zinc-200 text-[#B31046]"
        : "text-zinc-500 hover:bg-zinc-200/50 hover:text-zinc-800"
    }`;

  const divider = <div className="w-px h-4 bg-zinc-200 self-center" />;

  return (
    <>
      <div className="border border-zinc-150 rounded-2xl overflow-hidden focus-within:border-[#B31046] focus-within:ring-2 focus-within:ring-[#B31046]/5 transition-all">
        {/* ── Toolbar ── */}
        <div className="bg-zinc-50/80 border-b border-zinc-150 px-4 py-2.5 flex flex-wrap gap-2.5 items-center select-none">
          <button
            type="button"
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={btn(false)}
            title="Paragraph"
          >
            <span className="text-xs font-extrabold">Tt</span>
          </button>

          <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive("bold"))} title="Bold">
            <Bold className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive("italic"))} title="Italic">
            <Italic className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btn(editor.isActive("underline"))} title="Underline">
            <UnderlineIcon className="w-4 h-4" />
          </button>

          {divider}

          <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btn(editor.isActive("heading", { level: 1 }))} title="Heading 1">
            <Heading1 className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btn(editor.isActive("heading", { level: 2 }))} title="Heading 2">
            <Heading2 className="w-4 h-4" />
          </button>

          {divider}

          <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive("bulletList"))} title="Bullet List">
            <List className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(editor.isActive("orderedList"))} title="Ordered List">
            <ListOrdered className="w-4 h-4" />
          </button>

          {divider}

          {/* Link — opens modal */}
          <button type="button" onClick={openLinkModal} className={btn(editor.isActive("link"))} title="Insert Link">
            <Link2 className="w-4 h-4" />
          </button>

          <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btn(editor.isActive("blockquote"))} title="Blockquote">
            <Quote className="w-4 h-4" />
          </button>

          {/* Image — opens parent media library */}
          <button
            type="button"
            onClick={handleImageRequest}
            className={btn(false)}
            title="Insert Image from Media Library"
            disabled={!onImageRequest}
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        </div>

        {/* ── Editor Body ── */}
        <div className="bg-white relative h-72 overflow-y-auto">
          {editor.isEmpty && (
            <p className="absolute top-5 left-5 text-sm font-semibold text-zinc-400 pointer-events-none select-none">
              {placeholder}
            </p>
          )}
          <EditorContent editor={editor} />
        </div>

        {/* ── Prose styles ── */}
        <style>{`
          .ProseMirror { outline: none; }
          .ProseMirror h1 { font-size: 1.5rem; font-weight: 800; margin: 0.75rem 0 0.5rem; }
          .ProseMirror h2 { font-size: 1.25rem; font-weight: 700; margin: 0.65rem 0 0.4rem; }
          .ProseMirror p  { margin: 0.35rem 0; }
          .ProseMirror ul { list-style: disc;    padding-left: 1.4rem; }
          .ProseMirror ol { list-style: decimal; padding-left: 1.4rem; }
          .ProseMirror blockquote { border-left: 3px solid #B31046; padding-left: 1rem; color: #71717a; font-style: italic; margin: 0.5rem 0; }
          .ProseMirror strong { font-weight: 700; }
          .ProseMirror em     { font-style: italic; }
          .ProseMirror u      { text-decoration: underline; }
          .ProseMirror a      { color: #B31046; text-decoration: underline; }
        `}</style>
      </div>

      {/* ── Link Modal (portal-style, rendered outside the editor box) ── */}
      {linkModalOpen && (
        <LinkModal
          initialUrl={existingLink}
          onConfirm={handleLinkConfirm}
          onClose={() => setLinkModalOpen(false)}
        />
      )}
    </>
  );
}
