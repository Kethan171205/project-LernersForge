# ⚡ Learner's Forge

**A high-stakes software engineering job simulator that eradicates Tutorial Hell.**

Students receive mock-startup engineering tickets on a Kanban board, write code in a browser-based editor, run it through an automated CI/CD pipeline enforcing BIS IS 17041 security standards, and get AI-powered hints from a "Senior Tech Lead" when they fail.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile App | React Native + Expo (managed workflow) + Expo Router |
| Backend | Node.js + Express |
| Database | JSON file store (zero native dependencies) |
| AI Mentor | Google Gemini 1.5 Flash (free tier) |
| Deployment | Render (backend) + EAS + TestFlight (iOS) |

---

## Quick Start (Local)

### 1. Backend
```bash
cd backend
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY (optional — fallback works without it)
npm install
node src/index.js
# → 🚀 Learner's Forge backend running on port 3001
# → 5 tickets seeded automatically
```

### 2. App
```bash
cd app
npm install
# Edit config.js and set your machine's LAN IP (for Expo Go on phone)
npm start
# Press 'w' for web, or scan QR code with Expo Go
```

---

## Features

- **Kanban board** — 4 columns (To Do → In Progress → Review → Done), horizontally swipeable
- **5 engineering tickets** — real security vulnerabilities aligned to BIS IS 17041:
  - LF-001: Hash a plain-text password
  - LF-002: Fix SQL injection in a login query
  - LF-003: Optimise an O(n²) function to O(n)
  - LF-004: Validate and sanitise user input
  - LF-005: Remove a hard-coded API key
- **Automated CI/CD pipeline** — static security scan + hidden functional tests, results in < 15ms
- **AI Senior Dev Mentor** — Gemini-powered 2-sentence hints (no solutions)
- **Portfolio screen** — lists completed tickets with BIS standards met + native Share
- **Privacy Policy screen** — with Delete Account button (Apple App Store requirement)

---
## Testing

Learner's Forge includes **125 automated unit, integration, and smoke tests** with 100% pass rate.

```bash
# Run all automated tests (Unit + Integration + Pipeline + Client):
npm run test:all

# Run backend tests only (Jest):
npm run test:backend

# Run mobile API client tests:
npm run test:app
```

📖 **For complete step-by-step instructions and manual UI testing procedures, see [testingguide.md](file:///c:/Users/medas/OneDrive/Documents/Lernersforge/testingguide.md).**

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Server status |
| POST | `/users/login` | Login / create user |
| DELETE | `/users/:id` | Delete account |
| GET | `/tickets` | All Kanban tickets |
| GET | `/tickets/:id` | Single ticket |
| PATCH | `/tickets/:id/move` | Move ticket to column |
| POST | `/submit` | Run CI/CD pipeline |
| POST | `/mentor` | Get AI mentor hint |

---

## BIS IS 17041 Alignment

| Rule | Ticket | Test Type |
|------|--------|-----------|
| Credential Storage | LF-001 | Functional + Static |
| Input Sanitisation | LF-002 | Functional + Static |
| Algorithm Efficiency | LF-003 | Functional + Pattern |
| Data Validation | LF-004 | Functional |
| Secret Management | LF-005 | Functional + Static (regex) |

---

## Project Structure

```
Lernersforge/
├── backend/          # Node.js + Express API
│   ├── src/
│   │   ├── index.js
│   │   ├── db.js     # JSON file store
│   │   └── routes/   # users, tickets, submit, mentor
│   └── .env          # GEMINI_API_KEY goes here
├── app/              # Expo React Native app
│   ├── app/          # Expo Router file-based routes
│   ├── screens/      # LoginScreen, KanbanScreen, TicketScreen, etc.
│   ├── components/   # TicketCard
│   ├── api/          # API client (all fetch calls)
│   ├── context/      # UserContext (global auth state)
│   ├── constants/    # colours design tokens
│   └── assets/       # icon.png, splash-icon.png
└── render.yaml       # Render.com deploy config
```

---

*Built for Mission'26 Hackathon — Smart Education theme*
