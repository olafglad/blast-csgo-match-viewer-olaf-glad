# CS:GO Match Viewer

A web application for visualizing CS:GO match statistics from game logs. Built as a coding challenge for BLAST.

**[Live Demo](https://olafglad.github.io/blast-csgo-match-viewer-olaf-glad/)** | **Author:** Olaf Glad

## Features

- **Match Overview** - Teams, map, final score, and match duration
- **Round Timeline** - Visual round-by-round progression showing which team won each round
- **Interactive Round Details** - Click any round to see kill feed, weapons used, and events
- **Player Scoreboard** - Full stats for all players including K/D/A, ADR, and headshot percentage

## Tech Stack

**Backend:**
- Node.js with Express
- TypeScript
- Custom log parser for CS:GO match logs

**Frontend:**
- React 19
- TypeScript
- Tailwind CSS v4
- Vite

## Quick Start

```bash
# Run both servers with one command
./start.sh
```

This starts:
- Frontend: http://localhost:5173
- API: http://localhost:3001/api/match

## Manual Setup

### Backend

```bash
cd server
npm install
npm run dev
```

### Frontend

```bash
cd client
npm install
npm run dev
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/match` | Full match data (teams, players, rounds) |
| `GET /api/match/rounds` | All rounds with events |
| `GET /api/match/players` | Player statistics |
| `GET /api/match/teams` | Team information and scores |
| `GET /api/health` | Server health check |

## Project Structure

```
blast-csgo-match-viewer-olaf-glad/
├── client/                 # React frontend
│   └── src/
│       ├── components/     # UI components
│       └── hooks/          # Custom React hooks
├── server/                 # Express backend
│   └── src/
│       ├── index.ts        # Server entry + routes
│       └── parser.ts       # Log file parser
├── shared/                 # Shared TypeScript code (@shared alias)
│   ├── types/              # Type definitions
│   ├── constants/          # Shared constants (colors, logos)
│   └── utils/              # Utility functions
├── logs/                   # Match log files
└── start.sh                # Launch script
```

## Sample Match

The included log file contains a professional match:
- **Map:** de_nuke
- **Teams:** Team Vitality vs NAVI
- **Final Score:** 16-6
