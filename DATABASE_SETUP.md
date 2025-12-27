# Database Setup Guide

## Overview
This project uses Neon PostgreSQL (Vercel Postgres) with separate database branches for development and production.

## Current Setup
- **Production**: Neon "main" branch (used by Vercel deployment)
- **Development**: Should use Neon "dev" branch (for local development)

## How to Set Up Development Database

### Option 1: Neon Database Branches (Recommended)

1. **Go to your Neon console**: https://console.neon.tech
2. **Create a development branch**:
   - Click on your project
   - Go to "Branches" tab
   - Click "Create Branch"
   - Name it "dev"
   - Choose to branch from "main"
   - This creates an isolated copy of your database

3. **Get the connection strings**:
   - Click on your "dev" branch
   - Copy the connection string
   - It will look similar but with a different endpoint

4. **Update `.env.local`**:
   Replace the connection strings with your dev branch URLs. They'll look like:
   ```
   POSTGRES_URL=postgres://default:PASSWORD@ep-XXXXX-pooler.us-east-1.aws.neon.tech/verceldb?sslmode=require
   DATABASE_URL=postgres://default:PASSWORD@ep-XXXXX-pooler.us-east-1.aws.neon.tech/verceldb?sslmode=require
   ```

5. **Run migrations on dev branch**:
   ```bash
   npm run db:push
   ```

### Option 2: Use Different Schema (Alternative)

If you prefer not to use branches, you can use a different schema:

1. Update `app/lib/db/schema.ts` to add schema parameter:
   ```typescript
   // Add this at the top of your table definitions
   export const participants = pgTable('participants', {
     // ... fields
   }, { schema: process.env.NODE_ENV === 'production' ? 'fantasy_playoffs' : 'fantasy_playoffs_dev' });
   ```

2. Create the dev schema:
   ```sql
   CREATE SCHEMA IF NOT EXISTS fantasy_playoffs_dev;
   ```

## Vercel Production Setup

Your production environment should use the "main" branch connection strings, which are already configured in your Vercel project settings.

**In Vercel Dashboard**:
1. Go to your project settings
2. Navigate to Environment Variables
3. Ensure these are set to your "main" branch URLs:
   - `POSTGRES_URL`
   - `DATABASE_URL`
   - All other `POSTGRES_*` variables

## Why This Matters

- **Isolation**: Changes in development don't affect production data
- **Safety**: Test migrations and features without risk
- **Speed**: Neon branches are fast and free for development
- **Flexibility**: Easy to reset dev branch if needed

## Testing the Setup

After configuring your dev branch:

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Verify it's using the dev database by checking logs or making a test change

3. Check Vercel deployment uses production database (main branch)

## Branch Management

- **Reset dev branch**: Delete and recreate from main when needed
- **Sync dev with prod**: Create a new dev branch from updated main
- **Cost**: Neon dev branches are typically free on their plans
