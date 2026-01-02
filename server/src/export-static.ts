import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync, mkdirSync } from 'fs';
import { parseLogFile } from './parser.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const logPath = join(__dirname, '../../logs/vitality-vs-navi-nuke.log');
const outputPath = join(__dirname, '../../client/public/match.json');

console.log('Parsing match log...');
const matchData = parseLogFile(logPath);

console.log(`Parsed ${matchData.rounds.length} rounds`);
console.log(`Writing to ${outputPath}...`);

writeFileSync(outputPath, JSON.stringify(matchData));

console.log('Done! Static match data exported.');
