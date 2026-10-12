# My Shvil | השביל שלי

A Hebrew RTL section-hiking journal built with React, TypeScript, Vite, Tailwind CSS, Lucide and MapLibre. No API key or backend is required.

## Run

Requires Node.js 22+ and npm.

```sh
npm install
npm run dev
npm run build
npm test
```

## Authentication Setup

Authentication uses Supabase email magic links. Guest journals remain in this browser; signed-in journals are stored per account.

1. Create a Supabase project and run [`supabase/schema.sql`](supabase/schema.sql) in its SQL Editor. This creates the progress table, row-level security policies, and a private photo bucket.
2. In Supabase **Authentication → URL Configuration**, set the Site URL to `https://dimaklit.github.io/Dan2Eilat/` and add that URL plus `http://127.0.0.1:5173/` to the allowed redirect URLs.
3. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the ignored `.env.local` file from the Supabase project settings. Restart the local dev server.
4. For GitHub Pages, add repository Actions variables with those same names under **Settings → Secrets and variables → Actions → Variables**, then push to rebuild the site.

The publishable client key is public by design and is included in the static site. Never add a service-role key to the frontend or GitHub variables. Row-level security and the private storage policies in `supabase/schema.sql` are required to protect user data. After signing in, users can explicitly merge this browser's local journal into their account; existing account entries win when both journals have the same section.

## Project Structure

```text
index.html
package.json
package-lock.json
postcss.config.js
tailwind.config.js
tsconfig.json
vite.config.ts
src/
  main.tsx
  App.tsx
  index.css
  types/
    trail.ts
    userProgress.ts
  data/
    intSections.ts
    intRoute.json
  hooks/
    useUserProgress.ts
    useAuth.ts
  lib/
    progress.ts
    progress.test.ts
    cloudProgress.ts
    supabase.ts
  components/
    HeaderStats.tsx
    AuthDialog.tsx
    TrailMap.tsx
    SectionSidebar.tsx
    ShareModal.tsx
scripts/
  import-osm-trail.mjs
supabase/
  schema.sql
```

## MVP Boundaries

- Route geometry is a bundled OpenStreetMap snapshot of [Israel National Trail relation 282071](https://www.openstreetmap.org/relation/282071), imported on 2026-10-08: 41,750 detailed path points, approximately 1,081 km. Attribution: © OpenStreetMap contributors, [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/). The adapted route database is made available under ODbL 1.0; this does not change the license of the application code. The snapshot contains one continuous ordered route; the importer preserves separate fragments if later snapshots contain gaps instead of inventing straight bridges. No live Overpass request is needed to display the route.
- The 56 section boundaries, numbering, endpoint names, difficulty and elevation gains remain approximate MVP metadata, not the official 56-section dataset. Boundaries are assigned along the real route using bounded intervals and nearby demo landmarks. Distances are calculated from mapped geometry, not straight endpoint distances. Existing local log IDs remain unchanged; their approximate geographic boundaries have changed, so review earlier entries. The requested 1,050 km dashboard reference remains an estimate and may differ from the OSM snapshot length.
- The default map fits the complete mapped route. Completed sections are orange, partial sections amber, and remaining sections dark gray, all with high-contrast white casing. Overview markers are compact; numbers appear when zooming in. Real mapped geometry is not a guarantee of current trail access, safe conditions or navigation accuracy.
- Completion uses 56 sections and 1,050 km as requested. Distance and elevation count completed sections only. Partial sections have no measurable traveled distance in this data model and therefore do not inflate these totals.
- Guest LocalStorage uses `my-shvil.progress.v1`. `localProgressRepository` owns guest persistence; authenticated progress is stored in a per-user `user_progress` row protected by RLS. `useUserProgress` switches repositories only after the auth session is known and hides stale data during account changes.
- Guest images are saved as JPEG Data URLs (resized to at most 1,200 pixels) or external HTTP(S) URLs. Signed-in uploads move to the private `trail-photos` bucket and are displayed with temporary signed URLs. Maximum six images per section; input files up to 6 MB. Uploaded images without GPS coordinates are placed at the section midpoint; they are not geotagged. External image hosts can receive visitors' IP addresses.
- GPX / Strava is explicitly a mock synchronization toggle. It does not import tracks, connect an account or verify completion.
- Sharing opens a read-only summary card and shares/copies summary text without private notes/photos. The summary includes the public app URL; it does not publish the user's private journal.
- OpenTopoMap, OpenStreetMap and the Mapzen / AWS Open Data Terrarium DEM require network access. Topographic/street basemaps and terrain have independent controls; a map error can be dismissed. Honor providers' attribution and usage policies; use a production tile provider for larger deployments. Terrain is an illustrative global DEM, not a navigation-grade elevation model.
- Theme preference persists locally. RTL uses logical CSS properties and Tailwind RTL-compatible layout. Keyboard controls, focus outlines, accessible dialogs and mobile map/list switching are supported.

Local notes and photos are not encrypted; do not store sensitive information on shared devices. Clearing browser storage removes the journal.

## Refresh Route Data

Download `https://api.openstreetmap.org/api/0.6/relation/282071/full.json` to a local file, then run:

```sh
node --experimental-strip-types scripts/import-osm-trail.mjs path/to/osm-relation-full.json
npm test
npm run build
```

The importer validates relation membership, keeps way-node order, preserves disconnected fragments, and regenerates the bundled route with source metadata. It uses the existing demo landmarks to estimate section splits, not official section boundaries.