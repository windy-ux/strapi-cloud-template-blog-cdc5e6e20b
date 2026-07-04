# Strapi Home Page Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove blog-template defaults from Strapi, create proper `sections.*` dynamic zone components, and wire the home-page content type to match what the static site already queries.

**Architecture:** Pure Strapi schema changes (JSON files + directory deletions). No Strapi server code changes. One one-line fix in the website's query file to correct the API path. After all tasks, Strapi is started to auto-migrate the fresh DB.

**Tech Stack:** Strapi v4 (file-based schema), SQLite (dev DB), Nunjucks static site (website/)

---

## File Map

| Action | Path |
|---|---|
| Delete dir | `strapi-cloud-template-blog-cdc5e6e20b/src/api/about/` |
| Delete dir | `strapi-cloud-template-blog-cdc5e6e20b/src/api/article/` |
| Delete dir | `strapi-cloud-template-blog-cdc5e6e20b/src/api/author/` |
| Delete dir | `strapi-cloud-template-blog-cdc5e6e20b/src/api/category/` |
| Delete file | `strapi-cloud-template-blog-cdc5e6e20b/src/components/shared/hero.json` |
| Delete file | `strapi-cloud-template-blog-cdc5e6e20b/src/components/shared/media.json` |
| Delete file | `strapi-cloud-template-blog-cdc5e6e20b/src/components/shared/quote.json` |
| Delete file | `strapi-cloud-template-blog-cdc5e6e20b/src/components/shared/slider.json` |
| Delete file | `strapi-cloud-template-blog-cdc5e6e20b/.tmp/data.db` |
| Create file | `strapi-cloud-template-blog-cdc5e6e20b/src/components/sections/hero.json` |
| Create file | `strapi-cloud-template-blog-cdc5e6e20b/src/components/sections/announcement.json` |
| Create file | `strapi-cloud-template-blog-cdc5e6e20b/src/components/sections/text-block.json` |
| Modify | `strapi-cloud-template-blog-cdc5e6e20b/src/api/home-page/content-types/home-page/schema.json` |
| Modify | `website/strapi/queries.ts` |

---

### Task 1: Remove blog template API collections

**Files:**
- Delete: `strapi-cloud-template-blog-cdc5e6e20b/src/api/about/`
- Delete: `strapi-cloud-template-blog-cdc5e6e20b/src/api/article/`
- Delete: `strapi-cloud-template-blog-cdc5e6e20b/src/api/author/`
- Delete: `strapi-cloud-template-blog-cdc5e6e20b/src/api/category/`

- [ ] **Step 1: Delete the four blog API directories**

```bash
cd "strapi-cloud-template-blog-cdc5e6e20b"
rm -rf src/api/about src/api/article src/api/author src/api/category
```

- [ ] **Step 2: Verify they are gone**

```bash
ls src/api/
```

Expected output (only these should remain):
```
biography  global  home-page  .gitkeep
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove blog template api collections (about, article, author, category)"
```

---

### Task 2: Remove unused shared components and reset the database

**Files:**
- Delete: `src/components/shared/hero.json`
- Delete: `src/components/shared/media.json`
- Delete: `src/components/shared/quote.json`
- Delete: `src/components/shared/slider.json`
- Delete: `.tmp/data.db`

- [ ] **Step 1: Delete unused shared components**

```bash
rm src/components/shared/hero.json \
   src/components/shared/media.json \
   src/components/shared/quote.json \
   src/components/shared/slider.json
```

- [ ] **Step 2: Verify only seo.json remains in shared/**

```bash
ls src/components/shared/
```

Expected:
```
seo.json
```

- [ ] **Step 3: Delete the SQLite database**

```bash
rm .tmp/data.db
```

Strapi will auto-recreate a fresh database on next boot.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove unused shared components and reset dev database"
```

---

### Task 3: Create the sections components

**Files:**
- Create: `src/components/sections/hero.json`
- Create: `src/components/sections/announcement.json`
- Create: `src/components/sections/text-block.json`

- [ ] **Step 1: Create the sections directory**

```bash
mkdir -p src/components/sections
```

- [ ] **Step 2: Create `sections/hero.json`**

Write the following to `src/components/sections/hero.json`:

```json
{
  "collectionName": "components_sections_heroes",
  "info": {
    "displayName": "Hero"
  },
  "options": {},
  "attributes": {
    "heading": {
      "type": "string"
    },
    "subheading": {
      "type": "string"
    },
    "image": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    }
  }
}
```

- [ ] **Step 3: Create `sections/announcement.json`**

Write the following to `src/components/sections/announcement.json`:

```json
{
  "collectionName": "components_sections_announcements",
  "info": {
    "displayName": "Announcement"
  },
  "options": {},
  "attributes": {
    "exhibitionName": {
      "type": "string",
      "required": true
    },
    "venue": {
      "type": "string"
    },
    "vernissageDate": {
      "type": "string"
    },
    "duration": {
      "type": "string"
    },
    "curator": {
      "type": "string"
    },
    "link": {
      "type": "string"
    },
    "image": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    }
  }
}
```

- [ ] **Step 4: Create `sections/text-block.json`**

Write the following to `src/components/sections/text-block.json`:

```json
{
  "collectionName": "components_sections_text_blocks",
  "info": {
    "displayName": "Text Block"
  },
  "options": {},
  "attributes": {
    "heading": {
      "type": "string"
    },
    "body": {
      "type": "richtext"
    }
  }
}
```

- [ ] **Step 5: Verify all three files exist**

```bash
ls src/components/sections/
```

Expected:
```
announcement.json  hero.json  text-block.json
```

- [ ] **Step 6: Commit**

```bash
git add src/components/sections/
git commit -m "feat: add sections dynamic zone components (hero, announcement, text-block)"
```

---

### Task 4: Update the home-page schema

**Files:**
- Modify: `src/api/home-page/content-types/home-page/schema.json`

- [ ] **Step 1: Replace the schema file content**

Write the following to `src/api/home-page/content-types/home-page/schema.json`:

```json
{
  "kind": "singleType",
  "collectionName": "home_pages",
  "info": {
    "singularName": "home-page",
    "pluralName": "home-pages",
    "displayName": "Home page"
  },
  "options": {
    "draftAndPublish": true
  },
  "pluginOptions": {},
  "attributes": {
    "title": {
      "type": "string"
    },
    "description": {
      "type": "text"
    },
    "SEO": {
      "type": "component",
      "component": "shared.seo",
      "repeatable": false
    },
    "sections": {
      "type": "dynamiczone",
      "components": [
        "sections.hero",
        "sections.announcement",
        "sections.text-block"
      ]
    }
  }
}
```

Key changes from the old schema:
- Old `dynamicZone` field (with only `shared.hero`) is gone
- New `sections` dynamiczone references the three new components
- Added `title` (string) and `description` (text) fixed fields
- `SEO` component changed from `repeatable: true` to `repeatable: false`

- [ ] **Step 2: Commit**

```bash
git add src/api/home-page/content-types/home-page/schema.json
git commit -m "feat: restructure home-page schema with sections dynamic zone and fixed fields"
```

---

### Task 5: Fix the website query path

**Files:**
- Modify: `website/strapi/queries.ts` (line 8)

This is a one-line fix. The website was querying `/homepage` but the correct Strapi endpoint for a content type with `singularName: "home-page"` is `/home-page`.

- [ ] **Step 1: Update the path in `website/strapi/queries.ts`**

Open `website/strapi/queries.ts`. Change line 8:

```ts
// Before
const { data, error } = await client.GET('/homepage', {

// After
const { data, error } = await client.GET('/home-page', {
```

The full file after the change:

```ts
import { client } from './client.js';
import type { Homepage } from './types.js';
import { dynamicZoneQuery } from './dynamicZone/config/index.js';

export async function fetchHomepage(locale: string): Promise<Homepage> {
    const { data, error } = await client.GET('/home-page', {
        params: {
            query: {
                locale,
                // @ts-expect-error — populate is not fully typed in the generated schema
                populate: {
                    sections: {
                        on: dynamicZoneQuery,
                    },
                },
            },
        },
    });

    if (error) throw new Error(`Failed to fetch homepage: ${JSON.stringify(error)}`);

    return data.data;
}
```

- [ ] **Step 2: Commit (from the website git repo)**

```bash
cd ../website
git add strapi/queries.ts
git commit -m "fix: correct home-page api path from /homepage to /home-page"
cd ../strapi-cloud-template-blog-cdc5e6e20b
```

---

### Task 6: Verify Strapi boots and schema is correct

This is the integration check — Strapi reads all schema files on startup and auto-migrates the SQLite DB.

- [ ] **Step 1: Start Strapi in development mode**

```bash
npm run develop
```

Wait for the output to include:
```
[INFO] Starting Strapi in development mode...
[INFO] Your server is running at http://localhost:1337
```

If you see errors referencing removed collections or components, re-check that the files were fully deleted in Tasks 1 and 2.

- [ ] **Step 2: Open the admin and verify content types**

Navigate to `http://localhost:1337/admin`.

In **Content-Type Builder**, confirm:
- Under **Single Types**: only `Biography`, `Global`, `Home page` are listed (no About, no Article)
- Under **Collection Types**: empty (no Author, no Category, no Article)

- [ ] **Step 3: Verify the home-page fields**

Click **Home page** in the Content-Type Builder. Confirm these fields exist:
- `title` — Text (short)
- `description` — Text (long)
- `SEO` — Component (shared.seo), not repeatable
- `sections` — Dynamic Zone with three allowed components: Hero, Announcement, Text Block

- [ ] **Step 4: Verify the sections components**

In **Content-Type Builder → Components**, confirm `sections` category exists with:
- `Announcement` — fields: exhibitionName (required), venue, vernissageDate, duration, curator, link, image
- `Hero` — fields: heading, subheading, image
- `Text Block` — fields: heading, body

- [ ] **Step 5: Create a test home page entry**

Go to **Content Manager → Home page**. Add a `sections` entry — pick any component type, fill in a value, and publish. This confirms the dynamic zone is wired correctly.

- [ ] **Step 6: Stop Strapi** (`Ctrl+C`)

---

### Task 7: Install documentation plugin and generate OpenAPI types

The website's `npm run types:generate` reads from an OpenAPI JSON that Strapi's documentation plugin writes. The plugin is not yet installed. `website/strapi/generated.d.ts` does not exist yet — this is a first-time generation.

**Files:**
- Modify: `strapi-cloud-template-blog-cdc5e6e20b/package.json` (plugin added by npm)
- Create: `strapi-cloud-template-blog-cdc5e6e20b/src/extensions/documentation/documentation/1.0.0/full_documentation.json` (written by Strapi on boot)
- Create: `website/strapi/generated.d.ts` (written by types:generate)

- [ ] **Step 1: Install the documentation plugin in Strapi**

```bash
cd strapi-cloud-template-blog-cdc5e6e20b
npm install @strapi/plugin-documentation
```

- [ ] **Step 2: Enable the plugin in Strapi config**

Open `strapi-cloud-template-blog-cdc5e6e20b/config/plugins.js`. If it's empty or doesn't export documentation, add:

```js
module.exports = ({ env }) => ({
  documentation: {
    enabled: true,
    config: {
      info: {
        version: '1.0.0',
        title: 'Martin Froulik API',
      },
    },
  },
});
```

- [ ] **Step 3: Start Strapi to trigger documentation generation**

```bash
npm run develop
```

Wait for the line:
```
[INFO] Your server is running at http://localhost:1337
```

The plugin writes its OpenAPI JSON to:
```
src/extensions/documentation/documentation/1.0.0/full_documentation.json
```

Stop Strapi (`Ctrl+C`) once it has fully booted.

- [ ] **Step 4: Verify the OpenAPI file was created**

```bash
ls src/extensions/documentation/documentation/1.0.0/
```

Expected: `full_documentation.json` exists.

- [ ] **Step 5: Generate TypeScript types from the website directory**

```bash
cd ../website
npm run types:generate
```

Expected: `strapi/generated.d.ts` is created. Verify it contains the new paths:

```bash
grep -n "home-page\|SectionsHero\|SectionsAnnouncement\|SectionsText" strapi/generated.d.ts | head -20
```

Expected: lines referencing `/home-page`, `SectionsHeroComponent`, `SectionsAnnouncementComponent`, `SectionsTextBlockComponent`.

- [ ] **Step 6: Commit — two separate repos**

```bash
# Website repo
git add strapi/generated.d.ts
git commit -m "chore: generate strapi openapi types (first time)"

# Strapi repo
cd ../strapi-cloud-template-blog-cdc5e6e20b
git add package.json package-lock.json config/plugins.js
git commit -m "feat: install and enable strapi documentation plugin"
```
