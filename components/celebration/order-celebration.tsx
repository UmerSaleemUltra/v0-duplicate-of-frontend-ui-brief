"use client"

import { useEffect, useState } from "react"
import { Sparkles, PartyPopper, Trophy, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface OrderCelebrationProps {
  show: boolean
  onClose: () => void
}

interface ConfettiPiece {
  id: number
  left: number
  delay: number
  duration: number
  color: string
}

export function OrderCelebration({ show, onClose }: OrderCelebrationProps) {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([])

  useEffect(() => {
    if (show) {
      const colors = [
        "#ef4444",
        "#f59e0b",
        "#10b981",
        "#3b82f6",
        "#8b5cf6",
        "#ec4899",
        "#880000",
        "#ff0d13",
      ]

      const pieces = Array.from({ length: 25 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      }))

      setConfetti(pieces)

      document.body.style.overflow = "hidden"

      // Auto remove confetti after animation ends
      const timer = setTimeout(() => {
        setConfetti([])
      }, 4000)

      return () => clearTimeout(timer)
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
      id="modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto"
      onClick={(e) => {
        if ((e.target as HTMLElement).id === "modal-backdrop") {
          onClose()
        }
      }}
    >
      {/* Confetti */}
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className="absolute top-0 w-2 h-2 rounded-full pointer-events-none animate-fall"
          style={{
            left: `${piece.left}%`,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            backgroundColor: piece.color,
          }}
        />
      ))}

      {/* Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-md text-center animate-in zoom-in-95 duration-300">
        {/* Icon */}
        <div className="relative mx-auto w-20 h-20 mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-[#880000] to-[#ff0d13] rounded-full animate-pulse" />
          <div className="absolute inset-1 bg-white rounded-full flex items-center justify-center">
            <PartyPopper className="w-10 h-10 text-[#880000]" />
          </div>
          <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-spin" />
          <Sparkles className="absolute -bottom-2 -left-2 w-5 h-5 text-yellow-400 animate-bounce" />
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
          Congratulations!
        </h2>

        {/* Trophy */}
        <div className="flex justify-center mb-4">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-3 shadow-lg">
            <Trophy className="w-7 h-7 text-white" />
          </div>
        </div>

        {/* Description */}
        <p className="text-base sm:text-lg text-slate-700 mb-6">
          Your business formation is{" "}
          <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#880000] to-[#ff0d13]">
            complete!
          </span>
        </p>

        {/* Success Box */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="font-semibold text-green-900">
              All Milestones Completed
            </p>
          </div>
          <p className="text-sm text-green-700">
            Your company is now ready for business. All documents are available
            in your dashboard.
          </p>
        </div>

        {/* Button */}
        <Button
          onClick={onClose}
          size="lg"
          className="w-full min-h-[48px] bg-gradient-to-r from-[#880000] to-[#ff0d13] hover:from-[#660000] hover:to-[#cc0a0f] text-white font-semibold shadow-lg shadow-red-500/30 transition-all duration-300"
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
          animation-name: fall;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }
      `}</style>
    </div>
  )
}
