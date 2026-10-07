// Receives a lead from the site and emails it to Nabosiden via Web3Forms.
// Needs the environment variable WEB3FORMS_KEY (free key from web3forms.com, sent to nabosiden@gmail.com).
// Optional: a KV namespace bound as LEADS keeps a copy of every lead.
// Optional: META_CAPI_TOKEN (Conversions API token from Events Manager) tells Meta about each lead from the server.
// Only the ad click id (fbclid) is sent, never name, phone or mail, so it works without cookies.
const FIELDS = ['kind', 'firm', 'cvr', 'city', 'firmPhone', 'trade', 'contact', 'phone', 'mail', 'web', 'when', 'msg'];
const LABELS = { kind: 'Type', firm: 'Firma', cvr: 'CVR', city: 'By', firmPhone: 'Firmaets telefon', trade: 'Fag', contact: 'Kontaktperson', phone: 'Mobil', mail: 'Mail', web: 'Nuværende hjemmeside', when: 'Ring helst', msg: 'Besked' };

const PIXEL_ID = '1089683803957398';

export async function onRequestPost({ request, env, waitUntil }) {
  let data;
  try { data = await request.json(); } catch { return json({ ok: false }, 400); }

  const lead = {};
  for (const k of FIELDS) if (data[k]) lead[k] = String(data[k]).slice(0, 2000);
  if (!lead.contact || !(lead.phone || lead.mail)) return json({ ok: false, error: 'missing_fields' }, 400);
  lead.at = new Date().toISOString();

  if (env.LEADS) await env.LEADS.put(lead.at + '-' + crypto.randomUUID(), JSON.stringify(lead));

  if (!env.WEB3FORMS_KEY) return json({ ok: !!env.LEADS, error: env.LEADS ? undefined : 'no_mail_key' }, env.LEADS ? 200 : 500);

  const body = { access_key: env.WEB3FORMS_KEY, subject: `${lead.kind || 'Henvendelse'}: ${lead.firm || lead.contact}`, from_name: 'nabosiden.dk' };
  if (lead.mail) body.replyto = lead.mail;
  for (const k of Object.keys(lead)) body[LABELS[k] || k] = lead[k];

  const res = await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  if (res.ok) {
    if (env.META_CAPI_TOKEN && data.fbclid) {
      const p = tellMeta(env.META_CAPI_TOKEN, String(data.fbclid).slice(0, 500), String(data.eventId || '').slice(0, 100), lead.kind, request.headers.get('Referer'));
      if (waitUntil) waitUntil(p); else await p;
    }
    return json({ ok: true });
  }
  const detail = (await res.text().catch(() => '')).slice(0, 200);
  return json({ ok: false, error: 'web3forms', status: res.status, detail }, 502);
}

function tellMeta(token, fbclid, eventId, kind, url) {
  const now = Math.floor(Date.now() / 1000);
  const event = {
    event_name: 'Lead', event_time: now, action_source: 'website',
    event_source_url: url || 'https://nabosiden.dk/',
    user_data: { fbc: `fb.1.${now * 1000}.${fbclid}` },
    custom_data: { content_name: kind || '' },
  };
  if (eventId) event.event_id = eventId;
  return fetch(`https://graph.facebook.com/v21.0/${PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: [event] }),
  }).catch(() => {});
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
