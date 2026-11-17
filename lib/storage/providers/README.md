# Storage Provider Setup Guide

Flix Yourself stores media (videos, images, subtitles) through a pluggable
**storage seam**. Pick a provider by setting `STORAGE_PROVIDER` in your `.env` —
the app code never changes. This is the "seams, not forks" approach.

The rest of the app only ever calls:

```ts
import { getStorage } from '@/lib/storage'

const storage = await getStorage()
await storage.put('media/123/video.mp4', buffer, { contentType: 'video/mp4' })
const url = await storage.getSignedUrl('media/123/video.mp4') // presigned delivery
```

## Quick Start

1. Copy one of the example files to `.env` in the project root:
   ```bash
   cp lib/storage/providers/local.example.env .env
   ```
   (or merge it into your existing `.env`, which also holds `DATABASE_*`.)

2. Fill in the provider-specific values.

3. Restart the dev server.

## Provider Options

| Provider | Local | Hosted | Free Tier | Notes |
|----------|-------|--------|-----------|-------|
| **Local filesystem** | ✅ | ❌ | ✅ Always | Zero config, dev / single-node only |
| **S3** | ❌ | ✅ | 🟡 12 months | 5GB free for new AWS accounts |
| **R2** | ❌ | ✅ | ✅ 10GB | Cloudflare, **zero egress** — best for video |
| **GCS** | ❌ | ✅ | ✅ 5GB | Google Cloud |
| **Azure Blob** | ❌ | ✅ | 🟡 Limited | Microsoft Azure |

**Recommendation:** Local (development) → R2 or GCS (production).

---

### 📁 Local Filesystem (Recommended for Getting Started)

**Best for:** Development, testing, single-node self-hosting.

```bash
cp lib/storage/providers/local.example.env .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `STORAGE_LOCAL_PATH` | `./uploads` | Directory for stored objects |
| `STORAGE_LOCAL_BASE_URL` | `/api/media/file` | App route prefix for serving objects |

**Note:** Local URLs are app-served and **not** time-limited — access control
is the serving route's responsibility. Not suitable for serverless/distributed
deployments (Vercel, Netlify) where the filesystem is ephemeral or read-only.

---

### ☁️ Amazon S3 (and S3-compatible services)

**Best for:** Production on AWS, or any S3-compatible service (MinIO,
DigitalOcean Spaces).

```bash
cp lib/storage/providers/s3.example.env .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `STORAGE_S3_BUCKET` | Yes | Bucket name |
| `STORAGE_S3_REGION` | Yes | AWS region (e.g. `us-east-1`) |
| `AWS_ACCESS_KEY_ID` | Yes | Access key |
| `AWS_SECRET_ACCESS_KEY` | Yes | Secret key |
| `STORAGE_S3_ENDPOINT` | No | Custom endpoint for S3-compatible services |
| `STORAGE_S3_FORCE_PATH_STYLE` | No | `true` for path-style addressing (MinIO) |

---

### 🪣 Cloudflare R2 (Recommended for Video)

**Best for:** Streaming — R2 charges **zero egress fees**.

```bash
cp lib/storage/providers/r2.example.env .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `STORAGE_R2_ACCOUNT_ID` | Yes | Cloudflare account ID |
| `STORAGE_R2_BUCKET` | Yes | R2 bucket name |
| `R2_ACCESS_KEY_ID` | Yes | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | Yes | R2 API token secret |

R2 is S3-API compatible, so it is served by the same provider implementation as
S3 — only the endpoint (`https://<account-id>.r2.cloudflarestorage.com`) and
region (`auto`) differ, and these are configured for you.

---

### 🗂️ Google Cloud Storage

```bash
cp lib/storage/providers/gcs.example.env .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `STORAGE_GCS_BUCKET` | Yes | Bucket name |
| `STORAGE_GCS_PROJECT_ID` | Yes | GCP project ID |
| `STORAGE_GCS_KEY_FILE` | No | Path to service-account JSON key; omit to use ADC |

---

### 🔷 Azure Blob Storage

```bash
cp lib/storage/providers/azure.example.env .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `STORAGE_AZURE_ACCOUNT_NAME` | Yes | Storage account name |
| `STORAGE_AZURE_ACCOUNT_KEY` | Yes | Storage account key |
| `STORAGE_AZURE_CONTAINER` | Yes | Blob container name |

---

## The Storage Interface

Every provider implements the same contract (`lib/storage/types.ts`):

| Method | Description |
|--------|-------------|
| `put(key, body, options?)` | Store (or overwrite) an object |
| `get(key)` | Read an object into a `Buffer` (small files) |
| `delete(key)` | Remove an object (no-op if absent) |
| `exists(key)` | Whether an object exists |
| `getSignedUrl(key, options?)` | Time-limited delivery URL (presigned for cloud) |

**Keys** are provider-agnostic, forward-slash separated paths
(e.g. `media/123/video.mp4`).

## Switching Providers

1. Update `STORAGE_PROVIDER` and the provider-specific variables in `.env`.
2. Restart the app.

No migration of existing code is needed — but note that **objects are not
copied between providers automatically**. Migrate your files separately when
moving backends in production.

## Credentials & Security

- Never commit real credentials. `.env` is gitignored; only `*.example.env`
  files (with placeholder values) are committed.
- Cloud providers issue **presigned / SAS URLs** so clients fetch media directly
  from storage, offloading bandwidth from the app server — the recommended path
  for video delivery.

## Dependencies

Each cloud SDK is imported lazily, so only the selected provider's SDK loads at
runtime. The SDKs ship as dependencies of the template:

- S3 / R2: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`
- GCS: `@google-cloud/storage`
- Azure: `@azure/storage-blob`

The **local** provider has no external dependencies.
