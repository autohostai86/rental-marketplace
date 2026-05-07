import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

interface Payload {
  to: string
  message: string
}

serve(async (req) => {
  const { to, message }: Payload = await req.json()

  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')!
  const authToken  = Deno.env.get('TWILIO_AUTH_TOKEN')!
  const from       = Deno.env.get('TWILIO_PHONE_NUMBER')!

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          'Content-Type':  'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: to, From: from, Body: message }),
      }
    )
    const data = await res.json()
    return new Response(JSON.stringify({ success: true, sid: data.sid }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    // SMS failures must never crash the booking flow
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
