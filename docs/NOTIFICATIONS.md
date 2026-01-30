# Admin Notifications System

## Overview

The Admin Notifications System enables administrators to send browser notifications to users' devices with permission management. This system includes:

- **Browser Notification Permission Handling**: Request and manage user permissions
- **Multiple Notification Types**: Success, Error, Warning, and Info
- **Notification Service**: Centralized utility for managing notifications
- **Admin Dashboard**: User-friendly interface to send and track notifications

## Features

### 1. Permission Management
- Request notification permissions from users
- Display current permission status
- Handle denied/granted states gracefully
- Browser compatibility checks

### 2. Notification Types
- **Success**: Green notifications for successful operations
- **Error**: Red notifications for errors (requires interaction by default)
- **Warning**: Yellow notifications for warnings
- **Info**: Blue notifications for general information

### 3. Notification Service API
Located at: `/lib/notification-service.ts`

#### Key Methods:

```typescript
// Check if browser supports notifications
NotificationService.isSupported(): boolean

// Get current permission status
NotificationService.getPermissionStatus(): NotificationPermission | null

// Request permission from user
await NotificationService.requestPermission(): Promise<NotificationPermission>

// Show notification with options
await NotificationService.show(options: NotificationOptions): Promise<Notification | null>

// Quick notification helpers
await NotificationService.success(title, message, duration)
await NotificationService.error(title, message, requiresInteraction)
await NotificationService.warning(title, message, duration)
await NotificationService.info(title, message, duration)
```

### 4. Admin Notifications Page
Located at: `/app/admin/notifications/page.tsx`

Features:
- View and manage notification permissions
- Send notifications with custom title, message, and type
- Send to specific users or broadcast to all
- View recent notifications with statistics
- Real-time permission status display
- Test notification sending

## Usage

### In Components

```typescript
import { NotificationService } from "@/lib/notification-service"

// Check support
if (NotificationService.isSupported()) {
  // Request permission (if not already granted)
  const permission = await NotificationService.requestPermission()
  
  if (permission === "granted") {
    // Show notification
    await NotificationService.success("Success", "Operation completed!", 3000)
  }
}
```

### Sending Notifications from Admin

1. Navigate to `/admin/notifications`
2. Click "Enable Notifications" to request browser permission
3. Fill in notification details:
   - **Title**: Notification title
   - **Message**: Notification content
   - **Type**: Success, Error, Warning, or Info
   - **Recipient** (optional): User ID for targeted notification, leave empty to broadcast
4. Click "Send Notification"
5. The notification will appear on the admin's device and be sent to the server

## API Endpoints

### Send Notification
**POST** `/api/admin/notifications/send`

Request:
```json
{
  "title": "Order Confirmed",
  "message": "Your order has been confirmed",
  "type": "success",
  "userId": "user123" // optional
}
```

Response:
```json
{
  "success": true,
  "notification": {
    "id": "notif_123",
    "title": "Order Confirmed",
    "message": "Your order has been confirmed",
    "type": "success",
    "createdAt": "2024-01-31T10:30:00Z",
    "read": false
  }
}
```

### Get Notifications
**GET** `/api/admin/notifications/send`

Response:
```json
{
  "success": true,
  "notifications": [
    {
      "id": "notif_001",
      "title": "New Order",
      "message": "A new order has been placed",
      "type": "success",
      "createdAt": "2024-01-31T10:30:00Z",
      "read": false
    }
  ]
}
```

## Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ | Full support |
| Firefox | ✅ | Full support |
| Safari | ⚠️ | Limited support (macOS only) |
| Edge | ✅ | Full support |
| Opera | ✅ | Full support |
| IE | ❌ | Not supported |

## Permission Flow

```
User Visits App
    ↓
Check Permission Status
    ├─ "granted" → Show notifications
    ├─ "denied" → Disable notifications
    └─ "default" → Show permission request
         ↓
    User clicks "Enable Notifications"
         ↓
    Browser shows permission dialog
         ↓
    User accepts/denies
         ↓
    Status updates to "granted" or "denied"
```

## Notification Options

```typescript
interface NotificationOptions {
  title: string              // Required: Notification title
  message: string            // Required: Notification content
  type?: NotificationType    // Optional: success, error, warning, info (default: info)
  userId?: string            // Optional: Recipient user ID
  duration?: number          // Optional: Auto-close duration in ms
  icon?: string              // Optional: Custom icon URL
  badge?: string             // Optional: Badge image URL
  tag?: string               // Optional: Notification tag for grouping
  requiresInteraction?: boolean  // Optional: Force user to interact
}
```

## Example Usage in Different Scenarios

### Success Notification
```typescript
await NotificationService.success(
  "Order Confirmed",
  "Your order #12345 has been confirmed and will be shipped soon",
  4000
)
```

### Error Notification
```typescript
await NotificationService.error(
  "Payment Failed",
  "Your payment could not be processed. Please try again."
)
```

### Warning Notification
```typescript
await NotificationService.warning(
  "Low Balance",
  "Your account balance is running low",
  5000
)
```

### Custom Notification
```typescript
await NotificationService.show({
  title: "New Message",
  message: "You have a new message from support",
  type: "info",
  duration: 6000,
  requiresInteraction: false,
  tag: "messages"
})
```

## Security Considerations

1. **Authentication**: All notification endpoints require admin authentication
2. **Authorization**: Only admin users can send notifications
3. **Input Validation**: Titles and messages are validated on the server
4. **Token Management**: Uses JWT tokens from auth service
5. **HTTPS Only**: Browser notifications require HTTPS

## Troubleshooting

### Notifications not appearing
- Check browser permission status
- Ensure HTTPS is being used
- Verify browser supports notifications
- Check browser notification settings

### Permission stuck on "denied"
- Clear browser data for the site
- Check browser settings → Notifications
- Try from a private/incognito window

### API returns 401/403
- Verify authentication token is valid
- Ensure user has admin role
- Check token expiration

## Future Enhancements

- [ ] Scheduled notifications
- [ ] Notification templates
- [ ] Rich media in notifications
- [ ] User notification preferences
- [ ] Notification history/archive
- [ ] Analytics and metrics
- [ ] SMS/Email fallback
- [ ] Notification grouping
- [ ] Priority levels
- [ ] Expiration times

## Files Modified/Created

- **Created**: `/lib/notification-service.ts` - Notification utility service
- **Created**: `/app/api/admin/notifications/send/route.ts` - Notification API
- **Created**: `/app/admin/notifications/page.tsx` - Admin notifications interface
- **Created**: `/app/admin/notifications/loading.tsx` - Loading state
- **Modified**: `/components/admin/admin-shell.tsx` - Added notifications nav link

## Support

For issues or questions about the notification system, contact the development team or open an issue in the repository.
