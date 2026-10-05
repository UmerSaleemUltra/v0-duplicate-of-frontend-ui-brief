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
      <AlertDialogContent className="w-[calc(100%-2rem)] max-w-lg rounded-xl border-0 p-5 sm:p-6">
        <AlertDialogHeader className="gap-2 text-left">
          <AlertDialogTitle className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-5 text-slate-950 sm:text-base sm:leading-6">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-2 gap-2 sm:mt-3">
          <AlertDialogCancel className="h-10 rounded-lg border-slate-200 px-5 text-sm font-semibold text-slate-900 sm:h-11 sm:text-base">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="h-10 rounded-lg bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700 sm:h-11 sm:text-base"
          >
            {actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
