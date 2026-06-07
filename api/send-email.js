// Luxe Flame — Email Notification via Ionos SMTP
//
// Required Vercel env vars (Project Settings → Environment Variables):
//   SMTP_USER  — your full Ionos email address  e.g. orders@yourdomain.com
//   SMTP_PASS  — your Ionos email password
//
// Notification email is set in Admin Dashboard → Settings → "Your Notification Email"
// Customer confirmation is always sent to the email the customer enters at checkout.

import nodemailer from 'nodemailer';

const SUPABASE_URL  = 'https://kusdvbrgseyekprfblzu.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1c2R2YnJnc2V5ZWtwcmZibHp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NzU4NDksImV4cCI6MjA5NjM1MTg0OX0.JdnZBfY-rqjn_VjwSaknWomY-vCBbqxxBfEgmMYXd8A';

async function getSettings() {
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/site_settings?select=key,value`,
      { headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` } }
    );
    const rows = await r.json();
    const s = {};
    (Array.isArray(rows) ? rows : []).forEach(row => { s[row.key] = row.value; });
    return s;
  } catch (e) {
    console.error('[send-email] Could not fetch site_settings:', e.message);
    return {};
  }
}

function egp(n) {
  return `${Number(n).toLocaleString('en-EG', { minimumFractionDigits: 0 })} ج.م`;
}

function itemRows(items = []) {
  return items.map(i => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #2a2520;color:#f5f0e8;font-size:14px;">${i.name}</td>
      <td style="padding:10px 0;border-bottom:1px solid #2a2520;color:#c9a96e;text-align:center;font-size:14px;">×${i.qty}</td>
      <td style="padding:10px 0;border-bottom:1px solid #2a2520;color:#c9a96e;text-align:right;font-size:14px;">${egp(i.price * i.qty)}</td>
    </tr>`).join('');
}

function buildAdminHtml({ customer_name, customer_email, customer_phone, customer_address, items, total, notes, storeName }) {
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

function buildCustomerHtml({ customer_name, items, total, storeName, replyTo }) {
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
        Questions? Reply to this email or contact us at <a href="mailto:${replyTo}" style="color:#c9a96e;">${replyTo}</a>
      </p>
    </div>
    <p style="color:#3a3530;font-size:11px;text-align:center;margin-top:24px;">© 2026 ${storeName} · Egypt 🇪🇬</p>
  </div>
</body></html>`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const SMTP_USER = process.env.SMTP_USER; // your Ionos email address
  const SMTP_PASS = process.env.SMTP_PASS; // your Ionos email password

  // GET — health check for admin dashboard
  if (req.method === 'GET') {
    const settings = await getSettings();
    return res.status(200).json({
      configured:         !!SMTP_USER && !!SMTP_PASS && !!settings.notification_email,
      smtp_user_set:      !!SMTP_USER,
      smtp_pass_set:      !!SMTP_PASS,
      notification_email: settings.notification_email || null,
    });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!SMTP_USER || !SMTP_PASS) {
    console.error('[send-email] SMTP_USER or SMTP_PASS not set in Vercel env vars');
    return res.status(200).json({ ok: false, error: 'SMTP credentials not configured in Vercel' });
  }

  // Fetch notification email + store name from Supabase settings
  const settings          = await getSettings();
  const NOTIFICATION_EMAIL = settings.notification_email || null;
  const STORE_NAME         = process.env.STORE_NAME || 'Luxe Flame';

  const {
    customer_name,
    customer_email,
    customer_phone,
    customer_address,
    items,
    total,
    notes,
  } = req.body || {};

  // Create Ionos SMTP transporter
  const transporter = nodemailer.createTransport({
    host:   'smtp.ionos.com',
    port:   587,
    secure: false, // STARTTLS
    auth:   { user: SMTP_USER, pass: SMTP_PASS },
  });

  const results = {};

  // ── Admin order alert ─────────────────────────────────────────
  if (NOTIFICATION_EMAIL) {
    try {
      await transporter.sendMail({
        from:    `"${STORE_NAME}" <${SMTP_USER}>`,
        to:      NOTIFICATION_EMAIL,
        subject: `🕯 New Order — ${customer_name} · ${egp(total)}`,
        html:    buildAdminHtml({ customer_name, customer_email, customer_phone, customer_address, items, total, notes, storeName: STORE_NAME }),
      });
      console.log('[send-email] Admin alert sent to', NOTIFICATION_EMAIL);
      results.admin = { ok: true };
    } catch (err) {
      console.error('[send-email] Admin alert failed:', err.message);
      results.admin = { ok: false, error: err.message };
    }
  } else {
    console.warn('[send-email] notification_email not set — go to Admin → Settings to configure it');
    results.admin = { skipped: true, reason: 'notification_email not set in admin settings' };
  }

  // ── Customer confirmation ─────────────────────────────────────
  if (customer_email) {
    try {
      await transporter.sendMail({
        from:     `"${STORE_NAME}" <${SMTP_USER}>`,
        to:       customer_email,
        replyTo:  SMTP_USER,
        subject:  `🕯 Your ${STORE_NAME} order is confirmed!`,
        html:     buildCustomerHtml({ customer_name, items, total, storeName: STORE_NAME, replyTo: SMTP_USER }),
      });
      console.log('[send-email] Customer confirmation sent to', customer_email);
      results.customer = { ok: true };
    } catch (err) {
      console.error('[send-email] Customer email failed:', err.message);
      results.customer = { ok: false, error: err.message };
    }
  }

  return res.status(200).json({ ok: true, results });
}
