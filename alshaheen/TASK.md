# TASK: Al-Shaheen (الشاهين) — 3D Scrollytelling Delivery Site

> **Workflow note:** Enter plan mode first. Read this whole file + `index.html` before proposing a plan.

## 1. Context

Prototype of an Emons-style (emons.de — Awwwards HM, agency: BWS) scrollytelling landing page for **الشاهين**, a fictional Libyan delivery company. Built as a Rumuz demo to show clients what a premium interactive site looks like. Language: **Arabic, RTL, Libyan dialect copy.**

The concept: the page is a delivery journey across three Libyan cities. Scroll drives a pseudo-camera (scale + pan) through full-viewport sticky scenes of Tripoli → Misrata → Benghazi, with floating info cards (Emons-style) and a signature "route rail" progress indicator on the side showing the truck moving between city stops.

`index.html` is the working prototype — single file, no dependencies, no build step. Vanilla JS, transform/opacity-only animations, rAF-throttled scroll handler, IntersectionObserver reveals, `prefers-reduced-motion` respected.

## 2. URGENT FIRST TASK — image assets expire in days

The 4 scene images were AI-generated on Freepik (isometric low-poly, white world, burnt-amber #E8730C trucks, sage trees — consistent style). They are hotlinked with **signed URLs that expire ~2026-07-24**. Before anything else:

```bash
mkdir -p assets
curl -L -o assets/hub.jpg      "https://pikaso.cdnpk.net/private/production/4928425586/render.jpg?token=exp=1784851200~hmac=48df6ab59380c747951b75607acfc1fd6f4c3dad17ae325dd08ea1549b4bb8b7"
curl -L -o assets/tripoli.jpg  "https://pikaso.cdnpk.net/private/production/4928423554/render.jpg?token=exp=1784851200~hmac=692a8b57445f0f105f9e48339d4778c1d9fb919835ee417d1ff9c51e0838d6ae"
curl -L -o assets/misrata.jpg  "https://pikaso.cdnpk.net/private/production/4928424310/render.jpg?token=exp=1784851200~hmac=2d65e39b4d373d05f63f46092799aed40468ad2d8df857540423576995da3c64"
curl -L -o assets/benghazi.jpg "https://pikaso.cdnpk.net/private/production/4928424739/render.jpg?token=exp=1784851200~hmac=da2a96690211ee220faee24229f9d3b52044b9ecaf096508e75ba09b00fd4eef"
```

Then replace all 5 URL references in `index.html` (4 CSS `background-image` + 1 JS probe URL) with local `assets/*.jpg` paths, and **delete the sandbox fallback**: the `.no-img` CSS block, the `.fallback-note` element, and the JS image probe — they existed only because Claude.ai's artifact preview blocks external images. Generate WebP versions (`cwebp -q 82`) with `image-set()` or `<picture>`-equivalent fallback if kept as CSS backgrounds.

If any image fails to download (expired), STOP and tell Ziad — he can re-download from his Freepik history (freepik.com → My creations) or regenerate.

## 3. Design tokens (do not drift)

- **Ink** `#201A14` · **Bone** `#FBF9F5` · **Amber** `#E8730C` · **Amber-deep** `#B4550A` · **Sage** `#9DBFA5` · **Sea** `#7FC4BD`
- Display: `Alexandria` 700/900 · Body: `IBM Plex Sans Arabic` 300–500 (Google Fonts)
- Easing: `cubic-bezier(0.32,0.72,0,1)` everywhere. Transform/opacity only. No linear/ease-in-out.
- Cards use double-bezel (outer translucent shell + inner white core). Pill buttons with nested circular arrow.

## 4. Backlog (priority order)

1. **Localize assets** (section 2) + restructure into `index.html` / `css/main.css` / `js/main.js` / `assets/`.
2. **SVG truck on the route rail** — replace the round marker with a small side-view amber truck SVG that drives along the rail; subtle wheel rotation while scrolling, tilts slightly with scroll velocity. Keep it under ~1.5KB inline SVG.
3. **Scene depth pass** — split each scene into 2 layers if feasible (image + a foreground cutout via CSS mask or a duplicated blurred strip) for parallax depth. If too hacky, skip — don't fake it badly.
4. **Hero entrance choreography** — after loader: staggered mask-reveal of headline lines (translateY + clip), then card, then scroll hint. Currently everything appears at once.
5. **Mobile polish** — test at 390px: scene cards may cover too much of the image; consider bottom-sheet style card that peeks then expands on scroll progress. Route rail is hidden on mobile — add a slim top progress bar variant instead.
6. **Performance** — lazy-load scenes 2–3 images (`loading` strategy via JS since they're CSS backgrounds — or convert to `<img>` with `object-fit:cover`, which also improves a11y with alt text). Preload hero + fonts. Target Lighthouse ≥ 90 mobile.
7. **WhatsApp CTA** — wire the CTA buttons to `https://wa.me/218XXXXXXXXX?text=...` (placeholder number, prefilled Arabic message: "نبي نشحن طرد من … إلى …").
8. **(Optional) 4th scene: سبها** — if Ziad wants the south represented, he'll regenerate a matching Freepik image (same style preamble as others); scene markup is copy-paste of an existing one + new rail stop at 4 positions.

## 5. Acceptance criteria

- Opens from filesystem AND from a static server with zero console errors.
- 60fps scroll on mid-range hardware (no layout thrash — verify with DevTools performance trace).
- Full RTL correctness (cards anchor right, rail readable, arrows point correct direction).
- Reduced-motion: page fully readable with all content visible, no scroll-jacking artifacts.
- All copy in Libyan Arabic as written — do not "correct" dialect to MSA.

## 6. Out of scope (for now)

- No frameworks, no build step, no Three.js — this stays a zero-dependency static page.
- No backend/forms. WhatsApp link only.
- Don't touch brand copy/pricing — Ziad owns those.
