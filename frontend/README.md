# CareVision AI — Frontend

Next.js web application for chest X-ray upload, analysis results, scan history, and reports.

## Stack

- **Next.js** (App Router)
- **React**
- **Tailwind CSS**
- **TypeScript**

## Setup

```powershell
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home — overview and recent scans (dummy data) |
| `/analyze` | Upload X-ray and simulated AI results |
| `/history` | Scan history table |
| `/reports` | Report list and detail (`?id=scan-001`) |

## Dummy data

Sample scans and reports live in `lib/dummy-data.ts`. Backend integration will replace these with API calls later.

## Environment (future)

When connecting the API, add to the project root `.env`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```
