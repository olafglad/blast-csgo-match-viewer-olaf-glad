import type { TeamStats } from '@shared';
import { TEAM_LOGOS } from '@shared';
import { SideIcon } from './RoundTimeline';
import { assetUrl } from '../utils/assetUrl';

interface Props {
  teams: [TeamStats, TeamStats];
  map: string;
  duration: string;
  date: string;
  avgRoundLength: string;
}

export function MatchHeader({ teams, map, duration, date, avgRoundLength }: Props) {
  const [team1, team2] = teams;

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-center gap-8 mb-4">
        <div className="text-right flex-1">
          <div className="flex items-center justify-end gap-3">
            {TEAM_LOGOS[team1.name] && (
              <img
                src={assetUrl(TEAM_LOGOS[team1.name])}
                alt={team1.name}
                className="w-14 h-14 object-contain drop-shadow-lg"
                style={{ filter: 'drop-shadow(0 0 1px rgba(0,0,0,0.5))' }}
              />
            )}
            <h2 className="text-2xl font-bold text-white">{team1.name}</h2>
          </div>
          <p className="text-sm text-gray-400 flex items-center justify-end gap-1">
            Started <SideIcon side="CT" size={14} />
          </p>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-5xl font-bold text-white">{team1.finalScore}</span>
          <span className="text-3xl text-gray-500">:</span>
          <span className="text-5xl font-bold text-white">{team2.finalScore}</span>
        </div>

        <div className="text-left flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white">{team2.name}</h2>
            {TEAM_LOGOS[team2.name] && (
              <img
                src={assetUrl(TEAM_LOGOS[team2.name])}
                alt={team2.name}
                className="w-14 h-14 object-contain drop-shadow-lg"
                style={{ filter: 'drop-shadow(0 0 1px rgba(0,0,0,0.5))' }}
              />
            )}
          </div>
          <p className="text-sm text-gray-400 flex items-center gap-1">
            Started <SideIcon side="T" size={14} />
          </p>
        </div>
      </div>

      <div className="flex justify-center gap-6 text-sm text-gray-400">
        <span>Map: <span className="text-gray-200">{map}</span></span>
        <span>Duration: <span className="text-gray-200">{duration}</span></span>
        <span>Avg Round: <span className="text-gray-200">{avgRoundLength}</span></span>
        <span>Date: <span className="text-gray-200">{date}</span></span>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700 flex justify-center gap-12 text-sm">
        <div className="text-center">
          <p className="text-gray-400 mb-1 flex items-center justify-center gap-1">
            First Half <span className="text-xs">(<SideIcon side="CT" size={12} /> vs <SideIcon side="T" size={12} />)</span>
          </p>
          <p>
            <span className="font-semibold text-white">{team1.firstHalfScore}</span>
            <span className="text-gray-500 mx-2">-</span>
            <span className="font-semibold text-white">{team2.firstHalfScore}</span>
          </p>
        </div>
        <div className="text-center">
          <p className="text-gray-400 mb-1 flex items-center justify-center gap-1">
            Second Half <span className="text-xs">(<SideIcon side="T" size={12} /> vs <SideIcon side="CT" size={12} />)</span>
          </p>
          <p>
            <span className="font-semibold text-white">{team1.secondHalfScore}</span>
            <span className="text-gray-500 mx-2">-</span>
            <span className="font-semibold text-white">{team2.secondHalfScore}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
