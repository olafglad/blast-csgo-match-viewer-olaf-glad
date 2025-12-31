import type { Side, WinReason, KillEvent, FlashEvent, ChatMessage } from './events';
import type { PlayerStats, RoundPlayerStats } from './player';

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
  chat: ChatMessage[];
  flashes: FlashEvent[];
}
