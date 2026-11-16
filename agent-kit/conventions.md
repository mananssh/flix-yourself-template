# Development Conventions

These are the core architectural principles for flix-yourself-template. Follow these when adding features or making changes.

## Core Principles

### 1. DRY (Don't Repeat Yourself)

**Bad**:
```typescript
// auth/clerk.ts
async function loginWithClerk() {
  const user = await validateUser();
  await logEvent('login');
  return user;
}

// auth/nextauth.ts
async function loginWithNextAuth() {
  const user = await validateUser();
  await logEvent('login');
  return user;
}
```

**Good**:
```typescript
// auth/common.ts
async function handleLogin(validateFn: () => Promise<User>) {
  const user = await validateFn();
  await logEvent('login');
  return user;
}

// auth/clerk.ts
async function loginWithClerk() {
  return handleLogin(() => clerkValidate());
}

// auth/nextauth.ts  
async function loginWithNextAuth() {
  return handleLogin(() => nextAuthValidate());
}
```

**Rule**: If you copy-paste code, stop and extract a shared function/component.

### 2. Pluggable Architecture

Every external dependency must be swappable via configuration.

#### Provider Pattern

Use the provider pattern for pluggable services:

```typescript
// storage/types.ts
export interface StorageProvider {
  upload(file: File, path: string): Promise<string>;
  download(path: string): Promise<Blob>;
  delete(path: string): Promise<void>;
}

// storage/providers/s3.ts
export class S3Provider implements StorageProvider {
  async upload(file: File, path: string) { /* ... */ }
  async download(path: string) { /* ... */ }
  async delete(path: string) { /* ... */ }
}

// storage/providers/gcs.ts
export class GCSProvider implements StorageProvider {
  async upload(file: File, path: string) { /* ... */ }
  async download(path: string) { /* ... */ }
  async delete(path: string) { /* ... */ }
}

// storage/index.ts
import { config } from '@/config';

export const storage: StorageProvider = (() => {
  switch (config.storage.provider) {
    case 's3': return new S3Provider(config.storage.s3);
    case 'gcs': return new GCSProvider(config.storage.gcs);
    case 'r2': return new R2Provider(config.storage.r2);
    default: throw new Error(`Unknown storage provider: ${config.storage.provider}`);
  }
})();
```

Now the entire app imports from `@/storage` and works with any provider.

#### Pluggable Layers

These layers **must** be pluggable:

1. **Database**: PostgreSQL, CockroachDB, PlanetScale, SQLite/Turso (via Prisma)
2. **Storage**: S3, GCS, R2, Azure, Local filesystem
3. **Authentication**: Internal (bcrypt), NextAuth, Clerk, Auth0, Single-user
4. **Deployment**: Vercel, Netlify, Cloudflare, Docker, Local

When adding a feature, ask: "Does this assume a specific provider?" If yes, make it pluggable.

### 3. Seams, Not Forks

Users customize through **configuration and seams**, not by forking the codebase.

#### Seams are Extension Points

**Bad** (requires editing source):
```typescript
// Hard-coded categories
const categories = ['Movies', 'TV Shows', 'Documentaries'];
```

**Good** (configurable):
```typescript
// User can override in config
const categories = config.content.categories || ['Movies', 'TV Shows', 'Documentaries'];
```

**Better** (preset with customization):
```typescript
// Preset provides defaults, user can extend/override
const presetCategories = {
  couple: ['Our Dates', 'Trips Together', 'Special Moments'],
  family: ['Birthdays', 'Holidays', 'Family Events'],
  travel: ['Destinations', 'Adventures', 'Travel Vlogs'],
  generic: ['Movies', 'TV Shows', 'Documentaries'],
};

const categories = config.content.categories || presetCategories[config.content.preset];
```

#### Common Seams

Provide seams for:
- **Content taxonomy**: Categories, genres, tags
- **Layout**: Grid size, card style, hero section
- **Features**: Enable/disable features via toggles
- **Branding**: Logo, colors, app name
- **Behavior**: Auto-play, default quality, continue watching

### 4. Configuration Over Code Editing

Users should **never** need to edit TypeScript files to customize the app.

#### Config-First Design

**Bad**:
```typescript
// User must edit this file to change
export const APP_NAME = 'Flix Yourself';
export const ENABLE_DOWNLOADS = true;
```

**Good**:
```typescript
// User edits config.yaml
import { config } from '@/config';

export const APP_NAME = config.branding.appName;
export const ENABLE_DOWNLOADS = config.features.downloads;
```

#### Config File Location

Config lives in:
- `config.yaml` (user-edited, gitignored)
- `config.example.yaml` (template, committed)
- `src/config/schema.ts` (TypeScript types and validation)

#### Config Validation

Always validate config at startup:

```typescript
// src/config/schema.ts
import { z } from 'zod';

export const configSchema = z.object({
  branding: z.object({
    appName: z.string().min(1),
  }),
  features: z.object({
    downloads: z.boolean(),
  }),
  // ... more fields
});

// src/config/index.ts
import { configSchema } from './schema';
import yaml from 'yaml';
import fs from 'fs';

const configFile = fs.readFileSync('config.yaml', 'utf-8');
const rawConfig = yaml.parse(configFile);
export const config = configSchema.parse(rawConfig); // Throws if invalid
```

### 5. Feature Toggles

Every feature must be optional via config.

#### Feature Toggle Pattern

```typescript
// src/features/downloads/index.ts
export function DownloadButton({ videoId }: { videoId: string }) {
  const { features } = useConfig();
  
  if (!features.downloads) return null;
  
  return <button onClick={() => downloadVideo(videoId)}>Download</button>;
}
```

#### Common Toggles

- `features.continueWatching`
- `features.history`
- `features.profiles`
- `features.search`
- `features.subtitles`
- `features.transcoding`
- `features.downloads`
- `features.sharing`
- `features.comments`

### 6. Minimal Viable Defaults

Every config category should have a **minimal** option for users who want simplicity.

Examples:
- **Database**: SQLite (no server needed)
- **Storage**: Local filesystem (no cloud account needed)
- **Auth**: Single-user mode (no auth system needed)
- **Deployment**: Local/Docker (no platform account needed)

**Rule**: A user should be able to run `pnpm dev` with zero external dependencies.

### 7. TypeScript Strictness

Always use strict TypeScript:

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitAny": true
  }
}
```

**Bad**:
```typescript
function getUser(id: any) { // ❌ any
  const user = users[id]; // ❌ possibly undefined
  return user.name; // ❌ will crash if undefined
}
```

**Good**:
```typescript
function getUser(id: string): string | null {
  const user = users[id];
  return user?.name ?? null;
}
```

### 8. Error Handling

Always handle errors explicitly:

**Bad**:
```typescript
async function uploadVideo(file: File) {
  const url = await storage.upload(file, '/videos'); // ❌ unhandled error
  return url;
}
```

**Good**:
```typescript
async function uploadVideo(file: File): Promise<{ url?: string; error?: string }> {
  try {
    const url = await storage.upload(file, '/videos');
    return { url };
  } catch (error) {
    console.error('Upload failed:', error);
    return { error: 'Failed to upload video' };
  }
}
```

### 9. No Hard-Coded Magic Values

**Bad**:
```typescript
if (video.duration > 7200) { // ❌ What is 7200?
  return 'long';
}
```

**Good**:
```typescript
const TWO_HOURS_IN_SECONDS = 7200;

if (video.duration > TWO_HOURS_IN_SECONDS) {
  return 'long';
}
```

**Better** (configurable):
```typescript
const longVideoDuration = config.video.longDurationThreshold || 7200;

if (video.duration > longVideoDuration) {
  return 'long';
}
```

### 10. Component Composition

Build UIs through composition, not configuration:

**Bad**:
```typescript
<VideoCard 
  showDownload 
  showShare 
  showLike 
  showAddToPlaylist 
  showWatchLater 
/>
```

**Good**:
```typescript
<VideoCard>
  <VideoCard.Thumbnail />
  <VideoCard.Title />
  <VideoCard.Actions>
    {config.features.downloads && <DownloadButton />}
    {config.features.sharing && <ShareButton />}
    {config.features.likes && <LikeButton />}
  </VideoCard.Actions>
</VideoCard>
```

### 11. Single Source of Truth

Config options documented in `config-options.md` must match the code exactly.

**When adding a config option**:

1. Add to `src/config/schema.ts`
2. Add to `config.example.yaml`
3. Document in `config-options.md`
4. Use in code via `import { config }`

These four places must stay in sync.

### 12. Prisma as the Only ORM

We use **Prisma** exclusively. No choice of ORM.

**Why**: Supporting multiple ORMs (Drizzle, TypeORM, etc.) is too complex. Prisma works with all our supported databases.

**Supported databases** (via Prisma):
- PostgreSQL
- CockroachDB (Postgres-compatible)
- PlanetScale (MySQL-compatible)
- SQLite / Turso

## Anti-Patterns to Avoid

❌ **Hard-coding provider choices**  
Example: `import AWS from 'aws-sdk'` in business logic

✅ **Use provider interfaces**  
Example: `import { storage } from '@/storage'`

---

❌ **Environment-specific code in app logic**  
Example: `if (process.env.NODE_ENV === 'production')`

✅ **Use config**  
Example: `if (config.deployment.environment === 'production')`

---

❌ **Forking for customization**  
"Users can fork and customize the code"

✅ **Config-driven customization**  
"Users customize via config.yaml"

---

❌ **Boolean flag explosion**  
20 feature flags as separate config fields

✅ **Grouped features**  
`config.features.downloads`, `config.features.search`, etc.

---

❌ **Tight coupling**  
Direct imports between layers

✅ **Dependency injection**  
Layers receive dependencies via props/params

## File Organization

```
src/
├── config/          # Config schema and loading
│   ├── schema.ts
│   └── index.ts
├── lib/             # Shared utilities
│   ├── db/          # Database (Prisma client)
│   ├── storage/     # Storage providers
│   ├── auth/        # Auth providers
│   └── video/       # Video processing
├── app/             # Next.js app router
│   ├── (auth)/      # Auth routes
│   ├── (app)/       # Main app routes
│   └── api/         # API routes
└── components/      # React components
    ├── ui/          # UI primitives
    └── features/    # Feature components
```

**Rule**: Business logic lives in `lib/`, not in `app/` or `components/`.

## Testing Conventions

- **Unit tests**: Test utilities and providers in isolation
- **Integration tests**: Test API routes with real database (test DB)
- **E2E tests**: Test critical flows (upload, watch, search)

**Test file naming**:
- `utils.ts` → `utils.test.ts`
- `storage.ts` → `storage.test.ts`

## Summary

1. **DRY**: Extract shared logic
2. **Pluggable**: Providers for external services
3. **Seams**: Extension points, not forks
4. **Config-first**: Users edit YAML, not TypeScript
5. **Feature toggles**: Every feature is optional
6. **Minimal defaults**: Works with zero external dependencies
7. **Strict TypeScript**: No `any`, handle undefined
8. **Error handling**: Try/catch with user-friendly errors
9. **No magic values**: Named constants or config
10. **Composition**: Build UIs from small pieces
11. **Single source of truth**: Config docs match code
12. **Prisma only**: One ORM, multiple databases

Follow these conventions and the codebase stays maintainable, configurable, and agent-friendly.
