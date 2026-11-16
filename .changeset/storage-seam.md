---
"flix-yourself-template": minor
---

Add pluggable media storage layer with multi-provider support

Implements a storage seam so media (videos, images, subtitles) can be stored on
any supported backend without code changes — just update `.env` and restart.

- **Providers**: Local filesystem, Amazon S3 (and S3-compatible), Cloudflare R2,
  Google Cloud Storage, and Azure Blob Storage
- **Unified interface**: `put`, `get`, `delete`, `exists`, and `getSignedUrl`
  (`lib/storage/types.ts`) — the app depends only on this contract, never on a
  specific SDK
- **Presigned delivery**: Cloud providers issue time-limited signed/SAS URLs so
  clients fetch media directly from storage, offloading bandwidth from the app
  server (ideal for video streaming)
- **Lazy SDK loading**: Each provider's SDK is dynamically imported, so only the
  selected backend is ever loaded; the local provider has zero external deps
- **Config validation**: Zod discriminated union (`storageConfigSchema`) with a
  `validateStorageConfig()` helper that reads provider-specific env vars
- **Provider examples**: Ready-to-use `*.example.env` files and a setup guide

Following the "seams, not forks" approach, switch providers via the
`STORAGE_PROVIDER` environment variable.

**Setup:**
```bash
cp lib/storage/providers/local.example.env .env   # or r2 / s3 / gcs / azure
```

See `lib/storage/providers/README.md` for detailed provider setup instructions.
