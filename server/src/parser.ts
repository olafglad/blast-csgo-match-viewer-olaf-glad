import { readFileSync } from 'fs';
import type {
  MatchData, TeamStats, RoundData, PlayerStats, RoundPlayerStats, KillEvent,
  Side, WinReason, ParsedKill, ParsedDamage, ParsedAssist, ParsedRound
} from './types.js';

// Regex patterns for log parsing
const PATTERNS = {
  timestamp: /^(\d{2}\/\d{2}\/\d{4}) - (\d{2}:\d{2}:\d{2}):/,
  matchStart: /World triggered "Match_Start" on "(.+?)"/,
  roundStart: /World triggered "Round_Start"/,
  roundEnd: /World triggered "Round_End"/,
  gameOver: /Game Over: competitive \d+ (\w+) score (\d+):(\d+) after (\d+) min/,
  teamPlaying: /Team playing "(CT|TERRORIST)": (.+)/,
  roundWin: /Team "(CT|TERRORIST)" triggered "(SFUI_Notice_\w+)"/,
  kill: /"(.+?)<\d+><[^>]+><(CT|TERRORIST)>".*\[\-?\d+ \-?\d+ \-?\d+\] killed "(.+?)<\d+><[^>]+><(CT|TERRORIST)>".*with "(\w+)"( \(headshot\))?/,
  damage: /"(.+?)<\d+><[^>]+><(CT|TERRORIST)>".*attacked "(.+?)<\d+><[^>]+><(CT|TERRORIST)>".*\(damage "(\d+)"\)/,
  assist: /"(.+?)<\d+><[^>]+><(?:CT|TERRORIST)>" assisted killing "(.+?)<\d+>/,
};

// Map SFUI notices to win reasons
function parseWinReason(sfuiNotice: string): WinReason {
  if (sfuiNotice.includes('Bomb_Defused')) return 'bomb_defused';
  if (sfuiNotice.includes('Target_Bombed')) return 'bomb_exploded';
  if (sfuiNotice.includes('CTs_Win') || sfuiNotice.includes('Terrorists_Win')) return 'elimination';
  return 'timeout';
}

function parseTimestamp(dateStr: string, timeStr: string): Date {
  const [month, day, year] = dateStr.split('/').map(Number);
  const [hour, min, sec] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hour, min, sec);
}

function parseSide(side: string): Side {
  return side === 'CT' ? 'CT' : 'T';
}

export function parseLogFile(filePath: string): MatchData {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // State tracking
  let map = '';
  let matchDate = '';
  let ctTeam = '';
  let tTeam = '';
  let matchStarted = false;
  let lastMatchStartLine = 0;

  // Find the last Match_Start (as per challenge hint)
  for (let i = 0; i < lines.length; i++) {
    if (PATTERNS.matchStart.test(lines[i])) {
      lastMatchStartLine = i;
    }
  }

  // Parse from last Match_Start
  const rounds: ParsedRound[] = [];
  let currentRound: ParsedRound | null = null;
  let roundNumber = 0;
  let ctScore = 0;
  let tScore = 0;

  for (let i = lastMatchStartLine; i < lines.length; i++) {
    const line = lines[i];
    const tsMatch = line.match(PATTERNS.timestamp);
    if (!tsMatch) continue;

    const timestamp = parseTimestamp(tsMatch[1], tsMatch[2]);
    if (!matchDate) matchDate = tsMatch[1];

    // Match start
    const matchStartMatch = line.match(PATTERNS.matchStart);
    if (matchStartMatch) {
      map = matchStartMatch[1];
      matchStarted = true;
      continue;
    }

    // Team names - only capture once right after Match_Start
    // Avoid MatchStatus lines which appear throughout and reflect side swaps
    const teamMatch = line.match(PATTERNS.teamPlaying);
    if (teamMatch && matchStarted && !line.includes('MatchStatus')) {
      if (teamMatch[1] === 'CT' && !ctTeam) ctTeam = teamMatch[2];
      else if (teamMatch[1] !== 'CT' && !tTeam) tTeam = teamMatch[2];
      continue;
    }

    // Round start
    if (PATTERNS.roundStart.test(line) && matchStarted && ctTeam && tTeam) {
      roundNumber++;
      currentRound = {
        number: roundNumber,
        startTime: timestamp,
        endTime: timestamp,
        winner: 'CT',
        winReason: 'elimination',
        kills: [],
        damage: [],
        assists: [],
        ctTeam,
        tTeam,
      };
      continue;
    }

    // Skip if no active round
    if (!currentRound) continue;

    // Kill event
    const killMatch = line.match(PATTERNS.kill);
    if (killMatch) {
      // Filter out non-player kills (func_breakable, prop_dynamic, etc.)
      if (killMatch[3].includes('func_') || killMatch[3].includes('prop_')) continue;

      currentRound.kills.push({
        timestamp,
        killer: killMatch[1],
        killerSide: parseSide(killMatch[2]),
        victim: killMatch[3],
        victimSide: parseSide(killMatch[4]),
        weapon: killMatch[5],
        headshot: !!killMatch[6],
      });
      continue;
    }

    // Damage event
    const damageMatch = line.match(PATTERNS.damage);
    if (damageMatch) {
      currentRound.damage.push({
        timestamp,
        attacker: damageMatch[1],
        attackerSide: parseSide(damageMatch[2]),
        victim: damageMatch[3],
        victimSide: parseSide(damageMatch[4]),
        damage: parseInt(damageMatch[5], 10),
        hitgroup: '',
      });
      continue;
    }

    // Assist event
    const assistMatch = line.match(PATTERNS.assist);
    if (assistMatch) {
      currentRound.assists.push({
        timestamp,
        assister: assistMatch[1],
        victim: assistMatch[2],
      });
      continue;
    }

    // Round win
    const winMatch = line.match(PATTERNS.roundWin);
    if (winMatch && currentRound) {
      currentRound.winner = parseSide(winMatch[1]);
      currentRound.winReason = parseWinReason(winMatch[2]);
      if (currentRound.winner === 'CT') ctScore++;
      else tScore++;
      continue;
    }

    // Round end
    if (PATTERNS.roundEnd.test(line) && currentRound) {
      currentRound.endTime = timestamp;
      rounds.push(currentRound);
      currentRound = null;
      continue;
    }

    // Game over
    const gameOverMatch = line.match(PATTERNS.gameOver);
    if (gameOverMatch) {
      break;
    }
  }

  // Transform parsed data into API response format
  return transformToMatchData(rounds, map, matchDate, ctTeam, tTeam);
}

function transformToMatchData(
  rounds: ParsedRound[],
  map: string,
  date: string,
  startingCT: string,
  startingT: string
): MatchData {
  // Calculate match duration
  const firstRound = rounds[0];
  const lastRound = rounds[rounds.length - 1];
  const durationMs = lastRound?.endTime.getTime() - firstRound?.startTime.getTime() || 0;
  const durationMins = Math.floor(durationMs / 60000);
  const durationSecs = Math.floor((durationMs % 60000) / 1000);

  // Build player stats map
  const playerStatsMap = new Map<string, {
    team: string;
    kills: number;
    deaths: number;
    assists: number;
    damage: number;
    headshots: number;
    firstHalfKills: number;
    firstHalfDeaths: number;
    firstHalfDamage: number;
    firstHalfHeadshots: number;
    secondHalfKills: number;
    secondHalfDeaths: number;
    secondHalfDamage: number;
    secondHalfHeadshots: number;
    ctKills: number;
    ctDeaths: number;
    ctDamage: number;
    ctHeadshots: number;
    tKills: number;
    tDeaths: number;
    tDamage: number;
    tHeadshots: number;
  }>();

  const initPlayerStats = (name: string, team: string) => ({
    team,
    kills: 0,
    deaths: 0,
    assists: 0,
    damage: 0,
    headshots: 0,
    firstHalfKills: 0,
    firstHalfDeaths: 0,
    firstHalfDamage: 0,
    firstHalfHeadshots: 0,
    secondHalfKills: 0,
    secondHalfDeaths: 0,
    secondHalfDamage: 0,
    secondHalfHeadshots: 0,
    ctKills: 0,
    ctDeaths: 0,
    ctDamage: 0,
    ctHeadshots: 0,
    tKills: 0,
    tDeaths: 0,
    tDamage: 0,
    tHeadshots: 0,
  });

  // Team stats
  const teamStats: Record<string, TeamStats> = {
    [startingCT]: {
      name: startingCT,
      finalScore: 0,
      firstHalfScore: 0,
      secondHalfScore: 0,
      roundWinTypes: { elimination: 0, bombDefused: 0, bombExploded: 0, timeout: 0 },
      ctRoundsWon: 0,
      tRoundsWon: 0,
    },
    [startingT]: {
      name: startingT,
      finalScore: 0,
      firstHalfScore: 0,
      secondHalfScore: 0,
      roundWinTypes: { elimination: 0, bombDefused: 0, bombExploded: 0, timeout: 0 },
      ctRoundsWon: 0,
      tRoundsWon: 0,
    },
  };

  // Process each round
  const roundData: RoundData[] = rounds.map((round, idx) => {
    const isFirstHalf = round.number <= 15;
    const roundNum = round.number;

    // After round 15, sides swap
    const currentCT = roundNum <= 15 ? startingCT : startingT;
    const currentT = roundNum <= 15 ? startingT : startingCT;

    const winnerTeam = round.winner === 'CT' ? currentCT : currentT;

    // Update team stats
    teamStats[winnerTeam].finalScore++;
    if (isFirstHalf) teamStats[winnerTeam].firstHalfScore++;
    else teamStats[winnerTeam].secondHalfScore++;

    if (round.winner === 'CT') teamStats[winnerTeam].ctRoundsWon++;
    else teamStats[winnerTeam].tRoundsWon++;

    // Win type
    const winType = round.winReason;
    if (winType === 'elimination') teamStats[winnerTeam].roundWinTypes.elimination++;
    else if (winType === 'bomb_defused') teamStats[winnerTeam].roundWinTypes.bombDefused++;
    else if (winType === 'bomb_exploded') teamStats[winnerTeam].roundWinTypes.bombExploded++;
    else teamStats[winnerTeam].roundWinTypes.timeout++;

    // Track damage per player per round
    const roundDamage = new Map<string, number>();
    for (const dmg of round.damage) {
      // Only count damage to enemies
      if (dmg.attackerSide !== dmg.victimSide) {
        roundDamage.set(dmg.attacker, (roundDamage.get(dmg.attacker) || 0) + dmg.damage);
      }
    }

    // Track kills/deaths per player this round
    const roundKills = new Map<string, number>();
    const roundDeaths = new Set<string>();
    const roundHeadshots = new Map<string, number>();

    const killEvents: KillEvent[] = [];
    for (const kill of round.kills) {
      const killerTeam = kill.killerSide === 'CT' ? currentCT : currentT;
      const victimTeam = kill.victimSide === 'CT' ? currentCT : currentT;

      // Only count enemy kills
      if (kill.killerSide !== kill.victimSide) {
        roundKills.set(kill.killer, (roundKills.get(kill.killer) || 0) + 1);
        if (kill.headshot) {
          roundHeadshots.set(kill.killer, (roundHeadshots.get(kill.killer) || 0) + 1);
        }
      }
      roundDeaths.add(kill.victim);

      // Initialize player stats
      if (!playerStatsMap.has(kill.killer)) {
        playerStatsMap.set(kill.killer, initPlayerStats(kill.killer, killerTeam));
      }
      if (!playerStatsMap.has(kill.victim)) {
        playerStatsMap.set(kill.victim, initPlayerStats(kill.victim, victimTeam));
      }

      // Update overall stats
      const killerStats = playerStatsMap.get(kill.killer)!;
      const victimStats = playerStatsMap.get(kill.victim)!;

      if (kill.killerSide !== kill.victimSide) {
        killerStats.kills++;
        if (kill.headshot) {
          killerStats.headshots++;
          if (isFirstHalf) killerStats.firstHalfHeadshots++;
          else killerStats.secondHalfHeadshots++;
          if (kill.killerSide === 'CT') killerStats.ctHeadshots++;
          else killerStats.tHeadshots++;
        }

        if (isFirstHalf) killerStats.firstHalfKills++;
        else killerStats.secondHalfKills++;

        if (kill.killerSide === 'CT') killerStats.ctKills++;
        else killerStats.tKills++;
      }

      victimStats.deaths++;
      if (isFirstHalf) victimStats.firstHalfDeaths++;
      else victimStats.secondHalfDeaths++;
      if (kill.victimSide === 'CT') victimStats.ctDeaths++;
      else victimStats.tDeaths++;

      killEvents.push({
        timestamp: kill.timestamp.toISOString(),
        killer: kill.killer,
        killerTeam,
        victim: kill.victim,
        victimTeam,
        weapon: kill.weapon,
        headshot: kill.headshot,
      });
    }

    // Process assists
    for (const assist of round.assists) {
      if (!playerStatsMap.has(assist.assister)) continue;
      playerStatsMap.get(assist.assister)!.assists++;
    }

    // Update damage stats
    for (const [player, damage] of roundDamage) {
      if (!playerStatsMap.has(player)) continue;
      const stats = playerStatsMap.get(player)!;
      stats.damage += damage;
      if (isFirstHalf) stats.firstHalfDamage += damage;
      else stats.secondHalfDamage += damage;

      // Determine side for this round
      const playerTeam = stats.team;
      const playerSide = (roundNum <= 15)
        ? (playerTeam === startingCT ? 'CT' : 'T')
        : (playerTeam === startingCT ? 'T' : 'CT');

      if (playerSide === 'CT') stats.ctDamage += damage;
      else stats.tDamage += damage;
    }

    // Build per-round player stats
    const allPlayers = new Set<string>();
    round.kills.forEach(k => { allPlayers.add(k.killer); allPlayers.add(k.victim); });
    round.damage.forEach(d => { allPlayers.add(d.attacker); allPlayers.add(d.victim); });

    const playerRoundStats: RoundPlayerStats[] = [];
    for (const player of allPlayers) {
      const stats = playerStatsMap.get(player);
      if (!stats) continue;

      const playerSide: Side = (roundNum <= 15)
        ? (stats.team === startingCT ? 'CT' : 'T')
        : (stats.team === startingCT ? 'T' : 'CT');

      playerRoundStats.push({
        name: player,
        team: stats.team,
        side: playerSide,
        kills: roundKills.get(player) || 0,
        deaths: roundDeaths.has(player) ? 1 : 0,
        assists: 0, // Would need per-round tracking
        damage: roundDamage.get(player) || 0,
        survived: !roundDeaths.has(player),
      });
    }

    // Calculate running score
    const ctWins = rounds.slice(0, idx + 1).filter(r => r.winner === 'CT').length;
    const tWins = rounds.slice(0, idx + 1).filter(r => r.winner === 'T').length;

    return {
      number: round.number,
      winner: winnerTeam,
      winnerSide: round.winner,
      winReason: round.winReason,
      duration: Math.floor((round.endTime.getTime() - round.startTime.getTime()) / 1000),
      score: { ct: ctWins, t: tWins },
      playerStats: playerRoundStats.sort((a, b) => b.kills - a.kills),
      kills: killEvents,
    };
  });

  // Calculate final player stats
  const totalRounds = rounds.length;
  const firstHalfRounds = Math.min(15, totalRounds);
  const secondHalfRounds = Math.max(0, totalRounds - 15);
  const ctRounds = rounds.filter((_, i) => i < 15 ? true : false).length; // Simplified
  const tRounds = totalRounds - ctRounds;

  const players: PlayerStats[] = Array.from(playerStatsMap.entries()).map(([name, stats]) => {
    const ctRoundsPlayed = Math.min(15, totalRounds);
    const tRoundsPlayed = Math.max(0, totalRounds - 15);

    return {
      name,
      team: stats.team,
      kills: stats.kills,
      deaths: stats.deaths,
      assists: stats.assists,
      adr: Math.round((stats.damage / totalRounds) * 10) / 10,
      hsPercent: stats.kills > 0 ? Math.round((stats.headshots / stats.kills) * 100) : 0,
      firstHalf: {
        kills: stats.firstHalfKills,
        deaths: stats.firstHalfDeaths,
        adr: firstHalfRounds > 0 ? Math.round((stats.firstHalfDamage / firstHalfRounds) * 10) / 10 : 0,
        hsPercent: stats.firstHalfKills > 0 ? Math.round((stats.firstHalfHeadshots / stats.firstHalfKills) * 100) : 0,
      },
      secondHalf: {
        kills: stats.secondHalfKills,
        deaths: stats.secondHalfDeaths,
        adr: secondHalfRounds > 0 ? Math.round((stats.secondHalfDamage / secondHalfRounds) * 10) / 10 : 0,
        hsPercent: stats.secondHalfKills > 0 ? Math.round((stats.secondHalfHeadshots / stats.secondHalfKills) * 100) : 0,
      },
      ctSide: {
        kills: stats.ctKills,
        deaths: stats.ctDeaths,
        adr: ctRoundsPlayed > 0 ? Math.round((stats.ctDamage / ctRoundsPlayed) * 10) / 10 : 0,
        hsPercent: stats.ctKills > 0 ? Math.round((stats.ctHeadshots / stats.ctKills) * 100) : 0,
      },
      tSide: {
        kills: stats.tKills,
        deaths: stats.tDeaths,
        adr: tRoundsPlayed > 0 ? Math.round((stats.tDamage / tRoundsPlayed) * 10) / 10 : 0,
        hsPercent: stats.tKills > 0 ? Math.round((stats.tHeadshots / stats.tKills) * 100) : 0,
      },
    };
  }).sort((a, b) => b.kills - a.kills);

  // Convert date from MM/DD/YYYY to DD/MM/YYYY (EU format)
  const [month, day, year] = date.split('/');
  const euDate = `${day}/${month}/${year}`;

  return {
    map,
    date: euDate,
    duration: `${durationMins}:${durationSecs.toString().padStart(2, '0')}`,
    teams: [teamStats[startingCT], teamStats[startingT]],
    rounds: roundData,
    players,
  };
}
