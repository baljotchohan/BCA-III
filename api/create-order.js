const https = require('https');
const crypto = require('crypto');

function createRazorpayOrderViaHttp(keyId, keySecret, orderPayload) {
  return new Promise((resolve, reject) => {
    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const data = JSON.stringify(orderPayload);

    const options = {
      hostname: 'api.razorpay.com',
      port: 443,
      path: '/v1/orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization': authHeader
      }
    };

    const req = https.request(options, (res) => {
      let buf = '';
      res.on('data', d => { buf += d; });
      res.on('end', () => {
        try {
          const json = JSON.parse(buf);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            reject(new Error((json.error && json.error.description) || buf));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(data);
    req.end();
  });
}

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
    const keySecret = process.env.RAZORPAY_KEY_SECRET || '';

    const amountInPaise = Math.round(Number(amount) * 100);

    const orderPayload = {
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

    let order = null;
    if (keyId && keySecret) {
      try {
        order = await createRazorpayOrderViaHttp(keyId, keySecret, orderPayload);
      } catch (httpErr) {
        console.warn('Razorpay Direct API notice:', httpErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      orderId: (order && order.id) ? order.id : null,
      amount: (order && order.amount) ? order.amount : amountInPaise,
      currency: (order && order.currency) ? order.currency : 'INR',
      keyId: keyId
    });

  } catch (error) {
    console.error('Create Razorpay Order Error:', error);
    return res.status(500).json({
      error: 'Failed to create Razorpay order',
      details: error.message
    });
  }
};
