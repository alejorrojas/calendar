"use client";

import { useCallback, useRef, useState } from "react";

export interface PendingFileSource {
  fileData: string;
  mediaType: string;
  filename: string;
}

const GUEST_MAX_CHARS = 100;

interface UnifiedSourceInputProps {
  inputText: string;
  onInputTextChange: (text: string) => void;
  pendingFileSource: PendingFileSource | null;
  onFileAttached: (source: PendingFileSource) => void;
  onClearFile: () => void;
  onExtract: () => void;
  extracting: boolean;
  authenticated: boolean;
  hasExtracted: boolean;
}

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

async function fileToSource(file: File): Promise<PendingFileSource> {
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  return {
    fileData: `data:${file.type};base64,${base64}`,
    mediaType: file.type,
    filename: file.name,
  };
}

function FileTypeIcon({ mediaType }: { mediaType: string }) {
  if (mediaType === "application/pdf") {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path
            d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
            stroke="#EF4444"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M14 2v6h6M9 13h6M9 17h4"
            stroke="#EF4444"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }
  if (mediaType.includes("word") || mediaType.includes("document")) {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path
            d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
            stroke="#3B82F6"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M14 2v6h6M9 13h6M9 17h4"
            stroke="#3B82F6"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }
  if (mediaType.includes("text") || mediaType.includes("csv")) {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F5F5F5]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path
            d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
            stroke="#888"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M14 2v6h6M9 13h6M9 17h4"
            stroke="#888"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F5F5F5]">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path
          d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
          stroke="#999"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M14 2v6h6"
          stroke="#999"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export function UnifiedSourceInput({
  inputText,
  onInputTextChange,
  pendingFileSource,
  onFileAttached,
  onClearFile,
  onExtract,
  extracting,
  authenticated,
  hasExtracted,
}: UnifiedSourceInputProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileSizeError, setFileSizeError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isGuestLocked = !authenticated && hasExtracted;

  const processFile = useCallback(
    async (file: File) => {
      setFileSizeError("");
      if (file.size > MAX_UPLOAD_BYTES) {
        setFileSizeError("File is too large. Max 5 MB.");
        return;
      }
      const source = await fileToSource(file);
      onFileAttached(source);
    },
    [onFileAttached],
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) await processFile(file);
    },
    [processFile],
  );

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = Array.from(e.clipboardData.items);
      const imageItem = items.find((item) => item.type.startsWith("image/"));
      if (imageItem) {
        e.preventDefault();
        const file = imageItem.getAsFile();
        if (file) await processFile(file);
      }
    },
    [processFile],
  );

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) await processFile(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [processFile],
  );

  const canExtract =
    !extracting && (!!pendingFileSource || inputText.trim().length > 0);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`rounded-2xl border transition-all duration-150 ${
        isDragOver
          ? "border-[#0A0A0A] bg-[#FAFAF0] shadow-md"
          : "border-[#E8E8E8] bg-white shadow-sm"
      }`}
    >
      <div className="p-4">
        {/* Attached file preview */}
        {pendingFileSource && (
          <div className="mb-3 flex items-center gap-3 rounded-2xl border border-[#F0F0F0] bg-[#FAFAFA] p-2.5">
            {pendingFileSource.mediaType.startsWith("image/") ? (
              /* Image thumbnail */
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-[#E8E8E8] bg-[#F5F5F5]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pendingFileSource.fileData}
                  alt="preview"
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <FileTypeIcon mediaType={pendingFileSource.mediaType} />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-[#0A0A0A]">
                {pendingFileSource.filename}
              </p>
              <p className="text-[11px] text-[#AAAAAA]">
                {pendingFileSource.mediaType.startsWith("image/")
                  ? "Image"
                  : pendingFileSource.mediaType === "application/pdf"
                    ? "PDF"
                    : "File"}{" "}
                · Ready to extract
              </p>
            </div>
            <button
              type="button"
              onClick={onClearFile}
              aria-label="Remove file"
              className="shrink-0 text-[#BBBBBB] transition-colors hover:text-[#0A0A0A]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Textarea */}
        <textarea
          value={inputText}
          onChange={(e) => {
            const val = e.target.value;
            if (!authenticated && val.length > GUEST_MAX_CHARS) return;
            onInputTextChange(val);
          }}
          onPaste={handlePaste}
          disabled={isGuestLocked}
          placeholder={
            isGuestLocked
              ? "Login to add more events…"
              : pendingFileSource
                ? "Add a note (optional)…"
                : "Team sync Mon 10 am\nMath exam next Friday\nOr drop / paste a file or image…"
          }
          rows={4}
          className="w-full resize-none bg-transparent text-sm leading-relaxed text-[#0A0A0A] outline-none placeholder:text-[#C0C0C0] disabled:cursor-not-allowed disabled:opacity-50"
        />

        {/* Char counter for guests */}
        {!authenticated && !isGuestLocked && inputText.length > 60 && (
          <p
            className={`mb-1 text-right text-[11px] ${
              inputText.length >= GUEST_MAX_CHARS
                ? "text-red-400"
                : "text-[#CCCCCC]"
            }`}
          >
            {inputText.length}/{GUEST_MAX_CHARS}
          </p>
        )}

        {/* Bottom action row */}
        <div className="mt-1 flex items-center justify-between">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isGuestLocked}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-[#AAAAAA] transition-colors hover:bg-[#F5F5F5] hover:text-[#0A0A0A] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path
                d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Attach file
          </button>

          <button
            type="button"
            onClick={onExtract}
            disabled={!canExtract || isGuestLocked}
            aria-label={extracting ? "Extracting…" : "Extract events"}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8E815] transition-colors hover:bg-[#d4d512] disabled:cursor-not-allowed disabled:bg-[#E5E5E5]"
          >
            {extracting ? (
              <svg
                className="animate-spin"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="#AAAAAA"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="28 28"
                  strokeDashoffset="14"
                />
              </svg>
            ) : isGuestLocked ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <rect
                  x="3"
                  y="11"
                  width="18"
                  height="11"
                  rx="2"
                  stroke="#AAAAAA"
                  strokeWidth="2"
                />
                <path
                  d="M7 11V7a5 5 0 0110 0v4"
                  stroke="#AAAAAA"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path
                  d="M7 11V3M7 3L3.5 6.5M7 3L10.5 6.5"
                  stroke="#0A0A0A"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* File size error */}
      {fileSizeError && (
        <div className="border-t border-[#FFCDD2] bg-[#FFF0F0] px-4 py-2 text-[12px] text-[#C62828] rounded-b-2xl">
          {fileSizeError}
        </div>
      )}

      {/* Drop hint overlay */}
      {isDragOver && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl">
          <p className="font-heading text-sm font-bold text-[#0A0A0A]">
            Drop to attach
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,.pdf,.txt,.doc,.docx,.csv"
        onChange={handleFileInput}
      />
    </div>
  );
}
