# Production Database Migration Guide

This folder contains scripts for safely deploying database migrations to production.

## 📋 Overview

- **Development**: Uses `npm run db:push` with `POSTGRES_URL` (dev branch)
- **Production**: Uses `npm run db:migrate:prod` with `POSTGRES_URL_PROD` (prod branch)

## 🚀 Deployment Workflow

### 1. Develop & Test Locally

```bash
# Make schema changes in app/lib/db/schema.ts
# Test with dev database
npm run db:push
```

### 2. Generate Migrations

```bash
# This creates SQL files in drizzle/ folder
npm run db:generate
```

### 3. Review Migrations

```bash
# Check what migrations will be applied
npm run db:check-migrations
```

This shows:
- All migration files in `drizzle/` folder
- File sizes and previews
- Migration journal info

### 4. Commit & Push to Git

```bash
git add .
git commit -m "Add database migrations for [feature]"
git push origin develop
```

### 5. Merge to Production Branch

```bash
git checkout main
git merge develop
git push origin main
```

### 6. Set Production Database URL

In your `.env.local` file, add:

```env
# Production Neon database branch
POSTGRES_URL_PROD="postgresql://user:pass@host/db"
```

Get this from:
1. Go to [neon.tech](https://neon.tech)
2. Select your **production** branch
3. Copy the connection string

### 7. Apply Migrations to Production

**Option A: Using npm (requires manual confirmation in terminal)**
```bash
npm run db:migrate:prod
```

**Option B: Using PowerShell wrapper (recommended - has safety prompt)**
```powershell
.\scripts\migrate-prod.ps1
```

The PowerShell script will:
- Verify `POSTGRES_URL_PROD` exists
- Show warning and safety checklist
- Require you to type "MIGRATE PROD" to confirm
- Apply all pending migrations
- Report success/failure

### 8. Deploy Application Code

```bash
# Deploy to Vercel/hosting platform
vercel deploy --prod
# or
git push # if using auto-deploy
```

## 🔍 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run db:check-migrations` | Preview all migration files |
| `npm run db:migrate:prod` | Apply migrations to production (direct) |
| `.\scripts\migrate-prod.ps1` | Apply migrations with safety prompt (PowerShell) |

## ⚠️ Safety Checklist

Before running production migrations:

- [ ] Tested migrations in dev environment
- [ ] Reviewed all SQL files in `drizzle/` folder
- [ ] Committed migrations to git
- [ ] `POSTGRES_URL_PROD` is set correctly in `.env.local`
- [ ] Backed up critical production data (if needed)
- [ ] Ready to deploy application code immediately after

## 🔧 Files

- `migrate-prod.ts` - TypeScript migration script
- `check-migrations.ts` - Preview migration files
- `migrate-prod.ps1` - PowerShell wrapper with confirmation prompt
- `README.md` - This file

## 📚 Migration Process Details

### What Happens During Migration?

1. Connects to production database using `POSTGRES_URL_PROD`
2. Checks `drizzle/__drizzle_migrations` table for applied migrations
3. Applies any new `.sql` files from `drizzle/` folder in order
4. Records applied migrations in the tracking table
5. Reports success or failure

### Migration Files Location

All migration files are in: `drizzle/`

Example:
```
drizzle/
├── 0000_initial.sql
├── 0001_add_users.sql
├── 0002_add_isDraftEligible.sql
├── meta/
│   └── _journal.json
```

### Troubleshooting

**"POSTGRES_URL_PROD not found"**
- Add the production database URL to `.env.local`
- Get it from Neon dashboard for your production branch

**Migration fails mid-way**
- Check Neon dashboard for database state
- Review the error message
- May need to manually fix database state
- Contact Neon support if needed

**Migrations already applied**
- Drizzle tracks applied migrations automatically
- Only new migrations will run
- Safe to run multiple times

## 🔄 Rollback Strategy

Drizzle doesn't support automatic rollbacks. If you need to rollback:

1. Write a new migration with the reverse changes
2. Test in dev first
3. Apply to production

Example:
```sql
-- Original: 0005_add_column.sql
ALTER TABLE players ADD COLUMN new_field TEXT;

-- Rollback: 0006_remove_column.sql  
ALTER TABLE players DROP COLUMN new_field;
```

## 💡 Best Practices

1. **Always test in dev first** - Use `npm run db:push` to verify changes
2. **Small, atomic migrations** - One logical change per migration
3. **Review SQL files** - Check generated SQL before applying to prod
4. **Deploy code immediately** - App and DB should stay in sync
5. **Monitor after deploy** - Watch for errors in production logs
6. **Document breaking changes** - Note any required app updates

## 🆘 Emergency Contacts

- Neon Support: https://neon.tech/docs/support
- Drizzle Docs: https://orm.drizzle.team/docs/migrations
