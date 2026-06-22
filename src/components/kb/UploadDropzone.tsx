import { useRef, useState } from "react";
import { CloudUpload, FileText, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type UploadItem = {
  id: string;
  name: string;
  progress: number;
  status: "uploading" | "processing" | "done" | "error";
  error?: string;
};

const ACCEPT = ".pdf,.docx,.txt,.md,.markdown,.csv,.json";

export function UploadDropzone({
  onFiles,
  uploads,
  disabled,
}: {
  onFiles: (files: File[]) => void;
  uploads: UploadItem[];
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  return (
    <div className="rounded-[20px] border border-border bg-card p-5 shadow-card">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (disabled) return;
          onFiles(Array.from(e.dataTransfer.files));
        }}
        className={cn(
          "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          drag ? "border-primary bg-primary/5" : "border-border bg-background",
          disabled && "opacity-60",
        )}
      >
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <CloudUpload className="h-7 w-7" />
        </span>
        <p className="mt-4 text-sm font-semibold text-foreground">Drag files here</p>
        <p className="mt-1 text-xs text-muted-foreground">
          PDF, DOCX, TXT, Markdown, CSV, JSON — multiple files supported
        </p>
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          Browse Files
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) onFiles(Array.from(e.target.files));
            e.target.value = "";
          }}
        />
      </div>

      {uploads.length > 0 && (
        <ul className="mt-4 space-y-2">
          {uploads.map((u, i) => (
            <li
              key={`${u.name}-${i}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5"
            >
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-foreground">{u.name}</p>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      u.status === "error" ? "bg-destructive" : "bg-primary",
                    )}
                    style={{ width: `${u.progress}%` }}
                  />
                </div>
                {u.error && <p className="mt-1 text-[11px] text-destructive">{u.error}</p>}
              </div>
              <span className="shrink-0">
                {u.status === "uploading" || u.status === "processing" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : u.status === "done" ? (
                  <CheckCircle2 className="h-4 w-4 text-secondary" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
