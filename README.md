# University of Leicester Bangla Society — website

Static single-page site. No build step, no dependencies.

## Structure

    index.html              the public homepage (HTML + CSS + JS inline)
    admin.html              private committee admin area, password-gated
    assets/logo.png         society crest (circular, transparent edges)
    assets/committee-*.jpg  the seven "Meet the 2026 Committee" cards

## Run locally

    python3 -m http.server 8001
    # then open http://localhost:8001

Opening index.html directly in a browser also works.

## Admin page

`admin.html` is linked from the "Admin" button in the homepage nav and
footer (the "Committee" button instead scrolls to the public "Meet the
committee" section on the homepage). Admin is gated behind a client-side
password check (currently `1234`, set the `PASSWORD` variable in the
`<script>` at the bottom of the file to change it) — this only deters
casual visitors, since anyone can view the page source and read both the
password and the gated content. Don't put anything genuinely sensitive on
it. Once unlocked it stays unlocked for the browser session
(`sessionStorage`).

## Things still to fill in

- Social links: WhatsApp group, SU membership page
  (search for `data-placeholder` in index.html and admin.html)
- Charity donate link
- Photos section: eight placeholder tiles, class `.shot`, expect ~4:3 images
- Event times and venues are invented; only Sep 24 and Dec 16 dates are set
- Admin page quick links (meeting notes, shared drive, budget tracker,
  committee chat) and contact emails are all placeholders

## Notes

- Colours are CSS custom properties on `:root` (forest #154024, rust #AA3E21,
  gold #E08A2E, cream #F3E7C8). Dark mode overrides live just below.
- Fonts are Fraunces (display) and Karla (body), loaded from Google Fonts.
- All motion is wrapped in `prefers-reduced-motion: no-preference`.
