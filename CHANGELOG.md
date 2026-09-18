# Changelog

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
