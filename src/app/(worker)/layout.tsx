import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { WorkerTabBar } from '@/components/worker/WorkerTabBar'

export default async function WorkerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || profile.role !== 'worker') redirect('/login')

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-[#0f0f0f]">
      {/* Status bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 h-11">
        <span className="text-xs font-semibold">9:41</span>
        <div className="flex items-center gap-1.5">
          <svg width="15" height="11" viewBox="0 0 15 11" fill="white">
            <rect x="0" y="4" width="3" height="7" rx="0.5" opacity="0.4"/>
            <rect x="4" y="2.5" width="3" height="8.5" rx="0.5" opacity="0.6"/>
            <rect x="8" y="1" width="3" height="10" rx="0.5" opacity="0.8"/>
            <rect x="12" y="0" width="3" height="11" rx="0.5"/>
          </svg>
          <svg width="16" height="12" viewBox="0 0 16 12" fill="white">
            <path d="M8 2.4C10.7 2.4 13.1 3.5 14.8 5.3L16 4C14 1.9 11.1.6 8 .6 4.9.6 2 1.9 0 4l1.2 1.3C2.9 3.5 5.3 2.4 8 2.4z"/>
            <path d="M8 5.2c1.8 0 3.4.7 4.6 1.9L14 5.8C12.4 4.1 10.3 3 8 3S3.6 4.1 2 5.8l1.4 1.3C4.6 5.9 6.2 5.2 8 5.2z" opacity="0.8"/>
            <circle cx="8" cy="10" r="2"/>
          </svg>
          <span className="text-xs font-semibold">100%</span>
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>

      {/* Tab bar */}
      <WorkerTabBar />
    </div>
  )
}
