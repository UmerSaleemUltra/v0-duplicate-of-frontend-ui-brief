// Package pricing configuration
export const packagePricing = {
  starter: 149,
  advanced: 349,
} as const

// State filing fees
export const stateFees: Record<string, number> = {
  AL: 200, // Alabama
  AK: 250, // Alaska
  AZ: 50, // Arizona
  AR: 45, // Arkansas
  CA: 70, // California
  CO: 50, // Colorado
  CT: 120, // Connecticut
  DE: 90, // Delaware
  FL: 125, // Florida
  GA: 100, // Georgia
  HI: 50, // Hawaii
  ID: 100, // Idaho
  IL: 150, // Illinois
  IN: 95, // Indiana
  IA: 50, // Iowa
  KS: 90, // Kansas
  KY: 40, // Kentucky
  LA: 100, // Louisiana
  ME: 175, // Maine
  MD: 100, // Maryland
  MA: 500, // Massachusetts
  MI: 50, // Michigan
  MN: 135, // Minnesota
  MS: 50, // Mississippi
  MO: 50, // Missouri
  MT: 35, // Montana
  NE: 100, // Nebraska
  NV: 75, // Nevada
  NH: 100, // New Hampshire
  NJ: 125, // New Jersey
  NM: 50, // New Mexico
  NY: 200, // New York
  NC: 125, // North Carolina
  ND: 135, // North Dakota
  OH: 99, // Ohio
  OK: 100, // Oklahoma
  OR: 100, // Oregon
  PA: 125, // Pennsylvania
  RI: 150, // Rhode Island
  SC: 110, // South Carolina
  SD: 150, // South Dakota
  TN: 300, // Tennessee
  TX: 300, // Texas
  UT: 70, // Utah
  VT: 125, // Vermont
  VA: 75, // Virginia
  WA: 200, // Washington
  WV: 100, // West Virginia
  WI: 130, // Wisconsin
  WY: 100, // Wyoming
}

// Helper function to get package price
export function getPackagePrice(packageType: "starter" | "advanced"): number {
  return packagePricing[packageType] || packagePricing.starter
}

// Helper function to get state filing fee
export function getStateFee(state: string): number {
  return stateFees[state] || 100 // Default to $100 if state not found
}

// Calculate total price
export function calculateTotal(packageType: "starter" | "advanced", state: string, addonsTotal = 0): number {
  const packagePrice = getPackagePrice(packageType)
  const stateFee = getStateFee(state)
  return packagePrice + stateFee + addonsTotal
}
