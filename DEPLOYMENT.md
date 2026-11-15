# Vercel deployment guide

ANKH is a static Vite site. Vercel builds it with `npm run build` and serves the generated `dist/` directory. The Vercel configuration rewrites `/` to `/showcase.html`; the separate workbench remains available at `/index.html`.

## Configure the project

1. Import this repository into Vercel with the repository root as the project root.
2. Keep the Vite framework preset. The checked-in `vercel.json` sets the build command, output directory, and showcase root route.
3. Add `VITE_MUX_PLAYBACK_ID` to the Vercel Production environment with the public playback ID from `.env`.
4. Build and deploy from the Vercel dashboard or with the existing `npm run deploy:vercel` script after release approval.

The playback ID is public playback configuration, not an API secret. Do not add Mux signing keys, access tokens, or private API credentials to Vite variables. No server, function, authentication, or Mux Player iframe is required. Vercel hosts the static bundle; the Video.js v10 `@videojs/mux-video` adapter requests the public HLS stream directly from Mux.

To verify the production bundle locally, run `npm run build` followed by `npm run preview`, then open `http://127.0.0.1:4173/showcase.html`. Vite preview serves the static build; the Vercel-only `/` rewrite is configured in `vercel.json` and is applied by Vercel at deployment time.