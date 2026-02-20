"use client"

import { useEffect, useState } from "react"
import { Sparkles, PartyPopper, Trophy, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface OrderCelebrationProps {
  show: boolean
  onClose: () => void
}

export function OrderCelebration({ show, onClose }: OrderCelebrationProps) {
  const [confetti, setConfetti] = useState<Array<{ id: number; left: number; delay: number; duration: number }>>([])

  useEffect(() => {
    if (show) {
      // Generate confetti pieces
      const pieces = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2,
      }))
      setConfetti(pieces)

      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [show])

  if (!show) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300 p-4 overflow-y-auto"
      onClick={(e) => {
        // Close modal when clicking backdrop on mobile
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      {/* Confetti */}
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className="absolute top-0 w-2 h-2 rounded-full animate-fall pointer-events-none"
          style={{
            left: `${piece.left}%`,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            backgroundColor: ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#880000", "#ff0d13"][
              Math.floor(Math.random() * 8)
            ],
          }}
        />
      ))}

      {/* Celebration Card */}
      <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 md:p-12 w-full max-w-[90vw] sm:max-w-md mx-auto text-center animate-in zoom-in-95 duration-500 my-auto max-h-[90vh] overflow-y-auto">
        {/* Party Popper Icon */}
        <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24 mb-4 sm:mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-[#880000] to-[#ff0d13] rounded-full animate-pulse" />
          <div className="absolute inset-1 bg-white rounded-full flex items-center justify-center">
            <PartyPopper className="w-10 h-10 sm:w-12 sm:h-12 text-[#880000]" />
          </div>
          <Sparkles className="absolute -top-2 -right-2 w-6 h-6 sm:w-8 sm:h-8 text-yellow-400 animate-spin" />
          <Sparkles className="absolute -bottom-2 -left-2 w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 animate-bounce" />
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-3">Congratulations!</h2>

        {/* Trophy */}
        <div className="flex justify-center mb-4">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-2.5 sm:p-3 shadow-lg">
            <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
        </div>

        {/* Description */}
        <p className="text-base sm:text-lg text-slate-700 mb-4 sm:mb-6">
          Your business formation is{" "}
          <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#880000] to-[#ff0d13]">
            complete!
          </span>
        </p>

        {/* Success Message */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            <p className="font-semibold text-sm sm:text-base text-green-900">All Milestones Completed</p>
          </div>
          <p className="text-xs sm:text-sm text-green-700">
            Your company is now ready for business. All documents are available in your dashboard.
          </p>
        </div>

        {/* Close Button */}
        <Button
          onClick={onClose}
          size="lg"
          className="w-full min-h-[44px] sm:min-h-[48px] bg-gradient-to-r from-[#880000] to-[#ff0d13] hover:from-[#660000] hover:to-[#cc0a0f] hover:scale-[1.02] active:scale-[0.98] text-white font-semibold shadow-lg shadow-red-500/30 transition-all duration-200 text-sm sm:text-base"
        >
          Continue to Dashboard
        </Button>
      </div>

      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-fall {
          animation: fall linear infinite;
        }
      `}</style>
    </div>
  )
}
