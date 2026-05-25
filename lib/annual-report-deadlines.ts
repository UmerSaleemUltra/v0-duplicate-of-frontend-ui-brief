// State annual report deadlines and fees
// deadline types: "fixed" (specific date), "anniversary" (based on formation date), "quarterly"

export interface StateAnnualReportInfo {
  state: string
  deadlineType: "fixed" | "anniversary" | "quarterly"
  fixedDate?: string // e.g., "04-15" for April 15
  quarterlyMonths?: number[] // e.g., [3, 6, 9, 12] for quarterly
  fee: number
  lateFee?: number
  notes?: string
}

export const STATE_ANNUAL_REPORT_DEADLINES: Record<string, StateAnnualReportInfo> = {
  "Alabama": { state: "Alabama", deadlineType: "anniversary", fee: 100 },
  "Alaska": { state: "Alaska", deadlineType: "fixed", fixedDate: "01-02", fee: 100, notes: "Biennial report due Jan 2" },
  "Arizona": { state: "Arizona", deadlineType: "anniversary", fee: 0, notes: "No annual report required" },
  "Arkansas": { state: "Arkansas", deadlineType: "fixed", fixedDate: "05-01", fee: 150 },
  "California": { state: "California", deadlineType: "anniversary", fee: 25, notes: "Statement of Information due within 90 days of anniversary" },
  "Colorado": { state: "Colorado", deadlineType: "anniversary", fee: 10, notes: "Periodic report due in anniversary month" },
  "Connecticut": { state: "Connecticut", deadlineType: "anniversary", fee: 80 },
  "Delaware": { state: "Delaware", deadlineType: "fixed", fixedDate: "03-01", fee: 300, lateFee: 200 },
  "Florida": { state: "Florida", deadlineType: "fixed", fixedDate: "05-01", fee: 138.75 },
  "Georgia": { state: "Georgia", deadlineType: "fixed", fixedDate: "04-01", fee: 50 },
  "Hawaii": { state: "Hawaii", deadlineType: "anniversary", fee: 15 },
  "Idaho": { state: "Idaho", deadlineType: "anniversary", fee: 0, notes: "No annual report, just annual fee" },
  "Illinois": { state: "Illinois", deadlineType: "anniversary", fee: 75 },
  "Indiana": { state: "Indiana", deadlineType: "anniversary", fee: 50, notes: "Biennial report" },
  "Iowa": { state: "Iowa", deadlineType: "fixed", fixedDate: "04-01", fee: 60, notes: "Biennial report" },
  "Kansas": { state: "Kansas", deadlineType: "fixed", fixedDate: "04-15", fee: 55 },
  "Kentucky": { state: "Kentucky", deadlineType: "fixed", fixedDate: "06-30", fee: 15 },
  "Louisiana": { state: "Louisiana", deadlineType: "anniversary", fee: 35 },
  "Maine": { state: "Maine", deadlineType: "fixed", fixedDate: "06-01", fee: 85 },
  "Maryland": { state: "Maryland", deadlineType: "fixed", fixedDate: "04-15", fee: 300 },
  "Massachusetts": { state: "Massachusetts", deadlineType: "anniversary", fee: 500 },
  "Michigan": { state: "Michigan", deadlineType: "fixed", fixedDate: "02-15", fee: 25 },
  "Minnesota": { state: "Minnesota", deadlineType: "fixed", fixedDate: "12-31", fee: 0, notes: "No fee for annual renewal" },
  "Mississippi": { state: "Mississippi", deadlineType: "fixed", fixedDate: "04-15", fee: 0, notes: "No annual report required" },
  "Missouri": { state: "Missouri", deadlineType: "anniversary", fee: 0, notes: "No annual report required" },
  "Montana": { state: "Montana", deadlineType: "fixed", fixedDate: "04-15", fee: 20 },
  "Nebraska": { state: "Nebraska", deadlineType: "fixed", fixedDate: "04-01", fee: 26, notes: "Biennial report in odd years" },
  "Nevada": { state: "Nevada", deadlineType: "anniversary", fee: 350, lateFee: 75, notes: "Due last day of anniversary month" },
  "New Hampshire": { state: "New Hampshire", deadlineType: "fixed", fixedDate: "04-01", fee: 100 },
  "New Jersey": { state: "New Jersey", deadlineType: "anniversary", fee: 75 },
  "New Mexico": { state: "New Mexico", deadlineType: "anniversary", fee: 0, notes: "No annual report required" },
  "New York": { state: "New York", deadlineType: "anniversary", fee: 9, notes: "Biennial statement" },
  "North Carolina": { state: "North Carolina", deadlineType: "fixed", fixedDate: "04-15", fee: 200 },
  "North Dakota": { state: "North Dakota", deadlineType: "fixed", fixedDate: "11-15", fee: 50 },
  "Ohio": { state: "Ohio", deadlineType: "anniversary", fee: 0, notes: "No annual report required" },
  "Oklahoma": { state: "Oklahoma", deadlineType: "anniversary", fee: 25 },
  "Oregon": { state: "Oregon", deadlineType: "anniversary", fee: 100 },
  "Pennsylvania": { state: "Pennsylvania", deadlineType: "fixed", fixedDate: "12-31", fee: 70, notes: "Decennial report every 10 years" },
  "Rhode Island": { state: "Rhode Island", deadlineType: "anniversary", fee: 50 },
  "South Carolina": { state: "South Carolina", deadlineType: "anniversary", fee: 0, notes: "No annual report required" },
  "South Dakota": { state: "South Dakota", deadlineType: "anniversary", fee: 50 },
  "Tennessee": { state: "Tennessee", deadlineType: "fixed", fixedDate: "04-01", fee: 300 },
  "Texas": { state: "Texas", deadlineType: "fixed", fixedDate: "05-15", fee: 0, notes: "Franchise tax report" },
  "Utah": { state: "Utah", deadlineType: "anniversary", fee: 18 },
  "Vermont": { state: "Vermont", deadlineType: "anniversary", fee: 35 },
  "Virginia": { state: "Virginia", deadlineType: "anniversary", fee: 50 },
  "Washington": { state: "Washington", deadlineType: "anniversary", fee: 60 },
  "West Virginia": { state: "West Virginia", deadlineType: "fixed", fixedDate: "07-01", fee: 25 },
  "Wisconsin": { state: "Wisconsin", deadlineType: "quarterly", quarterlyMonths: [3, 6, 9, 12], fee: 25 },
  "Wyoming": { state: "Wyoming", deadlineType: "anniversary", fee: 60, notes: "Due first day of anniversary month" },
}

export function calculateNextDueDate(
  state: string,
  formationDate: Date | string
): { dueDate: Date; daysUntil: number } | null {
  const info = STATE_ANNUAL_REPORT_DEADLINES[state]
  if (!info) return null

  const formation = new Date(formationDate)
  const now = new Date()
  let dueDate: Date

  switch (info.deadlineType) {
    case "fixed":
      if (info.fixedDate) {
        const [month, day] = info.fixedDate.split("-").map(Number)
        dueDate = new Date(now.getFullYear(), month - 1, day)
        // If the date has passed this year, use next year
        if (dueDate < now) {
          dueDate = new Date(now.getFullYear() + 1, month - 1, day)
        }
      } else {
        return null
      }
      break

    case "anniversary":
      const anniversaryMonth = formation.getMonth()
      const anniversaryDay = formation.getDate()
      dueDate = new Date(now.getFullYear(), anniversaryMonth, anniversaryDay)
      // If the anniversary has passed this year, use next year
      if (dueDate < now) {
        dueDate = new Date(now.getFullYear() + 1, anniversaryMonth, anniversaryDay)
      }
      break

    case "quarterly":
      if (info.quarterlyMonths && info.quarterlyMonths.length > 0) {
        const currentMonth = now.getMonth() + 1
        const nextQuarterMonth = info.quarterlyMonths.find(m => m > currentMonth) || info.quarterlyMonths[0]
        const year = nextQuarterMonth <= currentMonth ? now.getFullYear() + 1 : now.getFullYear()
        dueDate = new Date(year, nextQuarterMonth - 1, 1) // First day of quarter month
      } else {
        return null
      }
      break

    default:
      return null
  }

  const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  return { dueDate, daysUntil }
}

export function getUrgencyLevel(daysUntil: number): "critical" | "urgent" | "upcoming" | "later" {
  if (daysUntil <= 7) return "critical"
  if (daysUntil <= 30) return "urgent"
  if (daysUntil <= 60) return "upcoming"
  return "later"
}
