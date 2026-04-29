// Vercel Serverless Function — receives form submissions and emails them
// to Evgenia via the Resend API.
//
// ENVIRONMENT VARIABLES (set in Vercel Dashboard → Project → Settings → Env):
//   RESEND_API_KEY  — required, get from https://resend.com/api-keys
//   LEAD_RECIPIENT  — optional override; defaults to e.morodenko@mail.ru
//   LEAD_FROM       — optional override; defaults to "Сайт Мороденко <onboarding@resend.dev>"

import { Resend } from 'resend';

const RECIPIENT = process.env.LEAD_RECIPIENT || 'e.morodenko@mail.ru';
const FROM      = process.env.LEAD_FROM      || 'Сайт Мороденко <onboarding@resend.dev>';

// In-memory rate limit (per-instance; sufficient for low-traffic regional site).
// Resets every time the function cold-starts.
const rateLimit = new Map();
const RL_WINDOW_MS = 60_000;   // 1 minute window
const RL_MAX_HITS  = 5;        // max 5 submissions per IP per minute
const MIN_FORM_TIME_MS = 1_500;
const MAX_FORM_TIME_MS = 1000 * 60 * 60 * 3;

function withinRateLimit(ip){
  const now = Date.now();
  const hits = (rateLimit.get(ip) || []).filter(t => now - t < RL_WINDOW_MS);
  if (hits.length >= RL_MAX_HITS) return false;
  hits.push(now);
  rateLimit.set(ip, hits);
  // Janitor: drop old IPs occasionally to prevent unbounded growth
  if (rateLimit.size > 1000){
    for (const [k, v] of rateLimit){
      if (!v.length || now - v[v.length - 1] > RL_WINDOW_MS) rateLimit.delete(k);
    }
  }
  return true;
}

// Strip control chars, header-injection attempts, HTML brackets; cap length
function sanitize(value, maxLen = 500){
  if (value == null) return '';
  return String(value)
    .replace(/[\r\n]+/g, ' ')
    .replace(/[<>]/g, '')
    .replace(/[\x00-\x1f\x7f]/g, '')
    .trim()
    .slice(0, maxLen);
}

function escapeHtml(s){
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getClientIp(req){
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
}

function normalizeBoolean(value){
  return value === true || value === 'true' || value === 'on' || value === '1' || value === 1;
}

function isTrustedOrigin(req){
  const origin = req.headers.origin;
  if (!origin) return true;

  try {
    const originHost = new URL(origin).host;
    const requestHost = req.headers.host;

    if (originHost === requestHost) return true;
    if (originHost === 'morodenko-psy.vercel.app') return true;
    if (originHost === 'localhost:3000' || originHost === 'localhost:4173') return true;
    if (originHost === '127.0.0.1:3000' || originHost === '127.0.0.1:4173') return true;
    if (/^morodenko-psy-.+\.vercel\.app$/.test(originHost)) return true;

    return false;
  } catch (_) {
    return false;
  }
}

function hasHumanTiming(startedAt){
  if (!Number.isFinite(startedAt) || startedAt <= 0) return false;
  const elapsed = Date.now() - startedAt;
  return elapsed >= MIN_FORM_TIME_MS && elapsed <= MAX_FORM_TIME_MS;
}

export default async function handler(req, res){
  // Method gate
  if (req.method !== 'POST'){
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (!isTrustedOrigin(req)){
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }

  // Body parsing — Vercel auto-parses JSON when Content-Type is set
  const body = (typeof req.body === 'object' && req.body !== null) ? req.body : {};

  // Honeypot: if a real human, this checkbox is unchecked. Bots fill all fields.
  if (body.botcheck){
    return res.status(200).json({ success: true });
  }

  // Rate limit
  const ip = getClientIp(req);
  if (!withinRateLimit(ip)){
    return res.status(429).json({ success: false, error: 'Too many requests' });
  }

  // Sanitize + validate
  const name    = sanitize(body.name,    150);
  const phone   = sanitize(body.phone,   60);
  const format  = sanitize(body.format,  100);
  const service = sanitize(body.service, 200);
  const comment = sanitize(body.comment, 2000);
  const consent = normalizeBoolean(body.consent);
  const startedAt = Number(body.form_started_at || body.started_at || body.startedAt || 0);

  if (!name){
    return res.status(400).json({ success: false, error: 'Имя обязательно' });
  }
  if (!phone || phone.replace(/\D/g, '').length < 11){
    return res.status(400).json({ success: false, error: 'Некорректный телефон' });
  }
  if (!format){
    return res.status(400).json({ success: false, error: 'Выберите формат консультации' });
  }
  if (!service){
    return res.status(400).json({ success: false, error: 'Выберите запрос консультации' });
  }
  if (!consent){
    return res.status(400).json({ success: false, error: 'Нужно согласие на обработку данных' });
  }
  if (!hasHumanTiming(startedAt)){
    return res.status(400).json({ success: false, error: 'Пожалуйста, отправьте форму ещё раз' });
  }

  // Resend API key check (fails loudly in logs, generic message to user)
  if (!process.env.RESEND_API_KEY){
    console.error('[send-lead] RESEND_API_KEY env var is not set');
    return res.status(500).json({ success: false, error: 'Сервис временно недоступен' });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const subject = `Новая заявка с сайта · ${name}`;
  const html    = renderHtml({ name, phone, format, service, comment });
  const text    = renderText({ name, phone, format, service, comment });

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: [RECIPIENT],
      subject,
      html,
      text,
    });

    if (error){
      console.error('[send-lead] Resend error:', error);
      return res.status(502).json({ success: false, error: 'Не удалось отправить' });
    }

    console.log('[send-lead] Sent OK:', { id: data?.id });
    return res.status(200).json({ success: true });

  } catch (err){
    console.error('[send-lead] Unexpected error:', err);
    return res.status(500).json({ success: false, error: 'Внутренняя ошибка' });
  }
}

// ============== EMAIL TEMPLATES ==============

function renderHtml({ name, phone, format, service, comment }){
  const phoneDigits = phone.replace(/\D/g, '');
  const date = new Date().toLocaleString('ru-RU', {
    timeZone: 'Asia/Novokuznetsk',
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const commentRow = comment
    ? `<tr>
        <td style="padding:10px 0;color:#8a7868;font-size:11px;text-transform:uppercase;letter-spacing:.12em;width:120px;vertical-align:top;">Комментарий</td>
        <td style="padding:10px 0;color:#5a4a3e;font-size:14px;line-height:1.55;">${escapeHtml(comment).replace(/\n/g,'<br>')}</td>
      </tr>`
    : '';

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <title>Новая заявка с сайта</title>
</head>
<body style="margin:0;padding:0;background:#f4ede3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#2a211b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4ede3;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:580px;background:#faf5ec;border-radius:14px;overflow:hidden;border:1px solid #d9ccb8;">
          <tr>
            <td style="height:6px;background:linear-gradient(90deg,#b8593a,#c89b4a);"></td>
          </tr>
          <tr>
            <td style="padding:32px 36px 22px;border-bottom:1px solid #e6dcc9;">
              <p style="margin:0 0 6px;color:#b8593a;font-size:11px;letter-spacing:.22em;text-transform:uppercase;font-weight:600;">Сайт · ${escapeHtml(date)}</p>
              <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;color:#2a211b;letter-spacing:-0.02em;">
                Новая заявка
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 36px 8px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding:10px 0;color:#8a7868;font-size:11px;text-transform:uppercase;letter-spacing:.12em;width:120px;">Имя</td>
                  <td style="padding:10px 0;color:#2a211b;font-size:17px;font-weight:600;">${escapeHtml(name)}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;color:#8a7868;font-size:11px;text-transform:uppercase;letter-spacing:.12em;border-top:1px solid #e6dcc9;">Телефон</td>
                  <td style="padding:10px 0;color:#2a211b;font-size:17px;font-weight:600;border-top:1px solid #e6dcc9;">
                    <a href="tel:+${escapeHtml(phoneDigits)}" style="color:#b8593a;text-decoration:none;">${escapeHtml(phone)}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;color:#8a7868;font-size:11px;text-transform:uppercase;letter-spacing:.12em;border-top:1px solid #e6dcc9;">Формат</td>
                  <td style="padding:10px 0;color:#5a4a3e;font-size:14px;border-top:1px solid #e6dcc9;">${escapeHtml(format || '—')}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;color:#8a7868;font-size:11px;text-transform:uppercase;letter-spacing:.12em;border-top:1px solid #e6dcc9;">Запрос</td>
                  <td style="padding:10px 0;color:#5a4a3e;font-size:14px;border-top:1px solid #e6dcc9;">${escapeHtml(service || '—')}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;color:#8a7868;font-size:11px;text-transform:uppercase;letter-spacing:.12em;border-top:1px solid #e6dcc9;">Согласие</td>
                  <td style="padding:10px 0;color:#5a4a3e;font-size:14px;border-top:1px solid #e6dcc9;">Получено · политика конфиденциальности</td>
                </tr>
                ${commentRow ? `<tr><td colspan="2" style="border-top:1px solid #e6dcc9;"></td></tr>${commentRow}` : ''}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 36px 32px;border-top:1px solid #e6dcc9;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding-right:8px;">
                    <a href="tel:+${escapeHtml(phoneDigits)}" style="display:inline-block;padding:11px 22px;background:#2a211b;color:#faf5ec;text-decoration:none;border-radius:24px;font-size:13px;font-weight:500;">📞 Позвонить</a>
                  </td>
                  <td style="padding-right:8px;">
                    <a href="https://wa.me/${escapeHtml(phoneDigits)}" style="display:inline-block;padding:11px 22px;background:#25D366;color:#ffffff;text-decoration:none;border-radius:24px;font-size:13px;font-weight:500;">WhatsApp</a>
                  </td>
                  <td>
                    <a href="https://t.me/+${escapeHtml(phoneDigits)}" style="display:inline-block;padding:11px 22px;background:#229ED9;color:#ffffff;text-decoration:none;border-radius:24px;font-size:13px;font-weight:500;">Telegram</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <p style="margin:18px 0 0;color:#8a7868;font-size:11px;text-align:center;">
          Письмо отправлено автоматически с сайта Мороденко Евгении.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderText({ name, phone, format, service, comment }){
  return [
    'Новая заявка с сайта',
    '----------------------',
    `Имя:        ${name}`,
    `Телефон:    ${phone}`,
    `Формат:     ${format || '—'}`,
    `Запрос:     ${service || '—'}`,
    'Согласие:   получено',
    comment ? `\nКомментарий:\n${comment}` : '',
    '\n— Сайт Мороденко Евгении'
  ].filter(Boolean).join('\n');
}
