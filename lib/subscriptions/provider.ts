// Payment provider abstraction for subscriptions.
//
// Two implementations:
//   - mock (default) — no external API, suitable for local dev and CI. Order
//     IDs are synthesized; the "verify" call always reports success.
//   - live — calls the real Razorpay API. Activated when RAZORPAY_KEY_ID and
//     RAZORPAY_KEY_SECRET are set in the environment.
//
// The shape is intentionally minimal: create an order, verify a payment.
// When the real SDK lands, replace `LiveProvider` only — callers stay the same.

export interface CreateOrderInput {
  amountPaise: number
  currency: 'INR'
  receipt: string
  notes?: Record<string, string>
}

export interface CreateOrderResult {
  orderId: string
  amountPaise: number
  currency: 'INR'
  status: 'created'
  /**
   * URL the client can redirect to in mock mode to complete the flow. Live
   * mode uses Razorpay's hosted checkout via the Razorpay JS SDK on the
   * client, so this field is unused there.
   */
  mockCompletionUrl?: string
}

export interface VerifyPaymentInput {
  orderId: string
  paymentId: string
  signature: string
}

export interface VerifyPaymentResult {
  valid: boolean
  paymentId: string
}

export interface PaymentProvider {
  readonly name: 'mock' | 'live'
  createOrder(input: CreateOrderInput): Promise<CreateOrderResult>
  verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult>
}

class MockProvider implements PaymentProvider {
  readonly name = 'mock' as const

  async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    const id = `order_mock_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    return {
      orderId: id,
      amountPaise: input.amountPaise,
      currency: input.currency,
      status: 'created',
      // Frontend redirects here after "checkout". The page will call
      // /api/subscriptions/verify with the synthesized payment id.
      mockCompletionUrl: `/dashboard/subscription?mock_order=${encodeURIComponent(id)}`,
    }
  }

  async verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
    // Mock mode considers any verification with a valid-looking order ID OK.
    // The webhook integration test should never depend on this branch in
    // production; gate live mode on RAZORPAY_KEY_ID/SECRET being set.
    const valid = input.orderId.startsWith('order_mock_') || input.orderId.startsWith('order_')
    return {
      valid,
      paymentId: input.paymentId || `pay_mock_${Date.now()}`,
    }
  }
}

class LiveProvider implements PaymentProvider {
  readonly name = 'live' as const

  async createOrder(_input: CreateOrderInput): Promise<CreateOrderResult> {
    // TODO: implement when integrating the real `razorpay` SDK. Sketch:
    //
    //   import Razorpay from 'razorpay'
    //   const rp = new Razorpay({ key_id, key_secret })
    //   const order = await rp.orders.create({ amount, currency, receipt, notes })
    //
    // Throw until then so we don't silently succeed in production with a
    // stub.
    throw new Error(
      'Live Razorpay provider not yet implemented. Set RAZORPAY_KEY_ID / SECRET in env once the SDK is wired up.'
    )
  }

  async verifyPayment(_input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
    // TODO: implement HMAC SHA256 signature verification.
    //   const expected = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET)
    //     .update(`${orderId}|${paymentId}`).digest('hex')
    //   valid = (expected === signature)
    throw new Error('Live Razorpay verifyPayment not yet implemented.')
  }
}

let cachedProvider: PaymentProvider | null = null

export function getPaymentProvider(): PaymentProvider {
  if (cachedProvider) return cachedProvider
  const haveLiveKeys = !!(
    process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  )
  cachedProvider = haveLiveKeys ? new LiveProvider() : new MockProvider()
  return cachedProvider
}

// For tests: allow forcing a provider explicitly.
export function _setPaymentProviderForTesting(p: PaymentProvider | null): void {
  cachedProvider = p
}
