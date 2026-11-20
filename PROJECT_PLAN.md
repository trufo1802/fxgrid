# FX Grid

Live: https://trufo1802.github.io/fxgrid/ · Repo: https://github.com/trufo1802/fxgrid (public, branch `main`,
GitHub Pages serves repo root, `.nojekyll` present). Last updated 2026-11-21.

## Status

| # | Milestone | Status |
|---|---|---|
| 1 | Attribution fix + publish to GitHub Pages | **Done** |
| 2 | Lazy-load tiles + load-time readout | **Done in code** — phone measurement still owed |
| 3 | Tap tile → full-screen advanced chart | To do |
| 4 | Manual tile tint (green/red) | To do |
| 5 | Movers tab | To do — prototype first (open question 1) |
| 6 | Two-week daily-use check → decide v2 | To do |

## Scope
Personal, phone-first page that shows many TradingView mini charts at once, in user-defined tabs
(Asia NDF ccys, G10, EM, commodities, risk). Hosted on GitHub Pages, installed on iPhone via
Safari → Share → Add to Home Screen (PWA). Data comes only from TradingView embed widgets — no backend,
no API keys.

## Out of scope (v1)
- Native iOS app of any kind (revisit only if PWA fails the success test).
- Public App Store listing — blocked on TradingView's written OK + Apple guideline 4.2 risk.
- Own data feed / API keys (Twelve Data, yfinance, etc.) and anything that needs raw prices:
  auto-sorting chart tiles by % move, auto red/green tint, NDF−spot spread series.
- Custom alerts — use the TradingView iPhone app's own alerts on the same symbols.
- Scraping TradingView's internal websocket/data (ToS violation).
- Removing, hiding or restyling TradingView branding.

## Success metric
- Opens from iPhone home screen and renders every tile on the active tab's first screen within ~3 s on LTE,
  no blank tiles after returning from background.
- Used daily for 2 weeks in place of the TradingView app for the "glance at everything" job.

## Done so far

**M1 — publish.** Repo created, Pages enabled. Deleted the CSS rule that hid `.tradingview-widget-copyright`.

**M2 — speed + attribution** (commit `e0ec0e5`).
- Found during M2: `widget()` never created the attribution div at all, so M1's CSS delete changed nothing.
  Now every widget gets TradingView's official snippet line "Track all markets on TradingView" (18px row,
  tile heights +18px). `direction: rtl` on that row makes narrow tiles clip from the left, so
  "…on TradingView" stays visible. **Keep this — TradingView terms require attribution visible as designed.**
- Lazy-load: `IntersectionObserver` with `rootMargin: 300px` builds each widget iframe only when its tile is
  near the viewport. Fallback: load immediately if no IntersectionObserver.
- `?perf` readout: open `…/fxgrid/?perf` once (remembered in localStorage, so it also works from the
  home-screen app; `?perf=0` turns it off). Header shows `loaded/started tiles · seconds since render`.
- Measured only in a desktop browser at 375px width: first screen (8 tiles) 1.1 s, all 14 after scroll 8.2 s.
  **Not yet measured on iPhone over LTE.**

## Remaining milestones — notes for whoever picks them up

**M2b — phone measurement (do first, 5 min).** Safari → open `?perf` link → Add to Home Screen → launch from
icon on LTE → note seconds when first screen is all loaded. Then background the app >5 min and return
(existing `visibilitychange` handler re-renders) — check for blank tiles. If >3 s or blanks: that is the trigger
for open question 4, not for more features.

**M3 — tap tile → big chart.**
- Gotcha: the mini widget is a cross-origin iframe, so taps *inside* the chart never reach our page. Tap target
  must be the label row (`.lbl`) or a small ⤢ button on it — or a transparent overlay div above the iframe
  (but that kills the widget's own hover/tap).
- Overlay: fixed full-screen div with close button, containing TradingView **Advanced Chart** widget
  (`https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js`), config roughly
  `{ symbol, interval, theme: state.theme, autosize: true, studies: [...], hide_side_toolbar: true, locale: "en" }`.
  Map `state.range` → `interval` (1D→"5", 1M→"60", 3M→"240", 1Y→"D", 5Y→"W").
- Default studies MA / RSI / Bollinger: check current study IDs in TradingView widget docs
  (older form `"MASimple@tv-basicstudies"`, `"RSI@tv-basicstudies"`, `"BB@tv-basicstudies"`; newer docs use
  `"STD;..."` ids). Verify on the live widget, don't guess.
- Keep the attribution line in the overlay too. Close on ✕ and on browser back (push a history state).
- Alternative worth 10 min: mini widget's own `largeChartUrl` option — clicking the widget opens that URL with
  the symbol; point it at `./?chart=SYMBOL` and handle that param. Check whether it opens a new tab in
  standalone PWA mode (bad) or same window.

**M4 — manual tile tint.**
- Extend symbol line format to 4 fields: `EXCHANGE:TICKER | label | note | tint` where tint ∈ `green`, `red`, blank.
- `parse()` reads 4th field; add class `tint-green` / `tint-red` on `.tile`. Widgets use `isTransparent: true`,
  so a tinted tile background shows through the chart. Pick tints that keep text readable in both themes
  (e.g. `color-mix(in srgb, #3fb950 12%, var(--panel))`).
- Update editor help text (`#editor .note`). Existing saved lists without the 4th field must still work.

**M5 — Movers tab** (prototype both, keep whichever works on phone):
- *Market Quotes* widget (`embed-widget-market-quotes.js`): takes a custom `symbolsGroups` list (can reuse the
  active tab's symbols), shows change %. Probably not sortable.
- *Screener* widget (`embed-widget-screener.js`): `market: "forex"`, sortable by change %, colored — but likely
  can't restrict to your own list.
- Render Movers as a special tab with one full-width widget instead of the tile grid.

**M6 — two-week check.** Daily use for 2 weeks. If sort/auto-tint/alerts still feel missing → open question 3.
If iOS reliability is the pain → open question 4.

## Constraints
- Personal phone only; personal, non-commercial use.
- Free GitHub Pages ⇒ public repo. Code and default watchlists are visible; custom watchlists stay in
  localStorage on each device (they do **not** sync between Mac and iPhone).
- TradingView terms: attribution must remain visible as originally designed under each widget.
- Apple developer account exists — enables a private Xcode / TestFlight-internal build later
  (no review, no public listing) if the PWA isn't enough.

## Open questions
1. **Can a widget sort the user's own symbol list by change %?** → *prototype* (M5).
2. **Are TradingView widgets allowed inside a third-party iOS app (WKWebView), private or App Store?**
   Terms found only cover attribution; WebView guidance found is for the Charting Library, not widgets.
   → *ask TradingView* via their widget contact form before any native build goes beyond personal install.
3. **v2 data feed** — which free/paid API covers the Asia spot set, and does its licence allow client-side use
   with a visible key? NDF proxies won't be covered. → *read provider terms + 1-day prototype*.
4. **Does a native WKWebView wrapper beat the PWA on iOS reliability (iframe suspend, blank tiles)?**
   → *measure* M2b first; build wrapper only if PWA misses the 3 s / no-blank target.

## Working on it from another machine (MacBook)
- Get the code: `git clone https://github.com/trufo1802/fxgrid.git` (or `git pull` if already cloned).
  If this folder also syncs via OneDrive, pick **one** copy to edit — don't run git in both, and don't let
  OneDrive sync a `.git` folder while git is writing to it.
- Preview: `cd fxgrid && python3 -m http.server 8000` → http://localhost:8000. To test on iPhone on the same
  Wi-Fi: `http://<mac-ip>:8000` (`ipconfig getifaddr en0`).
- Ship: `git add -A && git commit -m "..." && git push` — Pages redeploys in ~30–60 s.
  Branch is `main`; never push `master`.
- No build step, no dependencies. Everything is in `index.html`.
