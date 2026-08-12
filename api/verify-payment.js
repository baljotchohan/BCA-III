const crypto = require('crypto');

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      uid,
      itemType,
      itemId,
      planTier
    } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing required Razorpay payment verification parameters' });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET || '6m1RH27SVzDPedct3EKjWEkY';

    // HMAC SHA-256 verification
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isVerified = (generatedSignature === razorpay_signature) || keySecret === 'dummyKeySecret';

    if (!isVerified) {
      return res.status(400).json({ success: false, error: 'Invalid Razorpay signature. Payment verification failed.' });
    }

    // Update Firebase Realtime Database via REST API
    const rtdbBaseUrl = 'https://bca2nd-5c622-default-rtdb.firebaseio.com/bca3';
    const now = Date.now();

    if (uid && uid !== 'anonymous') {
      if (itemType === 'single_note' && itemId) {
        // Record single note purchase
        const notePurchaseUrl = `${rtdbBaseUrl}/users/${uid}/purchasedNotes/${itemId}.json`;
        await fetch(notePurchaseUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            purchasedAt: now,
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            verified: true
          })
        });
      } else if (itemType === 'subscription' && planTier) {
        // Compute validUntil based on plan tier
        let durationMs = 30 * 24 * 60 * 60 * 1000; // 30 days
        if (planTier === 'max') durationMs = 365 * 10 * 24 * 60 * 60 * 1000; // Lifetime (10 years)

        const subUrl = `${rtdbBaseUrl}/users/${uid}/subscription.json`;
        await fetch(subUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan: planTier,
            status: 'active',
            activatedAt: now,
            validUntil: now + durationMs,
            razorpayPaymentId: razorpay_payment_id,
            razorpayOrderId: razorpay_order_id
          })
        });
      }
    }

    // Log transaction order in Firebase RTDB orders log
    const orderLogUrl = `${rtdbBaseUrl}/orders/${razorpay_order_id}.json`;
    await fetch(orderLogUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: uid || 'anonymous',
        itemType: itemType || 'single_note',
        itemId: itemId || null,
        planTier: planTier || null,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        timestamp: now,
        status: 'PAID'
      })
    });

    return res.status(200).json({
      success: true,
      message: 'Payment verified and access granted successfully!',
      details: {
        uid,
        itemType,
        itemId,
        planTier,
        paymentId: razorpay_payment_id
      }
    });

  } catch (error) {
    console.error('Razorpay Payment Verification Error:', error);
    return res.status(500).json({
      error: 'Failed to verify payment signature',
      details: error.message
    });
  }
};
