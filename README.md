# AAMUKTHA Drapes & Delights

A responsive product showcase with a private owner dashboard. Visitors browse products and continue the conversation on WhatsApp. No cart, checkout, payments or customer accounts.

## Features

- Responsive catalog, category filters, search, stock filter and price sorting.
- Product detail dialog and product-specific WhatsApp enquiries.
- Supabase owner email/password sign-in, product creation/editing/deletion, availability and publication controls.
- Private image storage with signed links; uploads resized to 1,400 px and compressed to WebP, up to 2 MB.
- Store settings for business name, headline, description and WhatsApp number.
- Database permissions restrict writes to explicitly designated owners; logging in alone does not grant owner rights.
- No secrets committed. Browser config contains only the public project URL and publishable/anon key.

## Local development

Use Node 22.12+ (Node 24 LTS recommended).

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Without Supabase configuration, the site shows a **read-only sample collection** using original local SVG illustrations. Owner management is disabled. This preview is not a connected business catalog.

## Supabase setup (Free plan)

1. Create a free Supabase organization and project. Keep the database password in your password manager.
2. Run `supabase/schema.sql` once in the project's SQL Editor.
3. In Authentication > Users, create an email/password user for the owner. Enter the password directly in Supabase; do not commit it.
4. Run `supabase/owner-setup.sql`, replacing `OWNER_EMAIL` with that user's email.
5. Disable public signups under Authentication settings. The app has no signup form. RLS still prevents non-owners from writing even if signups remain enabled.
6. Copy the Project URL and public publishable/anon key into `.env.local` or the hosting provider's build environment:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
     Never use a service-role or secret key in frontend variables.
7. Run the app, visit `/admin`, sign in and add actual products. Set your business name and WhatsApp number under Store settings.

The configured database starts with **no products**; sample products never populate the real catalog automatically. Prices use Indian rupees. WhatsApp buttons stay disabled until a valid number with country code is provided.

## Current deployment

- Website: https://aamuktha-drapes-and-delights.pages.dev/
- Owner dashboard: https://aamuktha-drapes-and-delights.pages.dev/admin
- Previous address: https://myplay-catalog-4232.pages.dev/ redirects to the current website. The small redirect deployment is tracked under `deployment/legacy-redirect/`.
- GitHub branch: `v1`
- Supabase project: `myplay-catalog` (MyPlay organization)
- Deployment method: Cloudflare Pages Direct Upload. GitHub pushes save source code but do not automatically redeploy this project. Rebuild with the public Supabase configuration, zip the contents of `dist/` (not the parent folder), and upload a new production deployment in Cloudflare.
- Initial release needs owner account creation/authorization, real products and a WhatsApp number.

## Alternative: Git-connected Cloudflare Pages deployment (Free plan)

1. Connect the GitHub repository, selecting the intended branch (`v1` initially).
2. Build command: `npm run build`; output directory: `dist`; root: repository root.
3. Set `NODE_VERSION=24` and the two public Supabase build variables above.
4. Deploy and use the provided free `pages.dev` address. Add that origin as the Site URL in Supabase Authentication URL Configuration.
5. Verify `/`, `/admin`, sign-in, image upload, product updates and WhatsApp on desktop and mobile.

Vite emits no top-level `404.html`, so Cloudflare Pages serves this single-page app for routes such as `/admin`. `_headers` supplies browser security headers. Custom domains are optional and generally cost extra. Free plans have usage limits and may change; Supabase Free may pause after a week of inactivity. Export the database and keep original photos as manual backups; automatic backups are not included in the free plan.

## Checks

```sh
npm test
npm run build
```

After Supabase is connected, verify as an anonymous user that unpublished products/photos are inaccessible and insert/update/delete operations are refused. Verify as a signed-in non-owner that the same writes fail. Verify the designated owner can manage products, then sign out and confirm that owner controls are inaccessible.

A signed image URL lasts one hour; the visible app refreshes data every 30 minutes and when returning to the tab. Previously issued URLs can remain valid until they expire after a product is hidden/deleted. Photo deletion can fail after a successful product deletion; the dashboard surfaces a cleanup error in that case. No unlimited availability or storage is promised.
