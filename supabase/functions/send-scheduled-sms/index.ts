import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const VERCEL_API_URL = Deno.env.get('VERCEL_API_URL') || 'https://your-app.vercel.app'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const CRON_SECRET_KEY = Deno.env.get('CRON_SECRET_KEY')!

serve(async (req) => {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    // Verify cron secret key
    const authHeader = req.headers.get('Authorization')
    const expectedAuth = `Bearer ${CRON_SECRET_KEY}`
    
    if (!authHeader || authHeader !== expectedAuth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Create Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Find all customers with scheduled SMS that should be sent now
    const now = new Date().toISOString()
    const { data: scheduledCustomers, error: fetchError } = await supabase
      .from('customers')
      .select('id, user_id, scheduled_send_at')
      .eq('sms_status', 'scheduled')
      .lte('scheduled_send_at', now)
      .not('scheduled_send_at', 'is', null)
      .limit(50) // Process max 50 at a time to avoid timeout

    if (fetchError) {
      console.error('Error fetching scheduled customers:', fetchError)
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!scheduledCustomers || scheduledCustomers.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No scheduled SMS to send', processed: 0 }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${scheduledCustomers.length} scheduled SMS to process`)

    // Process each scheduled SMS
    const results = await Promise.allSettled(
      scheduledCustomers.map(async (customer) => {
        try {
          // Call the Vercel /api/send-sms endpoint
          const response = await fetch(`${VERCEL_API_URL}/api/send-sms`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // We need to pass the user ID for auth
              'x-user-id': customer.user_id,
            },
            body: JSON.stringify({ customerId: customer.id }),
          })

          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Failed to send SMS: ${response.status} - ${errorText}`)
          }

          const result = await response.json()
          console.log(`Successfully sent SMS for customer ${customer.id}`)
          return { customerId: customer.id, success: true, result }
        } catch (error) {
          console.error(`Error sending SMS for customer ${customer.id}:`, error)
          
          // Update customer status to 'pending' with error log
          await supabase
            .from('customers')
            .update({
              sms_status: 'pending',
              scheduled_send_at: null,
            })
            .eq('id', customer.id)

          return { customerId: customer.id, success: false, error: error.message }
        }
      })
    )

    const successful = results.filter((r) => r.status === 'fulfilled' && r.value.success).length
    const failed = results.length - successful

    return new Response(
      JSON.stringify({
        message: 'Processed scheduled SMS',
        processed: results.length,
        successful,
        failed,
        results: results.map((r) => r.status === 'fulfilled' ? r.value : { error: r.reason }),
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in send-scheduled-sms function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

