# Bulk Milestone Migration Guide

## Overview

The Bulk Milestone Migration feature allows admins to complete milestones for all existing companies without sending notifications. This is useful when introducing new milestones to the system and you want to apply them retroactively to existing companies.

## Use Case: "Company Application Applied" Milestone

When adding the new "Company Application Applied" milestone to your system, you have 150+ existing companies. To complete this milestone for all of them without triggering notifications:

## How to Use

### Step 1: Access the Admin Dashboard
1. Log in as an admin user
2. Navigate to `/admin` (Admin Dashboard)

### Step 2: Find the Bulk Migration Section
The "Bulk Milestone Migration" card is located at the bottom of the admin dashboard, just before the "All Orders Modal" section.

### Step 3: Review the Migration Details
- **Milestone**: Company Application Applied
- **Action**: Complete for all existing companies
- **Notifications**: None will be sent

### Step 4: Confirm and Execute
1. Click the "Run Migration" button
2. A confirmation dialog will appear asking you to confirm
3. Click "Confirm" to proceed with the bulk update
4. The system will display the number of companies updated

## What Happens Behind the Scenes

### The Migration Process

```
POST /api/admin/bulk-milestone-migrate
{
  "milestoneName": "companyApplicationApplied"
}
```

The API endpoint:
1. Validates admin authentication
2. Updates all companies in the database
3. Sets `milestones.companyApplicationApplied = true` for each company
4. **Does NOT** create any notifications
5. Returns the number of companies updated

### Database Changes

```javascript
// Before
{
  _id: ObjectId(...),
  name: "Company A",
  milestones: {
    orderPlaced: true,
    // no companyApplicationApplied
  }
}

// After
{
  _id: ObjectId(...),
  name: "Company A",
  milestones: {
    orderPlaced: true,
    companyApplicationApplied: true  // ← Added
  },
  updatedAt: new Date()
}
```

## Important Notes

### One-Time Operation
- This migration is designed to run **once**
- Running it multiple times is safe but redundant
- It updates all companies that don't already have the milestone

### No Notifications
- Unlike the normal milestone toggle UI, this operation does **not** trigger notification creation
- Existing notifications are not affected
- Subsequent milestone toggles will work normally with notifications

### Audit Trail
- Migration timestamp is logged in the response
- All updates include an `updatedAt` timestamp
- Check server logs for migration confirmation

## Troubleshooting

### "Unauthorized" Error
- Ensure you're logged in as an admin user
- Check that your session is valid

### "Failed to bulk migrate milestone" Error
- Check server logs for detailed error messages
- Verify database connection is healthy
- Ensure the milestone name is correct

### Partial Update
If the operation is interrupted:
- It's safe to run again
- Already-updated companies will have the milestone set (no duplicates)
- Check the response count to verify completion

## After Migration

### Testing
1. Visit an admin order detail page
2. The milestone should show as "completed"
3. Toggling it off should create a notification (normal behavior)
4. Toggling it on again should create a new notification (normal behavior)

### New Companies
- New companies created after migration will not have the milestone completed
- You'll need to manually complete it or create a different migration for new companies
- Or modify the company creation logic to include the milestone

## Creating Additional Migrations

To create similar migrations for other milestones:

1. Update the component props in `/app/admin/page.tsx`:
```tsx
<BulkMilestoneMigration
  milestoneName="yourNewMilestoneName"
  milestoneTitle="Your New Milestone Title"
  description="Description of what this migration does"
/>
```

2. The API endpoint is already generic and handles any milestone name

## API Reference

### Bulk Migration Endpoint

**Endpoint**: `POST /api/admin/bulk-milestone-migrate`

**Authentication**: Admin only (verified via `verifyAdminAuth`)

**Request Body**:
```json
{
  "milestoneName": "companyApplicationApplied"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Successfully updated 142 companies",
  "milestoneName": "companyApplicationApplied",
  "modifiedCount": 142,
  "timestamp": "2024-07-08T15:30:45.123Z"
}
```

**Error Response**:
```json
{
  "error": "Failed to bulk migrate milestone",
  "details": "Connection timeout"
}
```

## Security Considerations

1. **Admin-Only**: The endpoint requires admin authentication
2. **Confirmation**: The UI requires user confirmation before execution
3. **No Notification Spam**: Bulk operations don't create notifications, preventing email/alert spam
4. **Logged**: All operations are timestamped and logged

## Reverting a Migration

If you need to revert a migration:

1. Use MongoDB directly or your database management tool
2. Set `milestones.companyApplicationApplied` back to `false` or remove the field
3. Or set all affected documents to have `milestones.companyApplicationApplied: false`

**Manual Revert (MongoDB)**:
```javascript
db.companies.updateMany(
  { "milestones.companyApplicationApplied": true },
  { $set: { "milestones.companyApplicationApplied": false } }
)
```

## Questions?

Refer to:
- `/app/api/admin/bulk-milestone-migrate/route.ts` - API implementation
- `/components/admin/bulk-milestone-migration.tsx` - UI component
- `/app/admin/page.tsx` - Integration point
