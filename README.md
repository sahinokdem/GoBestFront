# 🎨 GoBest — Frontend

> 🇹🇷 Türkçe için: [README.tr.md](README.tr.md)

The web frontend for **GoBest**, a multi-modal travel reservation platform that searches and books trips across flights, buses, and trains. This app is the user-facing layer; it talks to the [GoBest backend](https://github.com/sahinokdem/GoBestBackend) over a REST API.

> In short: a role-based travel booking UI — customers search and book multi-leg routes, company maintainers manage their services, and admins manage the platform's reference data.

---

## 🚀 Tech Stack

- **Framework:** Next.js 15 (App Router) + React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Components:** shadcn/ui (Radix UI primitives)
- **Forms & Validation:** React Hook Form + Zod
- **Auth:** JWT-based, role-aware (Customer / Company Maintainer / Admin)

---

## 👥 Role-Based Experience

GoBest serves three roles, each with its own interface.

### Customer — Search & Book

Customers search across all transport modes from a single form (origin, destination, date, passengers, mode) and get a list of routes, including **multi-leg transfer options** with per-leg details and seat-type pricing.

![Search form](docs/search-form.png)

![Search results — 2-leg route](docs/search-results-2leg.png)

![Search results — 3-leg route with seat types](docs/search-results-3leg.png)

Authentication happens through a sign-in / register modal before booking.

![Sign in / Register](docs/auth-modal.png)

### Company Maintainer — Manage Services

Company maintainers manage their own company's information and service schedules, including a service time editor for adjusting departure/arrival times.

![Company Maintainer dashboard](docs/maintainer-dashboard.png)

![Service time editor](docs/maintainer-service-editor.png)

### Admin — Manage Platform Data

Admins manage the platform's reference data — creating company maintainers and maintaining companies, cities, and stations (often completing data that comes in from the external service API).

![Admin — create maintainer](docs/admin-create-maintainer.png)

![Admin — update company](docs/admin-update-company.png)

![Admin — update city](docs/admin-update-city.png)

---

## 🎯 Landing

The landing page introduces the product and its core value: comparing flights, trains, and buses in one place with flexible date search.

![Landing — Why Choose GoBest](docs/landing-why.png)

![Landing — features](docs/landing-features.png)

---

## 🛠️ Local Setup

```bash
npm install
npm run dev
```

The app expects the [GoBest backend](https://github.com/sahinokdem/GoBestBackend) to be running and reachable; configure the API base URL via the appropriate environment variable before starting.

Build for production:

```bash
npm run build
npm run start
```
