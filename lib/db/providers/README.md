# Database Provider Setup Guide

Flix Yourself supports three database providers. Choose the one that best fits your needs.

## Quick Start

1. Copy one of the example files to `.env` in the project root:
   ```bash
   cp lib/db/providers/sqlite.example.env .env
   ```

2. Generate Prisma Client:
   ```bash
   npm run db:generate
   ```

3. Push the schema to your database:
   ```bash
   npm run db:push
   ```

## Provider Options

### 🗄️ SQLite (Recommended for Getting Started)

**Best for:** Local development, testing, demos, single-user deployments

**Setup:**
```bash
# Copy the example
cp lib/db/providers/sqlite.example.env .env

# Generate client and create database
npm run db:generate
npm run db:push
```

Your database will be created as `prisma/dev.db` file.

**Pros:**
- Zero configuration
- File-based (easy backups)
- Perfect for development
- No separate server needed

**Cons:**
- Single write connection
- Not suitable for high-traffic production
- Limited concurrent users

---

### 🐘 PostgreSQL (Recommended for Production)

**Best for:** Production deployments, self-hosted solutions, traditional setups

**Setup:**

1. **Local PostgreSQL:**
   ```bash
   # Install PostgreSQL (macOS example):
   brew install postgresql@15
   brew services start postgresql@15
   
   # Create database:
   createdb flix_yourself
   ```

2. **Or use a hosted service:**
   - **Neon** (serverless): [neon.tech](https://neon.tech)
   - **Supabase**: [supabase.com](https://supabase.com)
   - **Railway**: [railway.app](https://railway.app)
   - **Render**: [render.com](https://render.com)

3. **Configure:**
   ```bash
   cp lib/db/providers/postgresql.example.env .env
   # Edit .env with your connection string
   ```

4. **Apply schema:**
   ```bash
   npm run db:generate
   npm run db:migrate dev --name init
   ```

**Pros:**
- Production-ready
- Excellent performance
- Rich ecosystem
- Many hosting options (including free tiers)

**Cons:**
- Requires server setup
- More complex than SQLite

---

### 🪳 CockroachDB (Recommended for Scale)

**Best for:** Distributed systems, global deployments, horizontal scaling

**Setup:**

1. **Sign up for CockroachDB Serverless (free tier):**
   - Visit [cockroachlabs.cloud](https://cockroachlabs.cloud)
   - Create a cluster
   - Copy the connection string

2. **Configure:**
   ```bash
   cp lib/db/providers/cockroachdb.example.env .env
   # Paste your connection string in .env
   ```

3. **Apply schema:**
   ```bash
   npm run db:generate
   npm run db:migrate dev --name init
   ```

**Pros:**
- PostgreSQL-compatible
- Built-in replication
- Global distribution
- Auto-scaling
- Free tier available

**Cons:**
- Cloud-only (no self-hosted free version)
- Slight differences from pure PostgreSQL

---

## Available Scripts

```bash
# Generate Prisma Client (run after schema changes)
npm run db:generate

# Push schema to database (dev, no migrations)
npm run db:push

# Create and apply migrations (production)
npm run db:migrate dev --name description
npm run db:migrate deploy

# Open Prisma Studio (database GUI)
npm run db:studio

# Reset database (caution: deletes all data)
npm run db:reset
```

## Switching Providers

To switch database providers:

1. **Stop your app**

2. **Update `.env`:**
   ```bash
   DATABASE_PROVIDER=postgresql  # or sqlite or cockroachdb
   DATABASE_URL=your_new_connection_string
   ```

3. **Regenerate client:**
   ```bash
   npm run db:generate
   ```

4. **Apply schema:**
   ```bash
   npm run db:push  # or db:migrate for production
   ```

## Troubleshooting

### "Environment variable not found: DATABASE_PROVIDER"
- Make sure `.env` file exists in project root
- Check that `DATABASE_PROVIDER` is set
- Restart your dev server after changes

### "Can't reach database server"
- Verify DATABASE_URL is correct
- Check database server is running (PostgreSQL/CockroachDB)
- For cloud providers, verify IP allowlist/firewall rules

### "Error: P3009" (migration conflicts)
- Run `npm run db:push` for development
- Or reset: `npm run db:reset` (deletes data!)

---

## Production Recommendations

| Provider | Use Case | Free Tier | 
|----------|----------|-----------|
| **SQLite** | Personal projects, demos | ✅ Always free |
| **PostgreSQL** (Neon) | Most production apps | ✅ 500MB free |
| **PostgreSQL** (Supabase) | Apps needing auth/storage | ✅ 500MB free |
| **CockroachDB** | Global, mission-critical | ✅ 5GB free |

**Start with SQLite for development, then migrate to PostgreSQL or CockroachDB for production.**
