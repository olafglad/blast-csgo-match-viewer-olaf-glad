import type { Side } from './events';

export interface FlashStats {
  thrown: number;
  enemiesBlinded: number;
  enemyBlindTime: number;
  teammatesBlinded: number;
  teammateBlindTime: number;
  selfFlashes: number;
  selfBlindTime: number;
  spectatorsFlashed: number;
  spectatorBlinds: { name: string; totalTime: number }[];
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

export interface MultiKillRounds {
  twoK: number;
  threeK: number;
  fourK: number;
  ace: number;
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
  openingKills: number;
  openingDeaths: number;
  clutchesWon: number;
  clutchesAttempted: number;
  flashStats: FlashStats;
  legShotPercent: number;
  leftLegDamage: number;
  rightLegDamage: number;
  totalDamageDealt: number;
  multiKillRounds: MultiKillRounds;
}
