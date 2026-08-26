/** Where a file is filed in the bucket. Mirrors `UploadFolder` on the API. */
export type UploadFolder =
  | 'rider-documents'
  | 'restaurant-logos'
  | 'menu-items'
  | 'avatars'
  | 'support-attachments'

export interface UploadedFileDto {
  /** Absolute URL the file reads back from. This is what records store. */
  url: string
  key: string
  folder: UploadFolder
  fileName: string | null
  mimeType: string
  size: number
}

/**
 * What the API accepts, kept in one place so the file picker's `accept`
 * attribute and its rejection message can never drift from each other.
 */
export const ACCEPTED_UPLOAD_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
] as const

/** For `<input type="file" accept>`. Extensions are listed because HEIC from an
 * iPhone often arrives with an empty or unexpected media type. */
export const ACCEPT_ATTRIBUTE = `${ACCEPTED_UPLOAD_TYPES.join(',')},.jpg,.jpeg,.png,.webp,.heic,.heif,.pdf`

/** Must match `UPLOAD_MAX_FILE_SIZE_MB` on the API. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
