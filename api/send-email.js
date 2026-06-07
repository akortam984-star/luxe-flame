export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const ADMIN_EMAIL    = process.env.ADMIN_EMAIL;
  const STORE_NAME     = process.env.STORE_NAME     || 'Luxe Flame';
  // Set STORE_FROM to a verified Resend domain address (e.g. orders@yourdomain.com)
  // If unset, falls back to the shared test sender (can only deliver to your own account email)
  const STORE_FROM     = process.env.STORE_FROM     || 'Luxe Flame <onboarding@resend.dev>';

  // GET → health-check used by admin panel
  if (req.method === 'GET') {
    return res.status(200).json({
      configured:      !!(RESEND_API_KEY && ADMIN_EMAIL),
      api_key_set:     !!RESEND_API_KEY,
      admin_email_set: !!ADMIN_EMAIL,
      store_name:      STORE_NAME,
      from_address:    STORE_FROM,
      using_test_sender: !process.env.STORE_FROM,
    });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!RESEND_API_KEY || !ADMIN_EMAIL) {
    console.error('[send-email] Missing env vars — RESEND_API_KEY or ADMIN_EMAIL not set');
    // Return 200 so the checkout still completes
    return res.status(200).json({ ok: false, error: 'Email not configured — set RESEND_API_KEY and ADMIN_EMAIL in Vercel' });
  }

  const {
    customer_name,
    customer_email,
    customer_phone,
    customer_address,
    items,
    total,
    notes
  } = req.body || {};

  function egp(n) {
    return `${Number(n).toLocaleString('en-EG', { minimumFractionDigits: 0 })} ج.م`;
  }

  async function sendEmail({ to, subject, html }) {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: STORE_FROM, to: [to], subject, html }),
    });
    const json = await r.json();
    if (!r.ok) {
      console.error(`[send-email] Resend error sending to ${to}:`, JSON.stringify(json));
    }
    return { ok: r.ok, status: r.status, body: json };
  }

  const itemsHtml = (items || [])
    .map(i => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #2a2520;color:#f5f0e8;">${i.name}</td>
        <td style="padding:10px 0;border-bottom:1px solid #2a2520;color:#c9a96e;text-align:center;">×${i.qty}</td>
        <td style="padding:10px 0;border-bottom:1px solid #2a2520;color:#c9a96e;text-align:right;">${egp(i.price * i.qty)}</td>
      </tr>`)
    .join('');

  const adminHtml = `
    <!DOCTYPE html><html><head><meta charset="UTF-8"></head>
    <body style="margin:0;padding:0;background:#0d0c0b;font-family:'Helvetica Neue',sans-serif;">
      <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
        <div style="text-align:center;margin-bottom:32px;">
          <h1 style="font-size:28px;color:#c9a96e;font-weight:300;letter-spacing:0.1em;margin:0;">${STORE_NAME}</h1>
          <p style="color:#7a7060;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;margin:6px 0 0;">New Order Received</p>
        </div>
        <div style="background:#131210;border:1px solid rgba(201,169,110,0.2);border-radius:16px;padding:28px;margin-bottom:20px;">
          <h2 style="color:#f5f0e8;font-size:16px;font-weight:500;margin:0 0 20px;">Customer Details</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="color:#7a7060;font-size:12px;padding:6px 0;width:40%;">Name</td><td style="color:#f5f0e8;font-size:14px;">${customer_name}</td></tr>
            <tr><td style="color:#7a7060;font-size:12px;padding:6px 0;">Email</td><td style="color:#f5f0e8;font-size:14px;">${customer_email}</td></tr>
            <tr><td style="color:#7a7060;font-size:12px;padding:6px 0;">Phone</td><td style="color:#f5f0e8;font-size:14px;">${customer_phone || '—'}</td></tr>
            <tr><td style="color:#7a7060;font-size:12px;padding:6px 0;">Address</td><td style="color:#f5f0e8;font-size:14px;">${customer_address || '—'}</td></tr>
            ${notes ? `<tr><td style="color:#7a7060;font-size:12px;padding:6px 0;">Notes</td><td style="color:#f5f0e8;font-size:14px;">${notes}</td></tr>` : ''}
          </table>
        </div>
        <div style="background:#131210;border:1px solid rgba(201,169,110,0.2);border-radius:16px;padding:28px;">
          <h2 style="color:#f5f0e8;font-size:16px;font-weight:500;margin:0 0 16px;">Order Items</h2>
          <table style="width:100%;border-collapse:collapse;">
            ${itemsHtml}
            <tr>
              <td colspan="2" style="padding:14px 0 0;color:#c9a96e;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;">Total</td>
              <td style="padding:14px 0 0;color:#c9a96e;font-size:20px;text-align:right;font-weight:500;">${egp(total)}</td>
            </tr>
          </table>
        </div>
        <p style="color:#7a7060;font-size:11px;text-align:center;margin-top:28px;">
          Manage orders at <a href="https://luxe-flame-one.vercel.app/admin" style="color:#c9a96e;">luxe-flame-one.vercel.app/admin</a>
        </p>
      </div>
    </body></html>`;

  const customerHtml = `
    <!DOCTYPE html><html><head><meta charset="UTF-8"></head>
    <body style="margin:0;padding:0;background:#0d0c0b;font-family:'Helvetica Neue',sans-serif;">
      <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
        <div style="text-align:center;margin-bottom:36px;">
          <h1 style="font-size:28px;color:#c9a96e;font-weight:300;letter-spacing:0.1em;margin:0;">${STORE_NAME}</h1>
          <p style="color:#7a7060;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;margin:6px 0 0;">Handcrafted Luxury Candles</p>
        </div>
        <div style="background:#131210;border:1px solid rgba(201,169,110,0.2);border-radius:16px;padding:36px;text-align:center;margin-bottom:20px;">
          <div style="font-size:40px;margin-bottom:16px;">🕯️</div>
          <h2 style="color:#f5f0e8;font-size:22px;font-weight:300;margin:0 0 12px;">Order Confirmed!</h2>
          <p style="color:#7a7060;font-size:14px;line-height:1.7;margin:0;">
            Thank you, ${customer_name}. Your order has been received and we'll be in touch shortly to arrange delivery.
          </p>
        </div>
        <div style="background:#131210;border:1px solid rgba(201,169,110,0.2);border-radius:16px;padding:28px;margin-bottom:20px;">
          <h3 style="color:#c9a96e;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 16px;">Your Order</h3>
          <table style="width:100%;border-collapse:collapse;">
            ${itemsHtml}
            <tr>
              <td colspan="2" style="padding:14px 0 0;color:#c9a96e;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;">Total</td>
              <td style="padding:14px 0 0;color:#c9a96e;font-size:20px;text-align:right;">${egp(total)}</td>
            </tr>
          </table>
        </div>
        <div style="background:#131210;border:1px solid rgba(201,169,110,0.2);border-radius:16px;padding:20px;text-align:center;">
          <p style="color:#7a7060;font-size:13px;margin:0;">Questions? Reach us at <a href="mailto:${ADMIN_EMAIL}" style="color:#c9a96e;">${ADMIN_EMAIL}</a></p>
        </div>
        <p style="color:#3a3530;font-size:11px;text-align:center;margin-top:24px;">© 2026 ${STORE_NAME} · Egypt 🇪🇬</p>
      </div>
    </body></html>`;

  const results = { admin: null, customer: null };

  try {
    results.admin = await sendEmail({
      to: ADMIN_EMAIL,
      subject: `🕯 New Order — ${customer_name} · ${egp(total)}`,
      html: adminHtml,
    });
  } catch (err) {
    console.error('[send-email] Admin email exception:', err.message);
    results.admin = { ok: false, error: err.message };
  }

  // Customer email: only attempt if we have a custom from-domain set.
  // onboarding@resend.dev can only deliver to the Resend account owner's email,
  // so skip customer email in test-sender mode to avoid silent failures.
  const usingTestSender = !process.env.STORE_FROM;
  const customerIsAdmin = customer_email === ADMIN_EMAIL;

  if (!usingTestSender || customerIsAdmin) {
    try {
      results.customer = await sendEmail({
        to: customer_email,
        subject: `🕯 Your ${STORE_NAME} order is confirmed!`,
        html: customerHtml,
      });
    } catch (err) {
      console.error('[send-email] Customer email exception:', err.message);
      results.customer = { ok: false, error: err.message };
    }
  } else {
    results.customer = { ok: false, skipped: true, reason: 'Set STORE_FROM env var to a verified domain to enable customer emails' };
  }

  return res.status(200).json({
    ok: results.admin?.ok === true,
    admin: results.admin,
    customer: results.customer,
  });
}
