# 🎬 Blastoise – The Binge Optimizer

> Optimize your free time. Watch smarter, not longer.

Blastoise is a smart content curation engine that helps you decide what to watch based on your available time and current mood. Featuring an AI-powered Binge Optimizer, it scores your entire media collection and builds the perfect viewing session, complete with Gemini AI-generated reviews.

---

## 🛠️ Tech Stack

- **Frontend:** React, Vite, GSAP, Anime.js (CSS styling with custom aesthetic)
- **Backend:** Node.js, Express.js
- **Database:** SQLite (managed via Prisma ORM)
- **AI Integrations:** Google Gemini 2.0 Flash
- **External APIs:** OMDB API (for media fetching)

---

## 🚀 Getting Started

Follow these steps to run the application locally on your machine.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- `npm` (comes with Node)

### 1. Setup the Backend

Open a terminal and navigate to the backend directory:
```bash
cd backend
```

Install dependencies:
```bash
npm install
```

Set up your environment variables:
1. Copy the example file: `cp .env.example .env`
2. Open `.env` and make sure the following essential keys are set:
   - `DATABASE_URL="file:./prisma/dev.db"` (default for SQLite)
   - `OMDB_API_KEY="your_omdb_key"` (Required for fetching movies)
   - `GEMINI_API_KEY="your_gemini_key"` (Required for AI reviews and binge optimizer)

Initialize the database:
```bash
npx prisma generate
npx prisma db push
```

Start the backend server:
```bash
npm run dev
```
*The backend will run on `http://localhost:5000`.*

### 2. Setup the Frontend

Open a **new** terminal and navigate to the frontend directory:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Start the frontend development server:
```bash
npm run dev
```
*The frontend will run on `http://localhost:5173` (or whatever port Vite assigns).*

---

## 🗄️ Database Management

Blastoise uses **Prisma** with a local SQLite database (`backend/prisma/dev.db`).

### Viewing & Editing Data (GUI)
The easiest way to view or edit the database is using Prisma Studio. In the `backend` folder, run:
```bash
npx prisma studio
```
This will open a beautiful web interface at `http://localhost:5556` where you can see all your tables and data.

### Running SQL Queries
If you want to run raw SQL queries against the database, you can use the SQLite command line tool:
```bash
# From the backend directory
sqlite3 prisma/dev.db
```
Then you can run queries like:
```sql
SELECT * FROM User;
SELECT title, type, releaseDate FROM Media;
.exit
```

---

## 👤 Authors

- **Aaryan Degama**
- **Manas Singh**
- **Jalendu Pandey**
- **Geethika**
- **Archee Jaiswal**
