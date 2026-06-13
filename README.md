# Reddit Investor Dashboard

A single-repo, full-stack investor dashboard to track geographical user growth and advertising sentiment across Reddit. Built with TanStack Start, React, Tailwind CSS, and Supabase Postgres.

## Prerequisites

1. Set up your `.env` file based on `.env.example`:
   - `SCRAPER_API_KEY`: Your ScraperAPI key used to bypass Reddit's bot protection.
   - `DATABASE_URL`: Your PostgreSQL connection string.

## Getting Started

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Database Setup**
   Push the Drizzle ORM schema to your Postgres database:
   ```bash
   pnpm run db:push
   ```

3. **Start the Development Server**
   ```bash
   pnpm run dev
   ```
   *Note: In Antigravity IDE, you can easily launch the app by opening the Run/Debug panel and clicking the Play button next to **"Start Dev Server"** (configured via `.vscode/launch.json`).*

## Scripts

- `pnpm run dev`: Starts the Vite dev server
- `pnpm run build`: Builds the application for production
- `pnpm run start`: Runs the built production server
- `pnpm run format`: Formats code with Biome
- `pnpm run lint`: Lints code with Biome
