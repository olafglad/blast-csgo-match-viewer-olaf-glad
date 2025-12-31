import { useState } from 'react';
import type { PlayerStats, TeamStats, RoundData } from '../types';
import { SideIcon } from './RoundTimeline';
import { RoundScrubber, computeCumulativeStats } from './RoundScrubber';

interface Props {
  players: PlayerStats[];
  teams: [TeamStats, TeamStats];
  rounds?: RoundData[];
}

type ViewMode = 'overall' | 'firstHalf' | 'secondHalf' | 'ctSide' | 'tSide' | 'timeline';

export function Scoreboard({ players, teams, rounds }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('overall');
  const [timelineRound, setTimelineRound] = useState(rounds?.length || 1);

  const team1Players = players.filter(p => p.team === teams[0].name);
  const team2Players = players.filter(p => p.team === teams[1].name);

  // Compute cumulative stats for timeline mode
  const cumulativeStats = viewMode === 'timeline' && rounds
    ? computeCumulativeStats(rounds, timelineRound, teams)
    : null;

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      {/* View Mode Tabs */}
      <div className="flex justify-center gap-2 mb-4">
        {[
          { mode: 'overall' as const, label: 'Overall', icon: null },
          { mode: 'firstHalf' as const, label: '1st Half', icon: null },
          { mode: 'secondHalf' as const, label: '2nd Half', icon: null },
          { mode: 'ctSide' as const, label: 'Side', icon: 'CT' as const },
          { mode: 'tSide' as const, label: 'Side', icon: 'T' as const },
          ...(rounds ? [{ mode: 'timeline' as const, label: 'Timeline', icon: null }] : []),
        ].map(({ mode, label, icon }) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-3 py-1 rounded text-sm transition-colors flex items-center gap-1 ${
              viewMode === mode
                ? 'bg-gray-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:text-white'
            }`}
          >
            {icon && <SideIcon side={icon} size={14} />}
            {label}
          </button>
        ))}
      </div>

      {/* Round Scrubber for Timeline Mode */}
      {viewMode === 'timeline' && rounds && (
        <RoundScrubber
          rounds={rounds}
          teams={teams}
          currentRound={timelineRound}
          onRoundChange={setTimelineRound}
        />
      )}

      {/* Two-column Scoreboard */}
      <div className="grid grid-cols-2 gap-4">
        <TeamTable
          teamName={teams[0].name}
          players={team1Players}
          viewMode={viewMode}
          cumulativeStats={cumulativeStats}
          roundCount={timelineRound}
        />
        <TeamTable
          teamName={teams[1].name}
          players={team2Players}
          viewMode={viewMode}
          cumulativeStats={cumulativeStats}
          roundCount={timelineRound}
        />
      </div>
    </div>
  );
}

function TeamTable({
  teamName,
  players,
  viewMode,
  cumulativeStats,
  roundCount,
}: {
  teamName: string;
  players: PlayerStats[];
  viewMode: ViewMode;
  cumulativeStats: Map<string, { kills: number; deaths: number; assists: number; damage: number; headshots: number; team: string }> | null;
  roundCount: number;
}) {
  const getStats = (p: PlayerStats) => {
    // Timeline mode uses cumulative stats
    if (viewMode === 'timeline' && cumulativeStats) {
      const cumulative = cumulativeStats.get(p.name);
      if (cumulative) {
        const adr = roundCount > 0 ? Math.round((cumulative.damage / roundCount) * 10) / 10 : 0;
        const hsPercent = cumulative.kills > 0 ? Math.round((cumulative.headshots / cumulative.kills) * 100) : 0;
        return { kills: cumulative.kills, deaths: cumulative.deaths, adr, hsPercent };
      }
      return { kills: 0, deaths: 0, adr: 0, hsPercent: 0 };
    }

    switch (viewMode) {
      case 'firstHalf':
        return { kills: p.firstHalf.kills, deaths: p.firstHalf.deaths, adr: p.firstHalf.adr, hsPercent: p.firstHalf.hsPercent };
      case 'secondHalf':
        return { kills: p.secondHalf.kills, deaths: p.secondHalf.deaths, adr: p.secondHalf.adr, hsPercent: p.secondHalf.hsPercent };
      case 'ctSide':
        return { kills: p.ctSide.kills, deaths: p.ctSide.deaths, adr: p.ctSide.adr, hsPercent: p.ctSide.hsPercent };
      case 'tSide':
        return { kills: p.tSide.kills, deaths: p.tSide.deaths, adr: p.tSide.adr, hsPercent: p.tSide.hsPercent };
      default:
        return { kills: p.kills, deaths: p.deaths, adr: p.adr, hsPercent: p.hsPercent };
    }
  };

  const sortedPlayers = [...players].sort((a, b) => getStats(b).kills - getStats(a).kills);

  return (
    <div>
      <h4 className="text-lg font-semibold mb-2 text-white">
        {teamName}
      </h4>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-400 border-b border-gray-700">
            <th className="text-left py-2">Player</th>
            <th className="text-center w-12">K</th>
            <th className="text-center w-12">D</th>
            <th className="text-center w-12">A</th>
            <th className="text-center w-16">ADR</th>
            <th className="text-center w-14">HS%</th>
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.map((player) => {
            const stats = getStats(player);
            const assists = viewMode === 'timeline' && cumulativeStats
              ? cumulativeStats.get(player.name)?.assists || 0
              : player.assists;
            return (
              <tr key={player.name} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                <td className="py-2 font-medium">{player.name}</td>
                <td className="text-center text-green-400">{stats.kills}</td>
                <td className="text-center text-red-400">{stats.deaths}</td>
                <td className="text-center text-gray-400">{assists}</td>
                <td className="text-center">{stats.adr}</td>
                <td className="text-center text-yellow-400">{stats.hsPercent}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
