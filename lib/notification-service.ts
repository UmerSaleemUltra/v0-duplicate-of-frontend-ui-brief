/**
 * Notification Service - Handles browser notifications with permission management
 */

export type NotificationType = "success" | "error" | "warning" | "info"

export interface NotificationOptions {
  title: string
  message: string
  type?: NotificationType
  userId?: string
  duration?: number
  icon?: string
  badge?: string
  tag?: string
  requiresInteraction?: boolean
}

export class NotificationService {
  /**
   * Check if the browser supports notifications
   */
  static isSupported(): boolean {
    return typeof window !== "undefined" && "Notification" in window
  }

  /**
   * Get current notification permission status
   */
  static getPermissionStatus(): NotificationPermission | null {
    if (!this.isSupported()) return null
    return Notification.permission
  }

  /**
   * Request notification permission from user
   */
  static async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error("Notifications are not supported in this browser")
    }

    if (Notification.permission === "granted") {
      return "granted"
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission()
      return permission
    }

    return "denied"
  }

  /**
   * Show a browser notification
   */
  static async show(options: NotificationOptions): Promise<Notification | null> {
    if (!this.isSupported()) {
      console.warn("Notifications are not supported in this browser")
      return null
    }

    try {
      // Request permission if not already granted
      if (Notification.permission === "default") {
        await this.requestPermission()
      }

      if (Notification.permission !== "granted") {
        console.warn("Notification permission not granted")
        return null
      }

      const {
        title,
        message,
        type = "info",
        icon,
        badge,
        tag,
        requiresInteraction = false,
      } = options

      const notificationOptions: NotificationOptions & { body?: string } = {
        title,
        message,
        type,
        body: message,
        icon: icon || this.getIconForType(type),
        badge: badge || "/icon-light-32x32.png",
        tag: tag || `notification-${Date.now()}`,
        requiresInteraction,
      }

      const notification = new Notification(title, notificationOptions as NotificationInit)

      // Auto-close notification if specified
      if (options.duration) {
        setTimeout(() => {
          notification.close()
        }, options.duration)
      }

      // Handle click
      notification.onclick = () => {
        window.focus()
        notification.close()
      }

      return notification
    } catch (error) {
      console.error("Error showing notification:", error)
      return null
    }
  }

  /**
   * Show success notification
   */
  static success(title: string, message: string, duration = 4000): Promise<Notification | null> {
    return this.show({
      title,
      message,
      type: "success",
      duration,
    })
  }

  /**
   * Show error notification
   */
  static error(title: string, message: string, requiresInteraction = true): Promise<Notification | null> {
    return this.show({
      title,
      message,
      type: "error",
      requiresInteraction,
    })
  }

  /**
   * Show warning notification
   */
  static warning(title: string, message: string, duration = 5000): Promise<Notification | null> {
    return this.show({
      title,
      message,
      type: "warning",
      duration,
    })
  }

  /**
   * Show info notification
   */
  static info(title: string, message: string, duration = 3000): Promise<Notification | null> {
    return this.show({
      title,
      message,
      type: "info",
      duration,
    })
  }

  /**
   * Get icon for notification type
   */
  private static getIconForType(type: NotificationType): string {
    const icons: Record<NotificationType, string> = {
      success: "✓",
      error: "✕",
      warning: "⚠",
      info: "ℹ",
    }
    return icons[type]
  }

  /**
   * Close all notifications with a specific tag
   */
  static closeByTag(tag: string): void {
    if (!this.isSupported()) return
    // Note: We can't directly close notifications in all browsers,
    // but this method can be used to manage them on the application side
  }

  /**
   * Clear all notifications
   */
  static clearAll(): void {
    if (!this.isSupported()) return
    // This would need a reference to all active notifications
  }
}
