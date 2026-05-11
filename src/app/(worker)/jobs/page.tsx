import { createServerSupabaseClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { WorkerJobsBrowse } from '@/components/worker/WorkerJobsBrowse'

export default async function WorkerJobsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')
  return <WorkerJobsBrowse profile={profile as any} />
}
