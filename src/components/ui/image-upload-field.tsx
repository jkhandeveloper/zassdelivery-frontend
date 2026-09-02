"use client";

import { ImageOff, Upload } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { FilePicker } from "@/components/ui/file-picker";
import { Field } from "@/components/ui/input";
import { Media } from "@/components/ui/media";
import { useUploadFile } from "@/hooks/use-uploads";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { ACCEPT_IMAGES, type UploadFolder } from "@/types/upload";

export interface ImageUploadFieldProps {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  /** Which folder in the bucket the file is filed under. */
  folder: UploadFolder;
  /** The stored URL, owned by the parent — empty string when there is none. */
  value: string;
  onChange: (url: string) => void;
  /** Which stand-in the preview falls back to before an image is chosen. */
  variant?: "food" | "store";
  /** Round for an avatar, square for a dish or a gallery shot. */
  shape?: "square" | "circle";
  disabled?: boolean;
  className?: string;
}

/**
 * Pick a photo, store it, and hand back the URL it reads from.
 *
 * The two halves of the upload flow are joined here so a form never has to know
 * about either: the file goes to `POST /uploads` the moment it is chosen, and
 * only the URL that comes back is put into the parent's state. That ordering is
 * deliberate — attaching a URL before the bytes are stored would leave a record
 * pointing at nothing if the save succeeded and the upload did not.
 *
 * Uploading on selection rather than on submit is what makes this feel like an
 * image field instead of a two-step form: by the time someone presses Save the
 * picture is already there to look at, and a failure surfaces next to the
 * picker while they can still choose another file.
 */
export function ImageUploadField({
  id,
  label,
  hint,
  required,
  folder,
  value,
  onChange,
  variant = "food",
  shape = "square",
  disabled = false,
  className,
}: ImageUploadFieldProps) {
  const store = useUploadFile();
  const [error, setError] = React.useState<string>();

  const busy = store.isPending;

  function upload(file: File | null): void {
    setError(undefined);

    if (file === null) return;

    store.mutate(
      { file, folder },
      {
        onSuccess: (stored) => onChange(stored.url),
        onError: (failure) =>
          setError(
            failure instanceof ApiError
              ? failure.message
              : "We couldn't upload that photo. Please try again.",
          ),
      },
    );
  }

  return (
    <Field label={label} htmlFor={id} hint={hint} required={required} className={className}>
      {value === "" ? (
        <FilePicker
          id={id}
          label={label}
          // Never held: the file is sent straight away, so the picker's own
          // "chosen file" state would only be a second copy of the same truth.
          value={null}
          onChange={upload}
          progress={store.progress}
          disabled={disabled || busy}
          error={error}
          imagesOnly
        />
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 rounded-[var(--radius-input)] border border-border-default bg-surface-muted p-3">
            <span
              className={cn(
                "size-16 shrink-0 overflow-hidden border border-border-subtle bg-surface",
                shape === "circle" ? "rounded-full" : "rounded-xl",
              )}
            >
              <Media src={value} alt="" variant={variant} />
            </span>

            <div className="flex min-w-0 flex-1 flex-wrap gap-2">
              <ReplaceButton
                id={id}
                label={label}
                disabled={disabled || busy}
                progress={store.progress}
                onPick={upload}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-danger"
                disabled={disabled || busy}
                onClick={() => {
                  setError(undefined);
                  onChange("");
                }}
              >
                <ImageOff className="size-4" />
                Remove
              </Button>
            </div>
          </div>

          {error !== undefined && <p className="text-sm font-medium text-danger">{error}</p>}
        </div>
      )}
    </Field>
  );
}

/**
 * Swaps the picture without clearing it first.
 *
 * A bare input rather than the full `FilePicker`: once there is a photo on
 * screen, the drop zone and its guidance are just noise around a button.
 */
function ReplaceButton({
  id,
  label,
  disabled,
  progress,
  onPick,
}: {
  id: string;
  label: string;
  disabled: boolean;
  progress: number | null;
  onPick: (file: File | null) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={ACCEPT_IMAGES}
        aria-label={`${label} file`}
        className="sr-only"
        // The visible button opens the same dialog, so a keyboard user should
        // reach one control here, not two.
        tabIndex={-1}
        disabled={disabled}
        onChange={(event) => {
          onPick(event.target.files?.[0] ?? null);
          // Without this the same file cannot be re-picked: the input still
          // holds it, so choosing it again fires no change event.
          event.target.value = "";
        }}
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        loading={progress !== null}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="size-4" />
        {progress === null ? "Replace photo" : `Sending… ${progress}%`}
      </Button>
    </>
  );
}
