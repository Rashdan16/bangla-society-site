/*
  /api/cms/*  — the editor's login and its line to GitHub, in one small function.

  Anyone who knows the committee password can log in to /admin/ and publish.
  There are no accounts: the password lives in a Vercel environment variable,
  and changing it logs everybody out.

  Decap CMS (the editor) already knows how to talk to "Git Gateway", Netlify's
  old login + GitHub proxy. This file speaks just enough of that protocol:

    /api/cms/auth/token      POST  password → session token (also refreshes it)
    /api/cms/auth/user       GET   who is logged in (the name they typed)
    /api/cms/auth/logout     POST  nothing to do server-side; always OK
    /api/cms/git/github/...  any   forwarded to api.github.com/repos/OWNER/REPO/...
                                   with the GitHub token, after checking the session

  vercel.json rewrites /api/cms/<path> to this function as ?__p=<path>.

  Environment variables (Vercel → Project → Settings → Environment Variables):
    CMS_PASSWORD   the shared committee password (required)
    GITHUB_TOKEN   fine-grained token, this repo only, Contents: read and write (required)
    GITHUB_REPO    owner/name, defaults to Rashdan16/bangla-society-site
*/
const crypto = require('crypto');

const REPO = process.env.GITHUB_REPO || 'Rashdan16/bangla-society-site';
const ACCESS_TTL = 60 * 60;             // 1 hour; the editor refreshes it silently
const REFRESH_TTL = 14 * 24 * 60 * 60;  // stay logged in for two weeks
const COMMIT_EMAIL = 'committee-editor@users.noreply.github.com';
// Only the parts of the GitHub API the editor needs for publishing.
const ALLOWED = /^(|branches\/.+|contents\/.+|commits|commits\/.+|compare\/.+|git\/(blobs|trees|commits|refs)(\/.*)?)$/;

// ---------- tokens (HS256 JWTs; the key is derived from the password) ----------
const b64url = (buf) => Buffer.from(buf).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const key = () => crypto.createHash('sha256').update('bsoc-cms:' + process.env.CMS_PASSWORD).digest();

function sign(claims, ttl) {
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify({ ...claims, iat: now, exp: now + ttl }));
  const sig = b64url(crypto.createHmac('sha256', key()).update(head + '.' + body).digest());
  return `${head}.${body}.${sig}`;
}

function verify(token, typ) {
  const [head, body, sig] = String(token || '').split('.');
  if (!head || !body || !sig) return null;
  const want = b64url(crypto.createHmac('sha256', key()).update(head + '.' + body).digest());
  if (sig.length !== want.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want))) return null;
  let claims;
  try { claims = JSON.parse(Buffer.from(body, 'base64').toString('utf8')); } catch { return null; }
  if (claims.typ !== typ || claims.exp < Date.now() / 1000) return null;
  return claims;
}

function samePassword(given) {
  const a = crypto.createHash('sha256').update(String(given)).digest();
  const b = crypto.createHash('sha256').update(String(process.env.CMS_PASSWORD)).digest();
  return crypto.timingSafeEqual(a, b);
}

function session(name) {
  return {
    access_token: sign({ typ: 'access', sub: name, email: name, user_metadata: { full_name: name }, app_metadata: {} }, ACCESS_TTL),
    token_type: 'bearer',
    expires_in: ACCESS_TTL,
    refresh_token: sign({ typ: 'refresh', sub: name }, REFRESH_TTL),
  };
}

// ---------- helpers ----------
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function send(res, status, json) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(json));
}

const bearer = (req) => (req.headers.authorization || '').replace(/^Bearer\s+/i, '');

// ---------- /auth/* ----------
async function auth(req, res, action) {
  if (action === 'token' && req.method === 'POST') {
    const form = new URLSearchParams((await readBody(req)).toString('utf8'));
    if (form.get('grant_type') === 'password') {
      if (!samePassword(form.get('password') || '')) {
        await new Promise((r) => setTimeout(r, 1000)); // slow down guessing
        return send(res, 400, { error: 'invalid_grant', error_description: 'Wrong password', msg: 'Wrong password — ask the President or Secretary for the current one.' });
      }
      const name = (form.get('username') || '').trim().slice(0, 60) || 'Committee';
      return send(res, 200, session(name));
    }
    if (form.get('grant_type') === 'refresh_token') {
      const claims = verify(form.get('refresh_token'), 'refresh');
      if (!claims) return send(res, 400, { error: 'invalid_grant', error_description: 'Session expired', msg: 'Your session has expired. Please log in again.' });
      return send(res, 200, session(claims.sub));
    }
    return send(res, 400, { error: 'unsupported_grant_type', msg: 'Unsupported grant type' });
  }
  if (action === 'user' && req.method === 'GET') {
    const claims = verify(bearer(req), 'access');
    if (!claims) return send(res, 401, { msg: 'Not logged in' });
    return send(res, 200, { id: claims.sub, email: claims.email, user_metadata: claims.user_metadata, app_metadata: {}, role: 'editor' });
  }
  if (action === 'logout') return send(res, 200, {});
  if (action === 'settings') return send(res, 200, { external: {}, disable_signup: true, autoconfirm: false });
  return send(res, 404, { msg: 'Not found' });
}

// ---------- /git/github/* → GitHub ----------
async function git(req, res, path, query) {
  const claims = verify(bearer(req), 'access');
  if (!claims) return send(res, 401, { message: 'Not logged in' });
  if (path.split('/').includes('..') || !ALLOWED.test(path)) return send(res, 403, { message: 'Not allowed' });

  let body;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = await readBody(req);
    // Record who made the change: the name typed at login. The editor commits
    // through git/commits; the dashboard writes single files through contents/.
    const isCommit = path === 'git/commits' && req.method === 'POST';
    const isFileWrite = path.startsWith('contents/') && (req.method === 'PUT' || req.method === 'DELETE');
    if (isCommit || isFileWrite) {
      const commit = JSON.parse(body.toString('utf8'));
      commit.author = { name: claims.sub, email: COMMIT_EMAIL, date: new Date().toISOString() };
      body = Buffer.from(JSON.stringify(commit));
    }
  }

  const url = `https://api.github.com/repos/${REPO}${path ? '/' + encodeURI(path) : ''}${query ? '?' + query : ''}`;
  const upstream = await fetch(url, {
    method: req.method,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: req.headers.accept && req.headers.accept.includes('github') ? req.headers.accept : 'application/vnd.github+json',
      'Content-Type': req.headers['content-type'] || 'application/json',
      'User-Agent': 'bangla-society-cms',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body,
  });

  res.statusCode = upstream.status;
  for (const h of ['content-type', 'link']) {
    const v = upstream.headers.get(h);
    if (v) res.setHeader(h, v);
  }
  res.setHeader('Cache-Control', 'no-store');
  res.end(Buffer.from(await upstream.arrayBuffer()));
}

module.exports = async (req, res) => {
  if (!process.env.CMS_PASSWORD || !process.env.GITHUB_TOKEN) {
    return send(res, 500, { msg: 'Editor not set up: add CMS_PASSWORD and GITHUB_TOKEN in Vercel → Settings → Environment Variables, then redeploy.', message: 'Editor not set up' });
  }
  const url = new URL(req.url, 'http://x');
  const route = (url.searchParams.get('__p') || '').replace(/^\/+/, '');
  url.searchParams.delete('__p');
  const query = url.searchParams.toString();

  try {
    if (route.startsWith('auth/')) return await auth(req, res, route.slice(5));
    if (route === 'git/github' || route.startsWith('git/github/')) return await git(req, res, route.slice(11), query);
    return send(res, 404, { msg: 'Not found' });
  } catch (err) {
    console.error(err);
    return send(res, 502, { msg: 'Editor server error', message: 'Editor server error' });
  }
};
