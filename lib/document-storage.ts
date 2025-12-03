import type { Document } from "@/lib/types"

export const documentStorage = {
  getAll: () => [] as Document[],
  get: (id: string) => null as Document | null,
  save: (doc: Document) => {},
  delete: (id: string) => {},
  upload: async (file: File, metadata: any) => {
    return { id: "", url: "", name: file.name }
  },
  download: async (id: string) => {
    return null as Blob | null
  },
}
