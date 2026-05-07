import { addHours, addDays, addWeeks, addMonths } from 'date-fns'
import type { DurationUnit, Item } from '@/types'

export function getPriceForUnit(item: Item, unit: DurationUnit): number | null {
  const map: Record<DurationUnit, number | null> = {
    hourly:  item.price_hourly  ?? null,
    daily:   item.price_daily   ?? null,
    weekly:  item.price_weekly  ?? null,
    monthly: item.price_monthly ?? null,
  }
  return map[unit]
}

export function calculateEndDatetime(start: Date, unit: DurationUnit, count: number): Date {
  const fns = { hourly: addHours, daily: addDays, weekly: addWeeks, monthly: addMonths }
  return fns[unit](start, count)
}

export function calculateTotalPrice(pricePerUnit: number, count: number): number {
  return Math.round(pricePerUnit * count * 100) / 100
}

export function getLowestPrice(item: Item): { price: number; unit: DurationUnit } | null {
  const options: { price: number; unit: DurationUnit }[] = []
  if (item.price_hourly  != null) options.push({ price: item.price_hourly,  unit: 'hourly'  })
  if (item.price_daily   != null) options.push({ price: item.price_daily,   unit: 'daily'   })
  if (item.price_weekly  != null) options.push({ price: item.price_weekly,  unit: 'weekly'  })
  if (item.price_monthly != null) options.push({ price: item.price_monthly, unit: 'monthly' })
  if (options.length === 0) return null
  return options.reduce((min, o) => (o.price < min.price ? o : min))
}

export function getAvailableUnits(item: Item): DurationUnit[] {
  const units: DurationUnit[] = []
  if (item.price_hourly  != null) units.push('hourly')
  if (item.price_daily   != null) units.push('daily')
  if (item.price_weekly  != null) units.push('weekly')
  if (item.price_monthly != null) units.push('monthly')
  return units
}
