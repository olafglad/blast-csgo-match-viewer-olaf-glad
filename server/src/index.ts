import express from 'express';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseLogFile } from './parser.js';
import type { MatchData } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Parse log file on startup (in-memory cache)
console.log('Parsing CS:GO match log...');
const logPath = join(__dirname, '../../logs/vitality-vs-navi-nuke.log');
let matchData: MatchData;

try {
  matchData = parseLogFile(logPath);
  console.log(`Parsed ${matchData.rounds.length} rounds`);
  console.log(`Map: ${matchData.map}`);
  console.log(`Teams: ${matchData.teams[0].name} vs ${matchData.teams[1].name}`);
  console.log(`Final: ${matchData.teams[0].finalScore} - ${matchData.teams[1].finalScore}`);
} catch (error) {
  console.error('Failed to parse log file:', error);
  process.exit(1);
}

// API Routes
app.get('/api/match', (req, res) => {
  res.json(matchData);
});

app.get('/api/match/rounds', (req, res) => {
  res.json(matchData.rounds);
});

app.get('/api/match/players', (req, res) => {
  res.json(matchData.players);
});

app.get('/api/match/teams', (req, res) => {
  res.json(matchData.teams);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', rounds: matchData.rounds.length });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/api/match`);
});
