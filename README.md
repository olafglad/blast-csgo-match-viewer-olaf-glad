# CS:GO Match Viewer

A web application for visualizing CS:GO match statistics from game logs. Built as a coding challenge for BLAST.

**Author:** Olaf Glad

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
│       ├── hooks/          # Custom React hooks
│       └── types.ts        # TypeScript types
├── server/                 # Express backend
│   └── src/
│       ├── index.ts        # Server entry point
│       ├── parser.ts       # Log file parser
│       └── types.ts        # TypeScript types
├── logs/                   # Match log files
│   └── vitality-vs-navi-nuke.log
├── start.sh               # Launch script
└── README.md
```

## Sample Match

The included log file contains a professional match:
- **Map:** de_nuke
- **Teams:** Team Vitality vs NAVI
- **Final Score:** 16-6
