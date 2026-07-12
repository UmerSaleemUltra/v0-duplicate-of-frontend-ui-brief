import { NextRequest, NextResponse } from 'next/server';

// Type definitions
interface CheckoutPayload {
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

// Validation helper
function validateCheckoutPayload(payload: any): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // Account validation
  if (!payload.account) {
    errors.account = 'Account information is required';
    return { valid: false, errors };
  }

  if (!payload.account.fullName?.trim()) {
    errors['account.fullName'] = 'Full name is required';
  }

  if (!/^\S+@\S+\.\S+$/.test(payload.account.email)) {
    errors['account.email'] = 'Valid email is required';
  }

  if (payload.account.password.length < 8) {
    errors['account.password'] = 'Password must be at least 8 characters';
  }

  if (!payload.account.terms) {
    errors['account.terms'] = 'You must accept the terms';
  }

  // Formation validation
  if (!payload.formation) {
    errors.formation = 'Formation information is required';
  } else {
    if (!payload.formation.state) {
      errors['formation.state'] = 'State is required';
    }
    if (!['LLC', 'C-Corp'].includes(payload.formation.entity)) {
      errors['formation.entity'] = 'Invalid entity type';
    }
    if (!['Starter', 'Advance'].includes(payload.formation.package)) {
      errors['formation.package'] = 'Invalid package';
    }
  }

  // Business validation
  if (!payload.business) {
    errors.business = 'Business information is required';
  } else {
    if (!payload.business.businessName?.trim()) {
      errors['business.businessName'] = 'Business name is required';
    }
    if (payload.business.description?.trim().length < 20) {
      errors['business.description'] = 'Description must be at least 20 characters';
    }
  }

  // Members validation
  if (!Array.isArray(payload.members) || payload.members.length === 0) {
    errors.members = 'At least one member is required';
  } else {
    const hasResponsible = payload.members.some((m: any) => m.responsible);
    if (!hasResponsible) {
      errors.members = 'At least one Responsible Party is required';
    }

    payload.members.forEach((member: any, index: number) => {
      if (!member.fullLegalName?.trim()) {
        errors[`member.${index}.fullLegalName`] = 'Member name is required';
      }
      if (!member.homeAddress?.trim()) {
        errors[`member.${index}.homeAddress`] = 'Member address is required';
      }
      if (!member.city?.trim()) {
        errors[`member.${index}.city`] = 'City is required';
      }
      if (!member.zip?.trim()) {
        errors[`member.${index}.zip`] = 'ZIP code is required';
      }
    });
  }

  // Payment validation
  if (!payload.payment) {
    errors.payment = 'Payment information is required';
  } else {
    if (!payload.payment.whatsapp?.trim()) {
      errors['payment.whatsapp'] = 'WhatsApp number is required';
    }
    if (payload.payment.method === 'make' && !payload.payment.receiptFileName) {
      errors['payment.receipt'] = 'Receipt upload is required';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

// Main POST handler
export async function POST(request: NextRequest): Promise<NextResponse<CheckoutResponse>> {
  try {
    // Parse the request body
    const payload: CheckoutPayload = await request.json();

    // Validate the payload
    const { valid, errors } = validateCheckoutPayload(payload);
    if (!valid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors,
        },
        { status: 400 }
      );
    }

    // Generate a unique order ID
    const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Here you would typically:
    // 1. Save to database
    // 2. Create user account
    // 3. Create order record
    // 4. Send confirmation email
    // 5. Process payment (if method is "make")

    console.log('✅ Checkout submission received:', {
      orderId,
      email: payload.account.email,
      businessName: payload.business.businessName,
      package: payload.formation.package,
      state: payload.formation.state,
      entity: payload.formation.entity,
      priceUSD: payload.formation.priceUSD,
      totalMembers: payload.members.length,
      paymentMethod: payload.payment.method,
      timestamp: new Date().toISOString(),
    });

    // TODO: Database save example
    // await db.orders.create({
    //   orderId,
    //   email: payload.account.email,
    //   fullName: payload.account.fullName,
    //   businessName: payload.business.businessName,
    //   formationState: payload.formation.state,
    //   entityType: payload.formation.entity,
    //   package: payload.formation.package,
    //   priceUSD: payload.formation.priceUSD,
    //   members: payload.members,
    //   paymentMethod: payload.payment.method,
    //   whatsappNumber: payload.payment.whatsapp,
    //   createdAt: new Date(),
    //   status: 'pending',
    // });

    // TODO: Send email confirmation
    // await sendEmail({
    //   to: payload.account.email,
    //   template: 'checkout-confirmation',
    //   data: {
    //     orderId,
    //     businessName: payload.business.businessName,
    //     package: payload.formation.package,
    //   }
    // });

    return NextResponse.json(
      {
        success: true,
        orderId,
        message: `Checkout submitted successfully. Your order ID is ${orderId}. You will receive a confirmation email at ${payload.account.email}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Checkout error:', error);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred during checkout',
      },
      { status: 500 }
    );
  }
}

// Optional: GET handler for testing
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    message: 'Checkout API v1',
    methods: ['POST'],
    endpoint: '/api/checkout/submit',
    description: 'Submit LLC/C-Corp formation checkout with member details and payment info',
  });
}
