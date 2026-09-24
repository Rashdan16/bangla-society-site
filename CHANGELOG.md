# Changelog

## [2026-09-24] - Dashboard buttons work: fix the /admin/ redirect loop, edit in place
- Fixed: every "Open the editor" / pencil / card link went into an endless
  redirect (`/admin/` → `/admin` → `/admin/` …) because `vercel.json` had
  `trailingSlash: false` fighting the `/admin` → `/admin/` redirect. Removed
  `trailingSlash`; `/admin/` loads again.
- `dashboard.html` is now a working editor. "Sign in to edit" (name + committee
  password, same login as `/admin/`), then every tile pencil and action card
  opens a slide-in panel: announcement (on/off, message, link, live preview),
  charity total (quick "+ £" buttons, bar preview), events (list, add, edit,
  hide as draft, delete, card preview) and photos (upload with drag and drop,
  shrunk to ≤1600px JPEG in the browser; caption, tile size, order; add/delete
  tiles). Publish writes the file through `/api/cms`, and the tile shows
  "Going live…" until the homepage has the change, then "Update is live".
  Edits made by someone else in the meantime are caught instead of overwritten.
- Demo mode (`/dashboard.html?demo`, or "Try the demo" in the sign-in box)
  runs the same panels on an in-browser copy; nothing is saved.
- `api/cms.js`: single-file writes through the contents API also carry the
  signed-in name as the commit author.
- README, SETUP.md and admin/ROLES.md point committee members at the dashboard.
- Files affected: vercel.json, dashboard.html, api/cms.js, README.md, SETUP.md,
  admin/ROLES.md, CHANGELOG.md

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
