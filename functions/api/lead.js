// Receives a lead from the site and emails it to Nabosiden via Web3Forms.
// Needs the environment variable WEB3FORMS_KEY (free key from web3forms.com, sent to nabosiden@gmail.com).
// Optional: a KV namespace bound as LEADS keeps a copy of every lead.
const FIELDS = ['kind', 'firm', 'cvr', 'city', 'firmPhone', 'trade', 'contact', 'phone', 'mail', 'web', 'when', 'msg'];
const LABELS = { kind: 'Type', firm: 'Firma', cvr: 'CVR', city: 'By', firmPhone: 'Firmaets telefon', trade: 'Fag', contact: 'Kontaktperson', phone: 'Mobil', mail: 'Mail', web: 'Nuværende hjemmeside', when: 'Ring helst', msg: 'Besked' };

export async function onRequestPost({ request, env }) {
  let data;
  try { data = await request.json(); } catch { return json({ ok: false }, 400); }

  const lead = {};
  for (const k of FIELDS) if (data[k]) lead[k] = String(data[k]).slice(0, 2000);
  if (!lead.contact || !lead.phone) return json({ ok: false, error: 'missing_fields' }, 400);
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
  return json({ ok: res.ok }, res.ok ? 200 : 502);
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
