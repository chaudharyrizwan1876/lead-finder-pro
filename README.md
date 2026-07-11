<div align="center">

<img src="./frontend/public/logo.png" alt="LeadFinderPro" width="320" />

<br />

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-1.61-45ba4b?style=flat-square&logo=playwright&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

**A full-stack lead generation tool that finds local businesses worldwide and automatically extracts their contact details — phone, email, website, and ratings.**

[Features](#features) · [Tech Stack](#tech-stack) · [Getting Started](#getting-started) · [API Reference](#api-reference) · [Project Structure](#project-structure)

</div>

---

## Overview

LeadFinderPro combines data from **OpenStreetMap** and **Google Maps** to build enriched business lead lists for any city in the world. It goes beyond basic scraping by running a multi-strategy email extraction pipeline against each business website, flagging businesses without an online presence, and generating direct WhatsApp links from phone numbers — all exportable to CSV in one click.

---

## Features

- **Dual-source data** — Pulls from OpenStreetMap (Overpass API) and Google Maps (Playwright headless browser) and merges results, deduplicating by name
- **Multi-strategy email extraction** — Scans homepage, contact page, privacy/terms pages, Schema.org JSON-LD structured data, and falls back to MX-verified domain pattern guessing
- **No-website detection** — Instantly flags businesses with no web presence (the highest-value cold outreach targets)
- **WhatsApp-ready phone numbers** — Converts scraped phone numbers into direct `wa.me` links
- **Configurable radius** — Search from 5 km up to 500 km with auto-scaled result limits and query timeouts to prevent API overload
- **30+ business categories** — Dentists, restaurants, gyms, law firms, real estate, hotels, salons, pharmacies, schools, and more
- **One-click CSV export** — Download filtered leads as a structured CSV, ready for any outreach tool
- **Live result filters** — Filter by email available, phone available, no website, 4.5+ rating

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS v4, TypeScript |
| Backend | Node.js, Express 5, TypeScript, ts-node, nodemon |
| Scraping | Playwright (Chromium headless) |
| Geocoding | Nominatim (OpenStreetMap) |
| Map Data | Overpass API (OpenStreetMap) |
| Business Listings | Google Maps (Playwright scraper) |
| Email Extraction | Cheerio, Axios, Node.js DNS (MX lookup) |
| Export | Server-side CSV generation |

---

## Project Structure

```
lead-finder-pro/
├── backend/
│   ├── src/
│   │   ├── index.ts                  # Express app entry point
│   │   ├── routes/
│   │   │   └── searchRoutes.ts       # POST /leads  POST /export
│   │   ├── services/
│   │   │   ├── osmService.ts         # Nominatim geocoding + Overpass query
│   │   │   ├── scrapeService.ts      # Playwright Google Maps scraper
│   │   │   ├── emailService.ts       # Multi-strategy email extractor
│   │   │   └── csvService.ts         # CSV builder
│   │   └── types/
│   │       └── index.ts              # Shared TypeScript interfaces
│   ├── .env                          # PORT (not committed)
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx            # Root layout + Tabler Icons CDN
    │   │   ├── page.tsx              # Main page (search + results)
    │   │   └── globals.css           # Tailwind v4 + base styles
    │   ├── components/
    │   │   ├── SearchForm.tsx        # Business type, city, radius inputs
    │   │   ├── StatsCards.tsx        # Total, email, phone, no-website counts
    │   │   ├── LeadsList.tsx         # List container with filter state
    │   │   ├── LeadRow.tsx           # Individual lead row (avatar, contact, website, WhatsApp)
    │   │   └── FilterToolbar.tsx     # Filter chips + Export CSV button
    │   ├── lib/
    │   │   └── api.ts                # Typed fetch wrappers for backend
    │   └── types/
    │       └── index.ts              # Business, SearchParams, SearchResponse types
    ├── public/
    │   └── logo.png
    ├── .env.local                    # NEXT_PUBLIC_API_URL (not committed)
    └── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- **Git**

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/lead-finder-pro.git
cd lead-finder-pro
```

### 2. Backend setup

```bash
cd backend
npm install
npx playwright install chromium
```

Create a `.env` file in the `backend` directory:

```env
PORT=5000
```

Start the development server:

```bash
npm run dev
```

Backend runs at `http://localhost:5000`

### 3. Frontend setup

Open a new terminal window:

```bash
cd frontend
npm install
```

Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Start the development server:

```bash
npm run dev
```

Frontend runs at `http://localhost:3000`

---

## API Reference

### `POST /api/search/leads`

Search for businesses by type and location.

**Request body**

```json
{
  "businessType": "dentist",
  "city": "London",
  "radius": 10,
  "useGoogleMaps": true
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `businessType` | string | Yes | Business category key (see supported types below) |
| `city` | string | Yes | City name in any language supported by Nominatim |
| `radius` | number | No | Search radius in km. Default: `10`. Range: `5` to `500` |
| `useGoogleMaps` | boolean | No | Whether to also scrape Google Maps. Default: `false` |

**Response**

```json
{
  "success": true,
  "total": 22,
  "withEmail": 10,
  "withPhone": 17,
  "withoutWebsite": 3,
  "data": [
    {
      "name": "City Dental Clinic",
      "type": "dentist",
      "address": "12 Baker Street, London, UK",
      "phone": "+441234567890",
      "whatsapp": "441234567890",
      "email": "info@citydentalclinic.co.uk",
      "emailSource": "website",
      "website": "https://citydentalclinic.co.uk",
      "facebookUrl": null,
      "rating": 4.8,
      "reviews": 312,
      "lat": 51.5203,
      "lon": -0.1567,
      "source": "googlemaps"
    }
  ]
}
```

---

### `POST /api/search/export`

Export a leads array to a downloadable CSV file.

**Request body**

```json
{
  "businesses": [...]
}
```

**Response**

`Content-Type: text/csv` file download with headers: Name, Type, Address, Phone, WhatsApp Link, Email, Email Source, Website, Facebook, Rating, Reviews, Source.

---

## Email Extraction Pipeline

When a business website is available, the following strategies run in sequence until an email is found:

```
1. Homepage raw HTML scan          (regex match)
2. Homepage mailto: link detection (cheerio)
3. /contact /contact-us /about     (axios + regex)
4. /privacy-policy /terms /legal   (GDPR contact emails)
5. Schema.org JSON-LD parsing      (structured SEO data)
6. MX record lookup + pattern guess (info@domain.com)
```

If no website is available, the tool checks for a Facebook page URL and attempts extraction from the public About section.

---

## Supported Business Types

```
dentist         clinic          hospital        pharmacy
veterinary      restaurant      cafe            bakery
fast_food       hotel           gym             salon
school          university      lawyer          real_estate
bank            insurance       car_dealer      car_repair
travel_agency   wedding_hall    photographer    furniture
electronics     clothing        supermarket     jewelry
gym_supplement  fitness_center  event_planner   logistics
construction    architect       accounting      marketing_agency
driving_school  daycare
```

---

## Environment Variables

### Backend — `backend/.env`

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Port for the Express server |

### Frontend — `frontend/.env.local`

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000` | Base URL of the backend API |

---

## Known Limitations

- **Google Maps scraping** can take 30 to 90 seconds depending on result count and network speed, as it visits each business listing individually using a real Chromium browser.
- **Overpass API** queries with a radius above 200 km may occasionally time out on high-traffic business types. Reduce radius or use a more specific business type if this happens.
- **Facebook email extraction** is unreliable on most pages due to login walls. It works only on fully public business pages.
- **Email pattern guessing** (`info@domain.com`) is not verified — it only confirms the domain has a valid mail server via MX record lookup.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
  Built by <a href="https://github.com/YOUR_USERNAME">Rizwan Chaudhary</a>
</div>
