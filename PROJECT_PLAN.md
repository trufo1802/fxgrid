# FX Grid

## Scope
Personal, phone-first page that shows many TradingView mini charts at once, in user-defined tabs
(Asia NDF ccys, G10, EM, commodities, risk). Hosted on GitHub Pages, installed on iPhone via
Safari → Add to Home Screen (PWA). Data comes only from TradingView embed widgets — no backend, no API keys.

v1 adds, on top of the current `index.html`:
- **Movers tab** — TradingView Screener / Market Quotes widget showing change % (sortable, colored) as the
  widget-only substitute for "sort tiles by % move".
- **Manual tile tint** — per-symbol green/red/neutral background set in the editor (e.g. `... | note | green`).
- **Tap tile → full-screen advanced chart** with default studies (MA, RSI, Bollinger); close returns to grid.
- **Speed** — lazy-load tiles (IntersectionObserver), keep the existing re-render-after-background fix.
- **Attribution fix** — delete the `.tradingview-widget-copyright { display: none }` rule.

## Out of scope (v1)
- Native iOS app of any kind (revisit only if PWA fails the success test).
- Public App Store listing — blocked on TradingView's written OK + Apple guideline 4.2 risk.
- Own data feed / API keys (Twelve Data, yfinance, etc.) and anything that needs raw prices:
  auto-sorting chart tiles by % move, auto red/green tint, NDF−spot spread series.
- Custom alerts — use the TradingView iPhone app's own alerts on the same symbols.
- Scraping TradingView's internal websocket/data (ToS violation).
- Removing or restyling TradingView branding.

## Success metric
- Opens from iPhone home screen and renders every tile on the active tab within ~3 s on LTE,
  no blank tiles after returning from background.
- Used daily for 2 weeks in place of the TradingView app for the "glance at everything" job.

## Milestones
1. Delete attribution-hiding CSS; publish repo to GitHub Pages (public repo, free); install to home screen.
2. Lazy-load tiles; measure load time on phone.
3. Tap tile → full-screen advanced chart with default studies.
4. Manual tile tint field in the symbol line format + editor.
5. Movers tab (screener / market-quotes widget) — see open question 1.
6. Two-week daily-use check → decide v2 (data feed and/or private native build).

## Constraints
- Personal phone only; personal, non-commercial use.
- Free: GitHub Pages (requires public repo — code and default watchlists visible; custom lists stay in
  localStorage on device).
- TradingView terms: attribution must remain visible as originally designed under each widget.
- Apple developer account exists — enables a private Xcode / TestFlight-internal build later
  (no review, no public listing) if PWA isn't enough.

## Open questions
1. **Can a widget sort the user's own symbol list by change %?** Forex Screener widget may only take a
   market/filter, not a custom list; Market Quotes takes a custom list but may not sort.
   → *Resolve by prototype* (build both, check on phone).
2. **Are TradingView widgets allowed inside a third-party iOS app (WKWebView), private or App Store?**
   Terms found only cover attribution; WebView guidance found is for the Charting Library, not widgets.
   → *Ask TradingView* via their widget contact form before any native build ships beyond personal install.
3. **v2 data feed** — if sort/auto-tint/alerts still feel missing after 2 weeks, which free/paid API covers
   the Asia spot set, and does its licence allow client-side use with a visible key?
   → *Resolve by reading the provider's terms + a 1-day prototype*. NDF proxies won't be covered.
4. **Does a native wrapper beat the PWA on iOS widget reliability (iframe suspend/blank tiles)?**
   → *Resolve by measuring* milestone 2; build the wrapper only if PWA misses the 3 s / no-blank target.
