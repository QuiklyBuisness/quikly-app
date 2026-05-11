import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { createJobPaymentIntent } from '@/lib/stripe'
import { z } from 'zod'

const SubmitQuoteSchema = z.object({
  job_id: z.string().uuid(),
  amount: z.number().min(100),  // minimum $1 in cents
  includes: z.string().optional(),
  eta: z.enum(['now', '1hr', 'today']),
})

const AcceptQuoteSchema = z.object({
  quote_id: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const action = body.action

  if (action === 'submit') {
    const parsed = SubmitQuoteSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { job_id, amount, includes, eta } = parsed.data

    // Verify worker has matching skills for this job category
    const { data: job } = await supabase.from('jobs').select('category, status').eq('id', job_id).single()
    if (!job || job.status !== 'open') return NextResponse.json({ error: 'Job not available' }, { status: 400 })

    const { data: profile } = await supabase.from('profiles').select('skills').eq('id', user.id).single()
    if (!profile?.skills?.includes(job.category)) {
      return NextResponse.json({ error: 'Your skills do not match this job' }, { status: 403 })
    }

    const { data: quote, error } = await supabase.from('quotes').upsert({
      job_id, worker_id: user.id, amount, includes, eta, status: 'pending'
    }, { onConflict: 'job_id,worker_id' }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Update job status to quoted
    await supabase.from('jobs').update({ status: 'quoted' }).eq('id', job_id)

    return NextResponse.json({ quote })
  }

  if (action === 'accept') {
    const parsed = AcceptQuoteSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { data: quote } = await supabase
      .from('quotes')
      .select('*, worker:profiles!worker_id(stripe_account_id), job:jobs!job_id(*, customer:profiles!customer_id(stripe_customer_id))')
      .eq('id', parsed.data.quote_id)
      .single()

    if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 })

    const workerAccountId = (quote.worker as any)?.stripe_account_id
    const customerStripeId = (quote.job as any)?.customer?.stripe_customer_id

    if (!workerAccountId) return NextResponse.json({ error: 'Worker has no payout account' }, { status: 400 })

    // Create payment intent (authorize, don't capture)
    let paymentIntentId: string | null = null
    if (customerStripeId) {
      const pi = await createJobPaymentIntent({
        amountCents: quote.amount,
        customerId: customerStripeId,
        workerStripeAccountId: workerAccountId,
        jobId: quote.job_id,
      })
      paymentIntentId = pi.id
    }

    // Lock the job
    await supabase.from('jobs').update({
      status: 'accepted',
      locked_price: quote.amount,
      assigned_worker_id: quote.worker_id,
      stripe_payment_intent_id: paymentIntentId,
    }).eq('id', quote.job_id)

    // Decline all other quotes
    await supabase.from('quotes')
      .update({ status: 'declined' })
      .eq('job_id', quote.job_id)
      .neq('id', quote.id)

    // Accept this quote
    await supabase.from('quotes').update({ status: 'accepted' }).eq('id', quote.id)

    return NextResponse.json({ success: true, lockedPrice: quote.amount })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
