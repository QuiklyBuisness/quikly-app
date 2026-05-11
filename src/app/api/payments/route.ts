import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { captureJobPayment, cancelJobPayment, PLATFORM_FEE_PERCENT } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action, job_id } = await req.json()

  const { data: job } = await supabase
    .from('jobs')
    .select('*, customer:profiles!customer_id(id), worker:profiles!assigned_worker_id(id)')
    .eq('id', job_id)
    .single()

  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  // Verify caller is a participant
  const isCustomer = job.customer_id === user.id
  const isWorker = job.assigned_worker_id === user.id
  if (!isCustomer && !isWorker) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  if (action === 'complete') {
    // Customer confirms completion → capture payment
    if (!isCustomer) return NextResponse.json({ error: 'Only customer can confirm completion' }, { status: 403 })
    if (job.status !== 'active') return NextResponse.json({ error: 'Job is not active' }, { status: 400 })

    if (job.stripe_payment_intent_id) {
      await captureJobPayment(job.stripe_payment_intent_id)
    }

    const platformFee = Math.round((job.locked_price || 0) * (PLATFORM_FEE_PERCENT / 100))
    const workerPayout = (job.locked_price || 0) - platformFee

    // Record payment
    await supabase.from('payments').insert({
      job_id,
      customer_id: job.customer_id,
      worker_id: job.assigned_worker_id,
      stripe_payment_intent_id: job.stripe_payment_intent_id,
      amount: job.locked_price,
      platform_fee: platformFee,
      worker_payout: workerPayout,
      status: 'released',
    })

    await supabase.from('jobs').update({ status: 'paid' }).eq('id', job_id)

    return NextResponse.json({ success: true, workerPayout, platformFee })
  }

  if (action === 'cancel') {
    if (job.stripe_payment_intent_id) {
      await cancelJobPayment(job.stripe_payment_intent_id)
    }
    await supabase.from('jobs').update({ status: 'cancelled' }).eq('id', job_id)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
