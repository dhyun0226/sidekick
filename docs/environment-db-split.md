# Environment and Database Split

Sidekick should use separate Supabase projects for local development and production.

## Target Setup

Use `.env.local` for local development:

```env
NUXT_PUBLIC_BASE_URL=http://localhost:3000
NUXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_URL=https://fpbejjuisemrldcnybua.supabase.co
SUPABASE_KEY=<dev-anon-key>
SUPABASE_SECRET_KEY=<dev-service-role-key>
```

Use `.env.production` for production:

```env
NUXT_PUBLIC_BASE_URL=https://cheerreaders.com
NUXT_PUBLIC_SITE_URL=https://cheerreaders.com
SUPABASE_URL=https://auwrxjzijwxmswczqnit.supabase.co
SUPABASE_KEY=<prod-anon-key>
SUPABASE_SECRET_KEY=<prod-service-role-key>
```

The current local files previously pointed both local and production to the same Supabase project. That is risky for v2 work because migrations and seed data can affect production.

## Known Project Refs

- Development target: `fpbejjuisemrldcnybua` (`sidekick-prod`, reused as the development DB)
- Old linked project found in `supabase/.temp/project-ref`: `lhoyxmarndzmwaikbfzk` (`sidekick-dev`, currently inactive)
- Production target: `auwrxjzijwxmswczqnit` (`cheerreaders-prod`, active healthy, used by `cheerreaders.com`)

Do not push v2 migrations to `cheerreaders-prod` until they have been tested against `sidekick-prod`.

If `sidekick-prod` is inactive in Supabase, restore/unpause it in the Supabase dashboard before running local QA or pushing dev migrations.

## Commands

Run local development with the local DB:

```bash
npm run dev:local
```

Build against local env:

```bash
npm run build:local
```

Build against production env:

```bash
npm run build:prod
```

Use `dev:prod-env` only for diagnosing production configuration locally. Do not use it for normal feature development.

## Supabase CLI

Link the repo to the development project before pushing v2 migrations:

```bash
npx supabase link --project-ref fpbejjuisemrldcnybua
npx supabase db push
```

Only link to production when intentionally applying reviewed migrations:

```bash
npx supabase link --project-ref auwrxjzijwxmswczqnit
npx supabase db push
```

## Supabase Auth URLs

Development Supabase project:

```txt
Site URL:
http://localhost:3000

Redirect URLs:
http://localhost:3000/auth/callback
http://127.0.0.1:3000/auth/callback
```

Production Supabase project:

```txt
Site URL:
https://cheerreaders.com

Redirect URLs:
https://cheerreaders.com/auth/callback
```

If a Vercel preview/staging URL is later used, add that URL only to the development Supabase project.

## Google OAuth

Recommended:

- One Google OAuth client for development.
- One Google OAuth client for production.

Development OAuth redirect URI:

```txt
https://fpbejjuisemrldcnybua.supabase.co/auth/v1/callback
```

Production OAuth redirect URI:

```txt
https://auwrxjzijwxmswczqnit.supabase.co/auth/v1/callback
```

Put each OAuth client ID/secret into its matching Supabase project's Google provider settings.

## Link Generation Rule

App-generated links should use:

```ts
const baseUrl = useRuntimeConfig().public.baseUrl
```

Do not hardcode localhost, Supabase URLs, or production domains inside components or APIs.
