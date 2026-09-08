# Mana Secret Room

Anonymous two-person Telugu lovers chat using Node.js, Socket.io, React, Vite, and PeerJS.

## Local development

```bash
npm install
npm install --prefix client
npm run dev
npm run dev --prefix client
```

Open `http://localhost:5173`. The backend defaults to `http://localhost:5000`.

## Render backend

Create a Render **Web Service** from this repository:

- Build command: `npm install`
- Start command: `npm start`
- Environment: `CLIENT_ORIGIN=https://YOUR-VERCEL-DOMAIN.vercel.app`
- Optional secret override: `SECRET_PASS=VivoX200`

## Vercel frontend

Import the repository into Vercel and set the project root to `client`.

- Build command: `npm run build`
- Output directory: `dist`
- Environment: `VITE_API_URL=https://YOUR-RENDER-SERVICE.onrender.com`

The free Render service sleeps when idle. The first connection after idle may take a few seconds.
