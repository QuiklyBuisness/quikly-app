'use client'

import { useEffect, useState } from 'react'
import { Job, Profile, PRICE_RANGES } from '@/types'
import { JobCard } from '@/components/shared/JobCard'
import { distanceMiles } from '@/lib/distance'
import { cn } from '@/lib/utils'

type Urgency = 'now' | 'today' | 'scheduled'

const TABS: { key: Urgency; label: string }[] = [
  { key: 'now', label: 'Now' },
  { key: 'today', label: 'Today' },
  { key: 'scheduled', label: 'Scheduled' },
]

export function WorkerJobsBrowse({ profile }: { profile: Profile }) {
  const [urgency, setUrgency] = useState<Urgency>('today')
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const res = await fetch(`/api/jobs?urgency=${urgency}&role=worker`)
      const data = await res.json()
      let filtered: Job[] = data.jobs || []

      // Filter by skills
      const skills = profile.skills || []
      if (skills.length) filtered = filtered.filter(j => skills.includes(j.category))

      // Filter by radius and sort by distance
      if (profile.lat && profile.lng) {
        filtered = filtered
          .filter(j => {
            if (!j.lat || !j.lng) return true
            return distanceMiles(profile.lat ?? 40.7135, profile.lng ?? -73.9541, j.lat, j.lng) <= (profile.radius_miles || 2)
          })
          .sort((a, b) => {
            if (!a.lat || !b.lat) return 0
            return distanceMiles(profile.lat ?? 40.7135, profile.lng ?? -73.9541, a.lat ?? 0, a.lng ?? 0) -
                   distanceMiles(profile.lat ?? 40.7135, profile.lng ?? -73.9541, b.lat ?? 0, b.lng ?? 0)
          })
      }

      setJobs(filtered)
      setLoading(false)
    }
    load()
  }, [urgency, profile])

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-5 pt-2 pb-0">
        <div className="text-lg font-black mb-3">Browse Jobs</div>
        <div className="flex border-b border-white/10">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setUrgency(key)}
              className={cn(
                'flex-1 pb-2.5 text-sm font-semibold transition-colors',
                urgency === key
                  ? 'text-white border-b-2 border-white'
                  : 'text-white/40'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-3 scroll-area">
        {urgency === 'now' && (
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-400 pulse" />
              <div className="text-sm font-bold text-green-400">Urgent jobs come to you</div>
            </div>
            <div className="text-xs text-white/55 leading-relaxed">
              Go online on Home and we'll send you the nearest matching job instantly. You have 60 seconds to accept.
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-2.5">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-[#1a1a1a] rounded-2xl h-36 animate-pulse" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center pt-12">
            <div className="text-5xl mb-3">🔍</div>
            <div className="text-base font-bold mb-2">No jobs matching your skills</div>
            <div className="text-sm text-white/40">Try expanding your radius in Profile → Availability</div>
          </div>
        ) : (
          jobs.map(job => (
            <JobCard
              key={job.id}
              job={job}
              mode="worker"
              workerLat={profile.lat}
              workerLng={profile.lng}
              onClick={() => {/* open detail sheet */}}
              onAction={() => {/* open quote sheet */}}
            />
          ))
        )}
      </div>
    </div>
  )
}
