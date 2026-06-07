// ── Luxe Flame — Email Notification API ──────────────────────
// Vercel Serverless Function (Node.js)
//
// Required env vars (Vercel → Project Settings → Environment Variables):
//   RESEND_API_KEY  — from resend.com (free: 100 emails/day)
//   ADMIN_EMAIL     — where new-order alerts are sent (your inbox)
//
// Optional env vars:
//   STORE_NAME      — defaults to "Luxe Flame"
//   STORE_FROM      — defaults to "onboarding@resend.dev"
//                     (replace with your verified domain once set up)
// ─────────────────────────────────────────────────────────────

const RESEND_URL = 'https://api.resend.com/emails';

function egp(n) {
  return `${Number(n).toLocaleString('en-EG', { minimumFractionDigits: 0 })} ج.م`;
}

function buildItemRows(items = []) {
  return items.map(i => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #2a2520;color:#f5f0e8;font-size:14px;">${i.name}</td>
      <td style="padding:10px 0;border-bottom:1px solid #2a2520;color:#c9a96e;text-align:center;font-size:14px;">×${i.qty}</td>
      <td style="padding:10px 0;border-bottom:1px solid #2a2520;color:#c9a96e;text-align:right;font-size:14px;">${egp(i.price * i.qty)}</td>
    </tr>`).join('');
}

function adminEmailHtml({ customer_name, customer_email, customer_phone, customer_address, items, total, notes, storeName }) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0d0c0b;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:580px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="font-size:26px;color:#c9a96e;font-weight:300;letter-spacing:0.1em;margin:0;">${storeName}</h1>
      <p style="color:#7a7060;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;margin:6px 0 0;">New Order Received 🕯</p>
    </div>
    <div style="background:#131210;border:1px solid rgba(201,169,110,0.2);border-radius:16px;padding:28px;margin-bottom:20px;">
      <h2 style="color:#f5f0e8;font-size:15px;font-weight:600;margin:0 0 18px;letter-spacing:0.05em;">Customer Details</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="color:#7a7060;font-size:12px;padding:5px 0;width:38%;">Name</td><td style="color:#f5f0e8;font-size:13px;">${customer_name}</td></tr>
        <tr><td style="color:#7a7060;font-size:12px;padding:5px 0;">Email</td><td style="color:#f5f0e8;font-size:13px;">${customer_email}</td></tr>
        <tr><td style="color:#7a7060;font-size:12px;padding:5px 0;">Phone</td><td style="color:#f5f0e8;font-size:13px;">${customer_phone || '—'}</td></tr>
        <tr><td style="color:#7a7060;font-size:12px;padding:5px 0;">Address</td><td style="color:#f5f0e8;font-size:13px;">${customer_address || '—'}</td></tr>
        ${notes ? `<tr><td style="color:#7a7060;font-size:12px;padding:5px 0;vertical-align:top;">Notes</td><td style="color:#f5f0e8;font-size:13px;">${notes}</td></tr>` : ''}
      </table>
    </div>
    <div style="background:#131210;border:1px solid rgba(201,169,110,0.2);border-radius:16px;padding:28px;">
      <h2 style="color:#f5f0e8;font-size:15px;font-weight:600;margin:0 0 14px;letter-spacing:0.05em;">Order Items</h2>
      <table style="width:100%;border-collapse:collapse;">
        ${buildItemRows(items)}
        <tr>
          <td colspan="2" style="padding:16px 0 0;color:#c9a96e;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;">Total</td>
          <td style="padding:16px 0 0;color:#c9a96e;font-size:22px;text-align:right;font-weight:500;">${egp(total)}</td>
        </tr>
      </table>
    </div>
    <p style="color:#3a3530;font-size:11px;text-align:center;margin-top:28px;">
      Manage at <a href="https://luxe-flame-one.vercel.app/admin" style="color:#c9a96e;">luxe-flame-one.vercel.app/admin</a>
    </p>
  </div>
</body></html>`;
}

function customerEmailHtml({ customer_name, items, total, storeName }) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0d0c0b;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:580px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:36px;">
      <h1 style="font-size:26px;color:#c9a96e;font-weight:300;letter-spacing:0.1em;margin:0;">${storeName}</h1>
      <p style="color:#7a7060;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;margin:6px 0 0;">Handcrafted Luxury Candles</p>
    </div>
    <div style="background:#131210;border:1px solid rgba(201,169,110,0.2);border-radius:16px;padding:36px;text-align:center;margin-bottom:20px;">
      <div style="font-size:44px;margin-bottom:16px;">🕯️</div>
      <h2 style="color:#f5f0e8;font-size:22px;font-weight:300;margin:0 0 12px;">Order Confirmed!</h2>
      <p style="color:#7a7060;font-size:14px;line-height:1.8;margin:0;">
        Thank you, <strong style="color:#f5f0e8;">${customer_name}</strong>.<br>
        Your order has been received. We'll be in touch shortly to arrange delivery.
      </p>
    </div>
    <div style="background:#131210;border:1px solid rgba(201,169,110,0.2);border-radius:16px;padding:28px;margin-bottom:20px;">
      <h3 style="color:#c9a96e;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;margin:0 0 16px;">Your Order</h3>
      <table style="width:100%;border-collapse:collapse;">
        ${buildItemRows(items)}
        <tr>
          <td colspan="2" style="padding:16px 0 0;color:#c9a96e;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;">Total</td>
          <td style="padding:16px 0 0;color:#c9a96e;font-size:22px;text-align:right;">${egp(total)}</td>
        </tr>
      </table>
    </div>
    <div style="background:#131210;border:1px solid rgba(201,169,110,0.2);border-radius:16px;padding:20px;text-align:center;">
      <p style="color:#7a7060;font-size:13px;margin:0;">
        Questions? <a href="mailto:info@luxe-flame.com" style="color:#c9a96e;">info@luxe-flame.com</a>
      </p>
    </div>
    <p style="color:#3a3530;font-size:11px;text-align:center;margin-top:24px;">© 2026 ${storeName} · Egypt 🇪🇬</p>
  </div>
</body></html>`;
}

async function sendEmail({ from, to, subject, html, apiKey }) {
  const res = await fetch(RESEND_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, html })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Resend error ${res.status}`);
  return data;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const ADMIN_EMAIL    = process.env.ADMIN_EMAIL;
  const STORE_NAME     = process.env.STORE_NAME || 'Luxe Flame';
  const STORE_FROM     = process.env.STORE_FROM || 'onboarding@resend.dev';

  // GET — health check (admin can ping this to verify setup)
  if (req.method === 'GET') {
    return res.status(200).json({
      configured: !!(RESEND_API_KEY && ADMIN_EMAIL),
      admin_email_set: !!ADMIN_EMAIL,
      api_key_set: !!RESEND_API_KEY,
      store_name: STORE_NAME,
      from_address: STORE_FROM
    });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // If not configured, return 200 (don't block the order)
  if (!RESEND_API_KEY || !ADMIN_EMAIL) {
    console.warn('[send-email] Not configured — RESEND_API_KEY or ADMIN_EMAIL missing. Skipping.');
    return res.status(200).json({ ok: false, reason: 'email_not_configured' });
  }

  const { customer_name, customer_email, customer_phone, customer_address, items, total, notes } = req.body;

  if (!customer_name || !customer_email) {
    return res.status(400).json({ error: 'customer_name and customer_email are required' });
  }

  const results = { admin: null, customer: null, errors: [] };

  // Admin notification
  try {
    results.admin = await sendEmail({
      apiKey:  RESEND_API_KEY,
      from:    `${STORE_NAME} Orders <${STORE_FROM}>`,
      to:      ADMIN_EMAIL,
      subject: `🕯 New Order — ${customer_name} · ${egp(total)}`,
      html:    adminEmailHtml({ customer_name, customer_email, customer_phone, customer_address, items, total, notes, storeName: STORE_NAME })
    });
  } catch (err) {
    console.error('[send-email] Admin email failed:', err.message);
    results.errors.push({ type: 'admin', message: err.message });
  }

  // Customer confirmation
  try {
    results.customer = await sendEmail({
      apiKey:  RESEND_API_KEY,
      from:    `${STORE_NAME} <${STORE_FROM}>`,
      to:      customer_email,
      subject: `🕯 Your ${STORE_NAME} order is confirmed!`,
      html:    customerEmailHtml({ customer_name, items, total, storeName: STORE_NAME })
    });
  } catch (err) {
    console.error('[send-email] Customer email failed:', err.message);
    results.errors.push({ type: 'customer', message: err.message });
  }

  return res.status(200).json({ ok: results.errors.length === 0, ...results });
}
