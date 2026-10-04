// Cloudflare Worker entry: sends http and www to https://nabosiden.dk, runs the two API routes, everything else is served from ./public.
import { onRequestPost as lead } from '../functions/api/lead.js';
import { onRequestGet as cvr } from '../functions/api/cvr.js';

const notAllowed = allow => new Response('Method not allowed', { status: 405, headers: { Allow: allow } });

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;
    // one address for the site: https and no www
    if ((url.hostname === 'www.nabosiden.dk' || url.hostname === 'nabosiden.dk') && (url.protocol === 'http:' || url.hostname !== 'nabosiden.dk')) {
      url.protocol = 'https:';
      url.hostname = 'nabosiden.dk';
      return Response.redirect(url.toString(), 301);
    }
    const c = { request, env, waitUntil: p => ctx.waitUntil(p) };
    if (pathname === '/api/lead') return request.method === 'POST' ? lead(c) : notAllowed('POST');
    if (pathname === '/api/cvr') return request.method === 'GET' ? cvr(c) : notAllowed('GET');
    return env.ASSETS.fetch(request);
  },
};
