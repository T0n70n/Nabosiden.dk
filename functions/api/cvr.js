// Company search for the "Se din side" box.
// GET /api/cvr?q=<name or CVR number>  ->  { results: [{ name, cvr, address, zip, city, phone, email, industry }], source }
//
// Sources, in order:
// 1. Erhvervsstyrelsen's CVR distribution (free, needs CVR_USER and CVR_PASS from cvrselvbetjening@erst.dk).
//    Gives suggestions while typing.
// 2. cvrapi.dk (no key, one result per search, may be blocked or rate limited).
export async function onRequestGet({ request, env, waitUntil }) {
  const q = (new URL(request.url).searchParams.get('q') || '').trim();
  if (q.length < 2 || q.length > 80) return json({ results: [] });

  const cache = caches.default;
  const key = new Request('https://cache.local/cvr?v=2&q=' + encodeURIComponent(q.toLowerCase()));
  const hit = await cache.match(key);
  if (hit) return hit;

  let body;
  try {
    body = env.CVR_USER && env.CVR_PASS ? await fromErst(q, env) : await fromCvrapi(q);
  } catch (e) {
    return json({ results: [], error: 'lookup_failed' }, 502);
  }
  const res = json(body);
  if (body.results.length) {
    res.headers.set('Cache-Control', 'public, max-age=86400');
    waitUntil(cache.put(key, res.clone()));
  }
  return res;
}

const ENDED = /ophør|opløst|konkurs|slettet|tvangsopl/i;

async function fromErst(q, env) {
  const digits = q.replace(/\s/g, '');
  const query = /^\d{8}$/.test(digits)
    ? { term: { 'Vrvirksomhed.cvrNummer': Number(digits) } }
    : {
        bool: {
          must: [{ match_phrase_prefix: { 'Vrvirksomhed.virksomhedMetadata.nyesteNavn.navn': { query: q, max_expansions: 50 } } }],
          must_not: [{ terms: { 'Vrvirksomhed.virksomhedMetadata.sammensatStatus': ['Ophørt', 'OPHØRT', 'Opløst', 'OPLØST'] } }],
        },
      };
  const res = await fetch('http://distribution.virk.dk/cvr-permanent/virksomhed/_search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Basic ' + btoa(env.CVR_USER + ':' + env.CVR_PASS) },
    body: JSON.stringify({
      size: 10,
      query,
      _source: ['Vrvirksomhed.cvrNummer', 'Vrvirksomhed.virksomhedMetadata', 'Vrvirksomhed.telefonNummer', 'Vrvirksomhed.elektroniskPost'],
    }),
  });
  if (!res.ok) throw new Error('erst ' + res.status);
  const data = await res.json();
  const results = [];
  for (const h of data.hits?.hits || []) {
    const v = h._source?.Vrvirksomhed || {};
    const m = v.virksomhedMetadata || {};
    if (ENDED.test(m.sammensatStatus || '')) continue;
    const a = m.nyesteBeliggenhedsadresse || {};
    const contacts = m.nyesteKontaktoplysninger || [];
    const phone = latest(v.telefonNummer) || contacts.find((c) => /^\+?[\d\s]{8,}$/.test(c)) || '';
    const email = latest(v.elektroniskPost) || contacts.find((c) => c.includes('@')) || '';
    results.push({
      name: m.nyesteNavn?.navn || '',
      cvr: String(v.cvrNummer || ''),
      address: [a.vejnavn, [a.husnummerFra, a.bogstavFra].filter(Boolean).join('')].filter(Boolean).join(' '),
      zip: a.postnummer ? String(a.postnummer) : '',
      city: a.postdistrikt || '',
      phone,
      email,
      industry: m.nyesteHovedbranche?.branchetekst || '',
    });
  }
  return { results: results.slice(0, 8), source: 'erst' };
}

function latest(list) {
  if (!Array.isArray(list)) return '';
  const open = list.filter((x) => !x.hemmelig && !(x.periode && x.periode.gyldigTil));
  const pick = open[open.length - 1];
  return pick ? String(pick.kontaktoplysning || '') : '';
}

async function fromCvrapi(q) {
  const digits = q.replace(/\s/g, '');
  const param = /^\d{8}$/.test(digits) ? 'vat=' + digits : 'search=' + encodeURIComponent(q);
  const res = await fetch('https://cvrapi.dk/api?' + param + '&country=dk', {
    headers: { 'User-Agent': 'Nabosiden - nabosiden@gmail.com' },
  });
  if (res.status === 404) return { results: [], source: 'cvrapi' };
  if (!res.ok) throw new Error('cvrapi ' + res.status);
  const d = await res.json();
  if (d.error || !d.name) return { results: [], source: 'cvrapi' };
  return {
    results: [{ name: d.name, cvr: String(d.vat || ''), address: d.address || '', zip: d.zipcode || '', city: d.city || '', phone: d.phone || '', email: d.email || '', industry: d.industrydesc || '' }],
    source: 'cvrapi',
  };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
