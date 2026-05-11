import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

interface MatchRequest {
  jobId: string
  excludeWorkerIds?: string[]
}

Deno.serve(async (req) => {
  const { jobId, excludeWorkerIds = [] }: MatchRequest = await req.json()

  // 1. Get job details
  const { data: job, error: jobErr } = await supabase
    .from('jobs')
    .select('*, customer:profiles!customer_id(id, first_name)')
    .eq('id', jobId)
    .single()

  if (jobErr || !job) {
    return new Response(JSON.stringify({ error: 'Job not found' }), { status: 404 })
  }

  if (job.status !== 'open') {
    return new Response(JSON.stringify({ error: 'Job no longer open' }), { status: 400 })
  }

  // 2. Find eligible workers
  // Online, matching skills, within radius, not excluded, sorted by rating desc
  const { data: workers } = await supabase
    .from('profiles')
    .select('id, lat, lng, radius_miles, skills, rating')
    .eq('role', 'worker')
    .eq('is_online', true)
    .eq('verification_status', 'approved')
    .contains('skills', [job.category])
    .not('id', 'in', `(${excludeWorkerIds.join(',') || 'null'})`)

  if (!workers?.length) {
    return new Response(JSON.stringify({ matched: false, reason: 'No workers available' }), { status: 200 })
  }

  // 3. Filter by distance and sort
  const eligible = workers
    .filter(w => {
      if (!w.lat || !w.lng || !job.lat || !job.lng) return false
      const dist = haversine(w.lat, w.lng, job.lat, job.lng)
      return dist <= (w.radius_miles || 2)
    })
    .sort((a, b) => (b.rating || 5) - (a.rating || 5))

  if (!eligible.length) {
    return new Response(JSON.stringify({ matched: false, reason: 'No workers in range' }), { status: 200 })
  }

  const targetWorker = eligible[0]

  // 4. Mark job as dispatched to this worker (store in metadata via realtime channel)
  // In production: send push notification via Expo/FCM and create a realtime channel event
  // For now we return the worker to notify via the API route
  return new Response(JSON.stringify({
    matched: true,
    workerId: targetWorker.id,
    jobId,
  }), { headers: { 'Content-Type': 'application/json' } })
})

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}
