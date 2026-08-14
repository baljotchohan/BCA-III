const crypto = require('crypto');
const https = require('https');

function getFirebaseDbAuth() {
  const secret = process.env.FIREBASE_DATABASE_SECRET || process.env.ADMIN_SECRET || '';
  return secret ? `?auth=${encodeURIComponent(secret)}` : '';
}

function firebasePut(path, body) {
  return new Promise((resolve) => {
    const authQuery = getFirebaseDbAuth();
    const url = `https://bca2nd-5c622-default-rtdb.firebaseio.com/bca3/${path}.json${authQuery}`;
    const data = JSON.stringify(body);
    const options = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    const req = https.request(url, options, (res) => {
      let buf = '';
      res.on('data', d => { buf += d; });
      res.on('end', () => resolve(true));
    });
    req.on('error', () => resolve(false));
    req.write(data);
    req.end();
  });
}

function firebasePatch(path, body) {
  return new Promise((resolve) => {
    const authQuery = getFirebaseDbAuth();
    const url = `https://bca2nd-5c622-default-rtdb.firebaseio.com/bca3/${path}.json${authQuery}`;
    const data = JSON.stringify(body);
    const options = {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    const req = https.request(url, options, (res) => {
      let buf = '';
      res.on('data', d => { buf += d; });
      res.on('end', () => resolve(true));
    });
    req.on('error', () => resolve(false));
    req.write(data);
    req.end();
  });
}

module.exports = async function handler(req, res) {
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

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      console.error('CRITICAL: RAZORPAY_KEY_SECRET is not configured on the server');
      return res.status(500).json({ error: 'Payment gateway configuration error. Please contact administrator.' });
    }

    // Perform strict HMAC SHA-256 signature verification
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const providedBuffer = Buffer.from(razorpay_signature, 'utf8');

    const isVerified = (expectedBuffer.length === providedBuffer.length) &&
      crypto.timingSafeEqual(expectedBuffer, providedBuffer);

    if (!isVerified) {
      console.warn('Payment signature verification failed for order:', razorpay_order_id);
      return res.status(400).json({ success: false, error: 'Invalid payment signature. Verification failed.' });
    }

    const now = Date.now();

    if (uid && uid !== 'anonymous') {
      if (itemType === 'single_note' && itemId) {
        await firebasePatch(`users/${uid}/purchasedNotes/${itemId}`, {
          purchasedAt: now,
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          verified: true
        });
      } else if (itemType === 'subscription' && planTier) {
        let durationMs = 30 * 24 * 60 * 60 * 1000; // 30 days
        if (planTier === 'max') durationMs = 365 * 10 * 24 * 60 * 60 * 1000; // Lifetime (10 years)

        await firebasePatch(`users/${uid}/subscription`, {
          plan: planTier,
          status: 'active',
          activatedAt: now,
          validUntil: now + durationMs,
          razorpayPaymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id
        });
      }
    }

    // Log transaction order in Firebase RTDB orders log
    await firebasePut(`orders/${razorpay_order_id}`, {
      uid: uid || 'anonymous',
      itemType: itemType || 'single_note',
      itemId: itemId || null,
      planTier: planTier || null,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      timestamp: now,
      status: 'PAID'
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
