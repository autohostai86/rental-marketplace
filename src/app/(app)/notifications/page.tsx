import { createClient } from '@/lib/supabase/server'
import { formatRelativeTime } from '@/lib/formatters'
import { redirect } from 'next/navigation'
import type { Notification } from '@/types'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  // Mark all as read
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  const items = (notifications ?? []) as Notification[]

  // Lender notification types — link to lend dashboard
  const lenderTypes = new Set(['booking_request', 'booking_cancelled', 'payment_reminder'])

  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-bold text-black mb-4">Notifications</h1>

      {items.length === 0 ? (
        <p className="text-center text-gray-300 py-16 text-sm">No notifications yet</p>
      ) : (
        <div className="space-y-1">
          {items.map((n) => (
            <NotificationItem key={n.id} notification={n} isLenderNotif={lenderTypes.has(n.type)} />
          ))}
        </div>
      )}
    </div>
  )
}

function NotificationItem({ notification: n, isLenderNotif }: { notification: Notification; isLenderNotif: boolean }) {
  const iconMap: Record<string, string> = {
    booking_request:  '📬',
    booking_accepted: '✅',
    booking_rejected: '❌',
    booking_cancelled:'↩️',
    rental_starting:  '⏰',
    rental_completed: '🎉',
    review_received:  '⭐',
    payment_reminder: '💳',
  }

  // Lender notifications go to /lend, borrower notifications go to /bookings
  const href = n.booking_id
    ? isLenderNotif ? `/lend/${n.booking_id}` : `/bookings/${n.booking_id}`
    : n.item_id ? `/items/${n.item_id}` : undefined

  const content = (
    <div className={`flex items-start gap-3 p-3 rounded-xl ${n.is_read ? 'bg-white' : 'bg-gray-50 border border-gray-100'}`}>
      <span className="text-xl shrink-0 mt-0.5">{iconMap[n.type] ?? '🔔'}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${n.is_read ? 'text-gray-700' : 'text-black'}`}>{n.title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{n.body}</p>
        <p className="text-xs text-gray-300 mt-1">{formatRelativeTime(n.created_at)}</p>
      </div>
      {!n.is_read && <span className="w-2 h-2 rounded-full bg-black shrink-0 mt-1.5" />}
    </div>
  )

  if (href) return <a href={href}>{content}</a>
  return content
}
