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
  lib/
    progress.ts
    progress.test.ts
  components/
    HeaderStats.tsx
    TrailMap.tsx
    SectionSidebar.tsx
    ShareModal.tsx
scripts/
  import-osm-trail.mjs
```

## MVP Boundaries

- Route geometry is a bundled OpenStreetMap snapshot of [Israel National Trail relation 282071](https://www.openstreetmap.org/relation/282071), imported on 2026-10-08: 41,750 detailed path points, approximately 1,081 km. Attribution: © OpenStreetMap contributors, [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/). The adapted route database is made available under ODbL 1.0; this does not change the license of the application code. The snapshot contains one continuous ordered route; the importer preserves separate fragments if later snapshots contain gaps instead of inventing straight bridges. No live Overpass request is needed to display the route.
- The 56 section boundaries, numbering, endpoint names, difficulty and elevation gains remain approximate MVP metadata, not the official 56-section dataset. Boundaries are assigned along the real route using bounded intervals and nearby demo landmarks. Distances are calculated from mapped geometry, not straight endpoint distances. Existing local log IDs remain unchanged; their approximate geographic boundaries have changed, so review earlier entries. The requested 1,050 km dashboard reference remains an estimate and may differ from the OSM snapshot length.
- The default map fits the complete mapped route. Completed sections are orange, partial sections amber, and remaining sections dark gray, all with high-contrast white casing. Overview markers are compact; numbers appear when zooming in. Real mapped geometry is not a guarantee of current trail access, safe conditions or navigation accuracy.
- Completion uses 56 sections and 1,050 km as requested. Distance and elevation count completed sections only. Partial sections have no measurable traveled distance in this data model and therefore do not inflate these totals.
- LocalStorage uses `my-shvil.progress.v1`. `localProgressRepository` owns persistence; `useUserProgress` owns reactive state and cross-tab updates. A Supabase repository can replace the storage adapter, with asynchronous loading and saving added to the hook.
- Images are saved as persistent JPEG Data URLs (resized to at most 1,200 pixels) or external HTTP(S) URLs. Maximum six images per section; input files up to 6 MB. Quota or unavailable-storage errors explicitly warn that changes only remain in memory. Uploaded images without GPS coordinates are placed at the section midpoint; they are not geotagged. External image hosts can receive visitors' IP addresses.
- GPX / Strava is explicitly a mock synchronization toggle. It does not import tracks, connect an account or verify completion.
- Sharing opens a read-only summary card and shares/copies summary text without private notes/photos. It is not a public hosted URL. No user accounts or social feed exist in this local-only MVP.
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