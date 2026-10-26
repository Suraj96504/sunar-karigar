# Sunar Karighar

A jewellery repair and home-service website built with **Vite + React, plain JavaScript, React Router, Tailwind CSS, Lucide React, and Recharts**. The API uses **Node.js, Express, MongoDB, and Mongoose**. No TypeScript or Next.js is used.

## Local setup

Requirements: Node.js 22+ and MongoDB 7+ (local or Atlas).

1. Run `npm install` from the project root.
2. Copy `server/.env.example` to `server/.env`. Set `JWT_SECRET` to a random value of at least 32 characters. Generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
3. Set `MONGODB_URI`. For a local database, install MongoDB Community Server, start its Windows service, and use `mongodb://127.0.0.1:27017/sunar_karighar`. Alternatively, run `docker run --name sunar-mongo -p 127.0.0.1:27017:27017 -v sunar-mongo-data:/data/db -d mongo:8`. For Atlas, create a database user, allow your server's IP, and put the connection URI in `server/.env`.
4. Set `ADMIN_EMAIL`, `ADMIN_NAME`, and a unique `ADMIN_PASSWORD` of at least 12 characters in `server/.env`.
5. Run `npm run seed`. This creates the initial admin, six services, eight repair prices, and contact settings. It preserves existing records and does not reset passwords on repeated runs. It creates no fake bookings or enquiries.
6. Run `npm run dev`. Open **http://127.0.0.1:5173**. The API runs on port 5000. Use the seeded credentials at `/login`.

The server workspace loads `server/.env` automatically. The client uses Vite's `/api` proxy in development; `client/.env.example` documents an optional API base URL. Use `127.0.0.1` consistently with the default `CLIENT_ORIGIN`.

**MongoDB credentials are not included.** Configure a real MongoDB instance before using persistent bookings, enquiries, authentication, and admin management. When disconnected, the site shows the standard catalogue and pricing for browsing, but never reports unsuccessful submissions as saved. No localStorage database or production in-memory storage is used.

## Build and hosting

Run `npm run build`, then `npm start`. Express serves `client/dist` and sends `index.html` for all non-API GET paths, so React Router routes support direct visits and refresh. Deploy the Node server and built client together behind an HTTPS reverse proxy. Set `NODE_ENV=production`, `CLIENT_ORIGIN` to the exact public origin, and a production MongoDB URI and JWT secret. Cookies are HTTP-only, SameSite Strict, and Secure in production. Proxy to `127.0.0.1:5000`; change the listen host if your platform requires it. Keep server environment variables out of frontend builds and source control.

Do not expose the development server publicly. If using separate static hosting, configure its SPA rewrite to `/index.html` and proxy `/api` to the Express backend on the same public origin. The bundled deployment requires no separate SPA hosting configuration.

## Routes and features

Public: `/`, `/services`, `/repair-charges`, `/book-service`, `/about`, `/contact`, `/login`.

Admin: `/admin`, `/admin/bookings`, `/admin/services`, `/admin/repair-charges`, `/admin/customers`, `/admin/messages`, `/admin/settings`.

- Booking and contact forms validate on both client and server and store records in MongoDB.
- Admin authentication uses bcrypt password hashes and signed 8-hour session cookies. All admin API routes check the session and database role.
- Login and submission rate limits, Helmet headers, bounded request bodies, schema validation, and origin checks protect API writes.
- Service and price CRUD, visibility toggles, booking status changes, enquiry status management, customer grouping, business settings, and dashboard statistics work through REST endpoints.
- Dashboard figures and Recharts data use real bookings; a fresh database shows zero values.
- Booking dates use India time; mobile numbers accept 10-digit Indian numbers with optional +91 prefix.

All website photography uses ten original AI-generated images created with the built-in image generation tool. Optimized full-size and 640px WebP assets live in `client/public/images/`; product photographs are 1024px square, while hero and banner images are up to 1536px wide. The shared `Photo` component provides responsive image selection, lazy loading below the fold, and descriptive alternative text. The original design screenshot remains unchanged at `client/public/showcase.png` and is no longer used for photographs. Prompts, paths, and output dimensions are recorded in `image-assets.json`. The contact map is a styled location link that opens Google Maps. The reference's illustrative phone, address, and business claims should be verified and updated before launch. Social links currently lead to the platform homepages; replace with the business profiles.

## Verification

`npm test` runs functional API checks using an isolated, ephemeral MongoDB instance (`mongodb-memory-server`) and Supertest. The first run downloads a MongoDB binary; production always uses the configured MongoDB instance. Tests cover authentication and cookies, authorization, validation, booking/message persistence, admin CRUD and statuses, dashboard totals, and settings.

`node tests/browser-check.js` runs desktop/mobile browser checks and screenshots with an installed Chrome using Playwright. It starts isolated test servers and an ephemeral database, then stops them. Screenshots are written to `artifacts/`. Build the frontend before running it. Browser checks do not change the production database.

See `artifacts/verification.md` for the checks actually performed in this environment.

## Render deployment configuration

See [DEPLOYMENT.md](DEPLOYMENT.md) and `render.yaml` for the configured single-service deployment. Production uses `0.0.0.0` by default; local development uses `127.0.0.1`. `CLIENT_ORIGIN` overrides the automatic `RENDER_EXTERNAL_URL` fallback. Use `npm run start:deploy` to seed missing initial data and start. The health endpoint returns HTTP 503 when the database is disconnected. Live deployment still requires connected GitHub/Render accounts.
