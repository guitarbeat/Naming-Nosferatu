# Gallery Files Migration Documentation

This document catalogs all files used for the gallery functionality in the Naming-Nosferatu project.

## Core Gallery Components

- **`source/components/Gallery.tsx`** - Main gallery component containing `PhotoGallery`, `Lightbox`, and the `useImageGallery` hook (kept for future use)
- **`source/components/ImageGrid.tsx`** - Masonry-style grid layout for displaying images (kept for future use)
- **`source/features/gallery/GalleryView.tsx`** - Gallery page component (currently not exposed in navigation)
- **`source/features/gallery/imageService.ts`** - Service for interacting with Supabase storage for image uploads and listing (kept for future use)

## Hooks

- **`source/hooks/useLightboxState.ts`** - Custom hook for managing lightbox state and navigation

## Assets

- **`public/assets/images/gallery.json`** - JSON manifest file containing the list of gallery images

## Image Files (Gallery Content)

All these image files are referenced in the gallery:

- `public/assets/images/bby-cat.GIF`
- `public/assets/images/cat.gif`
- `public/assets/images/75209580524__60DCC26F-55A1-4EF8-A0B2-14E80A026A8D.avif`
- `public/assets/images/75209580524__60DCC26F-55A1-4EF8-A0B2-14E80A026A8D.webp`
- `public/assets/images/IMG_0778.avif`
- `public/assets/images/IMG_0778.webp`
- `public/assets/images/IMG_0779.avif`
- `public/assets/images/IMG_0779.webp`
- `public/assets/images/IMG_0865.avif`
- `public/assets/images/IMG_0865.webp`
- `public/assets/images/IMG_0884.avif`
- `public/assets/images/IMG_0884.webp`
- `public/assets/images/IMG_0923.avif`
- `public/assets/images/IMG_0923.webp`
- `public/assets/images/IMG_1116.avif`
- `public/assets/images/IMG_1116.webp`
- `public/assets/images/IMG_4844.avif`
- `public/assets/images/IMG_4844.webp`
- `public/assets/images/IMG_4845.avif`
- `public/assets/images/IMG_4845.webp`
- `public/assets/images/IMG_4846.avif`
- `public/assets/images/IMG_4846.webp`
- `public/assets/images/IMG_4847.avif`
- `public/assets/images/IMG_4847.webp`
- `public/assets/images/IMG_5044.avif`
- `public/assets/images/IMG_5044.webp`
- `public/assets/images/IMG_5071.avif`
- `public/assets/images/IMG_5071.webp`
- `public/assets/images/IMG_7205.avif`
- `public/assets/images/IMG_7205.webp`

## Integration Points

Gallery UI is no longer wired into the navbar, dashboard tabs, or tournament flow to avoid images showing in tournament selection. The core gallery components and Supabase image service remain available for future features such as uploads, cursor tilt interactions, or image expansion.

## System Overview

The gallery system supports both static images (from the `public/assets/images/` directory and the `gallery.json` manifest) and dynamic uploads to Supabase storage, with a lightbox viewer and masonry-style responsive grid layout.
