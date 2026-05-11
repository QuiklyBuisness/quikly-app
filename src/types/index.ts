export type Role = 'customer' | 'worker'
export type VerificationStatus = 'pending' | 'approved' | 'rejected'
export type JobUrgency = 'now' | 'today' | 'scheduled'
export type JobStatus = 'open' | 'quoted' | 'accepted' | 'active' | 'scope_changed' | 'complete' | 'paid' | 'cancelled'
export type QuoteStatus = 'pending' | 'accepted' | 'declined' | 'expired'
export type PaymentStatus = 'held' | 'released' | 'refunded'
export type ScopeStatus = 'pending' | 'accepted' | 'cancelled'

export interface Profile {
  id: string
  role: Role
  first_name: string
  last_name: string
  legal_name?: string
  avatar_url?: string
  phone?: string
  gender?: string
  skills?: string[]
  rating: number
  jobs_completed: number
  verification_status: VerificationStatus
  stripe_account_id?: string
  stripe_customer_id?: string
  radius_miles: number
  lat?: number
  lng?: number
  neighborhoods?: string[]
  created_at: string
}

export interface Job {
  id: string
  customer_id: string
  title: string
  description: string
  full_description?: string
  category: string
  urgency: JobUrgency
  status: JobStatus
  lat?: number
  lng?: number
  address?: string
  scheduled_for?: string
  budget?: number
  locked_price?: number
  ai_notice?: string
  notes?: string
  bring?: string[]
  created_at: string
  customer?: Profile
  photos?: JobPhoto[]
  quotes?: Quote[]
  active_quote?: Quote
}

export interface JobPhoto {
  id: string
  job_id: string
  url: string
  type: 'photo' | 'video'
  order: number
}

export interface Quote {
  id: string
  job_id: string
  worker_id: string
  amount: number
  includes?: string
  eta: 'now' | '1hr' | 'today'
  status: QuoteStatus
  created_at: string
  worker?: Profile
}

export interface ScopeChange {
  id: string
  job_id: string
  worker_id: string
  reason: string
  photo_url?: string
  original_price: number
  new_price: number
  status: ScopeStatus
  created_at: string
}

export interface Message {
  id: string
  job_id: string
  sender_id: string
  body: string
  read_at?: string
  created_at: string
  sender?: Profile
}

export interface Review {
  id: string
  job_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  comment?: string
  created_at: string
}

export interface Payment {
  id: string
  job_id: string
  customer_id: string
  worker_id: string
  stripe_payment_intent_id: string
  amount: number
  platform_fee: number
  worker_payout: number
  status: PaymentStatus
  created_at: string
}

// Skill categories
export const SKILLS = [
  { id: 'moving',     label: 'Moving',       emoji: '📦', desc: 'Lifting, hauling' },
  { id: 'cleaning',   label: 'Cleaning',     emoji: '🧹', desc: 'Home & deep clean' },
  { id: 'handyman',   label: 'Handyman',     emoji: '🔧', desc: 'Repairs & installs' },
  { id: 'assembly',   label: 'Assembly',     emoji: '🪑', desc: 'Furniture, IKEA' },
  { id: 'plumbing',   label: 'Plumbing',     emoji: '🚿', desc: 'Pipes, fixtures' },
  { id: 'electrical', label: 'Electrical',   emoji: '⚡', desc: 'Outlets, fixtures' },
  { id: 'junk',       label: 'Junk removal', emoji: '🗑️', desc: 'Haul & dispose' },
  { id: 'lawn',       label: 'Lawn care',    emoji: '🌿', desc: 'Mowing, trimming' },
  { id: 'painting',   label: 'Painting',     emoji: '🖌️', desc: 'Interior & exterior' },
  { id: 'hvac',       label: 'HVAC',         emoji: '❄️', desc: 'AC & heating' },
] as const

export type SkillId = typeof SKILLS[number]['id']

// Market rate ranges by category (cents)
export const PRICE_RANGES: Record<string, { min: number; max: number; label: string }> = {
  handyman:   { min: 7500,  max: 20000, label: '$75 – $200' },
  plumbing:   { min: 8000,  max: 25000, label: '$80 – $250' },
  electrical: { min: 9000,  max: 30000, label: '$90 – $300' },
  cleaning:   { min: 10000, max: 22000, label: '$100 – $220' },
  moving:     { min: 12000, max: 28000, label: '$120 – $280' },
  assembly:   { min: 6000,  max: 15000, label: '$60 – $150' },
  junk:       { min: 8000,  max: 20000, label: '$80 – $200' },
  lawn:       { min: 6000,  max: 18000, label: '$60 – $180' },
  painting:   { min: 15000, max: 40000, label: '$150 – $400' },
  hvac:       { min: 10000, max: 35000, label: '$100 – $350' },
}

export const PLATFORM_FEE = 0.10  // 10%
