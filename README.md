# University of Leicester Bangla Society — website

Static site: `index.html` + `assets/`, with the content the committee edits in
`content/` and a Decap CMS editor at `/admin/`. No framework, no bundler.

## Structure

    index.html                 the public homepage (HTML + CSS + JS inline)
    dashboard.html             committee dashboard: see what's live, open the editor
    admin/                     the editor (Decap CMS): index.html, config.yml, cms.js, preview.css
    admin/ROLES.md             who can do what, and how to add a committee member
    content/events/*.md        one file per event   → content/events.json (generated)
    content/photos/*.md        one file per photo   → content/photos.json (generated)
    content/settings/*.json    links, charity total, announcement banner
    scripts/index-content.js   builds the two generated JSON files (Node, no deps)
    vercel.json                deploy settings, redirects, headers
    SETUP.md                   the full runbook (Vercel, the editor password, your domain)
    assets/logo.png            society crest
    assets/committee-*.jpg     the seven "Meet the 2026 Committee" cards
    assets/photos/             gallery uploads from the editor

## Run locally

    node scripts/index-content.js   # only needed after editing content/*.md by hand
    python -m http.server 8001
    # open http://localhost:8001

The homepage fetches `content/*.json`, so it needs a server — opening the file
directly no longer works. To try the editor without logging in, also run
`npx decap-server` and open http://localhost:8001/admin/.

## Editing content

Committee members sign in at `/dashboard.html` and click **Open the editor**.
Pressing Publish commits to `main` and Vercel rebuilds the site in about a
minute. Login is one shared committee password (checked by `api/cms.js`); nobody needs an account.
Details: `SETUP.md` (one-off setup) and `admin/ROLES.md` (day-to-day roles).

## Things still to fill in

- Vercel environment variables: `CMS_PASSWORD`, `GITHUB_TOKEN` (SETUP.md step 3)
- `admin/config.yml`: `site_url` / `display_url`
- `dashboard.html`: the four quick links, contact emails
- Through the editor: WhatsApp link, SU membership link, donate link, photos

## Notes

- Colours are CSS custom properties on `:root` (forest #154024, rust #AA3E21,
  gold #E08A2E, cream #F3E7C8). Dark mode overrides live just below.
- Fonts are Fraunces (display) and Karla (body), loaded from Google Fonts.
- All motion is wrapped in `prefers-reduced-motion: no-preference`.
- `admin/preview.css` mirrors the homepage component styles for the editor's
  live preview; update it if those components change.
