export type Side = 'CT' | 'T';
export type WinReason = 'elimination' | 'bomb_defused' | 'bomb_exploded' | 'timeout';

export interface MatchData {
  map: string;
  date: string;
  duration: string;
  teams: [TeamStats, TeamStats];
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
