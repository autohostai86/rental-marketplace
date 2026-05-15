'use client'

import { useEffect, useState } from 'react'

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  expired: boolean
}

function calculate(endDatetime: string): TimeLeft {
  const diff = new Date(endDatetime).getTime() - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
  const totalSeconds = Math.floor(diff / 1000)
  return {
    days:    Math.floor(totalSeconds / 86400),
    hours:   Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    expired: false,
  }
}

export default function CountdownTimer({ endDatetime }: { endDatetime: string }) {
  const [time, setTime] = useState<TimeLeft>(() => calculate(endDatetime))

  useEffect(() => {
    const interval = setInterval(() => setTime(calculate(endDatetime)), 1000)
    return () => clearInterval(interval)
  }, [endDatetime])

  const msLeft = new Date(endDatetime).getTime() - Date.now()
  const colorClass =
    time.expired          ? 'text-red-600' :
    msLeft < 3600_000     ? 'text-red-600' :
    msLeft < 86400_000    ? 'text-amber-600' :
    'text-black'

  if (time.expired) {
    return <span className="font-mono font-bold text-red-600">Time&apos;s up</span>
  }

  const parts = []
  if (time.days > 0)                         parts.push(`${time.days}d`)
  if (time.days > 0 || time.hours > 0)       parts.push(`${time.hours}h`)
  parts.push(`${String(time.minutes).padStart(2, '0')}m`)
  parts.push(`${String(time.seconds).padStart(2, '0')}s`)

  return (
    <span className={`font-mono font-bold tabular-nums ${colorClass}`}>
      {parts.join(' ')}
    </span>
  )
}
