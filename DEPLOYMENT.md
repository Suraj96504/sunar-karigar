# Render deployment

The repository contains `render.yaml`, which deploys the React frontend and Express API together. No production credentials are committed.

1. Connect GitHub and Render accounts, create a GitHub repository, and upload this source tree (or extract `artifacts/sunar-karighar-deploy.zip` and upload its contents). Preserve directory structure and include the dotfile `.gitignore`. Do not upload `server/.env`, dependencies, or local artifacts.
2. In Render create a Blueprint from that repository. The blueprint selects a free web service; review the displayed plan before creation.
3. Supply `MONGODB_URI`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` using your current private configuration. Existing admin passwords are preserved; a new database creates the initial admin. Render generates `JWT_SECRET` automatically. Secrets belong in the Render dashboard, not GitHub or chat.
4. In Render, service > Connect > Outbound, copy the service IP ranges. Add those ranges to the Atlas IP access list. Retry deployment if the initial database connection failed before allowlisting.
5. The app uses `RENDER_EXTERNAL_URL` for its browser origin automatically. Do not copy your local `CLIENT_ORIGIN=http://127.0.0.1:5173` to Render. With a custom domain, set `CLIENT_ORIGIN` to that domain's exact HTTPS origin, without a trailing slash, and redeploy.
6. Verify the public `/api/health` returns HTTP 200 and `database: connected`. Check `/login`, one booking, one enquiry, admin visibility, status persistence, route refresh, and mobile layout. Public verification can only be completed after account connection and deployment.

Build: `npm ci --include=dev && npm run build`.
Start: `npm run start:deploy` (seeds missing initial data, then starts the server).
Health: `/api/health` (HTTP 503 when MongoDB is disconnected).
The production server binds to `0.0.0.0` and the platform's `PORT`. Local development keeps loopback binding. Render reverse-proxy support enables client-IP rate limiting.

Local verification: `npm test`, `npm run build`, `npm run test:browser`. Browser tests use an isolated database and temporary ports, without changing real bookings or stopping local servers.

Official references:
- https://render.com/docs/blueprint-spec
- https://render.com/docs/outbound-ip-addresses
- https://www.mongodb.com/docs/atlas/security/ip-access-list/
