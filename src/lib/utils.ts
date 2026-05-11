import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCents(cents: number): string {
  return '$' + (cents / 100).toFixed(0)
}

export function workerEarns(cents: number): number {
  return Math.round(cents * 0.9)
}

export function platformFee(cents: number): number {
  return Math.round(cents * 0.1)
}
