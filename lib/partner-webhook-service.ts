// Webhook system for notifying partners of checkout events

import { db } from "@/lib/db"
import { PartnerWebhookManager, PartnerApiKeyManager } from "@/lib/partner-api"

interface WebhookEvent {
  event: "checkout.completed" | "checkout.abandoned" | "payment.received"
  data: {
    checkoutSessionId?: string
    orderId?: string
    customerId?: string
    partnerId: string
    email: string
    businessName: string
    packageType: string
    addons: string[]
    amount: number
    status: string
    customData?: Record<string, any>
  }
}

class PartnerWebhookService {
  /**
   * Send webhook notification to partner when checkout completes
   */
  static async notifyCheckoutCompleted(
    partnerId: string,
    orderData: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get partner details
      const partner = await db.collection("partners").findOne({
        _id: partnerId,
      })

      if (!partner || !partner.webhookUrl) {
        console.log(`[v0] No webhook URL for partner ${partnerId}`)
        return { success: false, error: "No webhook URL configured" }
      }

      // Prepare webhook payload
      const payload: WebhookEvent = {
        event: "checkout.completed",
        data: {
          checkoutSessionId: orderData.checkoutSessionId,
          orderId: orderData.id,
          customerId: orderData.customerId,
          partnerId,
          email: orderData.email,
          businessName: orderData.businessName,
          packageType: orderData.packageType,
          addons: orderData.addons || [],
          amount: orderData.amount,
          status: orderData.status,
          customData: orderData.customData,
        },
      }

      // Send webhook with retry logic
      const result = await this.sendWithRetry(
        partner.webhookUrl,
        payload,
        partner.webhookSecret || "",
        3 // max retries
      )

      // Store webhook event for audit
      if (result.success) {
        await db.collection("webhookEvents").insertOne({
          partnerId,
          orderId: orderData.id,
          event: "checkout.completed",
          status: "delivered",
          sentAt: new Date(),
          payload,
        })
      } else {
        // Store failed webhook for retry
        await db.collection("webhookEvents").insertOne({
          partnerId,
          orderId: orderData.id,
          event: "checkout.completed",
          status: "failed",
          error: result.error,
          sentAt: new Date(),
          payload,
          retryCount: 0,
        })
      }

      return result
    } catch (error) {
      console.error("[v0] Webhook notification error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  /**
   * Notify partner when checkout is abandoned
   */
  static async notifyCheckoutAbandoned(
    partnerId: string,
    sessionData: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const partner = await db.collection("partners").findOne({
        _id: partnerId,
      })

      if (!partner || !partner.webhookUrl) {
        return { success: false, error: "No webhook URL configured" }
      }

      const payload: WebhookEvent = {
        event: "checkout.abandoned",
        data: {
          checkoutSessionId: sessionData.id,
          partnerId,
          email: sessionData.email,
          businessName: sessionData.businessName,
          packageType: sessionData.packageType,
          addons: sessionData.addons || [],
          amount: 0,
          status: "abandoned",
          customData: sessionData.customData,
        },
      }

      const result = await this.sendWithRetry(
        partner.webhookUrl,
        payload,
        partner.webhookSecret || "",
        2
      )

      await db.collection("webhookEvents").insertOne({
        partnerId,
        event: "checkout.abandoned",
        status: result.success ? "delivered" : "failed",
        error: result.error,
        sentAt: new Date(),
        payload,
      })

      return result
    } catch (error) {
      console.error("[v0] Abandoned checkout notification error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  /**
   * Send webhook with exponential backoff retry
   */
  private static async sendWithRetry(
    webhookUrl: string,
    payload: any,
    secret: string,
    maxRetries: number
  ): Promise<{ success: boolean; error?: string }> {
    let lastError: string | undefined

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await PartnerWebhookManager.sendWebhook(
          webhookUrl,
          payload,
          secret
        )

        if (result.success) {
          console.log(`[v0] Webhook sent successfully on attempt ${attempt + 1}`)
          return result
        }

        lastError = result.error
      } catch (error) {
        lastError = error instanceof Error ? error.message : "Unknown error"
      }

      // Exponential backoff: 1s, 2s, 4s, 8s
      if (attempt < maxRetries) {
        const delayMs = Math.pow(2, attempt) * 1000
        console.log(
          `[v0] Webhook retry attempt ${attempt + 1}/${maxRetries} in ${delayMs}ms`
        )
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }

    return {
      success: false,
      error: `Failed after ${maxRetries + 1} attempts: ${lastError}`,
    }
  }

  /**
   * Process failed webhooks and retry
   */
  static async retryFailedWebhooks(): Promise<void> {
    try {
      const failedWebhooks = await db
        .collection("webhookEvents")
        .find({
          status: "failed",
          retryCount: { $lt: 3 },
          sentAt: {
            $lt: new Date(Date.now() - 5 * 60 * 1000), // Retry after 5 minutes
          },
        })
        .toArray()

      for (const webhook of failedWebhooks) {
        const partner = await db.collection("partners").findOne({
          _id: webhook.partnerId,
        })

        if (!partner || !partner.webhookUrl) continue

        const result = await PartnerWebhookManager.sendWebhook(
          partner.webhookUrl,
          webhook.payload,
          partner.webhookSecret || ""
        )

        if (result.success) {
          await db.collection("webhookEvents").updateOne(
            { _id: webhook._id },
            {
              $set: {
                status: "delivered",
                deliveredAt: new Date(),
              },
            }
          )
        } else {
          await db.collection("webhookEvents").updateOne(
            { _id: webhook._id },
            {
              $inc: { retryCount: 1 },
              $set: { error: result.error, lastRetryAt: new Date() },
            }
          )
        }
      }
    } catch (error) {
      console.error("[v0] Failed webhook retry error:", error)
    }
  }
}

export default PartnerWebhookService
