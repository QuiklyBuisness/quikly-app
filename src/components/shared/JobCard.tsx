'use client'

import { Job, PRICE_RANGES } from '@/types'
import { formatDistance, distanceMiles } from '@/lib/distance'
import { formatCents } from '@/lib/utils'
import { cn } from '@/lib/utils'

const CATEGORY_EMOJI: Record<string, string> = {
  moving: '📦', cleaning: '🧹', handyman: '🔧', assembly: '🪑',
  plumbing: '🚿', electrical: '⚡', junk: '🗑️', lawn: '🌿',
  painting: '🖌️', hvac: '❄️',
}

interface JobCardProps {
  job: Job
  mode: 'customer' | 'worker'
  workerLat?: number
  workerLng?: number
  onClick: () => void
  onAction: () => void
}

export function JobCard({ job, mode, workerLat, workerLng, onClick, onAction }: JobCardProps) {
  const emoji = CATEGORY_EMOJI[job.category] || '⚡'
  const range = PRICE_RANGES[job.category]
  const dist = workerLat && workerLng && job.lat && job.lng
    ? distanceMiles(workerLat, workerLng, job.lat, job.lng)
    : null

  const isUrgent = job.urgency === 'now'

  return (
    <div
      onClick={onClick}
      className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 mb-2.5 cursor-pointer active:scale-[0.99] transition-transform"
    >
      {/* Header row */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-11 h-11 rounded-xl bg-[#222] flex items-center justify-center text-xl flex-shrink-0">
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm mb-0.5 truncate">{job.title}</div>
          <div className="text-xs text-white/55">
            {dist !== null ? `${formatDistance(dist)} · ` : ''}{job.address?.split(',')[1]?.trim() || 'Brooklyn'}
            {' · '}{job.urgency === 'now' ? 'ASAP' : job.urgency === 'today' ? 'Today' : 'Scheduled'}
          </div>
          {isUrgent && (
            <div className="text-xs text-green-400 font-medium mt-0.5">Workers nearby</div>
          )}
        </div>

        {/* Price column */}
        {mode === 'worker' ? (
          <div className="text-right flex-shrink-0">
            <div className="text-xs font-bold text-white">{range?.label || '—'}</div>
            <div className="text-[10px] text-white/30 mt-0.5">typical</div>
            {job.budget && (
              <div className="text-[10px] text-amber-400 mt-1">budget ~{formatCents(job.budget)}</div>
            )}
          </div>
        ) : (
          <div className="text-right flex-shrink-0">
            {job.locked_price ? (
              <>
                <div className="text-base font-bold">{formatCents(job.locked_price)}</div>
                <div className="text-[10px] text-white/40">locked</div>
              </>
            ) : (
              <div className="text-xs text-white/40">awaiting quote</div>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      <div className="text-xs text-white/55 bg-[#222] rounded-xl p-2.5 mb-3 leading-relaxed line-clamp-2">
        {job.description}
      </div>

      {/* Tags + action */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {job.urgency === 'now' && (
            <span className="text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/20 rounded-md px-2 py-0.5">Urgent</span>
          )}
          {job.category === 'plumbing' || job.category === 'electrical' ? (
            <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/15 rounded-md px-2 py-0.5">Licensed</span>
          ) : null}
          {job.photos && job.photos.length > 0 && (
            <span className="text-[10px] text-white/40">{job.photos.length} photo{job.photos.length > 1 ? 's' : ''}</span>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onAction() }}
          className={cn(
            'text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors flex-shrink-0',
            mode === 'worker'
              ? 'border-white/15 text-white/70 hover:border-white/30 bg-[#222]'
              : 'border-white/15 text-white/70 hover:border-white/30 bg-[#222]'
          )}
        >
          {mode === 'worker' ? 'Send quote' : 'View quotes'}
        </button>
      </div>
    </div>
  )
}
