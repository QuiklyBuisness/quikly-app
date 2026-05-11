'use client'

import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export function GoOnlineOverlay({ visible }: { visible: boolean }) {
  const rippleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!visible || !rippleRef.current) return
    // Trigger ripple
    const el = rippleRef.current
    el.style.transition = 'transform 0.7s cubic-bezier(0.2,0.8,0.4,1), opacity 0.7s ease'
    el.style.transform = 'scale(5)'
    el.style.opacity = '0'
    return () => {
      el.style.transition = 'none'
      el.style.transform = 'scale(0)'
      el.style.opacity = '0.5'
    }
  }, [visible])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9995] bg-[#0a0a0a] flex flex-col items-center justify-center pointer-events-none"
        >
          {/* Ripple */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            <div
              ref={rippleRef}
              className="w-40 h-40 rounded-full bg-green-500/20"
              style={{ transform: 'scale(0)', opacity: 0.5 }}
            />
          </div>

          {/* Scan line */}
          <motion.div
            initial={{ top: '-2px' }}
            animate={{ top: '110%' }}
            transition={{ duration: 0.65, ease: 'easeIn' }}
            className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/50 to-transparent"
          />

          {/* Content */}
          <div className="relative z-10 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.05, duration: 0.4, type: 'spring', bounce: 0.3 }}
              className="w-20 h-20 rounded-full bg-green-400 flex items-center justify-center mx-auto mb-5"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18.36 6.64a9 9 0 11-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/>
              </svg>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
              className="text-[22px] font-black text-white tracking-tight"
            >
              You&apos;re online
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.38 }}
              className="text-sm text-green-400 mt-1.5"
            >
              Watching for jobs near you
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
