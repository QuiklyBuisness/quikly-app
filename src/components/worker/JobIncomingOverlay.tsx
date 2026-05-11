'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Job, PRICE_RANGES } from '@/types'
import { distanceMiles, formatDistance } from '@/lib/distance'
import { Button } from '@/components/ui/Button'

const EMOJI: Record<string, string> = {
  moving: '📦', cleaning: '🧹', handyman: '🔧', assembly: '🪑',
  plumbing: '🚿', electrical: '⚡', junk: '🗑️', lawn: '🌿', painting: '🖌️', hvac: '❄️',
}

interface Props {
  job: Job
  workerLat: number
  workerLng: number
  onAccept: () => void
  onSkip: () => void
}

export function JobIncomingOverlay({ job, workerLat, workerLng, onAccept, onSkip }: Props) {
  const [secs, setSecs] = useState(60)
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const range = PRICE_RANGES[job.category]
  const dist = job.lat && job.lng ? distanceMiles(workerLat, workerLng, job.lat, job.lng) : null
  const isUrgent = (job.urgency === 'now')

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) (navigator as any).vibrate([40, 30, 40])

    timerRef.current = setInterval(() => {
      setSecs(s => {
        if (s <= 1) { clearInterval(timerRef.current); onSkip(); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[9996] bg-[#0a0a0a] flex flex-col"
    >
      {/* Fixed header */}
      <div className="flex-shrink-0 px-5 pt-4">
        {/* Timer bar */}
        <div className="w-full h-[3px] bg-white/10 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-white rounded-full"
            style={{ width: `${(secs / 60) * 100}%`, transition: 'width 1s linear' }}
          />
        </div>

        {/* Top row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 pulse" />
            <span className="text-xs font-bold text-green-400 uppercase tracking-widest">Sent to you first</span>
          </div>
          <span className="text-sm text-white/40">
            Passes in <span className="text-white font-black text-base">{secs}</span>s
          </span>
        </div>

        {/* Title row */}
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="flex-1">
            <div className="text-xl mb-1">{EMOJI[job.category] || '⚡'}</div>
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-[22px] font-black tracking-tight leading-tight"
            >
              {job.title}
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
              className="text-sm text-white/55 mt-1"
            >
              {dist !== null ? `${formatDistance(dist)} · ` : ''}{job.address?.split(',')[1]?.trim() || 'Brooklyn'}
            </motion.div>
          </div>
          {range && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, type: 'spring', bounce: 0.3 }}
              className="text-right flex-shrink-0"
            >
              <div className="text-xs font-bold text-white/70">{range.label}</div>
              <div className="text-[10px] text-white/30">typical</div>
              {job.budget && <div className="text-[10px] text-amber-400 mt-1">budget ~${Math.round(job.budget / 100)}</div>}
            </motion.div>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-3 scroll-area">

        {/* Customer */}
        {job.customer && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl px-3.5 py-2.5 mb-3"
          >
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {job.customer.first_name[0]}{job.customer.last_name[0]}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{job.customer.first_name} {job.customer.last_name[0]}.</span>
                <span className="text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 rounded px-1.5 py-0.5 font-bold">Verified</span>
              </div>
              <div className="text-xs text-white/40">★ {job.customer.rating} · {job.customer.jobs_completed} jobs posted</div>
            </div>
            {isUrgent && (
              <span className="text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/20 rounded-md px-2 py-1">Urgent</span>
            )}
          </motion.div>
        )}

        {/* Photos */}
        {job.photos && job.photos.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mb-3">
            <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Photos from customer</div>
            <div className={`grid gap-1.5 rounded-xl overflow-hidden ${job.photos.length === 1 ? 'grid-cols-1' : job.photos.length === 2 ? 'grid-cols-2' : 'grid-cols-[2fr_1fr]'}`}>
              {job.photos.slice(0, 3).map((photo, i) => (
                <img
                  key={photo.id}
                  src={photo.url}
                  alt=""
                  className={`w-full object-cover bg-white/5 ${i === 0 && job.photos!.length > 2 ? 'aspect-square' : 'aspect-[4/3]'} rounded-lg`}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Full description */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-3">
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">What they need</div>
          <div className="text-sm text-white leading-relaxed">{job.full_description || job.description}</div>
        </motion.div>

        {/* Notes */}
        {job.notes && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.33 }} className="mb-3">
            <div className="flex gap-2.5 bg-amber-500/[0.06] border border-amber-500/15 rounded-xl p-3">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <div className="text-xs text-white/70 leading-relaxed">{job.notes}</div>
            </div>
          </motion.div>
        )}

        {/* AI Notice */}
        {job.ai_notice && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.36 }} className="mb-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">What we noticed</span>
            </div>
            <div className="bg-amber-500/[0.06] border border-amber-500/18 rounded-xl p-3">
              <div className="text-xs text-white leading-relaxed">{job.ai_notice}</div>
              <div className="text-[10px] text-white/30 mt-2">Your eyes on site are what matter — this is just a heads-up.</div>
            </div>
          </motion.div>
        )}

        {/* Bring list */}
        {job.bring && job.bring.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.38 }} className="mb-4">
            <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Suggested to bring</div>
            <div className="bg-white/[0.04] border border-white/8 rounded-xl p-3 flex flex-col gap-1.5">
              {job.bring.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-white/65">
                  <div className="w-1 h-1 rounded-full bg-white/30 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Fixed bottom buttons */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="flex-shrink-0 px-5 pb-8 pt-3 border-t border-white/[0.07] bg-[#0a0a0a] flex gap-2.5"
      >
        <Button variant="secondary" className="flex-1" onClick={onSkip}>Skip</Button>
        <Button className="flex-[2]" onClick={onAccept}>Accept job</Button>
      </motion.div>
    </motion.div>
  )
}
