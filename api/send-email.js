// Luxe Flame — Email via Resend
// Vercel env vars needed:
//   RESEND_API_KEY  — from resend.com
//   ADMIN_EMAIL     — where new-order alerts go (must match your Resend account email
//                     when using the free onboarding@resend.dev sender)

const SUPABASE_URL  = 'https://kusdvbrgseyekprfblzu.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1c2R2YnJnc2V5ZWtwcmZibHp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NzU4NDksImV4cCI6MjA5NjM1MTg0OX0.JdnZBfY-rqjn_VjwSaknWomY-vCBbqxxBfEgmMYXd8A';

async function getStoreName() {
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/site_settings?key=eq.tagline&select=value`,
      { headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` } }
    );
    const rows = await r.json();
    return (rows?.[0]?.value) || 'Luxe Flame';
  } catch { return 'Luxe Flame'; }
}

function egp(n) {
  return `${Number(n).toLocaleString('en-EG', { minimumFractionDigits: 0 })} ج.م`;
}

function itemRows(items = []) {
  return items.map(i => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #2a2520;color:#f5f0e8;font-size:14px;">${i.name}</td>
      <td style="padding:10px 0;border-bottom:1px solid #2a2520;color:#c9a96e;text-align:center;">>×${i.qty}</td>
      <td style="padding:10px 0;border-bottom:1px solid #2a2520;color:#c9a96e;text-align:right;">${egp(i.price * i.qty)}</td>
    </tr>`).join('');
}

function adminHtml({ customer_name, customer_email, customer_phone, customer_address, items, total, notes, storeName }) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0d0c0b;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:580px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="font-size:26px;color:#c9a96e;font-weight:300;letter-spacing:0.1em;margin:0;">${storeName}</h1>
      <p style="color:#7a7060;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;margin:6px 0 0;">New Order Received 🕯</p>
    </div>
    <div style="background:#131210;border:1px solid rgba(201,169,110,0.2);border-radius:16px;padding:28px;margin-bottom:20px;">
      <h2 style="color:#f5f0e8;font-size:15px;font-weight:600;margin:0 0 18px;">Customer Details</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="color:#7a7060;font-size:12px;padding:5px 0;width:38%;">Name</td><td style="color:#f5f0e8;font-size:13px;">${customer_name}</td></tr>
        <tr><td style="color:#7a7060;font-size:12px;padding:5px 0;">Email</td><td style="color:#f5f0e8;font-size:13px;">${customer_email}</td></tr>
        <tr><td style="color:#7a7060;font-size:12px;padding:5px 0;">Phone</td><td style="color:#f5f0e8;font-size:13px;">${customer_phone || '—'}</td></tr>
        <tr><td style="color:#7a7060;font-size:12px;padding:5px 0;">Address</td><td style="color:#f5f0e8;font-size:13px;">${customer_address || '—'}</td></tr>
        ${notes ? `<tr><td style="color:#7a7060;font-size:12px;padding:5px 0;vertical-align:top;">Notes</td><td style="color:#f5f0e8;font-size:13px;">${notes}</td></tr>` : ''}
      </table>
    </div>
    <div style="background:#131210;border:1px solid rgba(201,169,110,0.2);border-radius:16px;padding:28px;">
      <h2 style="color:#f5f0e8;font-size:15px;font-weight:600;margin:0 0 14px;">Order Items</h2>
      <table style="width:100%;border-collapse:collapse;">
        ${itemRows(items)}
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

function customerHtml({ customer_name, items, total, storeName, adminEmail }) {
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
        ${itemRows(items)}
        <tr>
          <td colspan="2" style="padding:16px 0 0;color:#c9a96e;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;">Total</td>
          <td style="padding:16px 0 0;color:#c9a96e;font-size:22px;text-align:right;">${egp(total)}</td>
        </tr>
      </table>
    </div>
    <div style="background:#131210;border:1px solid rgba(201,169,110,0.2);border-radius:16px;padding:20px;text-align:center;">
      <p style="color:#7a7060;font-size:13px;margin:0;">
        Questions? <a href="mailto:${adminEmail}" style="color:#c9a96e;">${adminEmail}</a>
      </p>
    </div>
    <p style="color:#3a3530;font-size:11px;text-align:center;margin-top:24px;">© 2026 ${storeName} · Egypt 🇪🇬</p>
  </div>
</body></html>`;
}

async function send({ apiKey, to, subject, html, from }) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.message || `Resend HTTP ${r.status}: ${JSON.stringify(data)}`);
  return data;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const ADMIN_EMAIL    = process.env.ADMIN_EMAIL;
  const FROM           = process.env.STORE_FROM || 'Luxe Flame <onboarding@resend.dev>';

  // GET — health check
  if (req.method === 'GET') {
    return res.status(200).json({
      configured:      !!(RESEND_API_KEY && ADMIN_EMAIL),
      api_key_set:     !!RESEND_API_KEY,
      admin_email_set: !!ADMIN_EMAIL,
      from:            FROM,
    });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Always return 200 so checkout completes even if email fails
  if (!RESEND_API_KEY || !ADMIN_EMAIL) {
    console.error('[send-email] Missing RESEND_API_KEY or ADMIN_EMAIL env var');
    return res.status(200).json({ ok: false, error: 'Email not configured' });
  }

  const { customer_name, customer_email, customer_phone, customer_address, items, total, notes } = req.body || {};
  const storeName = await getStoreName();
  const results   = {};

  // Admin alert
  try {
    results.admin = await send({
      apiKey:  RESEND_API_KEY,
      from:    FROM,
      to:      ADMIN_EMAIL,
      subject: `🕯 New Order — ${customer_name} · ${egp(total)}`,
      html:    adminHtml({ customer_name, customer_email, customer_phone, customer_address, items, total, notes, storeName }),
    });
    console.log('[send-email] Admin alert sent to', ADMIN_EMAIL);
  } catch (err) {
    console.error('[send-email] Admin alert failed:', err.message);
    results.admin = { error: err.message };
  }

  // Customer confirmation — always attempt
  if (customer_email) {
    try {
      results.customer = await send({
        apiKey:  RESEND_API_KEY,
        from:    FROM,
        to:      customer_email,
        subject: `🕯 Your ${storeName} order is confirmed!`,
        html:    customerHtml({ customer_name, items, total, storeName, adminEmail: ADMIN_EMAIL }),
      });
      console.log('[send-email] Customer confirmation sent to', customer_email);
    } catch (err) {
      console.error('[send-email] Customer email failed:', err.message);
      results.customer = { error: err.message };
    }
  }

  return res.status(200).json({ ok: !!results.admin?.id, results });
}
