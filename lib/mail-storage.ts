import type { MailItem } from "@/lib/types"

export const mailStorage = {
  getAll: () => [] as MailItem[],
  get: (id: string) => null as MailItem | null,
  save: (mail: MailItem) => {},
  delete: (id: string) => {},
}
