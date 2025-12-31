export type Side = 'CT' | 'T';
export type WinReason = 'elimination' | 'bomb_defused' | 'bomb_exploded' | 'timeout';

export interface KillEvent {
  timestamp: string;
  killer: string;
  killerTeam: string;
  victim: string;
  victimTeam: string;
  weapon: string;
  headshot: boolean;
}

export interface FlashEvent {
  timestamp: string;
  thrower: string;
  throwerTeam: string;
  throwerSide: Side | 'Spectator';
  entindex: number;
  blinds: BlindEffect[];
}

export interface BlindEffect {
  victim: string;
  victimSide: Side | 'Spectator';
  duration: number;
  isSelf: boolean;
  isTeammate: boolean;
  isEnemy: boolean;
  isSpectator: boolean;
}

export interface ChatMessage {
  timestamp: string;
  relativeTime: string;
  player: string;
  team: string;
  side: Side;
  message: string;
  isTeamChat: boolean;
  isFreezeTime: boolean;
}
