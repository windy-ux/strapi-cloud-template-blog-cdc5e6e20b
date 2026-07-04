# Home Page Dynamic Zone — Strapi Cleanup & Schema Design

**Date:** 2026-07-04  
**Scope:** Strapi only — no frontend changes

---

## Goal

Strip the blog-template defaults from Strapi and replace them with a clean home-page content type that has a proper dynamic zone (`sections`) plus fixed top-level fields. The Gulp + Nunjucks static site already queries this shape correctly; no frontend changes are needed.

---

## What Gets Removed

### API collections (full directory trees)
- `src/api/about/`
- `src/api/article/`
- `src/api/author/`
- `src/api/category/`

### Shared components
- `src/components/shared/hero.json`
- `src/components/shared/media.json`
- `src/components/shared/quote.json`
- `src/components/shared/slider.json`

### Database
- `.tmp/data.db` — deleted so Strapi auto-recreates a clean schema on next boot

---

## What Gets Kept

- `src/api/biography/` — used by the biography page
- `src/api/global/` — site-wide settings (siteName, siteDescription, defaultSeo)
- `src/api/home-page/` — restructured (see below)
- `src/components/shared/seo.json`
- `src/components/ui/button.json`

---

## Home-Page Schema Changes

**File:** `src/api/home-page/content-types/home-page/schema.json`

### Naming fix
`singularName` stays `home-page` and `pluralName` stays `home-pages` — the Strapi kebab-case convention. REST endpoint remains `/api/home-page`.

### Attributes
| Field | Type | Notes |
|---|---|---|
| `title` | string | Page title |
| `description` | text | Page description |
| `SEO` | component (`shared.seo`) | Non-repeatable |
| `sections` | dynamiczone | `sections.hero`, `sections.announcement`, `sections.text-block` |

The old `dynamicZone` field (named `dynamicZone`, contained only `shared.hero`) is replaced by `sections`.

---

## New Section Components

All created under `src/components/sections/`.

### `sections/hero.json`
| Field | Type |
|---|---|
| `heading` | string |
| `subheading` | string |
| `image` | media (single, images only) |

### `sections/announcement.json`
| Field | Type | Notes |
|---|---|---|
| `exhibitionName` | string | required |
| `venue` | string | |
| `vernissageDate` | string | |
| `duration` | string | |
| `curator` | string | |
| `link` | string | |
| `image` | media (single, images only) | |

### `sections/text-block.json`
| Field | Type |
|---|---|
| `heading` | string |
| `body` | richtext |

---

## Frontend Fix (one line)

**File:** `website/strapi/queries.ts`

```ts
// Before
client.GET('/homepage', {
// After
client.GET('/home-page', {
```

Everything else in the website already matches the schema:
- `populate.sections.on` for all three component types
- Type guards use `sections.hero`, `sections.announcement`, `sections.text-block`
- Nunjucks macros for all three sections are implemented

---

## Post-Cleanup Steps (manual, after implementation)

1. Start Strapi — it will auto-migrate and create fresh tables
2. Create a home page entry in the admin UI with at least one section
3. Run `npm run types:generate` in `website/` to regenerate the OpenAPI types from the updated documentation plugin output
4. Run the Gulp build to verify the static site fetches and renders correctly
