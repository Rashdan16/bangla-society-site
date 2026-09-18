# SETUP — getting the site and the committee editor live

Follow this top to bottom once. Afterwards, day-to-day editing is all in
`/admin/` and needs none of this. Budget about 45 minutes, most of it waiting
for DNS.

What you'll end up with:

- the public site on **Vercel**, at your own domain, rebuilt automatically
  whenever `main` changes
- the editor at `https://<your-domain>/admin/`, log-in by invite only through
  **DecapBridge** — committee members need an email address, nothing else
- one-click publishing, no approval step

Accounts you need (all free tiers): GitHub (you already have it), Vercel,
DecapBridge. Nobody else on the committee needs any of them.

---

## 1. Push the site to GitHub

Already done if you followed along in GitHub Desktop: the `bangla-society-site`
repository is published as **private** under your account. If not: **File → Add
local repository** → pick the `bangla-society-site` folder → **Publish
repository** → tick *Keep this code private*.

Note your repo path in the form `GITHUB-USERNAME/bangla-society-site`; you'll
need it twice below.

## 2. Deploy on Vercel

1. **vercel.com → Add New → Project → Import** the `bangla-society-site` repo
   (authorise Vercel's GitHub app if asked, giving it access to just this repo).
2. On the configure screen, Vercel reads `vercel.json`, so the fields should
   already show: Framework Preset **Other**, Build Command
   `node scripts/index-content.js`, Output Directory `.`. Leave everything else
   empty and press **Deploy**.
3. After a minute you get a `https://bangla-society-site-….vercel.app` URL. The
   homepage works now. `/admin/` loads but can't log in yet.

## 3. Set up DecapBridge (the editor login)

1. **decapbridge.com → Sign up** (use your own email) → **Create site**.
2. Repository: `GITHUB-USERNAME/bangla-society-site`. Auth method: **Classic**
   (email + password; simplest for handover).
3. DecapBridge needs permission to commit to the repo. It asks for a GitHub
   token: **GitHub → Settings → Developer settings → Personal access tokens →
   Fine-grained tokens → Generate new token.** Name it `decapbridge`, choose
   *Only select repositories* → `bangla-society-site`, and under *Repository
   permissions* set **Contents: Read and write**. Copy it into DecapBridge.
   (Set an expiry you'll remember, e.g. one year; DecapBridge will tell you when
   it stops working, and you just paste a new one.)
4. DecapBridge shows a config snippet with your **site id**. You don't need to
   paste the whole snippet: open `admin/config.yml` and replace the two
   placeholders in the `backend:` block:

   ```yaml
   repo: GITHUB-USERNAME/bangla-society-site
   identity_url: https://auth.decapbridge.com/sites/DECAPBRIDGE-SITE-ID
   ```

5. Commit and push (GitHub Desktop: write a summary, **Commit**, **Push origin**).
   Vercel redeploys automatically.
6. Test: open `https://…vercel.app/admin/`, log in with the DecapBridge account
   you just made, change an event, press **Publish**. A commit appears on GitHub
   and Vercel starts a build; a minute later the homepage shows it.

## 4. Connect your domain

1. **Vercel → the project → Settings → Domains → Add.** Enter your domain, e.g.
   `bangla-society.co.uk`. Accept Vercel's suggestion to add `www.` as well and
   redirect one to the other (pick whichever you want people to see).
2. Vercel shows the DNS records to add. Log in to wherever you bought the domain
   and add exactly those. Typically:

   | Type | Name | Value |
   |---|---|---|
   | `A` | `@` | `76.76.21.21` (use the value Vercel shows you) |
   | `CNAME` | `www` | the `….vercel-dns….com` value Vercel shows you |

   Delete any existing `A` or `CNAME` records for `@` and `www` that the
   registrar put there as "parking" pages.
3. Back in Vercel the domain flips to **Valid configuration** once DNS
   propagates — usually minutes, occasionally a few hours. HTTPS is automatic.
4. Put the final address into `admin/config.yml` (`site_url` and `display_url`,
   replacing `CHANGE-ME`, e.g. `https://www.bangla-society.co.uk`). Commit and
   push.

## 5. Invite the committee

1. **DecapBridge → your site → Manage collaborators → Invite** → enter an email.
2. They get an email with a link, set a password (or choose Google/Microsoft if
   you enabled PKCE), and land in the editor at `/admin/`.
3. Point them at `https://<your-domain>/dashboard.html` as the bookmark: it
   shows what's live and has the **Open the editor** button.

Free tier: 3 sites and 10 collaborators per site — enough for the committee.

## 6. Day-to-day: how a change goes live

```
member edits in /admin/  →  Publish  →  commit on main  →  Vercel rebuilds (~1 min)  →  live
```

There is no review step. If someone publishes something wrong, fix it in the
editor, or roll the whole site back: **Vercel → Deployments → the last good one
→ ⋯ → Instant Rollback**.

Role table and the handover checklist: [`admin/ROLES.md`](admin/ROLES.md).

> Want a review step later? Set `publish_mode: editorial_workflow` in
> `admin/config.yml` and give the DecapBridge token *Pull requests: Read and
> write* as well. Saves then become GitHub pull requests you merge.

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

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `/admin/` shows "Error loading the CMS configuration" | Syntax error in `admin/config.yml`. The message names the line. |
| Login form says the email or password is wrong | They haven't accepted the DecapBridge invite yet, or used a different email. Re-send from *Manage collaborators*. |
| "Failed to persist entry" / commit errors after login | The GitHub token DecapBridge holds has expired or lacks *Contents: write*. Generate a new fine-grained token and paste it into DecapBridge. |
| New event published but not on the site | Wait a minute and hard-refresh; check **Vercel → Deployments** for a failed build. Also check the event's "Published" toggle. |
| Domain shows "Invalid configuration" | Compare the records at your registrar with what Vercel's Domains page shows; remove conflicting parking records. Give it up to a few hours. |
| Uploaded photo shows in the editor but not on the site | The build hasn't finished, or the file is very large. Keep photos under ~1 MB. |

## Later (needs a backend — not built yet)

- **RSVP / headcount** — a small Vercel Function plus a store (or Supabase);
  slot a form under each `.ev-card` in `renderEvents()` and a count on the dashboard.
- **Membership enquiry form** — a form service (Formspree, Tally) or a Vercel
  Function that emails the committee; add it to the Socials section.
- **Academic-year archive** — add a `year` field to Events in `config.yml`,
  a `view_groups` entry to group by it, and filter in `renderEvents()`.
