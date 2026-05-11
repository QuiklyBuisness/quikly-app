'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, Search, DollarSign, MessageSquare, User } from 'lucide-react'

const tabs = [
  { href: '/home',     label: 'Home',    icon: Home },
  { href: '/jobs',     label: 'Jobs',    icon: Search },
  { href: '/earnings', label: 'Earn',    icon: DollarSign },
  { href: '/messages', label: 'Msgs',    icon: MessageSquare },
  { href: '/profile',  label: 'Profile', icon: User },
]

export function WorkerTabBar() {
  const pathname = usePathname()

  return (
    <div className="flex-shrink-0 border-t border-white/[0.07] bg-[#0f0f0f]">
      <div className="flex items-center justify-around px-2 h-[60px]">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors',
                active ? 'text-white' : 'text-white/30'
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              <span className="text-[11px] font-semibold">{label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
