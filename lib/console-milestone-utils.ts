/**
 * Milestone Console Utilities
 * Paste these functions in browser console for milestone management
 */

// 1. RUN MIGRATION - Silently update all 150+ companies with new milestone
export async function runMilestoneMigration() {
  console.log('[Milestone] Starting migration...')
  try {
    const response = await fetch('/api/admin/migrate-milestone-now', {
      method: 'POST',
      headers: { 
        'Authorization': 'Bearer admin',
        'Content-Type': 'application/json'
      }
    })
    const data = await response.json()
    console.log('[Milestone] Migration Complete:', data)
    console.log(`✓ Updated ${data.stats.modified} companies`)
    console.log(`✓ Already had milestone: ${data.stats.existing}`)
    console.log(`✓ Total companies: ${data.stats.total}`)
    return data
  } catch (error) {
    console.error('[Milestone] Migration failed:', error)
  }
}

// 2. FETCH COMPANY MILESTONES - Get milestone data for a specific company
export async function getCompanyMilestones(companyId: string) {
  console.log(`[Milestone] Fetching milestones for company: ${companyId}`)
  try {
    const response = await fetch(`/api/companies/${companyId}`)
    const company = await response.json()
    console.log('[Milestone] Company Milestones:', company.milestones)
    
    // Pretty print milestones
    console.table(company.milestones)
    
    return company.milestones
  } catch (error) {
    console.error('[Milestone] Fetch failed:', error)
  }
}

// 3. CHECK MILESTONE STATUS - See if a specific milestone is completed
export async function checkMilestoneStatus(companyId: string, milestoneName: string) {
  console.log(`[Milestone] Checking ${milestoneName} for company ${companyId}`)
  try {
    const response = await fetch(`/api/companies/${companyId}`)
    const company = await response.json()
    
    const milestone = company.milestones?.[milestoneName]
    const status = milestone ? 'COMPLETED ✓' : 'NOT COMPLETED ✗'
    
    console.log(`[Milestone] ${milestoneName}: ${status}`)
    console.log('Details:', milestone)
    
    return milestone
  } catch (error) {
    console.error('[Milestone] Check failed:', error)
  }
}

// 4. GET ALL MILESTONES STATS - Overview of all milestones across all companies
export async function getAllMilestonesStats() {
  console.log('[Milestone] Fetching all companies...')
  try {
    const response = await fetch('/api/companies')
    const companies = await response.json()
    
    const stats = {
      totalCompanies: companies.length,
      orderProcessingStarted: 0,
      registeredAgentAssigned: 0,
      businessMailingAddressIssued: 0,
      companyApplicationApplied: 0,
      companyFormationCompleted: 0,
      einApplicationSubmitted: 0,
      einObtained: 0,
      details: {}
    }
    
    companies.forEach(company => {
      if (!stats.details[company.id]) {
        stats.details[company.id] = { name: company.name, milestones: {} }
      }
      
      if (company.milestones?.orderSuccessfullyProcessed) stats.orderProcessingStarted++
      if (company.milestones?.registeredAgentAssigned) stats.registeredAgentAssigned++
      if (company.milestones?.businessMailingAddressIssued) stats.businessMailingAddressIssued++
      if (company.milestones?.companyApplicationApplied) stats.companyApplicationApplied++
      if (company.milestones?.companyFormationCompleted) stats.companyFormationCompleted++
      if (company.milestones?.einApplicationSubmitted) stats.einApplicationSubmitted++
      if (company.milestones?.einObtained) stats.einObtained++
      
      stats.details[company.id].milestones = company.milestones
    })
    
    console.log('[Milestone] Global Statistics:')
    console.table({
      'Order Processing Started': stats.orderProcessingStarted,
      'Registered Agent Assigned': stats.registeredAgentAssigned,
      'Business Mailing Address': stats.businessMailingAddressIssued,
      'Company Application Applied': stats.companyApplicationApplied,
      'Company Formation Completed': stats.companyFormationCompleted,
      'EIN Application Submitted': stats.einApplicationSubmitted,
      'EIN Obtained': stats.einObtained,
      'Total Companies': stats.totalCompanies
    })
    
    return stats
  } catch (error) {
    console.error('[Milestone] Stats fetch failed:', error)
  }
}

// 5. TOGGLE MILESTONE - Manually toggle a milestone for testing
export async function toggleMilestone(companyId: string, milestoneName: string) {
  console.log(`[Milestone] Toggling ${milestoneName} for company ${companyId}`)
  try {
    const response = await fetch(`/api/companies/${companyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        milestones: {
          [milestoneName]: true
        }
      })
    })
    const data = await response.json()
    console.log('[Milestone] Toggle Complete:', data)
    return data
  } catch (error) {
    console.error('[Milestone] Toggle failed:', error)
  }
}

// 6. VIEW MILESTONE TIMELINE - See when each milestone was completed
export async function getMilestoneTimeline(companyId: string) {
  console.log(`[Milestone] Fetching timeline for company ${companyId}`)
  try {
    const response = await fetch(`/api/companies/${companyId}`)
    const company = await response.json()
    
    const timeline = []
    const milestones = company.milestones || {}
    
    Object.entries(milestones).forEach(([name, data]: [string, any]) => {
      if (data) {
        timeline.push({
          milestone: name,
          completedAt: data.completedAt || 'N/A',
          notifiedAt: data.notifiedAt || 'N/A'
        })
      }
    })
    
    console.log('[Milestone] Timeline:')
    console.table(timeline)
    return timeline
  } catch (error) {
    console.error('[Milestone] Timeline fetch failed:', error)
  }
}

// 7. EXPORT TO CSV - Download all milestone data as CSV
export async function exportMilestonesToCSV() {
  console.log('[Milestone] Exporting to CSV...')
  try {
    const response = await fetch('/api/companies')
    const companies = await response.json()
    
    let csv = 'Company ID,Company Name,Order Processing,Agent Assigned,Address Issued,Application Applied,Formation Complete,EIN Application,EIN Obtained\n'
    
    companies.forEach(company => {
      const m = company.milestones || {}
      csv += `"${company.id}","${company.name}",${m.orderSuccessfullyProcessed ? '✓' : ''},${m.registeredAgentAssigned ? '✓' : ''},${m.businessMailingAddressIssued ? '✓' : ''},${m.companyApplicationApplied ? '✓' : ''},${m.companyFormationCompleted ? '✓' : ''},${m.einApplicationSubmitted ? '✓' : ''},${m.einObtained ? '✓' : ''}\n`
    })
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `milestones-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    
    console.log('[Milestone] CSV exported successfully')
  } catch (error) {
    console.error('[Milestone] Export failed:', error)
  }
}

// Print help menu
export function milestoneHelp() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                   MILESTONE CONSOLE UTILITIES                 ║
╚════════════════════════════════════════════════════════════════╝

AVAILABLE FUNCTIONS:

1. runMilestoneMigration()
   → Run silent migration for all 150+ companies
   → Updates companyApplicationApplied milestone

2. getCompanyMilestones(companyId)
   → Fetch all milestones for a specific company
   → Example: getCompanyMilestones('12345')

3. checkMilestoneStatus(companyId, milestoneName)
   → Check if specific milestone is completed
   → Example: checkMilestoneStatus('12345', 'companyApplicationApplied')

4. getAllMilestonesStats()
   → Get overview stats for all milestones across all companies
   → Shows completion counts for each milestone

5. toggleMilestone(companyId, milestoneName)
   → Manually toggle a milestone (for testing)
   → Example: toggleMilestone('12345', 'companyApplicationApplied')

6. getMilestoneTimeline(companyId)
   → View when each milestone was completed
   → Shows completion and notification timestamps

7. exportMilestonesToCSV()
   → Download all milestone data as CSV file
   → Useful for reports and analysis

8. milestoneHelp()
   → Show this help menu

EXAMPLES:

// Run the migration
await runMilestoneMigration()

// Check status of a company
await getCompanyMilestones('company-id-here')

// Get global stats
await getAllMilestonesStats()

// Export data
await exportMilestonesToCSV()
  `)
}

// Initialize - print help on load
console.log('Milestone utilities loaded. Type milestoneHelp() for commands.')
