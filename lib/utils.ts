import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns a display value for potentially missing data
 * @param value - The value to display
 * @param fallback - The fallback text (default: "Not yet")
 * @returns The value or fallback text
 */
export function getDisplayValue(value: string | undefined | null, fallback = "Not yet"): string {
  if (!value || value.trim() === "") {
    return fallback
  }
  return value
}

/**
 * Formats EIN for display - shows FULL EIN (not masked)
 * @param ein - The EIN to format
 * @param hideIfEmpty - Whether to return "Not yet" for empty values
 * @returns Formatted EIN or "Not yet"
 */
export function formatEIN(ein: string | undefined | null, hideIfEmpty = false): string {
  if (!ein || ein.trim() === "") {
    return hideIfEmpty ? "Not yet" : ""
  }
  return ein
}

/**
 * Formats business ID for display - shows FULL ID
 * @param id - The business ID
 * @returns Formatted ID or "Not yet"
 */
export function formatBusinessId(id: string | undefined | null): string {
  if (!id || id.trim() === "" || id === "BIZ-PENDING") {
    return "Not yet"
  }
  return id
}

/**
 * Calculates company profile completion percentage
 * @param company - The company object
 * @returns Completion percentage (0-100)
 */
export function calculateCompanyCompletion(company: any): number {
  if (!company) return 0

  const fields = [
    company.name,
    company.ein,
    company.registrationNumber,
    company.state,
    company.entityType,
    company.address,
    company.city,
    company.zip,
    company.members && company.members.length > 0,
    company.registeredAgent,
  ]

  const filledFields = fields.filter((field) => {
    if (typeof field === "boolean") return field
    return field && field.toString().trim() !== ""
  }).length

  return Math.round((filledFields / fields.length) * 100)
}

/**
 * Calculates revenue for a given time period
 * @param invoices - Array of invoices
 * @param months - Number of months to look back (default: 12)
 * @returns Total revenue
 */
export function calculateRevenue(invoices: any[], months = 12): number {
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1)

  return invoices
    .filter((invoice) => {
      const invoiceDate = new Date(invoice.createdAt)
      return invoice.status === "paid" && invoiceDate >= startDate
    })
    .reduce((sum, invoice) => sum + invoice.amount, 0)
}

/**
 * Gets monthly revenue breakdown
 * @param invoices - Array of invoices
 * @param months - Number of months to look back
 * @returns Array of monthly revenue data
 */
export function getMonthlyRevenue(invoices: any[], months = 12): Array<{ month: string; revenue: number }> {
  const now = new Date()
  const monthlyData: Array<{ month: string; revenue: number }> = []

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthName = date.toLocaleDateString("en-US", { month: "short", year: "numeric" })

    const monthRevenue = invoices
      .filter((invoice) => {
        const invoiceDate = new Date(invoice.createdAt)
        return (
          invoice.status === "paid" &&
          invoiceDate.getMonth() === date.getMonth() &&
          invoiceDate.getFullYear() === date.getFullYear()
        )
      })
      .reduce((sum, invoice) => sum + invoice.amount, 0)

    monthlyData.push({ month: monthName, revenue: monthRevenue })
  }

  return monthlyData
}

/**
 * Formats a date string or Date object for display
 * @param date - The date to format (string, Date, or null/undefined)
 * @param options - Intl.DateTimeFormatOptions for custom formatting
 * @returns Formatted date string or "N/A" for invalid dates
 */
export function formatDate(date: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return "N/A"

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date

    if (isNaN(dateObj.getTime())) {
      return "N/A"
    }

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      ...options,
    }

    return dateObj.toLocaleDateString("en-US", defaultOptions)
  } catch (error) {
    console.error("[BuzzFiling] Error formatting date:", error)
    return "N/A"
  }
}
