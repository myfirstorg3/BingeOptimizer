# BLASTOISE — Cinematic Universe Platform

A sophisticated, production-grade media tracking and curation platform.
Built with React + Vite, GSAP, and anime.js.

---

## ✦ Tech Stack

| Layer       | Library                                |
|-------------|----------------------------------------|
| Framework   | React 18 + Vite 5                      |
| Routing     | React Router 6                         |
| Animation   | **GSAP** (ScrollTrigger) + **anime.js** |
| Drag & Drop | Native HTML5 Drag API                  |
| Fonts       | Bebas Neue · Syne · JetBrains Mono     |

---

## ✦ Features

### Dashboard — Binge Optimizer
- Animated particle canvas background
- Letter-by-letter hero title entrance (anime.js stagger)
- Mood/time/genre filters that algorithmically surface content
- GSAP ScrollTrigger stat cards with anime.js number counters
- 3D perspective media card grid

### Tier List
- Drag-and-drop S/A/B/C/D ranking with HTML5 drag API
- Anime.js hover scale micro-interactions
- Animated tier row glow on drop
- Unranked pool with drag-back support

### Collection
- Grid / List layout toggle with animated transitions
- 3D tilt card effect on mouse movement (anime.js)
- Real-time genre + type filtering with stagger re-enter
- Full card detail overlay on hover

### Search — "Query the Void"
- Fullscreen floating background typographic treatment
- Debounced live search across title, genre, synopsis
- Staggered result entry animations
- Quick-suggestion chips

### Settings & Profile
- Sticky sidebar navigation
- Avatar section, form controls, custom toggle switches
- GSAP entrance animations
- Danger zone / wallet connection panels

---

## ✦ Design System

```
Void:        #020204
Surface:     #0a0a0f → #1a1a28
Cyan accent: #00e5ff
Pink accent: #ff2d6b
Gold:        #ffb800
Green:       #00ff88
Fonts:       Bebas Neue (display) · Syne (UI) · JetBrains Mono (data)
```

---

## ✦ Setup

```bash
# Install dependencies
npm install vite@7.3.2
npm i

# Start development server
npm run dev
# → http://localhost:3000

# Build for production
npm run build
```

---

## ✦ Project Structure

```
src/
  components/
    Cursor.jsx        ← Custom animated cursor with click burst
    Navbar.jsx        ← Floating nav with GSAP entrance + shimmer
  pages/
    Dashboard.jsx     ← Binge Optimizer + stats + recs
    TierList.jsx      ← Drag-and-drop tier ranking
    Collection.jsx    ← Masonry grid + 3D tilt cards
    Search.jsx        ← Live search + animated results
    Settings.jsx      ← Profile, security, notifications
  data/
    mockData.js       ← All media entries + tier/mood data
  styles/
    globals.css       ← Full design system (vars, utils, components)
```
