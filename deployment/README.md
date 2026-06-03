# Deployment Helpers

This project is already structured as a combined React + Express application:

```
smart-griviance-system/
├── server.js
├── package.json
├── .env.example
├── render.yaml
├── Procfile
├── src/           # React frontend
├── server/        # Express backend routes, middleware, utils
└── uploads/       # Local file upload storage
```

## Environment

Copy `.env.example` to `.env` and update values for your environment. Do not commit `.env`.

## Hosting commands

Build the frontend and start the server:

```bash
npm install
npm run build
npm run start
```

## Cloud hosts

- Render / Railway / Heroku: use `npm run build` as build command and `npm run start` as start command.
- For a Render service deployed as a single web app, the frontend and backend run on the same origin.
- In that case, set `VITE_API_BASE` to an empty string or leave it unset so API calls use relative paths.
- Ensure environment variables are configured in the host dashboard:
  - `MONGODB_URI`
  - `DB_NAME`
  - `JWT_SECRET`
  - `JWT_EXPIRY`
  - `CLIENT_ORIGIN` (optional)

## Render-specific setup

1. Create a new Render Web Service and connect your repository.
2. Use these settings:
   - Build command: `npm ci && npm run build`
   - Start command: `npm run start`
3. Add environment variables in Render:
   - `MONGODB_URI` = your MongoDB connection string
   - `DB_NAME` = smart-hostel
   - `JWT_SECRET` = a secure secret string
   - `JWT_EXPIRY` = 7d
   - `CLIENT_ORIGIN` = the origin you want to allow for CORS (optional)
   - `VITE_API_BASE` = leave blank for same-origin deployment
4. Deploy the service.

## Notes

- `uploads/` is local storage. For production hosting, use a persisted disk or external file storage if uploads must survive redeploys.
- `server.js` serves the built frontend from `dist/`.
