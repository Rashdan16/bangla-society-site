# Changelog

## [2026-09-24] - Editor login is one shared committee password (DecapBridge dropped)
- New `api/cms.js` Vercel function: checks the password from the
  `CMS_PASSWORD` env var and forwards the editor's GitHub requests using
  `GITHUB_TOKEN`, restricted to the repo endpoints publishing needs. Sessions
  last two weeks; changing the password logs everyone out. Commits carry the
  name typed at login.
- `admin/config.yml` backend now points at `/api/cms/auth` and
  `/api/cms/git/github`; `vercel.json` adds the `/api/cms/*` rewrite and
  no-store/noindex headers for `/api/`.
- `admin/index.html` relabels Decap's login boxes to "Your name" and
  "Committee password".
- Dashboard, SETUP.md (step 3 and 5 rewritten), ROLES.md, README updated.
- Files affected: api/cms.js (new), admin/config.yml, admin/index.html,
  vercel.json, dashboard.html, SETUP.md, admin/ROLES.md, README.md, CHANGELOG.md

## [2026-09-24] - Set GitHub repo in CMS config
- admin/config.yml: replaced the `GITHUB-USERNAME` placeholder with
  `Rashdan16/bangla-society-site` so Decap commits to the right repo.
  The DecapBridge site ID placeholder is still pending.
- Files affected: admin/config.yml, CHANGELOG.md

## [2026-09-18] - Host on Vercel with DecapBridge login
- Replaced netlify.toml with vercel.json (build command, output dir, redirects,
  headers). Editor login moves from Netlify Identity + Git Gateway to
  DecapBridge; members still need only an email address.
- admin/index.html: Identity widget removed, explicit config link added.
- dashboard.html: sign-in gate removed (login lives inside the editor); header
  gets an "Open the editor" button. index.html: invite-token redirect removed.
- SETUP.md rewritten for Vercel, DecapBridge and a custom domain; ROLES.md and
  README updated.
- Files affected: vercel.json (new), netlify.toml (deleted), admin/config.yml,
  admin/index.html, dashboard.html, index.html, SETUP.md, admin/ROLES.md, README.md

## [2026-09-18] - Runbook click paths verified against current Netlify UI
- SETUP.md: "Add new project", Identity menu paths, invite path, note that
  invite-only users are unlimited on current plans and that Decap needs the
  classic Identity widget.
- Files affected: SETUP.md, admin/ROLES.md

## [2026-09-18] - Publish directly, no approval step
- Switched Decap to `publish_mode: simple`: pressing Publish commits to `main`
  and Netlify rebuilds; no pull requests, no GitHub accounts for members.
- Removed `.github/CODEOWNERS` and the branch-protection steps from the runbook.
- Rewrote `admin/ROLES.md` around a single site maintainer who can roll back.
- Dashboard: "Review changes" card replaced by "Add an event", publish flow and
  roles table reworded; `GITHUB_REPO` setting removed.
- Files affected: admin/config.yml, admin/cms.js, admin/ROLES.md, SETUP.md,
  README.md, dashboard.html, .github/CODEOWNERS (deleted)

## [2026-09-18] - Committee editor (Decap CMS) and dashboard
- Moved events, photos, social links, charity total and the announcement banner
  out of `index.html` into `content/`; the homepage now fetches and renders them
  at load with the design, fonts, tokens and animations unchanged.
- Added `scripts/index-content.js` (Node, zero dependencies) to build
  `content/events.json` and `content/photos.json` from the per-file entries;
  Netlify runs it as the build command.
- Added a dismissible announcement strip under the nav, remembered per message.
- Added the Decap CMS editor at `/admin/` with editorial workflow, live previews
  that render the real site components, a branded loading screen and theme.
- Replaced the client-side password page with `dashboard.html`: Netlify Identity
  sign-in, live overview tiles, editor shortcuts, publishing flow and roles.
- Added `admin/ROLES.md`, `.github/CODEOWNERS`, `netlify.toml`, `SETUP.md`.
- Files affected: index.html, dashboard.html (renamed from admin.html), admin/*,
  content/*, scripts/index-content.js, netlify.toml, SETUP.md, README.md,
  .github/CODEOWNERS, .gitignore
