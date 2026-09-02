"use client";

import { Camera, FileText, FileUp, X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ACCEPT_ATTRIBUTE,
  ACCEPT_IMAGES,
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_UPLOAD_TYPES,
  IMAGE_EXTENSIONS,
  MAX_UPLOAD_BYTES,
  UPLOAD_EXTENSIONS,
  formatFileSize,
} from "@/types/upload";

export interface FilePickerProps {
  id: string;
  /** Names the control for screen readers, e.g. "CNIC — front". */
  label: string;
  /** The chosen file, owned by the parent so it can clear it after a save. */
  value: File | null;
  onChange: (file: File | null) => void;
  /** 0–100 while the file is being sent, `null` otherwise. */
  progress?: number | null;
  disabled?: boolean;
  /** Shown under the picker — a rejection from here or a failure from the API. */
  error?: string;
  /** What is already on file, offered as a link so a rider can check it first. */
  existingUrl?: string | null;
  /** Drops PDF from what may be chosen — for a field that ends up in an `<img>`. */
  imagesOnly?: boolean;
  className?: string;
}

/**
 * Pick a file off the device — camera roll, gallery or file system.
 *
 * Selection only: it never talks to the network. Whoever renders it decides
 * when the file is sent and what it is attached to, which keeps one picker
 * usable for rider documents, logos and menu photos alike.
 *
 * The type and size checks here are a courtesy, not a control — the API applies
 * its own, because anything a browser enforces can be bypassed.
 */
export function FilePicker({
  id,
  label,
  value,
  onChange,
  progress = null,
  disabled = false,
  error,
  existingUrl,
  imagesOnly = false,
  className,
}: FilePickerProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const [rejection, setRejection] = React.useState<string>();

  const preview = useImagePreview(value);
  const uploading = progress !== null;
  const message = error ?? rejection;

  const allowedTypes: readonly string[] = imagesOnly ? ACCEPTED_IMAGE_TYPES : ACCEPTED_UPLOAD_TYPES;
  const allowedExtensions: readonly string[] = imagesOnly ? IMAGE_EXTENSIONS : UPLOAD_EXTENSIONS;
  const allowedText = imagesOnly ? "JPG, PNG, WebP or HEIC" : "JPG, PNG, WebP, HEIC or PDF";

  function accept(file: File | undefined): void {
    setRejection(undefined);

    if (file === undefined) return;

    // An empty type is normal on some Android file pickers, so the extension
    // has to be enough on its own — the API is the one that decides for real.
    const typeIsKnown = file.type !== "";
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

    if (typeIsKnown && !allowedTypes.includes(file.type)) {
      setRejection(`That file type isn't accepted. Choose a ${allowedText}.`);
      return;
    }

    if (!typeIsKnown && !allowedExtensions.includes(extension)) {
      setRejection(`That file type isn't accepted. Choose a ${allowedText}.`);
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setRejection(
        `That file is ${formatFileSize(file.size)} — the limit is ${formatFileSize(MAX_UPLOAD_BYTES)}.`,
      );
      return;
    }

    if (file.size === 0) {
      setRejection("That file is empty.");
      return;
    }

    onChange(file);
  }

  function clear(): void {
    setRejection(undefined);
    onChange(null);
    // Without this the same file cannot be re-picked: the input still holds it,
    // so choosing it again fires no change event.
    if (inputRef.current !== null) inputRef.current.value = "";
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={imagesOnly ? ACCEPT_IMAGES : ACCEPT_ATTRIBUTE}
        aria-label={`${label} file`}
        className="sr-only"
        // Out of the tab order on purpose: the visible button below opens the
        // same dialog, so a keyboard user reaches one control, not two.
        tabIndex={-1}
        disabled={disabled}
        onChange={(event) => accept(event.target.files?.[0])}
      />

      {value === null ? (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            if (!disabled) accept(event.dataTransfer.files[0]);
          }}
          className={cn(
            "flex flex-col items-center gap-3 rounded-[var(--radius-input)] border border-dashed px-4 py-6 text-center transition-colors",
            dragging ? "border-brand bg-brand-soft" : "border-border-strong bg-surface-muted",
            message !== undefined && "border-danger",
            disabled && "opacity-60",
          )}
        >
          <FileUp className="size-6 text-muted" aria-hidden />

          <div className="flex flex-col gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
            >
              <Camera className="size-4" />
              {imagesOnly ? "Choose a photo" : "Choose a file"}
            </Button>
            <span className="text-xs text-muted">
              Take a photo, or pick one from this device. {allowedText}, up to{" "}
              {formatFileSize(MAX_UPLOAD_BYTES)}.
            </span>
          </div>

          {existingUrl != null && existingUrl !== "" && (
            <a
              href={existingUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-brand underline underline-offset-2"
            >
              View the file already on record
            </a>
          )}
        </div>
      ) : (
        <div
          className={cn(
            "flex items-center gap-3 rounded-[var(--radius-input)] border bg-surface-muted p-3",
            message !== undefined ? "border-danger" : "border-border-default",
          )}
        >
          <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-border-subtle bg-surface">
            {preview === null ? (
              <FileText className="size-5 text-muted" aria-hidden />
            ) : (
              // A local object URL, so next/image would gain nothing here.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="size-full object-cover" />
            )}
          </span>

          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="truncate text-sm font-semibold text-primary" title={value.name}>
              {value.name}
            </span>
            <span className="text-xs text-muted">
              {uploading ? `Sending… ${progress}%` : formatFileSize(value.size)}
            </span>

            {uploading && (
              <span
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Upload progress"
                className="mt-0.5 block h-1 w-full overflow-hidden rounded-full bg-border-subtle"
              >
                <span
                  className="block h-full rounded-full bg-brand transition-[width] duration-200"
                  style={{ width: `${progress}%` }}
                />
              </span>
            )}
          </span>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 shrink-0"
            aria-label={`Remove ${value.name}`}
            disabled={disabled || uploading}
            onClick={clear}
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      {message !== undefined && <p className="text-sm font-medium text-danger">{message}</p>}
    </div>
  );
}

/** Types a browser will not paint, so there is nothing to preview from. */
const UNPREVIEWABLE = ["image/heic", "image/heif"];

/**
 * An object URL for an image file, revoked when it is replaced.
 *
 * Derived while rendering rather than in an effect, so the thumbnail is there
 * on the first paint instead of one render later. The effect exists only to
 * hand the URL back to the browser when it is no longer on screen — that
 * registry is the external system here, and leaking into it holds the whole
 * file in memory for the life of the tab.
 *
 * PDFs are skipped deliberately: a browser cannot thumbnail one without
 * rendering the whole document, which is a lot of work for a 48px square. HEIC
 * is skipped for the opposite reason — it would render as a broken image
 * everywhere but Safari, and the file icon is the honest answer.
 */
function useImagePreview(file: File | null): string | null {
  const url = React.useMemo(() => {
    if (file === null || !file.type.startsWith("image/") || UNPREVIEWABLE.includes(file.type)) {
      return null;
    }

    return URL.createObjectURL(file);
  }, [file]);

  React.useEffect(() => {
    if (url === null) return;

    return () => URL.revokeObjectURL(url);
  }, [url]);

  return url;
}
