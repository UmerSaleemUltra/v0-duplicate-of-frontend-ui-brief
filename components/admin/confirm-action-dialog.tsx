"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ConfirmActionDialogProps {
  open: boolean
  title: string
  description: string
  actionLabel?: string
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function ConfirmActionDialog({
  open,
  title,
  description,
  actionLabel = "Delete",
  onOpenChange,
  onConfirm,
}: ConfirmActionDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[calc(100%-1.5rem)] rounded-xl border-0 p-6 sm:max-w-[640px] sm:p-8">
        <AlertDialogHeader className="gap-3 text-left">
          <AlertDialogTitle className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base leading-6 text-slate-950 sm:text-lg sm:leading-7">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-3 gap-3 sm:mt-4">
          <AlertDialogCancel className="h-12 rounded-xl border-slate-200 px-6 text-base font-semibold text-slate-900">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="h-12 rounded-xl bg-red-600 px-6 text-base font-semibold text-white hover:bg-red-700"
          >
            {actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
