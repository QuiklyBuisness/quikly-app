'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Job, Profile, SKILLS } from '@/types'
import { Button } from '@/components/ui/Button'
import { JobCard } from '@/components/shared/JobCard'
import Link from 'next/link'
import { QuoteReceivedOverlay } from '@/components/customer/QuoteReceivedOverlay'
import { Quote } from '@/types'

const QUICK_CATS = SKILLS.slice(0, 4)  // moving, cleaning, handyman, assembly
const MORE_CATS = SKILLS.slice(4)       // rest

interface Props { profile: Profile }

export default function CustomerHome({ profile }: Props) {
  const [myJobs, setMyJobs] = useState<Job[]>([])
  const [incomingQuote, setIncomingQuote] = useState<Quote | null>(null)
  const supabase = createClient()

  // Load customer's active jobs
  useEffect(() => {
    supabase
      .from('jobs')
      .select('*, photos:job_photos(*), quotes(*)')
      .eq('customer_id', profile.id)
      .not('status', 'in', '("paid","cancelled")')
      .order('created_at', { ascending: false })
      .then(({ data }) => setMyJobs(data as any || []))
  }, [profile.id, supabase])

  // Subscribe to incoming quotes in realtime
  useEffect(() => {
    const channel = supabase
      .channel(`customer-quotes-${profile.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'quotes',
        filter: `job_id=in.(${myJobs.map(j => j.id).join(',') || 'null'})`,
      }, async ({ new: quote }) => {
        // Fetch worker details
        const { data: worker } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', quote.worker_id)
          .single()
        setIncomingQuote({ ...quote, worker } as Quote)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [profile.id, myJobs, supabase])

  return (
    <div className="flex flex-col h-full">
      {incomingQuote && (
        <QuoteReceivedOverlay
          quote={incomingQuote}
          onAccept={async () => {
            await fetch('/api/quotes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'accept', quote_id: incomingQuote.id }),
            })
            setIncomingQuote(null)
          }}
          onDismiss={() => setIncomingQuote(null)}
        />
      )}

      <div className="scroll-area flex-1 px-5 pb-6">
        {/* Header */}
        <div className="mb-5">
          <div className="text-xs text-white/40 font-medium mb-1.5">Brooklyn, NY</div>
          <div className="text-[28px] font-black tracking-tight leading-none mb-4">
            What needs<br />taking care of?
          </div>
          {/* Availability indicator */}
          <div className="inline-flex items-center gap-2 bg-green-500/[0.08] border border-green-500/18 rounded-full px-3.5 py-2">
            <div className="w-2 h-2 rounded-full bg-green-400 pulse" />
            <span className="text-xs text-green-400 font-bold">23 workers nearby · quotes in ~4 min</span>
          </div>
        </div>

        {/* Main CTA */}
        <Link href="/post" className="block">
          <div className="relative w-full bg-white text-black rounded-[18px] p-5 mb-4 overflow-hidden active:scale-[0.98] transition-transform">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/5 pointer-events-none" />
            <div className="text-[10px] font-bold tracking-widest uppercase opacity-40 mb-1.5">Post a job</div>
            <div className="text-[24px] font-black tracking-tight leading-tight mb-3">Get help now ⚡</div>
            <div className="flex items-center justify-between">
              <div className="text-xs opacity-45">Describe · Quote · Pay when done</div>
              <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </div>
            </div>
          </div>
        </Link>

        {/* Quick book grid */}
        <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2.5">Quick book</div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {QUICK_CATS.map(cat => (
            <Link
              key={cat.id}
              href={`/post?category=${cat.id}`}
              className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-3.5 active:scale-[0.97] transition-transform"
            >
              <div className="text-[22px] mb-1.5">{cat.emoji}</div>
              <div className="text-sm font-bold mb-0.5">{cat.label}</div>
              <div className="text-[10px] text-white/30">from $60</div>
            </Link>
          ))}
        </div>

        {/* More categories row */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5" style={{ scrollbarWidth: 'none' }}>
          {MORE_CATS.map(cat => (
            <Link
              key={cat.id}
              href={`/post?category=${cat.id}`}
              className="bg-[#1a1a1a] border border-white/10 rounded-full px-3.5 py-2 text-xs font-semibold text-white/60 whitespace-nowrap flex-shrink-0"
            >
              {cat.emoji} {cat.label}
            </Link>
          ))}
        </div>

        {/* Active jobs */}
        {myJobs.length > 0 && (
          <>
            <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2.5">Your jobs</div>
            {myJobs.map(job => (
              <JobCard
                key={job.id}
                job={job}
                mode="customer"
                onClick={() => {}}
                onAction={() => {}}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
