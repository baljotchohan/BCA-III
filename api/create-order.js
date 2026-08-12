const Razorpay = require('razorpay');

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
    const { amount, itemType, itemId, planTier, uid } = req.body || {};

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid or missing amount' });
    }

    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_live_TOvSIy2L3J3ply';
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      return res.status(500).json({ error: 'Server configuration error: RAZORPAY_KEY_SECRET environment variable is missing.' });
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });

    const amountInPaise = Math.round(Number(amount) * 100);

    const crypto = require('crypto');
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      notes: {
        uid: uid || 'anonymous',
        itemType: itemType || 'single_note',
        itemId: itemId || '',
        planTier: planTier || ''
      }
    };

    const order = await razorpay.orders.create(options);

    return res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: keyId
    });
  } catch (error) {
    console.error('Razorpay Order Creation Error:', error);
    return res.status(500).json({
      error: 'Failed to create payment order',
      details: error.message
    });
  }
};
