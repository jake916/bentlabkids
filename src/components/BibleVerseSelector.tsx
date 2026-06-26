"use client";

import React, { useEffect, useState } from "react";
import { BIBLE_DATA, BibleBook } from "@/lib/bibleData";
import { BookOpen } from "lucide-react";

interface BibleVerseSelectorProps {
  value: string;
  onChange: (val: string) => void;
}

// Regex helper to parse references like "Genesis 1:1", "1 Kings 18:20-40", or "Genesis 1:1-5"
function parseReference(ref: string) {
  if (!ref) return { book: "", chapter: null, startVerse: null, endVerse: null };
  const match = ref.trim().match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);
  if (!match) return { book: "", chapter: null, startVerse: null, endVerse: null };
  return {
    book: match[1],
    chapter: parseInt(match[2], 10),
    startVerse: parseInt(match[3], 10),
    endVerse: match[4] ? parseInt(match[4], 10) : null,
  };
}

export default function BibleVerseSelector({ value, onChange }: BibleVerseSelectorProps) {
  const [book, setBook] = useState("");
  const [chapter, setChapter] = useState<number | null>(null);
  const [startVerse, setStartVerse] = useState<number | null>(null);
  const [endVerse, setEndVerse] = useState<number | null>(null);

  // Sync state from value prop on load/change
  useEffect(() => {
    const parsed = parseReference(value);
    setBook(parsed.book);
    setChapter(parsed.chapter);
    setStartVerse(parsed.startVerse);
    setEndVerse(parsed.endVerse);
  }, [value]);

  // Find the selected book metadata
  const selectedBookData = BIBLE_DATA.find((b) => b.book.toLowerCase() === book.toLowerCase() || b.abbr.toLowerCase() === book.toLowerCase());

  // Generate lists based on current selections
  const chapterCount = selectedBookData ? selectedBookData.chapters.length : 0;
  const verseCount = selectedBookData && chapter !== null ? selectedBookData.chapters[chapter - 1] || 0 : 0;

  // Handle Book Change
  const handleBookChange = (newBook: string) => {
    if (!newBook) {
      setBook("");
      setChapter(null);
      setStartVerse(null);
      setEndVerse(null);
      onChange("");
      return;
    }

    const bookData = BIBLE_DATA.find((b) => b.book === newBook);
    const defaultChapter = 1;
    const defaultStartVerse = 1;

    setBook(newBook);
    setChapter(defaultChapter);
    setStartVerse(defaultStartVerse);
    setEndVerse(null);

    onChange(`${newBook} ${defaultChapter}:${defaultStartVerse}`);
  };

  // Handle Chapter Change
  const handleChapterChange = (newChapterNum: number) => {
    const defaultStartVerse = 1;
    setChapter(newChapterNum);
    setStartVerse(defaultStartVerse);
    setEndVerse(null);

    if (book) {
      onChange(`${book} ${newChapterNum}:${defaultStartVerse}`);
    }
  };

  // Handle Start Verse Change
  const handleStartVerseChange = (newStartVerseNum: number) => {
    setStartVerse(newStartVerseNum);
    // If end verse is now less than start verse, reset it
    let finalEndVerse = endVerse;
    if (endVerse !== null && endVerse < newStartVerseNum) {
      setEndVerse(null);
      finalEndVerse = null;
    }

    if (book && chapter !== null) {
      const suffix = finalEndVerse ? `-${finalEndVerse}` : "";
      onChange(`${book} ${chapter}:${newStartVerseNum}${suffix}`);
    }
  };

  // Handle End Verse Change
  const handleEndVerseChange = (newEndVerseNum: number | null) => {
    setEndVerse(newEndVerseNum);

    if (book && chapter !== null && startVerse !== null) {
      const suffix = newEndVerseNum ? `-${newEndVerseNum}` : "";
      onChange(`${book} ${chapter}:${startVerse}${suffix}`);
    }
  };

  const selectCls =
    "w-full bg-[#FFF0F2]/30 border border-[#FFF0F2]/50 hover:bg-[#FFF0F2]/45 focus:bg-white focus:border-[#B31046] focus:ring-2 focus:ring-[#B31046]/5 px-3 py-3 rounded-2xl text-xs font-semibold text-zinc-800 placeholder-zinc-400 outline-none transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%2522%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M7%209l3%203%203-3%22%20stroke%3D%22%2523b31046%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-8";

  return (
    <div className="space-y-3">
      {/* Book Dropdown */}
      <div className="relative">
        <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B31046] pointer-events-none" />
        <select
          value={book}
          onChange={(e) => handleBookChange(e.target.value)}
          className={`${selectCls} pl-11`}
        >
          <option value="">Select Bible Book</option>
          {BIBLE_DATA.map((b) => (
            <option key={b.book} value={b.book}>
              {b.book}
            </option>
          ))}
        </select>
      </div>

      {/* Chapter & Verses Grid */}
      <div className="grid grid-cols-3 gap-2">
        {/* Chapter select */}
        <div>
          <label className="text-[10px] font-extrabold text-zinc-400 tracking-wider uppercase block mb-1">
            Chapter
          </label>
          <select
            value={chapter || ""}
            onChange={(e) => handleChapterChange(parseInt(e.target.value, 10))}
            disabled={!book}
            className={selectCls}
          >
            {!book && <option value="">-</option>}
            {book &&
              Array.from({ length: chapterCount }).map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
          </select>
        </div>

        {/* Start Verse select */}
        <div>
          <label className="text-[10px] font-extrabold text-zinc-400 tracking-wider uppercase block mb-1">
            Start Verse
          </label>
          <select
            value={startVerse || ""}
            onChange={(e) => handleStartVerseChange(parseInt(e.target.value, 10))}
            disabled={!book || chapter === null}
            className={selectCls}
          >
            {(!book || chapter === null) && <option value="">-</option>}
            {book &&
              chapter !== null &&
              Array.from({ length: verseCount }).map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
          </select>
        </div>

        {/* End Verse select (optional) */}
        <div>
          <label className="text-[10px] font-extrabold text-zinc-400 tracking-wider uppercase block mb-1">
            End Verse
          </label>
          <select
            value={endVerse || ""}
            onChange={(e) =>
              handleEndVerseChange(e.target.value ? parseInt(e.target.value, 10) : null)
            }
            disabled={!book || chapter === null || startVerse === null}
            className={selectCls}
          >
            <option value="">None</option>
            {book &&
              chapter !== null &&
              startVerse !== null &&
              Array.from({ length: verseCount - startVerse }).map((_, i) => {
                const verseNum = startVerse + i + 1;
                return (
                  <option key={verseNum} value={verseNum}>
                    {verseNum}
                  </option>
                );
              })}
          </select>
        </div>
      </div>
    </div>
  );
}
