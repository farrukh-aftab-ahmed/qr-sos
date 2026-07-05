import crypto from 'crypto';

const SIGNATURE_TOLERANCE_SECONDS = 300; // 5 minutes tolerance window to prevent replay attacks

/**
 * Verifies that a Paddle Billing webhook event payload matches its signature header.
 * 
 * @param rawBody - The raw text body (string) of the webhook request.
 * @param signatureHeader - The value of the 'paddle-signature' header.
 * @param secret - Your endpoint's webhook verification secret (starts with 'pdl_ntfset_').
 * @returns boolean - True if the signature is valid and recent, false otherwise.
 */
export function verifyPaddleSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string
): boolean {
  try {
    // 1. Split the signature header by semicolon
    const parts = signatureHeader.split(';');
    const tsPart = parts.find((p) => p.startsWith('ts='));
    const h1Part = parts.find((p) => p.startsWith('h1='));

    if (!tsPart || !h1Part) {
      console.warn('[Paddle Webhook] Missing ts or h1 parameter in signature header.');
      return false;
    }

    const ts = tsPart.split('=')[1];
    const h1 = h1Part.split('=')[1];

    if (!ts || !h1) {
      console.warn('[Paddle Webhook] Empty ts or h1 value in signature header.');
      return false;
    }

    // 2. Validate timestamp freshness to block replay attacks
    const timestamp = parseInt(ts, 10);
    if (isNaN(timestamp)) {
      console.warn('[Paddle Webhook] Timestamp component is not a valid number.');
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > SIGNATURE_TOLERANCE_SECONDS) {
      console.warn(`[Paddle Webhook] Timestamp expired. Event timestamp: ${timestamp}, Current time: ${now}`);
      return false;
    }

    // 3. Construct signed payload: 'timestamp:rawBody'
    const signedPayload = `${ts}:${rawBody}`;

    // 4. Compute SHA256 HMAC of the payload using webhook secret
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(signedPayload);
    const computedSignature = hmac.digest('hex');

    // 5. Compare using timing-safe comparison to prevent timing side-channel attacks
    const computedBuffer = Buffer.from(computedSignature, 'hex');
    const headerBuffer = Buffer.from(h1, 'hex');

    if (computedBuffer.length !== headerBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(computedBuffer, headerBuffer);
  } catch (error) {
    console.error('[Paddle Webhook] Signature verification failed with error:', error);
    return false;
  }
}
