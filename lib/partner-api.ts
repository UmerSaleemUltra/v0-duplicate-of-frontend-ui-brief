// Partner API Key Management

import { randomBytes } from "crypto"

export class PartnerApiKeyManager {
  static generateKey(): string {
    return `pk_${randomBytes(24).toString("hex")}`
  }

  static generateSecret(): string {
    return randomBytes(32).toString("hex")
  }

  static generateKeyPair() {
    return {
      key: this.generateKey(),
      secret: this.generateSecret(),
    }
  }

  static validateKeyFormat(key: string): boolean {
    return /^pk_[a-f0-9]{48}$/.test(key)
  }

  static createHmacSignature(payload: string, secret: string): string {
    const crypto = require("crypto")
    return crypto.createHmac("sha256", secret).update(payload).digest("hex")
  }

  static verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    const expectedSignature = this.createHmacSignature(payload, secret)
    return signature === expectedSignature
  }
}

// Partner Webhook Manager
export class PartnerWebhookManager {
  static async sendWebhook(
    webhookUrl: string,
    payload: any,
    secret: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const payloadString = JSON.stringify(payload)
      const signature = PartnerApiKeyManager.createHmacSignature(
        payloadString,
        secret
      )

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Buzzfiling-Signature": signature,
          "X-Buzzfiling-Timestamp": new Date().toISOString(),
        },
        body: payloadString,
      })

      if (!response.ok) {
        return {
          success: false,
          error: `Webhook failed with status ${response.status}`,
        }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  static async sendCheckoutCompletedWebhook(
    webhookUrl: string,
    secret: string,
    orderData: any
  ) {
    const payload = {
      event: "checkout.completed",
      timestamp: new Date().toISOString(),
      data: orderData,
    }

    return this.sendWebhook(webhookUrl, payload, secret)
  }
}

// Partner Session Manager
export class PartnerSessionManager {
  static SESSION_DURATION = 3600 * 1000 // 1 hour

  static generateSessionId(): string {
    return `session_${randomBytes(16).toString("hex")}`
  }

  static isSessionExpired(expiresAt: string): boolean {
    return new Date(expiresAt) < new Date()
  }

  static getExpirationTime(): Date {
    return new Date(Date.now() + this.SESSION_DURATION)
  }
}
