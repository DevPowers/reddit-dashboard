# Reddit Investor Dashboard

A single-repo, full-stack investor dashboard to track geographical user growth, advertising sentiment, and advertiser growth across Reddit. 

## Features
- **Daily Scraping:** Automated background scraper that bypasses Cloudflare using ScraperAPI.
- **Analytics UI:** A gorgeous dashboard for time-series visualization using Recharts.
- **Admin Portal:** Live UI polling, execution duration metrics, and database health.
- **Framework:** TanStack Start (React + Vite + TanStack Router).
- **Database:** Supabase (PostgreSQL) + Drizzle ORM.

## Setup Instructions

1. **Install Dependencies:**
   ```bash
   pnpm install
   ```

2. **Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgres://postgres.xxxxx:xxxxx@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
   SCRAPER_API_KEY="your_scraperapi_key"
   CRON_SECRET="your_secret_password"
   ```

3. **Push the Database Schema:**
   ```bash
   pnpm run db:push
   ```

4. **Start the Development Server:**
   ```bash
   pnpm run dev
   ```

## Production Deployment (Vercel)
This app is designed to be deployed to Vercel.
1. Push your code to GitHub.
2. Import the repository into Vercel.
3. Add `DATABASE_URL`, `SCRAPER_API_KEY`, and `CRON_SECRET` to the Vercel Environment Variables.
4. Set up Vercel Cron to hit `/api/cron/scrape` using the `CRON_SECRET` in the Authorization header.
