# Configuration Options

Complete reference for all configuration options in flix-yourself-template.

## Overview

Configuration lives in `config.yaml` at the project root. Copy `config.example.yaml` to get started:

```bash
cp config.example.yaml config.yaml
```

The config file is **gitignored** and user-specific. Never commit it.

## Configuration Structure

```yaml
branding:
  appName: string
  tagline: string
  
database:
  provider: "postgresql" | "cockroachdb" | "sqlite"
  url: string
  
storage:
  provider: "s3" | "gcs" | "r2" | "azure" | "local"
  # provider-specific options
  
auth:
  provider: "internal" | "nextauth" | "none"
  # provider-specific options
  
deployment:
  target: "vercel" | "netlify" | "cloudflare" | "docker" | "local"
  environment: "development" | "production"
  
content:
  preset: "couple" | "gift" | "family" | "travel" | "generic" | "homework"
  categories: string[] (optional, overrides preset)
  
features:
  continueWatching: boolean
  history: boolean
  profiles: boolean
  search: boolean
  subtitles: boolean
  transcoding: boolean
  downloads: boolean
  sharing: boolean
  comments: boolean
  
seedData: boolean
```

---

## 1. Branding

Customize the app's appearance and identity.

```yaml
branding:
  appName: "Flix Yourself"
  tagline: "Your personal streaming platform"
```

### Options

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `appName` | `string` | Yes | `"Flix Yourself"` | App name shown in header, page title, etc. |
| `tagline` | `string` | No | `null` | Tagline shown on landing page |

### Example

```yaml
branding:
  appName: "Our Love Story"
  tagline: "Every moment together, in one place"
```

---

## 2. Database

Choose your database provider. **Prisma is the only ORM** (no choice).

```yaml
database:
  provider: "postgresql"
  url: "postgresql://user:pass@localhost:5432/flix"
```

### Database Options

| Provider | Local | Hosted | Free Tier | Notes |
|----------|-------|--------|-----------|-------|
| **SQLite** | ✅ | ❌ | ✅ Always | File-based, zero config, perfect for dev |
| **PostgreSQL** | ✅ | ✅ | ✅ Available | Supabase, Neon, Railway free tiers |
| **CockroachDB** | ✅ | ✅ | ✅ Available | 10GB storage, 50M RUs/month free |

**Recommendation:** SQLite (local dev) → CockroachDB free tier (production)

### Providers

#### PostgreSQL

Full-featured relational database. Best for production.

```yaml
database:
  provider: "postgresql"
  url: "postgresql://user:pass@localhost:5432/flix"
```

**Prisma datasource**:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Use when**:
- Self-hosting or using managed Postgres (AWS RDS, DigitalOcean, etc.)
- Need full SQL features
- Production deployments

#### CockroachDB

PostgreSQL-compatible distributed database.

```yaml
database:
  provider: "cockroachdb"
  url: "postgresql://user:pass@cluster.cockroachlabs.cloud:26257/flix?sslmode=verify-full"
```

**Prisma datasource**:
```prisma
datasource db {
  provider = "cockroachdb"
  url      = env("DATABASE_URL")
}
```

**Use when**:
- Need global distribution
- Want Postgres compatibility with auto-scaling
- Using CockroachDB Serverless (free tier available)

#### SQLite / Turso

File-based database. **Minimal option** with zero setup.

```yaml
database:
  provider: "sqlite"
  url: "file:./flix.db"
```

For Turso (edge SQLite):
```yaml
database:
  provider: "sqlite"
  url: "libsql://your-db.turso.io?authToken=your-token"
```

**Prisma datasource**:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

**Use when**:
- Local development
- Single-user deployments
- Minimal setup (no database server needed)
- Using Turso for edge-deployed SQLite

**Limitations**:
- No concurrent writes (fine for single-user)
- File-based (backup by copying file)

---

## 3. Storage

Where video files and thumbnails are stored.

```yaml
storage:
  provider: "s3"
  s3:
    bucket: "my-videos"
    region: "us-east-1"
    accessKeyId: "env:AWS_ACCESS_KEY_ID"
    secretAccessKey: "env:AWS_SECRET_ACCESS_KEY"
```

### Storage Options

| Provider | Local | Hosted | Free Tier | Notes |
|----------|-------|--------|-----------|-------|
| **Local filesystem** | ✅ | ❌ | ✅ Always | File-based storage, dev only |
| **S3** | ❌ | ✅ | 🟡 Limited | 5GB free for 12 months (AWS new accounts) |
| **R2** | ❌ | ✅ | ✅ Available | 10GB free forever (Cloudflare) |
| **GCS** | ❌ | ✅ | ✅ Available | 5GB free forever (Google Cloud) |
| **Azure Blob** | ❌ | ✅ | 🟡 Limited | Limited free tier (Azure) |

**Recommendation:** Local (dev) → R2 or GCS (production)

### Options

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `provider` | `"s3"` \| `"gcs"` \| `"r2"` \| `"azure"` \| `"local"` | Yes | `"local"` | Storage provider |
| Provider-specific fields | Various | Yes | - | See each provider below |

### Providers

#### Amazon S3

Industry-standard object storage.

```yaml
storage:
  provider: "s3"
  s3:
    bucket: "my-flix-videos"
    region: "us-east-1"
    accessKeyId: "env:AWS_ACCESS_KEY_ID"
    secretAccessKey: "env:AWS_SECRET_ACCESS_KEY"
    endpoint: "https://s3.amazonaws.com" # optional, for S3-compatible services
```

**Required fields**:
- `bucket`: S3 bucket name
- `region`: AWS region (e.g., `us-east-1`)
- `accessKeyId`: AWS access key (use `env:VAR_NAME` to reference env var)
- `secretAccessKey`: AWS secret key (use `env:VAR_NAME`)

**Optional**:
- `endpoint`: Custom endpoint for S3-compatible services (Minio, DigitalOcean Spaces, etc.)

#### Google Cloud Storage

Google's object storage.

```yaml
storage:
  provider: "gcs"
  gcs:
    bucket: "my-flix-videos"
    projectId: "my-gcp-project"
    keyFile: "./gcp-service-account.json"
```

**Required fields**:
- `bucket`: GCS bucket name
- `projectId`: GCP project ID
- `keyFile`: Path to service account JSON key file

#### Cloudflare R2

S3-compatible storage with zero egress fees.

```yaml
storage:
  provider: "r2"
  r2:
    accountId: "your-account-id"
    bucket: "my-flix-videos"
    accessKeyId: "env:R2_ACCESS_KEY_ID"
    secretAccessKey: "env:R2_SECRET_ACCESS_KEY"
```

**Required fields**:
- `accountId`: Cloudflare account ID
- `bucket`: R2 bucket name
- `accessKeyId`: R2 access key
- `secretAccessKey`: R2 secret key

**Why R2**:
- Zero egress fees (perfect for video streaming)
- S3-compatible API
- Cheaper than S3 for high-bandwidth use cases

#### Azure Blob Storage

Microsoft Azure's object storage.

```yaml
storage:
  provider: "azure"
  azure:
    accountName: "myaccount"
    accountKey: "env:AZURE_STORAGE_KEY"
    containerName: "videos"
```

**Required fields**:
- `accountName`: Azure storage account name
- `accountKey`: Azure storage account key
- `containerName`: Blob container name

#### Local Filesystem

Store files on local disk. **Minimal option**.

```yaml
storage:
  provider: "local"
  local:
    path: "./uploads"
```

**Required fields**:
- `path`: Directory to store files (relative or absolute)

**Use when**:
- Local development
- Self-hosting with ample disk space
- No cloud storage account

**Limitations**:
- Not suitable for distributed deployments (Vercel, Netlify, etc.)
- No CDN benefits
- Manual backups

### Environment Variables

The storage seam is configured via environment variables (set `STORAGE_PROVIDER`,
then the variables for that provider). Only the selected provider's variables are read.

| Provider | Variables |
|----------|-----------|
| `local` | `STORAGE_LOCAL_PATH` (default `./uploads`), `STORAGE_LOCAL_BASE_URL` (default `/api/media/file`) |
| `s3` | `STORAGE_S3_BUCKET`, `STORAGE_S3_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `STORAGE_S3_ENDPOINT` (opt), `STORAGE_S3_FORCE_PATH_STYLE` (opt) |
| `r2` | `STORAGE_R2_ACCOUNT_ID`, `STORAGE_R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` |
| `gcs` | `STORAGE_GCS_BUCKET`, `STORAGE_GCS_PROJECT_ID`, `STORAGE_GCS_KEY_FILE` (opt) |
| `azure` | `STORAGE_AZURE_ACCOUNT_NAME`, `STORAGE_AZURE_ACCOUNT_KEY`, `STORAGE_AZURE_CONTAINER` |

See `lib/storage/providers/README.md` for setup walkthroughs and
`lib/storage/types.ts` for the provider interface. Implementation lives in
`lib/storage/` and is validated by `storageConfigSchema` in `lib/config/schema.ts`.

---

## 4. Authentication

User authentication and authorization.

```yaml
auth:
  provider: "internal"
  internal:
    allowSignup: true
```

### Auth Options

| Provider | Local | Hosted | Free Tier | Notes |
|----------|-------|--------|-----------|-------|
| **None** | ✅ | ❌ | ✅ Always | Single-user, no login needed |
| **Internal (bcrypt)** | ✅ | ❌ | ✅ Always | Cookie-based sessions, multi-user |
| **NextAuth** | ✅ | ❌ | ✅ Always | OAuth with Google/GitHub, self-hosted |

**All options are FREE and self-hosted.**

**Recommendation:** None (personal use) or Internal (family/friends)

### Options

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `provider` | `"internal"` \| `"nextauth"` \| `"none"` | Yes | `"none"` | Auth provider |
| Provider-specific fields | Various | Yes | - | See each provider below |

### Providers

#### Internal (bcrypt)

Built-in authentication with bcrypt password hashing.

```yaml
auth:
  provider: "internal"
  internal:
    allowSignup: true
    requireEmailVerification: false
```

**Fields**:
- `allowSignup`: Allow new user registration
- `requireEmailVerification`: Require email verification before login

**Use when**:
- Simple auth without external dependencies
- Self-hosting
- Don't need OAuth providers (Google, GitHub, etc.)

**Provides**:
- Email/password login
- Bcrypt password hashing
- Session management

#### NextAuth

Flexible auth library with many OAuth providers.

```yaml
auth:
  provider: "nextauth"
  nextauth:
    providers:
      - type: "google"
        clientId: "env:GOOGLE_CLIENT_ID"
        clientSecret: "env:GOOGLE_CLIENT_SECRET"
      - type: "github"
        clientId: "env:GITHUB_CLIENT_ID"
        clientSecret: "env:GITHUB_CLIENT_SECRET"
    secret: "env:NEXTAUTH_SECRET"
```

**Fields**:
- `providers`: Array of OAuth providers
- `secret`: NextAuth JWT secret

**Supported providers**:
- `google`, `github`, `discord`, `twitter`, `facebook`, and 50+ more

**Use when**:
- Need OAuth/social login
- Want flexibility and customization
- Open-source preference

#### None (Single-user / No auth)

No authentication. **Minimal option**.

```yaml
auth:
  provider: "none"
```

**Use when**:
- Single-user deployment
- Local development
- Behind another auth layer (VPN, etc.)
- Gift deployment (recipient doesn't need to log in)

**Warning**: All content is public. Don't use in production with sensitive content.

---

## 5. Deployment

Deployment target and environment settings.

```yaml
deployment:
  target: "vercel"
  environment: "production"
  vercel:
    projectId: "prj_abc123"
    teamId: "team_xyz789"
```

### Deployment Options

| Target | Local | Hosted | Free Tier | Notes |
|--------|-------|--------|-----------|-------|
| **Local** | ✅ | ❌ | ✅ Always | Development server |
| **Vercel** | ❌ | ✅ | ✅ Available | Hobby plan free |
| **Netlify** | ❌ | ✅ | ✅ Available | Starter plan free |
| **Cloudflare Pages** | ❌ | ✅ | ✅ Available | Free tier generous |
| **Docker** | ✅ | ✅ | ✅ Always | Self-hosted (hosting costs may apply) |

**Recommendation:** Vercel or Cloudflare Pages (easiest)

### Options

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `target` | `"vercel"` \| `"netlify"` \| `"cloudflare"` \| `"docker"` \| `"local"` | Yes | `"local"` | Deployment target |
| `environment` | `"development"` \| `"production"` | Yes | `"development"` | Environment |
| Target-specific fields | Various | No | - | See each target below |

### Targets

#### Vercel

Serverless Next.js hosting (official Next.js platform).

```yaml
deployment:
  target: "vercel"
  environment: "production"
  vercel:
    projectId: "prj_abc123"
    teamId: "team_xyz789" # optional, for teams
```

**Use when**:
- Easiest Next.js deployment
- Want automatic previews for PRs
- Generous free tier

**Limitations**:
- Serverless execution limits (10s for hobby, 60s for pro)
- Not suitable for `local` storage provider

#### Netlify

Serverless deployment platform.

```yaml
deployment:
  target: "netlify"
  environment: "production"
  netlify:
    siteId: "abc123-def456"
```

**Use when**:
- Alternative to Vercel
- Using Netlify for other projects
- Want Netlify-specific features

**Limitations**:
- Not as optimized for Next.js as Vercel
- Serverless function limits

#### Cloudflare Pages/Workers

Edge deployment on Cloudflare's network.

```yaml
deployment:
  target: "cloudflare"
  environment: "production"
  cloudflare:
    accountId: "your-account-id"
    projectName: "flix-yourself"
```

**Use when**:
- Want edge deployment (low latency worldwide)
- Using R2 for storage (same ecosystem)
- Need generous free tier (100k requests/day)

**Best with**:
- R2 storage
- Cloudflare D1 (when supported)

#### Docker

Containerized self-hosting.

```yaml
deployment:
  target: "docker"
  environment: "production"
  docker:
    registry: "docker.io/username/flix-yourself"
    tag: "latest"
```

**Use when**:
- Self-hosting on VPS, home server, etc.
- Want full control
- Have Docker infrastructure

**Provides**:
- Dockerfile included
- docker-compose.yml for easy setup
- Works with any storage/database

#### Local (None)

Local development or manual deployment. **Minimal option**.

```yaml
deployment:
  target: "local"
  environment: "development"
```

**Use when**:
- Local development (`pnpm dev`)
- Custom deployment setup
- No platform-specific config needed

---

## 6. Content Type Presets

Presets customize the app for specific use cases (taxonomy, layout, defaults).

```yaml
content:
  preset: "couple"
  categories: null # optional override
```

### Options

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `preset` | `"couple"` \| `"gift"` \| `"family"` \| `"travel"` \| `"generic"` \| `"homework"` | Yes | `"generic"` | Content preset |
| `categories` | `string[]` | No | (from preset) | Override preset categories |

### Presets

#### Couple

For couples documenting their relationship.

```yaml
content:
  preset: "couple"
```

**Default categories**:
- Our Dates
- Trips Together
- Special Moments
- Everyday Life
- Anniversaries

**Customizations**:
- Romantic color scheme (subtle pinks/purples in accents)
- "Watch Together" mode
- Date/location metadata emphasized

#### Gift

For giving a video collection to someone (friend, family).

```yaml
content:
  preset: "gift"
```

**Default categories**:
- Messages for You
- Our Memories
- Special Occasions
- Just Because

**Customizations**:
- Single-user mode (recipient doesn't need account)
- Gift message on landing page
- Download all feature
- No upload UI (pre-populated only)

**Typical auth**: `provider: "none"`

#### Family

For family videos and memories.

```yaml
content:
  preset: "family"
```

**Default categories**:
- Birthdays
- Holidays
- Family Events
- Vacations
- Everyday Moments
- Milestones

**Customizations**:
- Kid-friendly UI
- Multi-profile support emphasized
- Year/age timeline view

#### Travel

For travel vlogs and adventures.

```yaml
content:
  preset: "travel"
```

**Default categories**:
- Destinations
- Adventures
- Travel Vlogs
- Food & Culture
- Tips & Guides

**Customizations**:
- Map view of videos
- Location/country metadata
- Travel timeline

#### Generic

Netflix-like default for any content. **Minimal/default option**.

```yaml
content:
  preset: "generic"
```

**Default categories**:
- Movies
- TV Shows
- Documentaries
- Short Films

**Customizations**:
- Standard Netflix-style UI
- No preset assumptions
- Flexible for any content type

#### Homework Mode

Makes the app look like a college project (for educational use).

```yaml
content:
  preset: "homework"
```

**Default categories**:
- Lectures
- Tutorials
- Demonstrations
- Projects

**Customizations**:
- Academic UI theme
- Simple, utilitarian design
- Clear "educational project" disclaimers
- Sample data included
- README emphasized

**Use when**:
- Building this as a school/college project
- Want to demonstrate streaming tech without personal content
- Need clear academic framing

### Category Override

Override preset categories:

```yaml
content:
  preset: "couple"
  categories:
    - Our Adventures
    - Date Nights
    - Cooking Together
    - Travel
```

This uses the "couple" preset customizations but with custom categories.

---

## 7. Features

Feature toggles to enable/disable functionality.

```yaml
features:
  continueWatching: true
  history: true
  profiles: true
  search: true
  subtitles: true
  transcoding: false
  downloads: false
  sharing: false
  comments: false
```

### Options

| Feature | Type | Default | Description |
|---------|------|---------|-------------|
| `continueWatching` | `boolean` | `true` | Resume playback from where you left off |
| `history` | `boolean` | `true` | Track viewing history |
| `profiles` | `boolean` | `false` | Multi-user profiles (Netflix-style) |
| `search` | `boolean` | `true` | Search videos by title, description, tags |
| `subtitles` | `boolean` | `true` | Upload and display subtitle files (.srt, .vtt) |
| `transcoding` | `boolean` | `false` | Transcode videos to multiple qualities |
| `downloads` | `boolean` | `false` | Allow downloading videos |
| `sharing` | `boolean` | `false` | Generate shareable links |
| `comments` | `boolean` | `false` | Comment on videos |

### Feature Details

#### Continue Watching

Tracks playback position and shows "Continue Watching" row.

**When disabled**:
- No playback position tracking
- Videos always start from beginning
- Simpler database schema

#### History

Records what users have watched.

**When disabled**:
- No viewing history page
- No "Recently Watched" row
- Privacy-focused (no tracking)

#### Profiles

Multiple profiles per account (Netflix-style).

**When disabled**:
- One profile per user
- Simpler UX
- Good for single-user or couple use case

**When enabled**:
- Create multiple profiles (Kids, Parent 1, Parent 2, etc.)
- Separate watch history per profile
- Profile avatars and names

#### Search

Search videos by title, description, tags.

**When disabled**:
- Browse-only interface
- Good for small collections
- Simpler backend

#### Subtitles

Upload and display subtitle files (.srt, .vtt).

**When disabled**:
- Video player doesn't load subtitle tracks
- No subtitle upload UI
- Simpler video model

#### Transcoding

Automatically transcode uploaded videos to multiple qualities (480p, 720p, 1080p).

**When enabled**:
- Requires FFmpeg
- Adaptive bitrate streaming
- Better UX for varying network speeds

**When disabled**:
- Videos play at uploaded quality only
- Faster uploads (no processing queue)
- Simpler infrastructure

**Warning**: Transcoding is resource-intensive. Not recommended for serverless deployments without a job queue.

#### Downloads

Allow users to download videos.

**When enabled**:
- Download button on video page
- Generates signed URLs for direct download

**When disabled**:
- Stream-only
- Prevents offline copies

#### Sharing

Generate shareable links for videos.

**When enabled**:
- Share button on video page
- Expiring or permanent share links
- Optional password protection

**When disabled**:
- Private library only
- No external access

#### Comments

Comment on videos (discussion/notes).

**When enabled**:
- Comment section below video
- Replies and threading
- Markdown support

**When disabled**:
- Simpler UI
- No user-generated content to moderate

---

## 8. Seed Data

Pre-populate database with sample data for testing/demo.

```yaml
seedData: true
```

### Options

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `seedData` | `boolean` | `false` | Seed database with sample data |

**When enabled**:
- Runs seed script on first start
- Creates sample users, videos, categories
- Uses placeholder videos (Big Buck Bunny, etc.)
- Good for demos, development, and homework mode

**When disabled**:
- Empty database (you upload your own content)
- Production mode

**Seed script**: `pnpm db:seed`

---

## Minimal Configuration Example

The absolute minimum config to get started:

```yaml
branding:
  appName: "My Flix"

database:
  provider: "sqlite"
  url: "file:./flix.db"

storage:
  provider: "local"
  local:
    path: "./uploads"

auth:
  provider: "none"

deployment:
  target: "local"
  environment: "development"

content:
  preset: "generic"

features:
  continueWatching: true
  history: true
  profiles: false
  search: true
  subtitles: false
  transcoding: false
  downloads: false
  sharing: false
  comments: false

seedData: true
```

**This config**:
- Works with zero external dependencies
- Stores everything locally (DB + files)
- No authentication (single-user)
- Runs with `pnpm dev`
- Includes sample data

Perfect for trying out the template.

---

## Production Configuration Example

Production-ready config with cloud services:

```yaml
branding:
  appName: "Our Story"
  tagline: "Every moment together"

database:
  provider: "postgresql"
  url: "env:DATABASE_URL"

storage:
  provider: "r2"
  r2:
    accountId: "env:R2_ACCOUNT_ID"
    bucket: "our-story-videos"
    accessKeyId: "env:R2_ACCESS_KEY_ID"
    secretAccessKey: "env:R2_SECRET_ACCESS_KEY"

auth:
  provider: "internal"
  internal:
    allowSignup: false
    requireEmailVerification: true

deployment:
  target: "vercel"
  environment: "production"

content:
  preset: "couple"

features:
  continueWatching: true
  history: true
  profiles: false
  search: true
  subtitles: true
  transcoding: false
  downloads: true
  sharing: false
  comments: false

seedData: false
```

**This config**:
- Production-ready
- Managed PostgreSQL (e.g., Neon, Supabase)
- Cloudflare R2 (zero egress fees for streaming)
- Internal auth with email verification
- Deploys to Vercel
- Optimized for couple use case

---

## Environment Variables

Use `env:VAR_NAME` to reference environment variables:

```yaml
database:
  url: "env:DATABASE_URL"

storage:
  s3:
    accessKeyId: "env:AWS_ACCESS_KEY_ID"
```

This keeps secrets out of `config.yaml`.

**In `.env.local`**:
```bash
DATABASE_URL="postgresql://..."
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="..."
```

**Never commit** `.env.local` or `config.yaml` with secrets.

---

## Configuration Validation

The config is validated on app startup via Zod schema.

**If invalid**, you'll see a clear error:

```
❌ Configuration error:

  database.provider: Invalid enum value. Expected 'postgresql' | 'cockroachdb' | 'planetscale' | 'sqlite', received 'mysql'
  
  storage.s3.bucket: Required field missing
```

Fix the error in `config.yaml` and restart.

---

## Adding New Config Options

When adding a new config option:

1. **Update `src/config/schema.ts`**:
   ```typescript
   export const configSchema = z.object({
     // ... existing fields
     myNewFeature: z.boolean().default(false),
   });
   ```

2. **Update `config.example.yaml`**:
   ```yaml
   myNewFeature: false # Description here
   ```

3. **Document here in `config-options.md`**:
   Add a new section explaining the option.

4. **Use in code**:
   ```typescript
   import { config } from '@/config';
   
   if (config.myNewFeature) {
     // ...
   }
   ```

These four places must stay in sync (enforced in PR reviews).

---

## Summary

- **Branding**: App name, tagline
- **Database**: PostgreSQL, CockroachDB, SQLite (via Prisma)
- **Storage**: S3, GCS, R2, Azure, Local
- **Auth**: Internal, NextAuth, None
- **Deployment**: Vercel, Netlify, Cloudflare, Docker, Local
- **Content Presets**: Couple, Gift, Family, Travel, Generic, Homework
- **Features**: 9 toggleable features (continue watching, search, etc.)
- **Seed Data**: Yes/no

Every option is **pluggable and configurable**. Users never edit source code—only `config.yaml`.
