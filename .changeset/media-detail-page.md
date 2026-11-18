---
"flix-yourself-template": minor
---

Add media detail page

Clicking any poster in the browse grid now opens a dedicated detail page at
`/media/[id]`, rendered from the catalog read layer (`getMediaById`).

- **Cinematic hero**: full-bleed backdrop (falls back to the poster) with
  gradient fades, an overlapping poster, and a back-to-browse control
- **Title metadata**: release year, type, maturity rating, and runtime (or
  episode count for series) in a bullet-separated row, plus genre pills
- **Overview** description and a **Credits** sidebar grouping people by role
  (Director / Creator / Cast)
- **Episodes** list for series — numbered rows with still/thumbnail, title,
  runtime, and synopsis
- **Playback actions**: a primary Play CTA (enabled only when a playable video
  exists) and a "My List" action — the seam the video-player feature wires into
- Clickable `MediaCard`s with keyboard focus states, a per-title `<title>`/meta
  via `generateMetadata`, and a branded 404 (`not-found`) for unknown ids
- Fully responsive across desktop, laptop, tablet, and mobile breakpoints

Shared duration/type formatting moves to `lib/format.ts` for reuse across the
browse and detail views.
