'use client';

import { useState } from 'react';
import { CHECKOUT_CONFIG } from '@/lib/checkout-config';

export interface CheckoutPayload {
  account: {
    fullName: string;
    phone: string;
    email: string;
    password: string;
    terms: boolean;
  };
  formation: {
    state: string;
    entity: 'LLC' | 'C-Corp';
    package: 'Starter' | 'Advance';
    priceUSD: number;
  };
  business: {
    businessName: string;
    website: string;
    category: string;
    description: string;
  };
  members: Array<{
    id: string;
    responsible: boolean;
    fullLegalName: string;
    homeAddress: string;
    city: string;
    stateProvince: string;
    country: string;
    zip: string;
    ssn: string;
    idFileName: string;
  }>;
  payment: {
    method: 'already' | 'make';
    whatsapp: string;
    receiptFileName: string;
  };
}

interface CheckoutResponse {
  success: boolean;
  orderId?: string;
  message: string;
  errors?: Record<string, string>;
}

interface UseCheckoutSubmitReturn {
  submit: (payload: CheckoutPayload) => Promise<CheckoutResponse>;
  loading: boolean;
  error: string | null;
  orderId: string | null;
}

/**
 * Hook for submitting checkout form to the API
 * Handles loading states, error handling, and response parsing
 */
export function useCheckoutSubmit(): UseCheckoutSubmitReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const submit = async (payload: CheckoutPayload): Promise<CheckoutResponse> => {
    setLoading(true);
    setError(null);
    setOrderId(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CHECKOUT_CONFIG.TIMEOUTS.SUBMISSION);

      const response = await fetch(CHECKOUT_CONFIG.API.SUBMIT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data: CheckoutResponse = await response.json();

      if (!response.ok) {
        const errorMessage = data.message || 'Checkout submission failed';
        setError(errorMessage);
        return {
          success: false,
          message: errorMessage,
          errors: data.errors,
        };
      }

      if (data.success && data.orderId) {
        setOrderId(data.orderId);
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during submission';
      setError(errorMessage);

      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    submit,
    loading,
    error,
    orderId,
  };
}
