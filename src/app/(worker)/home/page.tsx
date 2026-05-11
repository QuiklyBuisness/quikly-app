import { createServerSupabaseClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import WorkerHome from '@/components/worker/WorkerHome'

export default async function WorkerHomePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')
  return <WorkerHome profile={profile as any} />
}
