# Walkthrough: Live API Integration for Media, Bible Stories & Prayers

We have successfully migrated the content editors (Bible Stories and Prayers) to fetch and display live assets from the Media Library API, resolved the upload endpoint parameters, and set up high-fidelity first-frame previews for uploaded videos.

- **Live Backend API Sync**: Migrated the Prayers listing page (`src/app/prayers/page.tsx`) to pull live data from the backend `GET /api/v1/admin/prayers` endpoint.
- **Dynamic Filter Binding**: Wired up the category filter dropdown options directly from backend-fetched category data (`getCategories`).
- **High-Fidelity Skeleton Pulse**: Integrated `PrayersGridSkeleton` and `PrayersListSkeleton` with shimmer effects to handle asynchronous page loading.
- **Polished Deletion Lifecycle**: Synced the deleting confirmation modal to utilize the live `deleteCategory` and `deleteStory` endpoints with in-flight disable indicators.

## Changes Completed

### 1. Media Upload Endpoint Fix (`src/app/media/upload/page.tsx`)
- Changed the endpoint from the mock/incorrect `/api/v1/admin/uploads` to the correct `/api/v1/admin/upload`.
- Corrected the FormData parameter mapping (using `images` array field name for image uploads, and `video` field name for video uploads) to match Swagger and backend specs.

### 2. Video First-Frame Previews (`src/app/media/page.tsx`)
- Configured video preview elements to use browser-native first-frame rendering via `preload="metadata"` and appending `#t=0.001` to video URLs.
- Replaced bright background gradients for video cards with a clean, dark-zinc background (`bg-zinc-900`) for premium visual presentation.

### 3. Bible Stories Image Integration (`src/app/bible-stories/new/page.tsx`)
- Replaced the static mock image selection modal with a dynamic image library selector.
- Loaded live image uploads via `getUploads({ type: "image" })` on component mount.
- Structured modal selection state to query both live API files (`mediaList`) and the fallback fallback list (`MOCK_MEDIA_LIBRARY`) seamlessly.

### 4. Prayers Backend Sync & Listing (`src/app/prayers/page.tsx`)
- Integrated `/api/v1/admin/prayers` endpoints into `src/lib/api.ts` (GET, POST, GET by ID, PATCH, DELETE, publish, unpublish).
- Refactored `src/app/prayers/page.tsx` to handle dynamic loading, active filtering (categoryId, status), pagination metadata, and live item deletion.
- Added grid and list shimmer skeleton states mirroring the actual listing layouts.
- Updated category filter options to pull live categories from the backend.

## Verification

### Build Validation
- Run TypeScript verification successfully:
  ```powershell
  npx tsc --noEmit
  ```
  Result: Clean compile, 0 errors!

