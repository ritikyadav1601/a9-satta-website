# SattaTodayResult.com deployment

The application is production-ready for a Node.js host such as Vercel.

## Required environment variables

Copy every value from `.env.example` into the hosting provider. The production-critical values are:

- `NEXT_PUBLIC_SITE_URL=https://sattatodayresult.com`
- `TOP_GAMES_MONGODB_URI`
- `TOP_GAMES_MONGODB_DATABASE=test`
- All Firebase client variables
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_CLIENT_EMAIL`

Set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` after adding the new domain to Google Search Console.

## Build settings

- Install command: `npm install`
- Build command: `npm run build`
- Start command: `npm start`
- Node.js: 20 or newer

## Domain setup

1. Add `sattatodayresult.com` as the production domain in the hosting dashboard.
2. Add `www.sattatodayresult.com` and redirect it permanently to the non-www domain.
3. Apply the DNS records supplied by the hosting provider.
4. Confirm HTTPS is active before submitting the sitemap.
5. Submit `https://sattatodayresult.com/sitemap.xml` in Google Search Console.

## Verification

Run before deployment:

```bash
npm run build
```

The build must finish without TypeScript or route-generation errors.
