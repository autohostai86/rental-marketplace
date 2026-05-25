export type ItemStatus = 'draft' | 'available' | 'paused' | 'deleted' | 'rented_out'
export type ItemCondition = 'new' | 'like_new' | 'good' | 'fair'
export type BookingStatus = 'pending' | 'accepted' | 'rejected' | 'active' | 'completed' | 'cancelled'
export type DurationUnit = 'daily' | 'weekly' | 'monthly'
export type ReviewerRole = 'borrower' | 'lender'
export type NotificationType =
  | 'booking_request'
  | 'booking_accepted'
  | 'booking_rejected'
  | 'booking_cancelled'
  | 'rental_starting'
  | 'rental_completed'
  | 'review_received'
  | 'payment_reminder'

export interface Profile {
  id: string
  phone: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  locality: string
  upi_id: string | null
  is_verified: boolean
  avg_rating: number | null
  total_reviews: number
  created_at: string
  updated_at: string
}

export interface Item {
  id: string
  owner_id: string
  title: string
  description: string | null
  category: string
  condition: ItemCondition
  images: string[]
  inventory: number
  price_daily: number | null
  price_weekly: number | null
  price_monthly: number | null
  locality: string
  address_hint: string | null
  status: ItemStatus
  avg_rating: number | null
  total_reviews: number
  view_count: number
  created_at: string
  updated_at: string
  // joined
  owner?: Profile
}

export interface Booking {
  id: string
  item_id: string
  borrower_id: string
  lender_id: string
  duration_unit: DurationUnit
  duration_count: number
  start_datetime: string
  end_datetime: string
  price_per_unit: number
  total_price: number
  status: BookingStatus
  lender_note: string | null
  borrower_note: string | null
  payment_confirmed: boolean
  created_at: string
  updated_at: string
  // joined
  item?: Item
  borrower?: Profile
  lender?: Profile
}

export interface Review {
  id: string
  booking_id: string
  reviewer_id: string
  reviewee_id: string
  item_id: string | null
  role: ReviewerRole
  rating: number
  comment: string | null
  created_at: string
  // joined
  reviewer?: Profile
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string
  booking_id: string | null
  item_id: string | null
  is_read: boolean
  created_at: string
}

export const CATEGORIES = [
  'Toys',
  'Electronics',
  'Cables & Chargers',
  'Household Items',
  'Outdoor Equipment',
  'Hardware Tools',
  'Powerbanks',
  'Books',
  'Sports & Fitness',
  'Party & Events',
  'Stationery',
  'Office',
  'Others',
] as const

export type Category = (typeof CATEGORIES)[number]

export const DURATION_UNITS: { value: DurationUnit; label: string; shortLabel: string }[] = [
  { value: 'daily',   label: 'Per Day',   shortLabel: '/day' },
  { value: 'weekly',  label: 'Per Week',  shortLabel: '/wk'  },
  { value: 'monthly', label: 'Per Month', shortLabel: '/mo'  },
]

export const ITEM_CONDITIONS: { value: ItemCondition; label: string }[] = [
  { value: 'new',       label: 'New'       },
  { value: 'like_new',  label: 'Like New'  },
  { value: 'good',      label: 'Good'      },
  { value: 'fair',      label: 'Fair'      },
]
