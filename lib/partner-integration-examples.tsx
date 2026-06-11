// Integration examples for partners

// ============================================
// EXAMPLE 1: React Component for Form
// ============================================

import React, { useState } from 'react'

interface CheckoutFormProps {
  onCheckoutCreated?: (checkoutUrl: string) => void
}

export function BuzzFilingCheckoutForm({ onCheckoutCreated }: CheckoutFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      businessName: formData.get('businessName'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      state: formData.get('state'),
      packageType: formData.get('packageType'),
      addons: Array.from(formData.getAll('addons')),
    }

    try {
      const response = await fetch('/api/create-buzzfiling-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Failed to create checkout')

      const result = await response.json()
      if (result.success && result.data?.checkoutUrl) {
        if (onCheckoutCreated) {
          onCheckoutCreated(result.data.checkoutUrl)
        } else {
          window.location.href = result.data.checkoutUrl
        }
      } else {
        setError(result.error || 'Unknown error occurred')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Business Name *</label>
        <input
          type="text"
          name="businessName"
          required
          placeholder="e.g., Acme Corp"
          className="w-full px-3 py-2 border rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Email *</label>
        <input
          type="email"
          name="email"
          required
          placeholder="john@example.com"
          className="w-full px-3 py-2 border rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Phone</label>
        <input
          type="tel"
          name="phone"
          placeholder="+1 (555) 123-4567"
          className="w-full px-3 py-2 border rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">State *</label>
        <select name="state" required className="w-full px-3 py-2 border rounded">
          <option value="">Select a state</option>
          <option value="TX">Texas</option>
          <option value="CA">California</option>
          <option value="NY">New York</option>
          <option value="FL">Florida</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Package *</label>
        <select name="packageType" required className="w-full px-3 py-2 border rounded">
          <option value="">Select a package</option>
          <option value="starter">Starter - $99</option>
          <option value="standard">Standard - $299</option>
          <option value="plus">Plus - $499</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Add-ons</label>
        <label className="flex items-center">
          <input
            type="checkbox"
            name="addons"
            value="registered-agent"
            className="rounded"
          />
          <span className="ml-2 text-sm">Registered Agent (+$99/year)</span>
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            name="addons"
            value="ein-filing"
            className="rounded"
          />
          <span className="ml-2 text-sm">EIN Filing (+$49)</span>
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            name="addons"
            value="business-address"
            className="rounded"
          />
          <span className="ml-2 text-sm">Business Address (+$149/year)</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Continue to BuzzFiling'}
      </button>
    </form>
  )
}

// ============================================
// EXAMPLE 2: Backend Integration (Node.js)
// ============================================

import type { NextRequest, NextResponse } from 'next/server'

const BUZZFILING_API_KEY = process.env.BUZZFILING_API_KEY
const BUZZFILING_API_URL = 'https://buzzfiling.com/api/partners'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate inputs
    if (!body.businessName || !body.email || !body.state || !body.packageType) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400 }
      )
    }

    // Call BuzzFiling API
    const response = await fetch(`${BUZZFILING_API_URL}/checkout/create`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${BUZZFILING_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessName: body.businessName,
        email: body.email,
        phone: body.phone,
        state: body.state,
        packageType: body.packageType,
        addons: body.addons || [],
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/success`,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return new Response(
        JSON.stringify({ success: false, error: error.error }),
        { status: response.status }
      )
    }

    const data = await response.json()
    return new Response(JSON.stringify(data), { status: 200 })
  } catch (error) {
    console.error('Checkout error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500 }
    )
  }
}

// ============================================
// EXAMPLE 3: Webhook Handler
// ============================================

import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-buzzfiling-signature')
    if (!signature) {
      return new Response(JSON.stringify({ error: 'Missing signature' }), { status: 401 })
    }

    // Read raw body
    const rawBody = await request.text()

    // Verify signature
    const secret = process.env.BUZZFILING_WEBHOOK_SECRET!
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')

    if (signature !== expected) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 })
    }

    const event = JSON.parse(rawBody)

    // Handle checkout completed
    if (event.event === 'checkout.completed') {
      const { orderId, email, businessName, amount, status } = event.data

      // TODO: Store order in your database
      console.log(`Order completed: ${orderId}`)

      // TODO: Send confirmation email
      // await sendConfirmationEmail(email, businessName)

      // TODO: Trigger any post-processing
      // await processOrder(orderId)
    }

    // Handle checkout abandoned
    if (event.event === 'checkout.abandoned') {
      const { email, businessName, amount } = event.data

      // TODO: Send follow-up email
      console.log(`Checkout abandoned: ${email}`)
      // await sendFollowUpEmail(email, businessName, amount)
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: 'Webhook processing failed' }), { status: 500 })
  }
}

// ============================================
// EXAMPLE 4: Order Management
// ============================================

const PARTNER_ID = process.env.BUZZFILING_PARTNER_ID!

export async function getPartnerOrders(
  status?: string,
  page: number = 1,
  limit: number = 50
) {
  try {
    const url = new URL(`${BUZZFILING_API_URL}/${PARTNER_ID}/orders`)
    if (status) url.searchParams.set('status', status)
    url.searchParams.set('page', page.toString())
    url.searchParams.set('limit', limit.toString())

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${BUZZFILING_API_KEY}`,
      },
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to fetch orders:', error)
    throw error
  }
}

// Example usage:
// const orders = await getPartnerOrders('completed', 1, 25)
// console.log(orders.data) // Array of orders
// console.log(orders.pagination) // Pagination info
