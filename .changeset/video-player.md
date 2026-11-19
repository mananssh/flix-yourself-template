---
"flix-yourself-template": minor
---

Add video player with local streaming and HTTP range support

The Play button on a detail page now actually plays. Video is delivered through
the storage seam, so the same player works against local disk in development and
a cloud provider (S3/R2/GCS/Azure) in production — no code changes, just `.env`.

- **Streaming route** `app/api/media/file/[...key]`: serves stored objects with
  full HTTP range support (`206 Partial Content`, `Accept-Ranges`,
  `Content-Range`), so `<video>` seeking and partial downloads work. Returns
  `200` (with `Accept-Ranges`) for un-ranged requests, `416` for unsatisfiable
  ranges, `404` for missing objects, and mirrors headers for `HEAD`.
- **Storage seam capability**: an optional `stat()` + `createReadStream(key, range)`
  on the provider interface, implemented by the local provider (streams a byte
  range straight off disk, no full-file buffering). Cloud providers hand out
  direct presigned URLs via the existing `getSignedUrl`, bypassing the app
  server — the recommended delivery path for video.
- **Custom `VideoPlayer`** (`components/catalog/VideoPlayer.tsx`): a bespoke
  control surface over a single `<video>` — play/pause, scrubbable seek bar with
  buffered indicator, volume/mute, elapsed/total timestamps, and fullscreen.
  Keyboard shortcuts (Space/K, ←/→ seek, ↑/↓ volume, M mute, F fullscreen),
  auto-hiding controls, loading/error/replay states, and resume-where-you-left-off
  via `localStorage`. Playlist aware: a series plays as an episode playlist with
  prev/next and auto-advance, so one component serves movies and episodes.
- **Playback wiring**: `PlaybackActions` is now a client component that opens the
  player in a modal overlay; the detail page resolves each playable source's URL
  through `getStorage().getSignedUrl()` server-side and passes them in, keeping
  the player free of any provider knowledge.
- **Sample media**: a small CC0 sample clip (`uploads/samples/sample-video.mp4`,
  ~1.1 MB) ships under the local storage root, and the seed points every title's
  video at it, so a fresh `db:seed` + `dev` plays end-to-end out of the box.

Responsive across desktop, laptop, tablet, and mobile; verified with real HTTP
range requests and end-to-end playback.
