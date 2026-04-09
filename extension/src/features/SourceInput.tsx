import { useCallback, useRef, useState } from "react"

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

async function fileToSource(file: File) {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ""
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  const base64 = btoa(binary)
  return {
    fileData: `data:${file.type};base64,${base64}`,
    mediaType: file.type,
    filename: file.name
  }
}

type PendingFile = {
  fileData: string
  mediaType: string
  filename: string
}

type Props = {
  inputText: string
  onInputTextChange: (t: string) => void
  pendingFile: PendingFile | null
  onFileAttached: (f: PendingFile) => void
  onClearFile: () => void
  onExtract: () => void
  extracting: boolean
  error: string
}

export function SourceInput({
  inputText,
  onInputTextChange,
  pendingFile,
  onFileAttached,
  onClearFile,
  onExtract,
  extracting,
  error
}: Props) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [fileSizeError, setFileSizeError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(
    async (file: File) => {
      setFileSizeError("")
      if (file.size > MAX_UPLOAD_BYTES) {
        setFileSizeError("File too large. Max 5 MB.")
        return
      }
      const source = await fileToSource(file)
      onFileAttached(source)
    },
    [onFileAttached]
  )

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) await processFile(file)
    },
    [processFile]
  )

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = Array.from(e.clipboardData.items)
      const img = items.find((i) => i.type.startsWith("image/"))
      if (img) {
        e.preventDefault()
        const file = img.getAsFile()
        if (file) await processFile(file)
      }
    },
    [processFile]
  )

  const canExtract =
    !extracting && (!!pendingFile || inputText.trim().length > 0)

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragOver(true)
        }}
        onDragEnter={(e) => {
          e.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`relative rounded-2xl border transition-all duration-150 ${
          isDragOver
            ? "border-[#0a0a0a] bg-[#fafaf0] shadow-md"
            : "border-[#e8e8e8] bg-white shadow-sm"
        }`}>
        <div className="p-4">
          {/* File preview */}
          {pendingFile && (
            <div className="mb-3 flex items-center gap-3 rounded-xl border border-[#f0f0f0] bg-[#fafafa] p-2.5">
              {pendingFile.mediaType.startsWith("image/") ? (
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-[#e8e8e8]">
                  <img
                    src={pendingFile.fileData}
                    alt="preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
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
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-[#0a0a0a]">
                  {pendingFile.filename}
                </p>
                <p className="text-[11px] text-[#aaaaaa]">
                  {pendingFile.mediaType.startsWith("image/")
                    ? "Image"
                    : "File"}{" "}
                  · Ready to extract
                </p>
              </div>
              <button
                type="button"
                onClick={onClearFile}
                className="shrink-0 text-[#bbbbbb] transition-colors hover:text-[#0a0a0a]">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
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
            onChange={(e) => onInputTextChange(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && canExtract) {
                e.preventDefault()
                onExtract()
              }
            }}
            placeholder={
              pendingFile
                ? "Add a note (optional)…"
                : "Team sync Mon 10 am\nMath exam next Friday\nOr drop / paste a file or image…"
            }
            rows={5}
            className="w-full resize-none bg-transparent text-sm leading-relaxed text-[#0a0a0a] outline-none placeholder:text-[#c0c0c0]"
          />

          {/* Bottom row */}
          <div className="mt-1 flex items-center justify-between">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-[#aaaaaa] transition-colors hover:bg-[#f5f5f5] hover:text-[#0a0a0a]">
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
              disabled={!canExtract}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8e815] transition-colors hover:bg-[#d4d512] disabled:cursor-not-allowed disabled:bg-[#e5e5e5]">
              {extracting ? (
                <svg
                  className="animate-spin"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none">
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="#aaaaaa"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="28 28"
                    strokeDashoffset="14"
                  />
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M7 11V3M7 3L3.5 6.5M7 3L10.5 6.5"
                    stroke="#0a0a0a"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {isDragOver && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-white/80">
            <p className="font-heading text-sm font-bold text-[#0a0a0a]">
              Drop to attach
            </p>
          </div>
        )}
      </div>

      {(fileSizeError || error) && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
          {fileSizeError || error}
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,.pdf,.txt,.doc,.docx,.csv"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (file) await processFile(file)
          if (fileInputRef.current) fileInputRef.current.value = ""
        }}
      />
    </div>
  )
}
