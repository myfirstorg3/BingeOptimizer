# 🎬 Blastoise – The Binge Optimizer
> Optimize your free time. Watch smarter, not longer.

Blastoise is a smart content curation engine that helps you decide what to watch based on your available time and current mood. Featuring an AI-powered Binge Optimizer, it scores your entire media collection and builds the perfect viewing session, complete with Gemini AI-generated reviews.

🌐 **Live Demo:** [Frontend on Vercel](#) · [Backend on Render](#)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 7, GSAP, Anime.js |
| Backend | Node.js, Express.js |
| Database | PostgreSQL (production) · SQLite (local dev) |
| ORM | Prisma |
| AI | Google Gemini 2.0 Flash |
| External API | OMDB API |
| Deployment | Vercel (frontend) · Render (backend + DB) |

---

## 🚀 Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- `npm` (comes with Node)
- OMDB API key → [omdbapi.com/apikey.aspx](https://www.omdbapi.com/apikey.aspx) (free)
- Gemini API key → [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (free)

---

### 1. Clone the repo

```bash
git clone https://github.com/myfirstorg3/BingeOptimizer.git
cd BingeOptimizer
```

### 2. Setup the Backend

```bash
cd backend
npm install
```

Create your environment file:

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="your_random_secret"
OMDB_API_KEY="your_omdb_key"
GEMINI_API_KEY="your_gemini_key"
FRONTEND_URL="http://localhost:5173"
```

Initialize the database:

```bash
npx prisma generate
npx prisma db push
```

Start the backend:

```bash
npm run dev
```

Backend runs at `http://localhost:5000`
Health check: `http://localhost:5000/api/health`

---

### 3. Setup the Frontend

Open a **new terminal**:

```bash
cd frontend
npm install
```

Create your environment file:

```bash
cp .env.example .env
```

Open `frontend/.env` and set:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Frontend runs at `http://localhost:3000`

---

## 🗄️ Database Management

Blastoise uses **Prisma ORM** with SQLite locally and PostgreSQL in production.

### View data with Prisma Studio

```bash
# From the backend directory
npx prisma studio
```

Opens at `http://localhost:5556`

### Run raw SQL queries

```bash
# From the backend directory
sqlite3 prisma/dev.db
```

```sql
SELECT * FROM User;
SELECT title, type, releaseDate FROM Media;
.exit
```

---

## 🌐 Deployment

| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Vercel | [link](#) |
| Backend | Render | [link](#) |
| Database | Render PostgreSQL | managed |

### Environment variables needed on Render (backend):

```env
NODE_ENV=production
DATABASE_URL=<your_render_postgres_url>
JWT_SECRET=<your_secret>
OMDB_API_KEY=<your_key>
GEMINI_API_KEY=<your_key>
FRONTEND_URL=<your_vercel_url>
```

### Environment variables needed on Vercel (frontend):

```env
VITE_API_URL=<your_render_backend_url>
```

---

## 📁 Project Structure
---
BingeOptimizer/

├── backend/

│   ├── prisma/

│   │   └── schema.prisma

│   ├── src/

│   │   ├── controllers/

│   │   ├── middleware/

│   │   ├── routes/

│   │   └── services/

│   ├── .env.example

│   └── package.json

├── frontend/

│   ├── src/

│   │   ├── components/

│   │   ├── context/

│   │   ├── data/

│   │   ├── hooks/

│   │   ├── pages/

│   │   └── services/

│   └── package.json

└── README.md

## ✨ Features

- 🎯 **Binge Optimizer** — AI scores your collection based on mood, time, and genre
- 🤖 **Gemini AI Reviews** — auto-generated critic-style review summaries
- 📚 **Collections** — organize your watchlist into custom collections
- 🏆 **Tier Lists** — rank your media S through D
- 🔍 **Search** — fetch any movie or show via OMDB
- 👤 **Auth** — register, login, profile, avatar upload
- 👥 **Friends** — send/accept friend requests, view public profiles

---

## 🔑 API Keys Required

| Key | Where to get it | Free tier |
|-----|----------------|-----------|
| `OMDB_API_KEY` | [omdbapi.com](https://www.omdbapi.com/apikey.aspx) | 1,000 req/day |
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com/apikey) | Yes |
