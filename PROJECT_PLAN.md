# FX Grid

Live: https://trufo1802.github.io/fxgrid/ · Repo: https://github.com/trufo1802/fxgrid (public, branch `main`,
GitHub Pages serves repo root, `.nojekyll` present). Last updated 2026-11-21 (re-planned: lock + sync, App Store stance).

## Status

| # | Milestone | Status |
|---|---|---|
| 1 | Attribution fix + publish to GitHub Pages | **Done** |
| 2 | Lazy-load tiles + load-time readout | **Done in code** |
| 2b | iPhone test: first screen <3 s on LTE, no blank tiles after background | **To do — first, 5 min** |
| 3 | Passphrase lock + watchlists synced PC → iPhone | **Done** — live; iPhone unlock not yet checked |
| 4 | Tap tile → full-screen advanced chart | To do |
| 5 | Manual tile tint (green/red) | To do |
| 6 | Movers tab | To do — prototype first (open question 1) |
| 7 | Two-week daily-use check → decide native wrapper / v2 | To do |

## Scope
Personal, phone-first page showing many TradingView mini charts at once, in user-defined tabs (Asia NDF ccys,
G10, EM, commodities, risk). Hosted free on GitHub Pages, installed on iPhone via Safari → Share → Add to Home
Screen (PWA) — **this is the iPhone app for v1**. Data comes only from TradingView embed widgets — no backend,
no API keys. "Mine only" via a passphrase: watchlists are encrypted in the public repo and decrypted on device;
strangers who find the URL see only a passphrase box. Lists are edited on the PC and pushed; every device reads
the same encrypted file.

How it fits together:
```
iPhone home-screen icon ─┐
PC browser ──────────────┼─> github.io/fxgrid  (static page, public code)
                         │      ├─ passphrase → decrypts lists.enc.json (key remembered per device)
                         │      └─ each tile = TradingView iframe → TradingView servers (prices)
PC: edit lists.local.json → encrypt script → git push  (repo holds only ciphertext)
```

## Out of scope (v1)
- **Public App Store listing.** Blocked three ways: Apple 4.2 (a wrapper around web widgets is the textbook
  rejection), TradingView widget rights for in-app distribution (open question 2), and a passphrase-locked
  single-user app belongs on TestFlight/direct install, not the Store. A public app is a **separate later
  project** with its own data licence, native charts and alert server — see "Public later" below.
- Native iOS app for v1. A private Xcode/TestFlight WKWebView wrapper is allowed **only if** M2b/M7 show the
  PWA is unreliable.
- Push alerts — use the TradingView iPhone app's alerts on the same symbols. (Web Push works for home-screen
  PWAs since iOS 16.4; the missing piece is an always-on price watcher, i.e. a server + feed.) Revisit at M7.
- Real access control (per-user revoke, audit log, Cloudflare Access). Passphrase gate is enough for "mine only".
- Two-way sync / editing lists on the phone and saving back. In-page editor stays a per-device override.
- Encrypting the page code itself.
- Own data feed / API keys and anything needing raw prices: auto-sort by % move, auto tint, NDF−spot spread.
- Scraping TradingView's internal data; removing, hiding or restyling TradingView branding.

## Success metric
- Opens from iPhone home screen, every tile on the active tab's first screen rendered within ~3 s on LTE,
  no blank tiles after returning from background.
- Locked: a fresh browser at the URL shows only the passphrase box; `git grep` for any watchlist ticker finds
  nothing in tracked files at HEAD; passphrase typed once per device, not per launch.
- Synced: edit on PC → encrypt → push → the iPhone shows the change on next open (≤ Pages deploy ~1 min).
- Used daily for 2 weeks in place of the TradingView app for the "glance at everything" job.

## Done so far

**M1 — publish.** Repo created, Pages enabled. Deleted the CSS rule that hid `.tradingview-widget-copyright`.

**M2 — speed + attribution** (commit `e0ec0e5`).
- `widget()` never created the attribution div, so M1's CSS delete changed nothing. Now every widget gets
  TradingView's official snippet line (18px row, tiles +18px); `direction: rtl` keeps "…on TradingView" visible
  on narrow tiles. **Keep — TradingView terms require attribution visible as designed.**
- Lazy-load via `IntersectionObserver` (`rootMargin: 300px`); immediate-load fallback.
- `?perf` readout (remembered in localStorage; `?perf=0` off): `loaded/started tiles · seconds since render`.
- Desktop at 375px: first screen (8 tiles) 1.1 s, all 14 after scroll 8.2 s. **Not yet measured on iPhone/LTE.**

## Remaining milestones — notes for whoever picks them up

**M2b — phone test (do first, 5 min).** Safari → open `…/fxgrid/?perf` → Add to Home Screen → launch from icon
on LTE → note seconds when the first screen is all loaded. Background >5 min, return (`visibilitychange`
re-renders) — check for blanks. If >3 s or blanks: that triggers open question 4, not more features.
Re-add the home-screen icon after M3 ships if the start URL or manifest changes.

**M3 — passphrase lock + PC→phone sync.**
- Move `DEFAULT_TABS` (tabs, symbols, notes) out of `index.html` into `lists.local.json` — **gitignored**; it
  syncs between your machines via OneDrive, never to GitHub.
- `encrypt.mjs` (Node 24 built-in WebCrypto, no deps): passphrase → PBKDF2-SHA256 (≥600k iters, random salt) →
  AES-256-GCM (random 12-byte IV) → `lists.enc.json` `{v, salt, iv, iter, ct}` (base64). Prompt for passphrase,
  don't take it as an argv (shell history). Reference pattern: `encrypted-static-site` skill.
- Page: fetch `lists.enc.json` with `cache: "no-store"` (Pages sends max-age=600) → if no key stored, show only a
  passphrase box → derive key, decrypt, render. Store the derived key as a **non-extractable CryptoKey in
  IndexedDB** (not the passphrase, not in localStorage). Wrong passphrase → GCM auth fails → "wrong passphrase".
  Add a "Lock / forget key" button.
- Cache last decrypted lists in memory only; if fetch fails offline, fall back to last ciphertext in
  localStorage + stored key.
- In-page editor: keep as per-device override over synced lists; "Reset tab" now resets to the synced version.
  Add "Copy tab as JSON" so a phone edit can be pasted into `lists.local.json` on the PC.
- Ship flow: edit `lists.local.json` → `node encrypt.mjs` → `git add lists.enc.json index.html && git commit && git push`.
- Passphrase: script refuses <8 chars, warns <16. Ciphertext is public forever, so offline guessing is the
  threat model; current one is short (owner's choice, low-stakes data). Strengthen with `--new-passphrase`.
  Lose it = re-encrypt with a new one; nothing else is lost.
- The current default watchlists are already in public git history (commits `beb56c2`…`13f95b2`). Leave them
  (generic FX pairs) unless you decide otherwise — rewriting needs a force-push on `main`.

**M4 — tap tile → big chart.**
- Mini widget is a cross-origin iframe, taps inside never reach the page. Tap target = label row (`.lbl`) or a
  ⤢ button on it (an overlay above the iframe kills the widget's own tap).
- Overlay: fixed full-screen div + close button, TradingView **Advanced Chart** widget
  (`embed-widget-advanced-chart.js`), `{ symbol, interval, theme, autosize: true, studies, hide_side_toolbar: true }`.
  Map `state.range` → `interval` (1D→"5", 1M→"60", 3M→"240", 1Y→"D", 5Y→"W").
- Study IDs (MA/RSI/BB): verify on the live widget (`"RSI@tv-basicstudies"` vs newer `"STD;..."`), don't guess.
- Keep attribution in the overlay. Close on ✕ and browser back (push a history state).
- 10-min alternative: mini widget `largeChartUrl` → `./?chart=SYMBOL`; check it doesn't open a new tab in
  standalone PWA mode.

**M5 — manual tile tint.** 4th field in list entries (`tint`: `green`/`red`/blank) → `.tint-green`/`.tint-red` on
`.tile`; widgets are `isTransparent`, so tint shows through. Readable in both themes
(`color-mix(in srgb, #3fb950 12%, var(--panel))`). Entries without the field still work. Update editor help.

**M6 — Movers tab** (prototype both, keep whichever works on phone): *Market Quotes* widget (custom
`symbolsGroups`, shows change %, probably not sortable) vs *Screener* widget (`market: "forex"`, sortable, likely
can't restrict to your list). Render as one full-width widget instead of the grid.

**M7 — two-week check.** Daily use. Then decide, in this order:
1. iOS reliability is the pain → open question 4 (private wrapper).
2. Sort / auto-tint / alerts feel missing → open question 3 (v2 feed); alerts would ride on the same feed + a
   small cron worker + Web Push.
3. Still want others to use it → start "Public later" as its own plan (`/plan-grill`).

## Public later (separate project, not milestones here)
Preconditions before any work: (a) TradingView's written answer on widgets in apps (open question 2) — likely
"no", which means (b) a redistributable FX data licence (Pepperstone NDF proxies almost certainly aren't;
retail feeds often forbid redistribution), (c) native charts (Swift Charts), (d) a server for alerts/accounts.
v1's reusable parts: the watchlist JSON format and the tab/tile UX — not the widget layer.

## Constraints
- Personal phone, personal non-commercial use.
- Free GitHub Pages ⇒ public repo; only ciphertext of lists is committed. Code is public.
- TradingView terms: attribution visible as designed under each widget.
- Apple developer account exists → private Xcode / TestFlight-internal build possible (builds expire 90 days).
- Node 24 + Python `cryptography` available on the Mac for the encrypt script.

## Open questions
1. **Can a widget sort the user's own symbol list by change %?** → *prototype* (M6).
2. **Are TradingView widgets allowed inside a third-party iOS app (WKWebView), private or App Store?**
   → *ask TradingView* via their widget contact form. Gates any native build beyond personal install and the
   whole "Public later" track.
3. **v2 data feed** — which API covers the Asia spot set, and does its licence allow client-side use with a
   visible key / redistribution? NDF proxies likely not covered. → *read provider terms + 1-day prototype*.
4. **Does a native WKWebView wrapper beat the PWA on iOS reliability?** → *measure* M2b first; build only if the
   PWA misses the 3 s / no-blank target.
5. **Does the IndexedDB key survive in the home-screen PWA?** iOS can evict storage for web apps unused for a
   while (ITP 7-day rule applies to Safari; installed PWAs are reportedly exempt). → *test during M7*; worst case
   is retyping the passphrase.

## Working on it from another machine
- `git clone https://github.com/trufo1802/fxgrid.git` (or `git pull`). If this folder also syncs via OneDrive,
  edit **one** copy only — don't run git in both. Note `lists.local.json` is gitignored: a fresh clone won't
  have it; copy it from OneDrive.
- Preview: `python3 -m http.server 8000` → http://localhost:8000 (iPhone on same Wi-Fi: `http://<mac-ip>:8000`,
  `ipconfig getifaddr en0`). WebCrypto needs a secure context: localhost is fine; a LAN IP over http is **not** —
  test decryption on the phone via the live Pages URL.
- Ship: `git push` to `main` (never `master`); Pages redeploys in ~30–60 s.
