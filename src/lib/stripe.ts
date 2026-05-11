import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

export const PLATFORM_FEE_PERCENT = 10

/**
 * Create a payment intent with manual capture.
 * Card is authorized but NOT charged until job is confirmed complete.
 */
export async function createJobPaymentIntent({
  amountCents,
  customerId,
  workerStripeAccountId,
  jobId,
}: {
  amountCents: number
  customerId: string
  workerStripeAccountId: string
  jobId: string
}) {
  const platformFeeCents = Math.round(amountCents * (PLATFORM_FEE_PERCENT / 100))

  return stripe.paymentIntents.create({
    amount: amountCents,
    currency: 'usd',
    capture_method: 'manual',
    customer: customerId,
    application_fee_amount: platformFeeCents,
    transfer_data: { destination: workerStripeAccountId },
    metadata: { jobId, workerStripeAccountId },
  })
}

/**
 * Capture a previously authorized payment — call when job is confirmed complete.
 */
export async function captureJobPayment(paymentIntentId: string) {
  return stripe.paymentIntents.capture(paymentIntentId)
}

/**
 * Cancel/refund a payment — call on job cancellation.
 */
export async function cancelJobPayment(paymentIntentId: string) {
  return stripe.paymentIntents.cancel(paymentIntentId)
}

/**
 * Create Stripe Connect account link for worker onboarding.
 */
export async function createWorkerOnboardingLink(accountId: string, returnUrl: string) {
  return stripe.accountLinks.create({
    account: accountId,
    refresh_url: returnUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  })
}
