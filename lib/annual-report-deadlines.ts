// Annual Report Deadlines by State
// Format: { state: { month: number (1-12), dayOrRule: string, frequency: string, fee: number } }
// dayOrRule can be a specific day or a rule like "anniversary", "end-of-month", "quarter"

export interface StateDeadline {
  month: number | "anniversary" | "quarter"
  dayOrRule: string
  frequency: string
  fee: number
  notes?: string
}

export const STATE_ANNUAL_REPORT_DEADLINES: Record<string, StateDeadline> = {
  "Alabama": { month: 4, dayOrRule: "15", frequency: "annual", fee: 100, notes: "Due April 15" },
  "Alaska": { month: 1, dayOrRule: "2", frequency: "biennial", fee: 100, notes: "Due January 2, every 2 years" },
  "Arizona": { month: "anniversary", dayOrRule: "anniversary", frequency: "annual", fee: 45, notes: "Due on anniversary of formation" },
  "Arkansas": { month: 5, dayOrRule: "1", frequency: "annual", fee: 150, notes: "Due May 1" },
  "California": { month: "anniversary", dayOrRule: "anniversary", frequency: "annual", fee: 25, notes: "Due on anniversary of formation" },
  "Colorado": { month: "anniversary", dayOrRule: "anniversary", frequency: "annual", fee: 10, notes: "Due in anniversary month" },
  "Connecticut": { month: "anniversary", dayOrRule: "anniversary", frequency: "annual", fee: 80, notes: "Due on anniversary of formation" },
  "Delaware": { month: 3, dayOrRule: "1", frequency: "annual", fee: 300, notes: "Due March 1" },
  "Florida": { month: 5, dayOrRule: "1", frequency: "annual", fee: 138.75, notes: "Due May 1" },
  "Georgia": { month: 4, dayOrRule: "1", frequency: "annual", fee: 50, notes: "Due April 1" },
  "Hawaii": { month: "anniversary", dayOrRule: "anniversary", frequency: "annual", fee: 15, notes: "Due on anniversary quarter" },
  "Idaho": { month: "anniversary", dayOrRule: "end-of-month", frequency: "annual", fee: 0, notes: "Due end of anniversary month" },
  "Illinois": { month: "anniversary", dayOrRule: "anniversary", frequency: "annual", fee: 75, notes: "Due in anniversary month" },
  "Indiana": { month: "anniversary", dayOrRule: "anniversary", frequency: "biennial", fee: 32, notes: "Due biennially on anniversary" },
  "Iowa": { month: 4, dayOrRule: "1", frequency: "biennial", fee: 60, notes: "Due April 1, every 2 years" },
  "Kansas": { month: 4, dayOrRule: "15", frequency: "annual", fee: 55, notes: "Due April 15" },
  "Kentucky": { month: 6, dayOrRule: "30", frequency: "annual", fee: 15, notes: "Due June 30" },
  "Louisiana": { month: "anniversary", dayOrRule: "anniversary", frequency: "annual", fee: 35, notes: "Due on anniversary of formation" },
  "Maine": { month: 6, dayOrRule: "1", frequency: "annual", fee: 85, notes: "Due June 1" },
  "Maryland": { month: 4, dayOrRule: "15", frequency: "annual", fee: 300, notes: "Due April 15" },
  "Massachusetts": { month: "anniversary", dayOrRule: "anniversary", frequency: "annual", fee: 500, notes: "Due on anniversary of formation" },
  "Michigan": { month: 2, dayOrRule: "15", frequency: "annual", fee: 25, notes: "Due February 15" },
  "Minnesota": { month: 12, dayOrRule: "31", frequency: "annual", fee: 0, notes: "Due December 31" },
  "Mississippi": { month: 4, dayOrRule: "15", frequency: "annual", fee: 0, notes: "Due April 15" },
  "Missouri": { month: "anniversary", dayOrRule: "anniversary", frequency: "annual", fee: 0, notes: "Due on anniversary of formation" },
  "Montana": { month: 4, dayOrRule: "15", frequency: "annual", fee: 20, notes: "Due April 15" },
  "Nebraska": { month: 4, dayOrRule: "1", frequency: "biennial", fee: 10, notes: "Due April 1, every 2 years" },
  "Nevada": { month: "anniversary", dayOrRule: "last-day", frequency: "annual", fee: 350, notes: "Due last day of anniversary month" },
  "New Hampshire": { month: 4, dayOrRule: "1", frequency: "annual", fee: 100, notes: "Due April 1" },
  "New Jersey": { month: "anniversary", dayOrRule: "anniversary", frequency: "annual", fee: 75, notes: "Due on anniversary of formation" },
  "New Mexico": { month: "anniversary", dayOrRule: "anniversary", frequency: "annual", fee: 0, notes: "Due on anniversary of formation" },
  "New York": { month: "anniversary", dayOrRule: "anniversary", frequency: "biennial", fee: 9, notes: "Due biennially on anniversary" },
  "North Carolina": { month: 4, dayOrRule: "15", frequency: "annual", fee: 200, notes: "Due April 15" },
  "North Dakota": { month: 11, dayOrRule: "15", frequency: "annual", fee: 50, notes: "Due November 15" },
  "Ohio": { month: "anniversary", dayOrRule: "anniversary", frequency: "biennial", fee: 0, notes: "Due biennially on anniversary" },
  "Oklahoma": { month: "anniversary", dayOrRule: "anniversary", frequency: "annual", fee: 25, notes: "Due on anniversary of formation" },
  "Oregon": { month: "anniversary", dayOrRule: "anniversary", frequency: "annual", fee: 100, notes: "Due on anniversary of formation" },
  "Pennsylvania": { month: "anniversary", dayOrRule: "anniversary", frequency: "decennial", fee: 70, notes: "Due every 10 years" },
  "Rhode Island": { month: 11, dayOrRule: "1", frequency: "annual", fee: 50, notes: "Due November 1" },
  "South Carolina": { month: "anniversary", dayOrRule: "anniversary", frequency: "annual", fee: 0, notes: "Due on anniversary of formation" },
  "South Dakota": { month: "anniversary", dayOrRule: "anniversary", frequency: "annual", fee: 50, notes: "Due on anniversary month" },
  "Tennessee": { month: 4, dayOrRule: "1", frequency: "annual", fee: 300, notes: "Due April 1" },
  "Texas": { month: 5, dayOrRule: "15", frequency: "annual", fee: 0, notes: "Due May 15 (Franchise Tax)" },
  "Utah": { month: "anniversary", dayOrRule: "anniversary", frequency: "annual", fee: 18, notes: "Due on anniversary of formation" },
  "Vermont": { month: "anniversary", dayOrRule: "anniversary", frequency: "annual", fee: 35, notes: "Due on anniversary quarter" },
  "Virginia": { month: "anniversary", dayOrRule: "last-day", frequency: "annual", fee: 50, notes: "Due last day of anniversary month" },
  "Washington": { month: "anniversary", dayOrRule: "end-of-month", frequency: "annual", fee: 60, notes: "Due end of anniversary month" },
  "West Virginia": { month: 7, dayOrRule: "1", frequency: "annual", fee: 25, notes: "Due July 1" },
  "Wisconsin": { month: "anniversary", dayOrRule: "anniversary", frequency: "annual", fee: 25, notes: "Due on anniversary quarter" },
  "Wyoming": { month: "anniversary", dayOrRule: "anniversary", frequency: "annual", fee: 60, notes: "Due on anniversary of formation" },
}

// Calculate next due date based on state deadline rules
export function calculateNextDueDate(state: string, formationDate: Date): Date | null {
  const deadline = STATE_ANNUAL_REPORT_DEADLINES[state]
  if (!deadline) return null

  const now = new Date()
  const formation = new Date(formationDate)
  
  if (deadline.month === "anniversary") {
    // Anniversary-based deadline
    const nextDue = new Date(now.getFullYear(), formation.getMonth(), formation.getDate())
    if (nextDue < now) {
      nextDue.setFullYear(nextDue.getFullYear() + 1)
    }
    return nextDue
  } else if (deadline.month === "quarter") {
    // Quarter-based deadline
    const formationMonth = formation.getMonth()
    const quarterMonth = Math.floor(formationMonth / 3) * 3 + 2
    const nextDue = new Date(now.getFullYear(), quarterMonth, 28)
    if (nextDue < now) {
      nextDue.setFullYear(nextDue.getFullYear() + 1)
    }
    return nextDue
  } else {
    // Fixed date deadline
    const month = deadline.month as number - 1 // Convert to 0-indexed
    const day = parseInt(deadline.dayOrRule) || 1
    const nextDue = new Date(now.getFullYear(), month, day)
    if (nextDue < now) {
      nextDue.setFullYear(nextDue.getFullYear() + 1)
    }
    return nextDue
  }
}

// Get days until deadline
export function getDaysUntilDeadline(dueDate: Date): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  const diffTime = due.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}
