# SETUP — getting the site and the committee editor live

Follow this top to bottom once. Afterwards, day-to-day editing is all in
`/admin/` and needs none of this. Budget about 30 minutes.

What you'll end up with:

- the public site on Netlify, rebuilt automatically whenever `main` changes
- the editor at `https://<your-site>/admin/`, log-in by invite only
- committee members publishing with one click — no GitHub accounts needed
  for anyone except you, the maintainer

> **Heads-up on Git Gateway.** Netlify has marked Git Gateway as *deprecated*:
> it still works and can still be switched on, but Netlify no longer develops
> it. Netlify Identity itself is staying. If Git Gateway is ever turned off, see
> [If Git Gateway goes away](#if-git-gateway-goes-away) — it's a three-line swap.

---

## 0. Before you start

- A GitHub account for **you only**. Nobody else on the committee needs one.
- A Netlify account (free tier is fine). Sign up with GitHub to skip a step.
- Node.js installed locally if you want to preview the site (`node -v`).

## 1. Put the site on GitHub

```bash
cd bangla-society-site
git status              # should say "nothing to commit" — the history is already here
```

On GitHub: **New repository** → name it `bangla-society-site` → **Private** →
*don't* add a README/.gitignore → **Create**. Then:

```bash
git remote add origin https://github.com/<OWNER>/bangla-society-site.git
git push -u origin main
```

## 2. Connect the repo to Netlify

1. **app.netlify.com → Add new project → Import an existing project → GitHub.**
   Authorise Netlify, pick `bangla-society-site`. (Netlify calls sites
   "projects" now; older screenshots and guides say "site".)
2. Build settings are read from `netlify.toml`, so leave the form as it is
   (publish directory `.`, build command `node scripts/index-content.js`).
   Click **Deploy**.
3. When the deploy finishes, note the URL (e.g. `https://sparkly-tiger-1234.netlify.app`).
   Rename it if you like: **Project configuration → General → Project details → Change project name.**
4. Put that URL into `admin/config.yml` (`site_url` and `display_url`, replacing
   `CHANGE-ME`), commit and push. This is what the editor's "View site" link uses.

The public site now works. `/admin/` will load but you can't log in yet.

## 3. Turn on Netlify Identity (invite-only)

1. In the project's left-hand menu: **Identity → Enable Identity.**
2. **Identity → Registration → Registration preferences → Configure** → choose
   **Invite only** → Save.
   *(This is the real gate: no one can create an account themselves.)*
3. **Identity → Registration → External providers:** leave off. Email + password
   is simplest for handover.
4. Leave the email templates alone. Invite links open the homepage with a token,
   and the homepage forwards them to the dashboard automatically.

**User limits:** on current Netlify plans (including Free) invite-only users are
unlimited, so the whole committee fits. Only old "legacy" plans had a 5-user cap.

**About the login widget:** the editor and dashboard use Netlify's classic
`netlify-identity-widget.js`. Netlify now recommends a newer `@netlify/identity`
package for new projects, but Decap's Git Gateway login is built around the
classic widget, which still works. Nothing to do here; just don't be alarmed if
the Netlify docs call it "previously recommended".

## 4. Turn on Git Gateway

1. **Identity → Services → Git Gateway → Enable Git Gateway.**
2. Netlify may ask you to authorise GitHub again; the branch to use is `main`
   (leave the "Roles" box empty — any logged-in user may use the editor).

## 5. Invite the first committee members

1. **Identity → Users → Invite users** → enter the emails (one at a time or several).
2. Each person gets an email → the link opens `dashboard.html` on your site →
   they set a password → they land on the committee dashboard → **Open the editor**.
3. Test it yourself first: invite your own email, accept, open `/admin/`, edit an
   event, press **Publish** → a new commit appears on GitHub and Netlify starts a
   deploy (the **Deploys** tab). About a minute later the homepage shows it.

## 6. Day-to-day: how a change goes live

```
member edits in /admin/  →  Publish  →  commit on main  →  Netlify rebuilds (~1 min)  →  live
```

There is no review step. If someone publishes something wrong, fix it in the
editor, or roll the whole site back in one click: **Netlify → Deploys → the last
good deploy → Publish deploy**.

Role table and the handover checklist: [`admin/ROLES.md`](admin/ROLES.md).

> Want a review step later? Set `publish_mode: editorial_workflow` in
> `admin/config.yml`. Saves then become GitHub pull requests, and whoever has
> write access on the repo approves them.

---

## Running it locally

```bash
node scripts/index-content.js     # rebuild content/*.json after editing files by hand
python -m http.server 8001        # or any static server
# open http://localhost:8001
```

Opening `index.html` straight from the file system no longer works — the page
fetches `content/*.json`, which browsers block on `file://`. Use a local server.

**Editing locally without logging in:** run `npx decap-server` in a second
terminal, then open `http://localhost:8001/admin/`. Decap notices the proxy on
localhost and writes straight to your files. This is only ever active on
localhost.

## If Git Gateway goes away

[DecapBridge](https://decapbridge.com) is a free hosted replacement that speaks
the same protocol. Sign up, add the site, and it gives you a site id. Then:

1. In `admin/config.yml`, replace the `backend:` block with

   ```yaml
   backend:
     name: git-gateway
     repo: <OWNER>/bangla-society-site
     branch: main
     identity_url: https://auth.decapbridge.com/sites/<SITE-ID>
     gateway_url: https://gateway.decapbridge.com
   ```

2. In `admin/index.html` and `dashboard.html`, remove the
   `netlify-identity-widget.js` script tag (DecapBridge shows its own login).
3. Invite members from the DecapBridge dashboard instead of Netlify Identity.

Nothing about `content/` or the site changes.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `/admin/` shows "Error loading the CMS configuration" | Syntax error in `admin/config.yml`. The message names the line. |
| Login button does nothing / "Failed to load settings" | Identity isn't enabled on *this* site (step 3), or you're on a deploy-preview URL — use the main site URL. |
| "Git Gateway Error: Please ask your site administrator to reissue the Git Gateway token" | Netlify → Identity → Services → Git Gateway → *Edit settings* → regenerate token. |
| New event published but not on the site | Wait a minute and hard-refresh; check the **Deploys** tab for a failed build. Also check the event's "Published" toggle. |
| Site shows old content after publishing | Netlify build failed or is still running: **Deploys** tab. The build only runs `node scripts/index-content.js`. |
| Netlify says the free plan needs upgrading for Identity | Only legacy plans have Identity limits. Current credit-based plans include unlimited invite-only users. |
| Invite link opens the homepage and nothing happens | The redirect script at the bottom of `index.html` sends `#invite_token` to the dashboard; make sure that script is still there. |

## Later (needs a backend — not built yet)

- **RSVP / headcount** — a Netlify Form (or Function + store) per event; slot a
  form under each `.ev-card` in `renderEvents()` and a count on the dashboard.
- **Membership enquiry form** — Netlify Forms with an email notification;
  add a `<form netlify>` to the Socials section.
- **Academic-year archive** — add a `year` field to Events in `config.yml`,
  a `view_groups` entry to group by it, and filter in `renderEvents()`.
