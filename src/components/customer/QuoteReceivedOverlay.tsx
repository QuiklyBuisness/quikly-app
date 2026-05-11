'use client'

import { motion } from 'framer-motion'
import { Quote } from '@/types'
import { formatCents, workerEarns, platformFee } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Shield } from 'lucide-react'

interface Props {
  quote: Quote
  onAccept: () => void
  onDismiss: () => void
}

export function QuoteReceivedOverlay({ quote, onAccept, onDismiss }: Props) {
  const worker = quote.worker
  const initials = worker ? `${worker.first_name[0]}${worker.last_name[0]}` : '?'
  const fee = platformFee(quote.amount)
  const workerGets = workerEarns(quote.amount)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9996] bg-[#0f0f0f] flex flex-col"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-4 pb-0 flex-shrink-0">
        <div className="text-sm text-white/40">Quote received</div>
        <button
          onClick={onDismiss}
          className="bg-[#1a1a1a] border border-white/10 rounded-full px-4 py-1.5 text-xs font-semibold text-white/55"
        >
          Later
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 overflow-hidden">

        {/* Avatar with pulse rings */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: 'spring', bounce: 0.35 }}
          className="relative mb-5"
        >
          <div className="absolute inset-0 -m-4 rounded-full border border-green-500/20 animate-ping" style={{ animationDuration: '1.4s' }} />
          <div className="absolute inset-0 -m-7 rounded-full border border-green-500/10 animate-ping" style={{ animationDuration: '1.4s', animationDelay: '0.25s' }} />
          <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-green-500/30 flex items-center justify-center text-2xl font-black relative z-10">
            {initials}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="text-[10px] font-bold text-green-400 uppercase tracking-widest mb-1"
        >
          Flat-rate quote
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="text-xl font-black mb-0.5"
        >
          {worker ? `${worker.first_name} ${worker.last_name[0]}.` : 'Worker'}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="text-sm text-white/40 mb-5"
        >
          ★ {worker?.rating || '5.0'} · {worker?.jobs_completed || 0} jobs · Verified
        </motion.div>

        {/* Big price */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, type: 'spring', bounce: 0.3 }}
          className="text-center mb-4"
        >
          <div className="text-[58px] font-black tracking-tight leading-none">{formatCents(quote.amount)}</div>
          <div className="text-sm text-white/40 mt-1">flat rate · locked if you accept</div>
        </motion.div>

        {/* Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
          className="w-full bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 mb-3"
        >
          <div className="flex justify-between text-sm text-white/55 mb-1.5">
            <span>Worker receives</span><span>{formatCents(workerGets)}</span>
          </div>
          <div className="flex justify-between text-sm text-white/55 mb-3">
            <span>Quikly fee</span><span>{formatCents(fee)}</span>
          </div>
          <div className="h-px bg-white/10 mb-3" />
          <div className="flex justify-between font-black text-base">
            <span>You pay</span><span>{formatCents(quote.amount)}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
          className="flex items-center gap-2 text-xs text-white/30"
        >
          <Shield size={12} />
          <span>Charged only after you confirm the job is done</span>
        </motion.div>
      </div>

      {/* Bottom actions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
        className="flex-shrink-0 px-5 pb-8 pt-3 flex flex-col gap-2.5"
      >
        <Button size="lg" onClick={onAccept}>
          Accept {formatCents(quote.amount)}
        </Button>
        <button
          onClick={onDismiss}
          className="text-white/40 text-sm py-2 font-medium"
        >
          Decline quote
        </button>
      </motion.div>
    </motion.div>
  )
}
