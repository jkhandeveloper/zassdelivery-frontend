"use client";

import { useMutation } from "@tanstack/react-query";
import * as React from "react";

import { uploadApi } from "@/lib/api/uploads";
import type { UploadedFileDto, UploadFolder } from "@/types/upload";

/**
 * Sends one file and reports how far along it is.
 *
 * Progress is state rather than a callback so a form can render a bar without
 * wiring one up itself; it is reset on every new attempt, and cleared when the
 * upload settles either way.
 */
export function useUploadFile() {
  const [progress, setProgress] = React.useState<number | null>(null);

  const mutation = useMutation<UploadedFileDto, Error, { file: File; folder: UploadFolder }>({
    mutationFn: ({ file, folder }) => {
      setProgress(0);
      return uploadApi.uploadFile(file, folder, { onProgress: setProgress });
    },
    onSettled: () => setProgress(null),
  });

  return { ...mutation, progress };
}
