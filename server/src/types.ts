// Shared types for CS:GO match statistics

export type Side = 'CT' | 'T';
export type WinReason = 'elimination' | 'bomb_defused' | 'bomb_exploded' | 'timeout';

export interface MatchData {
  map: string;
  date: string;
  duration: string;
  teams: [TeamStats, TeamStats]; // [starting CT, starting T]
  rounds: RoundData[];
  players: PlayerStats[];
}

export interface TeamStats {
  name: string;
  finalScore: number;
  firstHalfScore: number;
  secondHalfScore: number;
  roundWinTypes: {
    elimination: number;
    bombDefused: number;
    bombExploded: number;
    timeout: number;
  };
  ctRoundsWon: number;
  tRoundsWon: number;
}

export interface RoundData {
  number: number;
  winner: string;
  winnerSide: Side;
  winReason: WinReason;
  duration: number;
  score: { ct: number; t: number };
  playerStats: RoundPlayerStats[];
  kills: KillEvent[];
}

export interface RoundPlayerStats {
  name: string;
  team: string;
  side: Side;
  kills: number;
  deaths: number;
  assists: number;
  damage: number;
  survived: boolean;
}

export interface KillEvent {
  timestamp: string;
  killer: string;
  killerTeam: string;
  victim: string;
  victimTeam: string;
  weapon: string;
  headshot: boolean;
}

export interface PlayerStats {
  name: string;
  team: string;
  kills: number;
  deaths: number;
  assists: number;
  adr: number;
  hsPercent: number;
  firstHalf: { kills: number; deaths: number; adr: number; hsPercent: number };
  secondHalf: { kills: number; deaths: number; adr: number; hsPercent: number };
  ctSide: { kills: number; deaths: number; adr: number; hsPercent: number };
  tSide: { kills: number; deaths: number; adr: number; hsPercent: number };
}

// Internal parsing types
export interface ParsedKill {
  timestamp: Date;
  killer: string;
  killerSide: Side;
  victim: string;
  victimSide: Side;
  weapon: string;
  headshot: boolean;
}

export interface ParsedDamage {
  timestamp: Date;
  attacker: string;
  attackerSide: Side;
  victim: string;
  victimSide: Side;
  damage: number;
  hitgroup: string;
}

export interface ParsedAssist {
  timestamp: Date;
  assister: string;
  victim: string;
}

export interface ParsedRound {
  number: number;
  startTime: Date;
  endTime: Date;
  winner: Side;
  winReason: WinReason;
  kills: ParsedKill[];
  damage: ParsedDamage[];
  assists: ParsedAssist[];
  ctTeam: string;
  tTeam: string;
}
