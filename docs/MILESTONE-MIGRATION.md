# Company Application Milestone Migration Guide

## Overview

This guide explains how to safely backfill the new "Company Application Applied" milestone for 150+ existing companies without triggering customer notifications.

## The Problem

When a new milestone is added to the system, you don't want to send notifications to customers for milestones that happened in the past. The notification system is designed to alert customers when something happens, not when historical data is updated.

## The Solution

We've created three ways to perform this migration, each with increasing levels of control:

---

## Method 1: Admin Dashboard UI (Recommended)

The easiest and safest way for most users.

### Steps:

1. **Log in to Admin Dashboard**
   - Navigate to `/admin/security`
   - Scroll down to "Data Migrations" section

2. **Locate the Migration Card**
   - Find "Migrate Company Application Milestone" card
   - Read the description to understand what will happen

3. **Run the Migration**
   - Click "Run Migration Now"
   - Confirm the dialog asking for permission
   - Monitor the results

4. **Verify Success**
   - You'll see a success message with:
     - Number of companies updated
     - Number of companies matched
     - Timestamp of completion

### Benefits:
- ✅ No technical knowledge required
- ✅ Visual feedback and confirmation
- ✅ Built-in safety checks
- ✅ Shows detailed results

---

## Method 2: API Endpoint

For programmatic or scripted migrations.

### Request:

```bash
curl -X POST http://localhost:3000/api/admin/migration/company-application-milestone \
  -H "Content-Type: application/json" \
  -d '{"confirm": true}'
```

### With Authorization (if INTERNAL_API_SECRET is set):

```bash
curl -X POST http://localhost:3000/api/admin/migration/company-application-milestone \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_INTERNAL_API_SECRET" \
  -d '{"confirm": true}'
```

### Response:

```json
{
  "success": true,
  "message": "Migration completed successfully",
  "stats": {
    "modifiedCount": 150,
    "matchedCount": 165,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### Error Response:

```json
{
  "error": "Confirmation required. Send { confirm: true } in request body."
}
```

### Benefits:
- 🔧 Programmatic integration
- 📊 Structured response for parsing
- 🔒 Optional secret-based authentication
- 🔄 Can be integrated into automation

---

## Method 3: Direct Migration Script

For full control and debugging.

### Run the Script:

```bash
npx ts-node scripts/migrate-company-application-milestone.ts
```

### What It Does:

1. Connects to the database
2. Finds all companies without the milestone or with `companyApplicationApplied` undefined
3. Updates them silently (NO notifications)
4. Reports results to console

### Console Output:

```
[Migration] Starting Company Application Milestone migration...
[Migration] Updated 150 companies
[Migration] Matched 165 companies
[Migration] ✓ Migration completed successfully!
[Migration] All existing companies now have companyApplicationApplied milestone set to true
```

### Benefits:
- 🎯 Direct database access
- 📝 Detailed console logging
- 🛠️ Great for debugging
- 💾 Can be added to deployment scripts

---

## Important Notes

### No Notifications Sent

✅ **This migration will NOT:**
- Send emails to customers
- Create customer notifications
- Trigger any notification webhooks
- Update notification counters

### Idempotent Operation

✅ **Safe to run multiple times:**
- Only updates companies that don't have the milestone
- Won't overwrite existing milestone data
- Can be run repeatedly without issues

### Before and After

**Before migration:**
```javascript
{
  "company": {
    "name": "Acme Corp",
    "milestones": {
      "orderSuccessfullyProcessed": true,
      "registeredAgentAssigned": true,
      "businessMailingAddressIssued": true,
      // companyApplicationApplied is MISSING
      "companyFormationCompleted": true,
      "einApplicationSubmitted": true,
      "einObtained": true
    }
  }
}
```

**After migration:**
```javascript
{
  "company": {
    "name": "Acme Corp",
    "milestones": {
      "orderSuccessfullyProcessed": true,
      "registeredAgentAssigned": true,
      "businessMailingAddressIssued": true,
      "companyApplicationApplied": true,  // ← NOW ADDED
      "companyFormationCompleted": true,
      "einApplicationSubmitted": true,
      "einObtained": true
    }
  }
}
```

---

## Troubleshooting

### Migration Doesn't Show Results

**Problem:** Running the migration but not seeing updates

**Solution:**
1. Check that `INTERNAL_API_SECRET` is properly set (if required)
2. Verify database connection
3. Check database permissions
4. Review server logs for errors

### Only Some Companies Updated

**Problem:** Expected 150 companies but only 100 were updated

**Possible Causes:**
- Some companies already have the milestone from a previous run
- Some companies don't have milestones object at all
- Run the migration again to catch the rest

**Solution:** This is expected! Run again:
```bash
npx ts-node scripts/migrate-company-application-milestone.ts
```

### API Returns 401 Unauthorized

**Problem:** Getting 401 errors when calling the API endpoint

**Solution:**
1. If `INTERNAL_API_SECRET` is set, you must include it:
   ```bash
   Authorization: Bearer YOUR_INTERNAL_API_SECRET
   ```
2. If not set, the endpoint is open (for development)
3. Check your environment variables

---

## Rollback (If Needed)

If you need to revert the migration:

```javascript
// MongoDB command
db.companies.updateMany(
  { "milestones.companyApplicationApplied": true },
  { $unset: { "milestones.companyApplicationApplied": "" } }
)
```

Or delete it completely:
```javascript
db.companies.updateMany(
  { "milestones.companyApplicationApplied": { $exists: true } },
  { $unset: { "milestones.companyApplicationApplied": 1 } }
)
```

---

## After Migration

### Verify the Migration

Check that companies are updated:

```bash
# Check one company
curl http://localhost:3000/api/companies/{companyId}

# Response should include:
{
  "milestones": {
    "companyApplicationApplied": true,
    ...
  }
}
```

### New Orders Automatically Included

Going forward, all NEW orders will automatically have all milestones initialized (including `companyApplicationApplied`) when created, so no further action is needed.

### Notifications Work Normally

After the migration:
- New milestone updates will trigger notifications as expected
- Customers won't see notifications for this backfilled milestone
- The system works normally going forward

---

## FAQ

**Q: Will customers see notifications about the migration?**
A: No, this migration is completely silent. No emails or notifications are sent.

**Q: What if I run the migration twice?**
A: It's safe! The second run will only update companies that don't already have the milestone, so nothing will be duplicated or overwritten.

**Q: How long does the migration take?**
A: With 150+ companies, typically 1-5 seconds depending on database performance.

**Q: Can I schedule this to run later?**
A: Yes! You can add it to a cron job or scheduled task using Method 2 or Method 3.

**Q: What's the difference between the three methods?**
A: 
- **Method 1 (UI):** Best for one-time manual runs
- **Method 2 (API):** Best for integration with other systems
- **Method 3 (Script):** Best for deployment pipelines

---

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review server logs for errors
3. Verify database connection
4. Ensure proper permissions and authentication
5. Contact your database administrator if issues persist
