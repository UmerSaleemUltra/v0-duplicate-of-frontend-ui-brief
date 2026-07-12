/**
 * Checkout Configuration
 * Centralized settings for the checkout process
 */

export const CHECKOUT_CONFIG = {
  // Default package (must be either 'Starter' or 'Advance')
  DEFAULT_PACKAGE: 'Starter' as const,

  // Package pricing in USD
  PRICING: {
    Starter: 249,
    Advance: 349,
  },

  // Exchange rates
  EXCHANGE_RATES: {
    PKR: 285, // 1 USD = 285 PKR
  },

  // API endpoints
  API: {
    SUBMIT: '/api/checkout/submit',
    VALIDATE: '/api/checkout/validate',
  },

  // Form validation rules
  VALIDATION: {
    PHONE: {
      MIN_DIGITS: 6,
      MAX_DIGITS: 15,
    },
    WHATSAPP: {
      MIN_DIGITS: 7,
      MAX_DIGITS: 15,
    },
    PASSWORD: {
      MIN_LENGTH: 8,
    },
    DESCRIPTION: {
      MIN_LENGTH: 20,
    },
  },

  // Timeouts
  TIMEOUTS: {
    SUBMISSION: 30000, // 30 seconds
    REDIRECT_DELAY: 10000, // 10 seconds
  },

  // Success redirect
  REDIRECT_URL: 'https://www.buzzfiling.com/login',
};

// Type exports
export type PackageType = typeof CHECKOUT_CONFIG.DEFAULT_PACKAGE;
export type PricingKeys = keyof typeof CHECKOUT_CONFIG.PRICING;
