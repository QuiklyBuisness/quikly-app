'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { Job, Profile } from '@/types'
import { Button } from '@/components/ui/Button'
import { GoOnlineOverlay } from '@/components/worker/GoOnlineOverlay'
import { JobIncomingOverlay } from '@/components/worker/JobIncomingOverlay'

interface WorkerHomeProps {
  profile: Profile
}

export default function WorkerHome({ profile }: WorkerHomeProps) {
  const [online, setOnline] = useState(false)
  const [showStartup, setShowStartup] = useState(false)
  const [incomingJob, setIncomingJob] = useState<Job | null>(null)
  const [activeJob, setActiveJob] = useState<Job | null>(null)
  const [workerLat, setWorkerLat] = useState<number>(40.7135)
  const [workerLng, setWorkerLng] = useState<number>(-73.9541)
  const supabase = createClient()

  const goOnline = useCallback(async () => {
    setShowStartup(true)

    // Vibrate: short-short-long (engine catch)
    if ('vibrate' in navigator) navigator.vibrate([30, 60, 30, 60, 120])

    // Get GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setWorkerLat(pos.coords.latitude)
        setWorkerLng(pos.coords.longitude)
      }, () => {})
    }

    // Update DB
    await supabase.from('profiles').update({
      is_online: true,
      lat: workerLat,
      lng: workerLng,
      online_at: new Date().toISOString(),
    }).eq('id', profile.id)

    // Animation plays for 1.1s, then reveal online state
    setTimeout(() => {
      setShowStartup(false)
      setOnline(true)
    }, 1100)
  }, [profile.id, workerLat, workerLng, supabase])

  const goOffline = useCallback(async () => {
    setOnline(false)
    await supabase.from('profiles').update({ is_online: false }).eq('id', profile.id)
    setIncomingJob(null)
  }, [profile.id, supabase])

  // Subscribe to job assignments via realtime
  useEffect(() => {
    if (!online) return

    const channel = supabase
      .channel(`worker-${profile.id}`)
      .on('broadcast', { event: 'job-incoming' }, ({ payload }) => {
        setIncomingJob(payload.job as Job)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [online, profile.id, supabase])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Go-online startup overlay */}
      <GoOnlineOverlay visible={showStartup} />

      {/* Job incoming overlay — covers entire screen */}
      <AnimatePresence>
        {incomingJob && (
          <JobIncomingOverlay
            job={incomingJob}
            workerLat={workerLat}
            workerLng={workerLng}
            onAccept={async () => {
              await supabase.from('jobs').update({
                status: 'active',
                assigned_worker_id: profile.id,
              }).eq('id', incomingJob.id)
              setActiveJob(incomingJob)
              setIncomingJob(null)
            }}
            onSkip={() => setIncomingJob(null)}
          />
        )}
      </AnimatePresence>

      <div className="scroll-area flex-1 p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-xs text-white/40 mb-0.5 font-medium">Brooklyn, NY</div>
            <div className="text-xl font-bold">Hey, {profile.first_name} 👋</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-white/40">This week</div>
            <div className="text-lg font-bold text-green-400">$340</div>
          </div>
        </div>

        {!online && !showStartup && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center min-h-[55vh] text-center"
          >
            {/* Rings behind button */}
            <div className="relative mb-8">
              <div className="absolute inset-0 -m-8 rounded-full bg-white/[0.03]" />
              <div className="absolute inset-0 -m-14 rounded-full bg-white/[0.015]" />
              <button
                onClick={goOnline}
                className="relative w-36 h-36 rounded-full bg-white text-black flex flex-col items-center justify-center gap-1.5 shadow-[0_4px_32px_rgba(255,255,255,0.12)] active:scale-95 transition-transform z-10"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18.36 6.64a9 9 0 11-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/>
                </svg>
                <span className="text-[15px] font-black">Go Online</span>
              </button>
            </div>

            <div className="text-2xl font-black tracking-tight mb-2">Ready to hustle?</div>
            <div className="text-sm text-white/55 leading-relaxed mb-6 max-w-xs">
              Go online and jobs come to you — wherever you are in the app.
            </div>

            {/* Stats */}
            <div className="flex gap-5 mb-5">
              <div className="text-center"><div className="text-lg font-black">$340</div><div className="text-xs text-white/40">This week</div></div>
              <div className="w-px bg-white/10" />
              <div className="text-center"><div className="text-lg font-black">{profile.jobs_completed}</div><div className="text-xs text-white/40">Jobs done</div></div>
              <div className="w-px bg-white/10" />
              <div className="text-center"><div className="text-lg font-black">{profile.rating}★</div><div className="text-xs text-white/40">Rating</div></div>
            </div>

            <div className="flex items-center gap-2 bg-[#1a1a1a] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white/55">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Williamsburg & Bushwick are busiest right now
            </div>
          </motion.div>
        )}

        {online && !incomingJob && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            {/* Online status bar */}
            <div className="flex items-center justify-between bg-green-500/[0.06] border border-green-500/15 rounded-xl px-3.5 py-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-green-400 pulse" />
                <div>
                  <div className="text-sm font-bold text-green-400">Online</div>
                  <div className="text-xs text-white/40">Watching for jobs near you</div>
                </div>
              </div>
              <button
                onClick={goOffline}
                className="bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-1.5 text-xs font-bold text-white/55"
              >
                Go offline
              </button>
            </div>

            {/* Active job */}
            {activeJob && (
              <div className="bg-[#1a1a1a] border border-green-500/30 rounded-2xl p-4 mb-4">
                <div className="text-[10px] font-bold text-green-400 uppercase tracking-widest mb-2">Active job</div>
                <div className="text-sm font-bold mb-1">{activeJob.title}</div>
                <div className="text-xs text-white/55 mb-3">{activeJob.customer?.first_name} · {activeJob.address}</div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" className="flex-1">Scope changed</Button>
                  <Button size="sm" className="flex-1">Mark complete</Button>
                </div>
              </div>
            )}

            {/* Reliability */}
            <div>
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2.5">Your reliability</div>
              <div className="flex gap-2 flex-wrap">
                {['On-time 98%', 'Completion 100%', 'Response avg. 2 min'].map(b => (
                  <span key={b} className="text-[11px] font-semibold border border-green-500/20 text-green-400 bg-green-500/[0.06] rounded-full px-2.5 py-1">{b}</span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
