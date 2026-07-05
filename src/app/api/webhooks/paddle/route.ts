import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPaddleSignature } from '@/lib/paddle';

export async function POST(req: NextRequest) {
  try {
    // 1. Retrieve raw text body to avoid formatting/whitespace changes that invalidate the signature
    const rawBody = await req.text();
    const signature = req.headers.get('paddle-signature') || '';
    const secret = process.env.PADDLE_WEBHOOK_SECRET || '';

    if (!secret) {
      console.error('[Paddle Webhook] PADDLE_WEBHOOK_SECRET environment variable is missing.');
      return NextResponse.json({ error: 'Webhook secret is not configured' }, { status: 500 });
    }

    if (!signature) {
      console.warn('[Paddle Webhook] Missing paddle-signature header.');
      return NextResponse.json({ error: 'Missing signature header' }, { status: 400 });
    }

    // 2. Validate cryptographic signature using standard timing-safe comparison
    const isValid = verifyPaddleSignature(rawBody, signature, secret);
    if (!isValid) {
      console.warn('[Paddle Webhook] Invalid webhook signature detected.');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 3. Parse JSON event payload
    const event = JSON.parse(rawBody);
    const eventType = event.event_type;
    const data = event.data;

    console.log(`[Paddle Webhook] Received verified event: ${eventType} (Event ID: ${event.event_id})`);

    // 4. Extract custom data (attached on client-side checkout trigger)
    const customData = data?.custom_data || {};
    const userId = customData.userId || customData.user_id;

    if (!userId) {
      console.warn(`[Paddle Webhook] No userId found in custom_data for event ${eventType}. Payload:`, customData);
      // Respond 200 OK to stop Paddle from retrying events that do not target active platform users
      return NextResponse.json({ received: true, message: 'No userId found in custom data' }, { status: 200 });
    }

    // 5. Update user database record based on the event type
    if (eventType === 'transaction.completed') {
      // Handles transaction completion for the QR code purchase
      const customerId = data.customer_id;
      const transactionId = data.id; // The transaction ID (txn_...)
      const subscriptionId = data.subscription_id; // Present if transaction belongs to a subscription
      
      // Update payment status to 'completed' for one-time payments
      await prisma.user.update({
        where: { id: userId },
        data: {
          paddleCustomerId: customerId,
          paddleSubscriptionId: subscriptionId || transactionId,
          paymentStatus: 'completed', // Explicitly mark as completed to unlock the QR code
        },
      });

      console.log(`[Paddle Webhook] Processed transaction.completed to unlock QR code for user ${userId}`);
    } 
    else if (eventType.startsWith('subscription.')) {
      // Fallback/Subscription compatibility (e.g. subscription.created, subscription.updated)
      const customerId = data.customer_id;
      const subscriptionId = data.id;
      const status = data.status; // e.g. active, trialing, past_due, canceled, paused
      
      const endsAtStr = data.current_billing_period?.ends_at;
      const subscriptionEndsAt = endsAtStr ? new Date(endsAtStr) : null;

      await prisma.user.update({
        where: { id: userId },
        data: {
          paddleCustomerId: customerId,
          paddleSubscriptionId: subscriptionId,
          paymentStatus: status,
          subscriptionEndsAt: subscriptionEndsAt,
        },
      });

      console.log(`[Paddle Webhook] Updated subscription state for user ${userId}. Status: ${status}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('[Paddle Webhook] Error handling incoming webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
