import { apiUpload } from '../api-client'
import type { UploadedFileDto, UploadFolder } from '@/types/upload'

export const uploadApi = {
  /**
   * Sends one file and gets back the URL it reads from.
   *
   * Uploading and using a file are two steps: the URL returned here is what
   * goes on the record the file belongs to — a rider document's `fileUrl`, a
   * restaurant's logo — so every other endpoint keeps taking plain JSON.
   */
  uploadFile: (
    file: File,
    folder: UploadFolder,
    options?: { onProgress?: (percent: number) => void; signal?: AbortSignal },
  ) => {
    const form = new FormData()
    form.append('file', file)
    form.append('folder', folder)

    return apiUpload<UploadedFileDto>('/uploads', form, options)
  },
}
