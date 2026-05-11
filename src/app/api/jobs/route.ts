import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { analyzeJobPhoto } from '@/lib/claude'
import { z } from 'zod'

const PostJobSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  full_description: z.string().optional(),
  category: z.string(),
  urgency: z.enum(['now', 'today', 'scheduled']),
  address: z.string(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  scheduled_for: z.string().optional(),
  budget: z.number().optional(),
  notes: z.string().optional(),
  bring: z.array(z.string()).optional(),
  photo_base64: z.string().optional(),
  photo_media_type: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = PostJobSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const data = parsed.data

    // Run AI photo analysis if photo provided (runs in background, doesn't block)
    let aiNotice: string | null = null
    if (data.photo_base64 && data.photo_media_type) {
      aiNotice = await analyzeJobPhoto(data.photo_base64, data.photo_media_type, data.category)
    }

    // Create job
    const { data: job, error: jobErr } = await supabase.from('jobs').insert({
      customer_id: user.id,
      title: data.title,
      description: data.description,
      full_description: data.full_description,
      category: data.category,
      urgency: data.urgency,
      status: 'open',
      address: data.address,
      lat: data.lat,
      lng: data.lng,
      scheduled_for: data.scheduled_for,
      budget: data.budget,
      notes: data.notes,
      bring: data.bring,
      ai_notice: aiNotice,
    }).select().single()

    if (jobErr) return NextResponse.json({ error: jobErr.message }, { status: 500 })

    // If urgent, trigger dispatch edge function
    if (data.urgency === 'now') {
      supabase.functions.invoke('dispatch-job', {
        body: { jobId: job.id }
      }).catch(console.error) // fire and forget
    }

    return NextResponse.json({ job })
  } catch (err) {
    console.error('POST /api/jobs error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const urgency = searchParams.get('urgency')
    const role = searchParams.get('role')

    let query = supabase
      .from('jobs')
      .select('*, customer:profiles!customer_id(id, first_name, last_name, rating, jobs_completed), photos:job_photos(*)')
      .eq('status', 'open')

    if (urgency) query = query.eq('urgency', urgency)
    if (role === 'customer') query = query.eq('customer_id', user.id)

    const { data: jobs, error } = await query.order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ jobs })
  } catch (err) {
    console.error('GET /api/jobs error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
