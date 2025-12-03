"use client"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

interface BusinessNameDisplayProps {
  name: string
  maxLength?: number
  className?: string
  showTooltip?: boolean
  truncateMode?: "ellipsis" | "smart"
}

export function BusinessNameDisplay({
  name,
  maxLength = 6,
  className = "",
  showTooltip = true,
  truncateMode = "ellipsis",
}: BusinessNameDisplayProps) {
  const needsTruncation = name && name.length > maxLength

  const getTruncatedName = (text: string, max: number) => {
    if (text.length <= max) return text

    if (truncateMode === "smart") {
      const truncated = text.substring(0, max)
      const lastSpace = truncated.lastIndexOf(" ")
      return lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated
    }

    return text.substring(0, max)
  }

  const displayName = getTruncatedName(name, maxLength)
  const isTextTruncated = displayName !== name

  const content = (
    <span className={`truncate ${className}`} title={isTextTruncated ? name : undefined} aria-label={name}>
      {isTextTruncated ? `${displayName}...` : displayName}
    </span>
  )

  if (showTooltip && isTextTruncated) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs break-words text-xs sm:text-sm" sideOffset={4}>
            {name}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return content
}
