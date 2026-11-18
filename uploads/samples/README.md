# Sample media

`sample-video.mp4` is a short (~8s, 1.1 MB, 1280×720 H.264/AAC) clip shipped so
the catalog has something that actually plays out of the box. The seed
(`prisma/seed.ts`) points every title's video at this file, and the local
storage provider serves it through the streaming route at
`/api/media/file/samples/sample-video.mp4`.

Source: MDN's `flower.mp4`, released under **CC0 1.0 (public domain)** —
<https://github.com/mdn/shared-assets>. Safe to redistribute; swap it for your
own media by replacing this file (and the `SAMPLE_VIDEO_PATH` in the seed).

This lives under the local storage root (`STORAGE_LOCAL_PATH`, default
`./uploads`) rather than `public/` on purpose: media is served **through the
storage seam** so the same code path works when you switch to S3/R2/GCS/Azure.
