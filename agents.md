<!-- intent-skills:start -->
# Skill mappings - load `use` with `npx @tanstack/intent@latest load <use>`.
skills:
  - when: "Install TanStack Devtools, pick framework adapter (React/Vue/Solid/Preact), register plugins via plugins prop, configure shell (position, hotkeys, theme, hideUntilHover, requireUrlFlag, eventBusConfig). TanStackDevtools component, defaultOpen, localStorage persistence."
    use: "@tanstack/devtools#devtools-app-setup"
  - when: "Publish plugin to npm and submit to TanStack Devtools Marketplace. PluginMetadata registry format, plugin-registry.ts, pluginImport (importName, type), requires (packageName, minVersion), framework tagging, multi-framework submissions, featured plugins."
    use: "@tanstack/devtools#devtools-marketplace"
  - when: "Build devtools panel components that display emitted event data. Listen via EventClient.on(), handle theme (light/dark), use @tanstack/devtools-ui components. Plugin registration (name, render, id, defaultOpen), lifecycle (mount, activate, destroy), max 3 active plugins. Two paths: Solid.js core with devtools-ui for multi-framework support, or framework-specific panels."
    use: "@tanstack/devtools#devtools-plugin-panel"
  - when: "Handle devtools in production vs development. removeDevtoolsOnBuild, devDependency vs regular dependency, conditional imports, NoOp plugin variants for tree-shaking, non-Vite production exclusion patterns."
    use: "@tanstack/devtools#devtools-production"
  - when: "Two-way event patterns between devtools panel and application. App-to-devtools observation, devtools-to-app commands, time-travel debugging with snapshots and revert. structuredClone for snapshot safety, distinct event suffixes for observation vs commands, serializable payloads only."
    use: "@tanstack/devtools-event-client#devtools-bidirectional"
  - when: "Create typed EventClient for a library. Define event maps with typed payloads, pluginId auto-prepend namespacing, emit()/on()/onAll()/onAllPluginEvents() API. Connection lifecycle (5 retries, 300ms), event queuing, enabled/disabled state, SSR fallbacks, singleton pattern. Unique pluginId requirement to avoid event collisions."
    use: "@tanstack/devtools-event-client#devtools-event-client"
  - when: "Analyze library codebase for critical architecture and debugging points, add strategic event emissions. Identify middleware boundaries, state transitions, lifecycle hooks. Consolidate events (1 not 15), debounce high-frequency updates, DRY shared payload fields, guard emit() for production. Transparent server/client event bridging."
    use: "@tanstack/devtools-event-client#devtools-instrumentation"
  - when: "Configure @tanstack/devtools-vite for source inspection (data-tsd-source, inspectHotkey, ignore patterns), console piping (client-to-server, server-to-client, levels), enhanced logging, server event bus (port, host, HTTPS), production stripping (removeDevtoolsOnBuild), editor integration (launch-editor, custom editor.open). Must be FIRST plugin in Vite config. Vite ^6 || ^7 only."
    use: "@tanstack/devtools-vite#devtools-vite-plugin"
  - when: "Step-by-step migration from Next.js App Router to TanStack Start: route definition conversion, API mapping, server function conversion from Server Actions, middleware conversion, data fetching pattern changes."
    use: "@tanstack/react-start#lifecycle/migrate-from-nextjs"
  - when: "React bindings for TanStack Start: createStart, StartClient, StartServer, React-specific imports, re-exports from @tanstack/react-router, full project setup with React, useServerFn hook."
    use: "@tanstack/react-start#react-start"
  - when: "Implement, review, debug, and refactor TanStack Start React Server Components in React 19 apps. Use when tasks mention @tanstack/react-start/rsc, renderServerComponent, createCompositeComponent, CompositeComponent, renderToReadableStream, createFromReadableStream, createFromFetch, Composite Components, React Flight streams, loader or query owned RSC caching, router.invalidate, structuralSharing: false, selective SSR, stale names like renderRsc or .validator, or migration from Next App Router RSC patterns. Do not use for generic SSR or non-TanStack RSC frameworks except brief comparison."
    use: "@tanstack/react-start#react-start/server-components"
  - when: "Framework-agnostic core concepts for TanStack Router: route trees, createRouter, createRoute, createRootRoute, createRootRouteWithContext, addChildren, Register type declaration, route matching, route sorting, file naming conventions. Entry point for all router skills."
    use: "@tanstack/router-core#router-core"
  - when: "Route protection with beforeLoad, redirect()/throw redirect(), isRedirect helper, authenticated layout routes (_authenticated), non-redirect auth (inline login), RBAC with roles and permissions, auth provider integration (Auth0, Clerk, Supabase), router context for auth state."
    use: "@tanstack/router-core#router-core/auth-and-guards"
  - when: "Automatic code splitting (autoCodeSplitting), .lazy.tsx convention, createLazyFileRoute, createLazyRoute, lazyRouteComponent, getRouteApi for typed hooks in split files, codeSplitGroupings per-route override, splitBehavior programmatic config, critical vs non-critical properties."
    use: "@tanstack/router-core#router-core/code-splitting"
  - when: "Route loader option, loaderDeps for cache keys, staleTime/gcTime/ defaultPreloadStaleTime SWR caching, pendingComponent/pendingMs/ pendingMinMs, errorComponent/onError/onCatch, beforeLoad, router context and createRootRouteWithContext DI pattern, router.invalidate, Await component, deferred data loading with unawaited promises."
    use: "@tanstack/router-core#router-core/data-loading"
  - when: "Link component, useNavigate, Navigate component, router.navigate, ToOptions/NavigateOptions/LinkOptions, from/to relative navigation, activeOptions/activeProps, preloading (intent/viewport/render), preloadDelay, navigation blocking (useBlocker, Block), createLink, linkOptions helper, scroll restoration, MatchRoute."
    use: "@tanstack/router-core#router-core/navigation"
  - when: "notFound() function, notFoundComponent, defaultNotFoundComponent, notFoundMode (fuzzy/root), errorComponent, CatchBoundary, CatchNotFound, isNotFound, NotFoundRoute (deprecated), route masking (mask option, createRouteMask, unmaskOnReload)."
    use: "@tanstack/router-core#router-core/not-found-and-errors"
  - when: "Dynamic path segments ($paramName), splat routes ($ / _splat), optional params ({-$paramName}), prefix/suffix patterns ({$param}.ext), useParams, params.parse/stringify, pathParamsAllowedCharacters, i18n locale patterns."
    use: "@tanstack/router-core#router-core/path-params"
  - when: "validateSearch, search param validation with Zod/Valibot/ArkType adapters, fallback(), search middlewares (retainSearchParams, stripSearchParams), custom serialization (parseSearch, stringifySearch), search param inheritance, loaderDeps for cache keys, reading and writing search params."
    use: "@tanstack/router-core#router-core/search-params"
  - when: "Non-streaming and streaming SSR, RouterClient/RouterServer, renderRouterToString/renderRouterToStream, createRequestHandler, defaultRenderHandler/defaultStreamHandler, HeadContent/Scripts components, head route option (meta/links/styles/scripts), ScriptOnce, automatic loader dehydration/hydration, memory history on server, data serialization, document head management."
    use: "@tanstack/router-core#router-core/ssr"
  - when: "Full type inference philosophy (never cast, never annotate inferred values), Register module declaration, from narrowing on hooks and Link, strict:false for shared components, getRouteApi for code-split typed access, addChildren with object syntax for TS perf, LinkProps and ValidateLinkOptions type utilities, as const satisfies pattern."
    use: "@tanstack/router-core#router-core/type-safety"
  - when: "TanStack Router bundler plugin for route generation and automatic code splitting. Supports Vite, Webpack, Rspack, and esbuild. Configures autoCodeSplitting, routesDirectory, target framework, and code split groupings."
    use: "@tanstack/router-plugin#router-plugin"
  - when: "Core overview for TanStack Start: tanstackStart() Vite plugin, getRouter() factory, root route document shell (HeadContent, Scripts, Outlet), client/server entry points, routeTree.gen.ts, tsconfig configuration. Entry point for all Start skills."
    use: "@tanstack/start-client-core#start-core"
  - when: "Server-side authentication primitives for TanStack Start: session cookies (HttpOnly, Secure, SameSite, __Host- prefix), session read/issue/destroy via createServerFn and middleware, OAuth authorization-code flow with state and PKCE, password-reset enumeration defense, CSRF for non-GET RPCs, rate limiting auth endpoints, session rotation on privilege change. Pairs with router-core/auth-and-guards for the routing side."
    use: "@tanstack/start-client-core#start-core/auth-server-primitives"
  - when: "Deploy to Cloudflare Workers, Netlify, Vercel, Node.js/Docker, Bun, Railway. Selective SSR (ssr option per route), SPA mode, static prerendering, ISR with Cache-Control headers, SEO and head management."
    use: "@tanstack/start-client-core#start-core/deployment"
  - when: "Isomorphic-by-default principle, environment boundary functions (createServerFn, createServerOnlyFn, createClientOnlyFn, createIsomorphicFn), ClientOnly component, useHydrated hook, import protection, dead code elimination, environment variable safety (VITE_ prefix, process.env)."
    use: "@tanstack/start-client-core#start-core/execution-model"
  - when: "createMiddleware, request middleware (.server only), server function middleware (.client + .server), context passing via next({ context }), sendContext for client-server transfer, global middleware via createStart in src/start.ts, middleware factories, method order enforcement, fetch override precedence."
    use: "@tanstack/start-client-core#start-core/middleware"
  - when: "createServerFn (GET/POST), validator (Zod or function), useServerFn hook, server context utilities (getRequest, getRequestHeader, setResponseHeader, setResponseStatus), error handling (throw errors, redirect, notFound), streaming, FormData handling, file organization (.functions.ts, .server.ts)."
    use: "@tanstack/start-client-core#start-core/server-functions"
  - when: "Server-side API endpoints using the server property on createFileRoute, HTTP method handlers (GET, POST, PUT, DELETE), createHandlers for per-handler middleware, handler context (request, params, context), request body parsing, response helpers, file naming for API routes."
    use: "@tanstack/start-client-core#start-core/server-routes"
  - when: "Server-side runtime for TanStack Start: createStartHandler, request/response utilities (getRequest, setResponseHeader, setCookie, getCookie, useSession), three-phase request handling, AsyncLocalStorage context."
    use: "@tanstack/start-server-core#start-server-core"
  - when: "Programmatic route tree building as an alternative to filesystem conventions: rootRoute, index, route, layout, physical, defineVirtualSubtreeConfig. Use with TanStack Router plugin's virtualRouteConfig option."
    use: "@tanstack/virtual-file-routes#virtual-file-routes"
<!-- intent-skills:end -->

# Project Overview
We are building a single-repo, full-stack investor dashboard to track geographical user growth, advertising sentiment and advertiser growth across Reddit. The app will scrape daily visitor and contribution metrics from targeted subreddits and visualize the time-series data.

## Tech Stack & Tooling
- **Framework:** TanStack Start (React + Vite + TanStack Router)
- **Language:** TypeScript (Strict mode enabled)
- **Database:** PostgreSQL (via Supabase Postgres)
- **ORM:** Drizzle ORM
- **Scraping/Parsing:** Cheerio (for server-side HTML parsing)
- **UI & Styling:** Tailwind CSS, shadcn/ui components
- **Charting:** Recharts
- **Typography:** Open Sans (via Google Fonts API)
- **Formatting:** Biome (default configuration)
- **Linting:** Biome

## Core Data & Reddit API
Reddit no longer displays total "subscribers" or "active users," and heavily blocks serverless automated requests with Cloudflare. To bypass this, the app uses **ScraperAPI** to fetch the fully-rendered raw HTML from the public web interface: `GET https://api.scraperapi.com/?api_key={KEY}&url=https://www.reddit.com/r/{subreddit}/&render=true`.
Using Cheerio, the scraper will parse the DOM and extract the two new public engagement metrics embedded in the `<shreddit-subreddit-header>` component:
1. `weekly_visitors`: Found in the `weekly-active-users` attribute.
2. `weekly_contributions`: Found in the `weekly-contributions` attribute.

### Target Subreddits
**Geographical Growth:**
- `r/india` (India)
- `r/brasil` (Brazil)
- `r/mexico` (Mexico)
- `r/de` (Germany)
- `r/france` (France)
- `r/australia` (Australia)
- `r/unitedkingdom` (UK)
- `r/canada` (Canada)

**Advertiser & Platform Sentiment:**
- `r/redditads` (Reddit Platform)
- `r/FacebookAds` (Meta Platform)
- `r/PPC` (Google Ads / General)

## Database Management
- **No Data Deletion**: Do NOT drop, delete, or wipe the production database or completely scrap it going forward.
- **Migrations**: Any future database schema changes must be handled gracefully using proper Drizzle migration scripts instead of destructive wiping.

## Database Schema (Drizzle)
Agents must implement the following three tables:

1. `subreddits`:
   - `id`: serial / primary key
   - `name`: varchar (e.g., 'redditads')
   - `category`: varchar ('geography' or 'advertising')
   - `created_at`: timestamptz

2. `subreddit_metrics`:
   - `id`: serial / primary key
   - `subreddit_id`: integer / foreign key
   - `weekly_visitors`: integer
   - `weekly_contributions`: integer
   - `recorded_at`: timestamptz (default now)

3. `cron_logs`:
   - `id`: serial / primary key
   - `status`: varchar ('running', 'success', 'failed')
   - `errorMessage`: varchar
   - `durationMs`: integer (tracks execution time)
   - `ranAt`: timestamptz (default now)

## Backend Scraper (API Route `/api/cron/scrape`)
- Handles the actual scraping execution and deduplication.
- Scraper bypasses Cloudflare using ScraperAPI.
- Enforces a 1-run-per-day limit by checking `cron_logs`.
- Logs `status: 'running'` immediately upon boot, then captures elapsed milliseconds before logging `success` or `failed`.
- Requires `CRON_SECRET` Bearer token for authentication.

## Admin Portal (`/admin`)
- Real-time diagnostics dashboard.
- Uses a native TanStack Router `useEffect` to poll `router.invalidate()` every 15 seconds if `isRunning === true`.
- Displays Database Health, Total Scrapes, Scrape Duration (Averages), and Last Run exact execution times.

## TypeScript Architecture
- **Dedicated Types File:** All reusable TypeScript types, interfaces, and enums (like `Category`, `ArpuExpectation`, and `TrackedGroup`) MUST be placed in `src/types/index.ts`. Do not clutter data or component files with exported types.

## UI & Design Guidelines
- Agents must reference `DESIGN.md` (generated via Google Stitch) for all styling primitives, spacing, and color hexes.
- Apply the Open Sans font globally via standard CSS imports or layout configuration.
- Implement a dashboard view using Recharts to plot `recorded_at` (X-axis) against `weekly_visitors` (Y-axis) for trend visualization.
- Ensure all charts can filter between the 'geography' and 'advertising' categories.

## README Generation
Upon completing the setup, the agent must generate a `README.md` containing:
1. Environment variable requirements (`DATABASE_URL`).
2. Commands to install dependencies (`pnpm install`).
3. Commands to push the Drizzle schema (`pnpm run db:push`).
4. Commands to run the dev server (`pnpm run dev`).

## Testing Requirements
Agents MUST ALWAYS add and update unit tests for any new functionality or changes.
- **Framework:** Vitest, React Testing Library, JSDOM.
- **Rule 1:** When implementing new UI components, add tests to `tests/ui/` to verify rendering and interactive states.
- **Rule 2:** When adding new backend data logic or mock generators, add tests to `tests/backend/` to verify mathematical and structural correctness.
- **Rule 3:** When adding new API routes or server handlers, add tests to `tests/api/` to verify request/response handling and edge cases (like missing keys or errors).
- **Rule 4:** ALWAYS run `pnpm run test` before finalizing the work to ensure a 100% pass rate.
- **Rule 5:** When modifying database schemas (`schema.ts`), types, or exports, ALWAYS run `npx tsc --noEmit` (or `pnpm run build`) to typecheck the entire project. Vitest does NOT catch missing ESM exports or unresolved imports due to Vite's transpilation process.
- **Rule 6:** API integration tests must NEVER blindly swallow exceptions with a generic `catch (e) { expect(e).toBeDefined() }`. Tests should either correctly mock the database schema to ensure the structural query works, or explicitly fail if an unexpected SyntaxError or Import error occurs.
## Page Architecture Standard (Compositional Shell)
- **Documentation-Style Pages**: All route files (`.tsx` files inside `src/routes/`) MUST act strictly as compositional shells and read like documentation.
- They should contain minimal inline logic and map directly to imported section components.
- Example pattern:
```tsx
import { SectionA } from "../components/SectionA";
import { SectionB } from "../components/SectionB";

export function RouteComponent() {
  return (
    <div className="page-wrap">
       <SectionA />
       <SectionB />
    </div>
  );
}
```
- Sub-components must be extracted to `src/components/` and properly typed.
- Theme hex values (`#HEX`) are strictly prohibited in components. Use Tailwind v4 theme variables (e.g., `text-success`, `bg-obsidian`) defined in `src/styles.css`.

## React Performance Standards
- **Memoization Strictness**: Heavy data generation (like `generateMockMetrics`) or complex array mapping MUST be strictly wrapped in `useMemo` hooks with correct dependency arrays. Be extremely cautious about returning new object/array references that bypass downstream `useMemo` caches.
- **Lookup Optimization**: Never use `Array.find()` or `Array.filter()` inside of loops (O(N²) complexity). Always transform the target array into a `Map` or `Set` first for instant O(1) lookups.
- **Render Auditing**: When introducing new state (like category toggles or layout changes), ensure those states aren't needlessly causing the entire page data tree to re-evaluate.

## Dashboard Chart & Accordion Data Grouping Logic
- **chartData (Recharts)**: The line chart dynamically groups historical points differently depending on the active category.
  - If `selectedCategory` is `GEOGRAPHY`: It aggregates and averages all subreddits into `High ARPU`, `Medium ARPU`, and `Low ARPU` lines.
  - If `selectedCategory` is anything else (e.g., `ADVERTISING_PLATFORMS`, `HIGH_VALUE_AD_VERTICALS`): It aggregates and averages all subreddits into their `subCategory` lines (e.g. "Google", "Meta", "Gaming").
- **accordionData**: The accordion table below the chart ALWAYS groups subreddits by their `subCategory` (e.g. "France", "Gaming") allowing users to expand the category to see the underlying subreddits making up that group.

## Accessibility & UX Standards
- **Cursor Pointer**: Explicitly add the `cursor-pointer` utility class to ALL clickable elements in the application (e.g. `<button>`, `<label>`, `<div onClick={...}>`). Do not assume that standard browser behaviors or Tailwind preflight handles this, as elements without `cursor-pointer` negatively impact perceived interactivity.
