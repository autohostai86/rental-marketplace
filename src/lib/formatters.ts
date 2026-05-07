import { formatDistanceToNow, format } from 'date-fns'
import type { DurationUnit } from '@/types'

export function formatPrice(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
}

export function formatDurationUnit(unit: DurationUnit): string {
  const map: Record<DurationUnit, string> = {
    hourly: '/hr', daily: '/day', weekly: '/wk', monthly: '/mo',
  }
  return map[unit]
}

export function formatRelativeTime(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
}

export function formatDatetime(dateStr: string): string {
  return format(new Date(dateStr), 'dd MMM yyyy, h:mm a')
}

export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'dd MMM yyyy')
}

export function maskPhone(phone: string): string {
  if (phone.length < 5) return phone
  return phone.slice(0, -4).replace(/\d/g, '*') + phone.slice(-4)
}
