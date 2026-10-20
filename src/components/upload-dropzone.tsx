"use client";

import { useMemo, useState } from "react";
import { Upload } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { PRIMARY_MAX_BYTES, SUPPORTING_MAX_BYTES, extensionOf } from "@/lib/files";

export function UploadDropzone({
  name,
  label,
  accept,
  kind,
  required,
  onFileChange,
}: {
  name: string;
  label: string;
  accept: string;
  kind: "primary" | "supporting";
  required?: boolean;
  onFileChange?: (file: File | null) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(false);
  const preview = useMemo(() => {
    if (!file || kind !== "primary") return null;
    return URL.createObjectURL(file);
  }, [file, kind]);

  const max = kind === "primary" ? PRIMARY_MAX_BYTES : SUPPORTING_MAX_BYTES;

  function onFile(next: File | null) {
    if (!next) {
      setFile(null);
      setProgress(0);
      onFileChange?.(null);
      return;
    }
    const ext = extensionOf(next.name);
    if (kind === "primary" && !["png", "jpg", "jpeg", "webp"].includes(ext)) {
      setError("Use PNG, JPG, JPEG, or WEBP.");
      setFile(null);
      onFileChange?.(null);
      return;
    }
    if (kind === "supporting" && ext !== "pdf") {
      setError("Supporting file must be a PDF.");
      setFile(null);
      onFileChange?.(null);
      return;
    }
    if (next.size > max) {
      setError(kind === "primary" ? "Primary image must be 10 MB or smaller." : "PDF must be 15 MB or smaller.");
      setFile(null);
      onFileChange?.(null);
      return;
    }
    setError(null);
    setFile(next);
    onFileChange?.(next);
    setProgress(35);
    requestAnimationFrame(() => setProgress(100));
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <label
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/40 px-4 py-8 text-center ${active ? "border-primary bg-primary/5" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setActive(true);
        }}
        onDragLeave={() => setActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setActive(false);
          onFile(event.dataTransfer.files[0] ?? null);
        }}
      >
        <Upload className="mb-2 h-5 w-5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Drag a file here or click to browse</span>
        <input
          className="sr-only"
          type="file"
          name={name}
          accept={accept}
          required={required}
          onChange={(event) => onFile(event.target.files?.[0] ?? null)}
        />
      </label>
      {file ? (
        <div className="space-y-2 text-sm">
          <p>
            {file.name} · {(file.size / (1024 * 1024)).toFixed(2)} MB
          </p>
          <Progress value={progress} />
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Preview" className="h-32 rounded-lg object-cover" />
          ) : null}
        </div>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
