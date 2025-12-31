import type { RoundData } from '../types';

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function calculateAvgRoundLength(rounds: RoundData[]): string {
  if (rounds.length === 0) return '0:00';
  const total = rounds.reduce((sum, r) => sum + r.duration, 0);
  return formatDuration(total / rounds.length);
}
