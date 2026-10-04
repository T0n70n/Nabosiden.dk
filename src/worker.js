// Cloudflare Worker entry: runs the two API routes, everything else is served from ./public.
import { onRequestPost as lead } from '../functions/api/lead.js';
import { onRequestGet as cvr } from '../functions/api/cvr.js';

const notAllowed = allow => new Response('Method not allowed', { status: 405, headers: { Allow: allow } });

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    const c = { request, env, waitUntil: p => ctx.waitUntil(p) };
    if (pathname === '/api/lead') return request.method === 'POST' ? lead(c) : notAllowed('POST');
    if (pathname === '/api/cvr') return request.method === 'GET' ? cvr(c) : notAllowed('GET');
    return env.ASSETS.fetch(request);
  },
};
