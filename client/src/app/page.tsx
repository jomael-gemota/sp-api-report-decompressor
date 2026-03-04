"use client";

import { useState, useRef, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    csvPreview: string;
    totalRows: number;
    outputName: string;
    wasCompressed: boolean;
    blob: Blob;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFile = (f: File) => {
    setError(null);
    setResult(null);
    setFile(f);
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }, []);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
  };

  const handleSubmit = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_URL}/api/decompress`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || `Server returned ${res.status}`);
      }

      const blob = await res.blob();
      const csvText = await blob.text();
      const lines = csvText.split("\n").filter((l) => l.trim());
      const previewLines = lines.slice(0, 21);

      setResult({
        csvPreview: previewLines.join("\n"),
        totalRows: lines.length - 1,
        outputName:
          res.headers.get("X-Output-Filename") ||
          file.name.replace(/\.[^.]+$/, ".csv"),
        wasCompressed: res.headers.get("X-Was-Compressed") === "true",
        blob,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to decompress — is the server running?"
      );
    } finally {
      setLoading(false);
    }
  };

  const downloadCsv = () => {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.outputName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="flex flex-col">
      {/* Hero + Upload */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(79,70,229,0.15),transparent)]" />

        <div className="mx-auto max-w-3xl px-6 pb-16 pt-16 sm:pt-24">
          {/* Welcome text */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              SP-API Report{" "}
              <span className="text-accent">Decompressor</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-muted">
              Upload your compressed{" "}
              <code className="rounded bg-border/50 px-1.5 py-0.5 text-sm font-mono">
                .NA
              </code>{" "}
              report file and get a clean, structured CSV back instantly.
            </p>
          </div>

          {/* Upload area */}
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all ${
              dragging
                ? "border-accent bg-accent/5"
                : file
                  ? "border-emerald-400 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-950/20"
                  : "border-border bg-surface hover:border-accent/40 hover:bg-accent/5"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={onFileSelect}
              className="hidden"
              accept=".NA,.na,.gz,.gzip,.txt,.tsv"
            />

            {file ? (
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <polyline points="16 13 12 17 8 13" />
                    <line x1="12" y1="17" x2="12" y2="9" />
                  </svg>
                </div>
                <div>
                  <p className="text-base font-semibold">{file.name}</p>
                  <p className="mt-0.5 text-sm text-muted">
                    {formatBytes(file.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    reset();
                  }}
                  className="mt-1 text-xs font-medium text-red-500 transition-colors hover:text-red-700"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
                    <polyline points="16 16 12 12 8 16" />
                    <line x1="12" y1="12" x2="12" y2="21" />
                    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                  </svg>
                </div>
                <div>
                  <p className="text-base font-semibold">
                    Drag & drop your .NA file here
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    or click to browse — supports .NA, .gz, .tsv, .txt
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Decompress button */}
          {file && !result && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-3 text-base font-semibold text-white shadow-lg shadow-accent/25 transition-all hover:bg-accent/90 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" className="opacity-75" />
                    </svg>
                    Decompressing...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Decompress &amp; Convert to CSV
                  </>
                )}
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/30">
              <p className="text-sm font-semibold text-red-800 dark:text-red-400">
                Error
              </p>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Result — full width */}
      {result && (
        <section className="border-t border-border bg-surface/50">
          <div className="mx-auto max-w-6xl px-6 py-10">
            <div className="flex flex-col gap-6">
              {/* Summary bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-400">
                    Conversion complete
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    {result.outputName}
                  </span>
                  <span className="text-xs text-emerald-700 dark:text-emerald-400">
                    {result.totalRows.toLocaleString()} data rows
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
                    {result.wasCompressed
                      ? "gzip decompressed"
                      : "raw text parsed"}
                  </span>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={downloadCsv}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download CSV
                  </button>
                  <button
                    onClick={reset}
                    className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 px-5 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
                  >
                    Upload Another
                  </button>
                </div>
              </div>

              {/* CSV Preview */}
              <div className="rounded-2xl border border-border bg-surface">
                <div className="flex items-center justify-between border-b border-border px-5 py-3">
                  <h2 className="text-sm font-semibold">
                    CSV Preview
                    <span className="ml-2 font-normal text-muted">
                      (first 20 rows)
                    </span>
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <pre className="p-5 text-xs leading-relaxed font-mono">
                    {result.csvPreview}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* How it works — shown when no result */}
      {!result && (
        <section className="border-t border-border bg-surface/50">
          <div className="mx-auto max-w-3xl px-6 py-16">
            <h2 className="mb-10 text-center text-2xl font-bold tracking-tight">
              How It Works
            </h2>
            <div className="grid gap-8 sm:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-lg font-bold text-accent">
                  1
                </div>
                <h3 className="mb-1 text-sm font-semibold">Upload</h3>
                <p className="text-sm text-muted">
                  Drag & drop or browse for your SP-API .NA report file.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-lg font-bold text-accent">
                  2
                </div>
                <h3 className="mb-1 text-sm font-semibold">Decompress</h3>
                <p className="text-sm text-muted">
                  The server detects the format (gzip, JSON, TSV) and converts
                  it automatically.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-lg font-bold text-accent">
                  3
                </div>
                <h3 className="mb-1 text-sm font-semibold">Download CSV</h3>
                <p className="text-sm text-muted">
                  Preview the structured output and download a ready-to-use CSV
                  file.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
