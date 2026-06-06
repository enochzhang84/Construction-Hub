
# V2 Construction Library → Supabase Standard Distribution

## Goal
Turn the renovation quote app into a reproducible deployment: any fresh Supabase project can run two SQL files to get a complete V2 construction library, while customer/estimate data stays out of the seed.

---

## 1. New Supabase tables

All under schema `public`, with `GRANT` + RLS + standard `created_at`/`updated_at`.

| Table | Purpose | Write access |
|---|---|---|
| `categories` | Construction categories (demo, framing, …, lowvoltage, general) | admin/super_admin |
| `construction_items` | V2 price book items | admin/super_admin |
| `units` | sqft, lf, ea, sq, job, hr | admin/super_admin |
| `pricing_types` | Labor Only / Labor + Material / Turnkey / Estimate / … | admin/super_admin |
| `terms_conditions` | Default disclaimer / T&C blocks (EN + ZH) | admin/super_admin |
| `pdf_templates` | PDF layout config (jsonb) | admin/super_admin |
| `system_settings` | key/value jsonb (tax rate defaults, currency, language, …) | admin/super_admin |

**Read access:** all 7 tables are publicly readable (catalog data — `GRANT SELECT ... TO anon, authenticated`). Writes are gated through `has_role(auth.uid(), 'admin' | 'super_admin')`.

**Customer/estimate tables are explicitly NOT created** in this turn (out of scope per your answer).

---

## 2. Two deliverable SQL files

Generated and committed to `supabase/exports/`:

- **`construction_schema.sql`** — every `CREATE TABLE`, `GRANT`, RLS policy, the `has_role` function, the `update_updated_at_column` trigger function, and the existing `company_profile` / `profiles` / `user_roles` tables. Re-runnable on a fresh Supabase.
- **`construction_seed_data.sql`** — `INSERT` statements for: 20 categories, ~236 construction items (V2), units, pricing types, default English + Chinese terms, the default PDF template, baseline system settings. Idempotent (`ON CONFLICT DO NOTHING`).

Fresh-deploy flow becomes:

```text
psql < construction_schema.sql
psql < construction_seed_data.sql
git pull && npm i && npm run build && pm2 restart
```

---

## 3. Frontend rewire (construction library only)

- **`price-book-store.ts`** → fetch categories + items from Supabase on mount (browser client, SELECT is public). Keep the Zustand cache + dedup-on-upsert logic. Custom items now persist to `construction_items` via authenticated insert.
- **`terms-store.ts`** → read defaults from `terms_conditions`.
- **`company-store.ts`** → keep current `company_profile` wiring; merge any settings reads from `system_settings`.
- **`src/lib/data.ts`** → kept as the V2 seed source of truth used by the seed-SQL generator and the "Restore Defaults" button. UI no longer imports `PRICE_ITEMS` / `CATEGORIES` directly.

Customer/estimate/project stores are **not touched**.

---

## 4. Settings → "System Data" panel

New section in `src/routes/_authenticated/settings.tsx` with 4 actions:

1. **Export Schema SQL** — downloads `construction_schema.sql` (static file from `supabase/exports/`).
2. **Export Seed Data SQL** — regenerates seed SQL from current DB rows (categories + construction_items + units + pricing_types + terms + pdf_templates + system_settings) and downloads it. Customer/estimate tables excluded.
3. **Restore Default Construction Items** — upserts V2 list into `construction_items`. Dedup key: `category_id + name_en + name_zh + unit`. Skips duplicates, never overwrites prices. Shows `{created, skipped}` toast.
4. **Initialize Default Data** — only enabled when target tables are empty; runs the full default seed (categories, units, pricing types, items, terms, template, settings).

All four actions are admin/super_admin only.

---

## 5. Tables actually used by the system after this work

```text
public.company_profile       (already exists)
public.profiles              (already exists)
public.user_roles            (already exists)
public.categories            (new)
public.construction_items    (new)
public.units                 (new)
public.pricing_types         (new)
public.terms_conditions      (new)
public.pdf_templates         (new)
public.system_settings       (new)
```

Customer / estimate / project / payment tables are **not** part of this distribution.

---

## Execution order

1. Submit one migration creating all 7 new tables + GRANTs + RLS + indexes.
2. Submit one data insert (via insert tool) that seeds the 7 tables from `data.ts` V2.
3. Generate `supabase/exports/construction_schema.sql` and `construction_seed_data.sql` (committed to repo, served as static download).
4. Rewire `price-book-store.ts` + `terms-store.ts` to read from Supabase (keep API surface unchanged so existing pages don't break).
5. Add `System Data` panel + 4 actions in Settings.
6. Verify: fresh-DB simulation (count rows after seed), Export Seed regenerates a working file, Restore Defaults shows correct skip count on second run.

---

## Risks / call-outs

- **Schema for `pdf_templates` and `system_settings`** uses `jsonb`. Concrete keys (tax rate, currency, locale, header/footer config) will be pulled from current code (`company-store`, estimate PDF code) so existing UI keeps working.
- **Terms** are currently stored locally per-user; moving defaults to DB means edits to defaults become global. Per-estimate custom terms stay in the estimate record (local store, out of scope).
- **Static schema SQL** will lag behind future migrations unless regenerated. The "Export Schema SQL" button always returns the latest version because it's regenerated at build time from `supabase/migrations/`.
- After approval, the migration tool runs the schema change first; only after types regenerate can I write the store rewire code that depends on the new tables.
