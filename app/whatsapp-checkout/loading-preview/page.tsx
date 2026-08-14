import { Sparkles } from "lucide-react"

export default function WhatsAppCheckoutLoadingPreview() {
  return (
    <main className="min-h-screen bg-white px-6 py-12 font-sans text-slate-900 sm:px-10">
      <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center">
        <div
          className="w-full overflow-hidden rounded-2xl border border-[#ff0d13]/20 bg-white shadow-[0_12px_35px_rgba(255,13,19,0.10)]"
          role="status"
          aria-live="polite"
        >
          <div className="h-1 w-full overflow-hidden bg-[#ff0d13]/10">
            <div className="h-full w-1/3 animate-[loading-slide_1.4s_ease-in-out_infinite] rounded-full bg-[#ff0d13]" />
          </div>

          <div className="flex items-center gap-4 px-5 py-6 sm:px-8 sm:py-7">
            <div className="relative grid h-14 w-14 shrink-0 place-items-center rounded-full border-4 border-[#ff0d13]/15 bg-[#ff0d13]/5">
              <div className="absolute inset-[-4px] animate-spin rounded-full border-4 border-transparent border-t-[#ff0d13]" />
              <Sparkles className="h-6 w-6 text-[#ff0d13]" aria-hidden="true" />
            </div>
            <div>
              <p className="text-lg font-extrabold tracking-tight sm:text-xl">
                Creating your BuzzFiling order
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-500 sm:text-base">
                We&apos;re securely saving your details. Please keep this page open
                <span className="inline-block w-8 text-left animate-pulse">...</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 border-t border-slate-100 px-5 py-3 text-xs font-semibold text-slate-500 sm:px-8">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#ff0d13]" aria-hidden="true" />
            Secure checkout in progress
          </div>
        </div>
      </div>
    </main>
  )
}
