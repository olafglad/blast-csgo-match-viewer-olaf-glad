// Internal parsing types - only used by parser.ts
import type { Side, WinReason } from '../../shared/index.js';

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

export interface ParsedFlash {
  timestamp: Date;
  thrower: string;
  throwerSide: Side | 'Spectator';
  entindex: number;
}

export interface ParsedBlind {
  timestamp: Date;
  victim: string;
  victimSide: Side | 'Spectator';
  thrower: string;
  throwerSide: Side | 'Spectator';
  duration: number;
  entindex: number;
}

export interface ParsedChat {
  timestamp: Date;
  player: string;
  playerSide: Side;
  message: string;
  isTeamChat: boolean;
  isFreezeTime: boolean;
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
  flashes: ParsedFlash[];
  blinds: ParsedBlind[];
  chat: ParsedChat[];
  ctTeam: string;
  tTeam: string;
}
