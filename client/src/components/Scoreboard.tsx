import {useState} from "react";
import type {
  PlayerStats,
  TeamStats,
  RoundData,
  FlashStats,
  MultiKillRounds,
} from "@shared";
import {SideIcon} from "./RoundTimeline";
import {RoundScrubber, computeCumulativeStats} from "./RoundScrubber";

interface Props {
  players: PlayerStats[];
  teams: [TeamStats, TeamStats];
  rounds?: RoundData[];
}

type ViewMode =
  | "overall"
  | "firstHalf"
  | "secondHalf"
  | "ctSide"
  | "tSide"
  | "timeline"
  | "advanced";

export function Scoreboard({players, teams, rounds}: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("overall");
  const [timelineRound, setTimelineRound] = useState(rounds?.length || 1);

  const team1Players = players.filter((p) => p.team === teams[0].name);
  const team2Players = players.filter((p) => p.team === teams[1].name);

  // Compute cumulative stats for timeline mode
  const cumulativeStats =
    viewMode === "timeline" && rounds
      ? computeCumulativeStats(rounds, timelineRound, teams)
      : null;

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      {/* View Mode Tabs */}
      <div className="flex justify-center gap-2 mb-4">
        {[
          {mode: "overall" as const, label: "Overall", icon: null},
          {mode: "firstHalf" as const, label: "1st Half", icon: null},
          {mode: "secondHalf" as const, label: "2nd Half", icon: null},
          {mode: "ctSide" as const, label: "Side", icon: "CT" as const},
          {mode: "tSide" as const, label: "Side", icon: "T" as const},
          ...(rounds
            ? [{mode: "timeline" as const, label: "Timeline", icon: null}]
            : []),
          {mode: "advanced" as const, label: "Advanced", icon: null},
        ].map(({mode, label, icon}) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-3 py-1 rounded text-sm transition-colors flex items-center gap-1 ${
              viewMode === mode
                ? "bg-gray-600 text-white"
                : "bg-gray-700 text-gray-400 hover:text-white"
            }`}
          >
            {icon && <SideIcon side={icon} size={14} />}
            {label}
          </button>
        ))}
      </div>

      {/* Round Scrubber for Timeline Mode */}
      {viewMode === "timeline" && rounds && (
        <RoundScrubber
          rounds={rounds}
          teams={teams}
          currentRound={timelineRound}
          onRoundChange={setTimelineRound}
        />
      )}

      {/* Two-column Scoreboard */}
      <div className="grid grid-cols-2 gap-4">
        {viewMode === "advanced" ? (
          <>
            <AdvancedTeamTable
              teamName={teams[0].name}
              players={team1Players}
            />
            <AdvancedTeamTable
              teamName={teams[1].name}
              players={team2Players}
            />
          </>
        ) : (
          <>
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
          </>
        )}
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
  cumulativeStats: Map<
    string,
    {
      kills: number;
      deaths: number;
      assists: number;
      damage: number;
      headshots: number;
      team: string;
    }
  > | null;
  roundCount: number;
}) {
  const getStats = (p: PlayerStats) => {
    // Timeline mode uses cumulative stats
    if (viewMode === "timeline" && cumulativeStats) {
      const cumulative = cumulativeStats.get(p.name);
      if (cumulative) {
        const adr =
          roundCount > 0
            ? Math.round((cumulative.damage / roundCount) * 10) / 10
            : 0;
        const hsPercent =
          cumulative.kills > 0
            ? Math.round((cumulative.headshots / cumulative.kills) * 100)
            : 0;
        return {
          kills: cumulative.kills,
          deaths: cumulative.deaths,
          adr,
          hsPercent,
        };
      }
      return {kills: 0, deaths: 0, adr: 0, hsPercent: 0};
    }

    switch (viewMode) {
      case "firstHalf":
        return {
          kills: p.firstHalf.kills,
          deaths: p.firstHalf.deaths,
          adr: p.firstHalf.adr,
          hsPercent: p.firstHalf.hsPercent,
        };
      case "secondHalf":
        return {
          kills: p.secondHalf.kills,
          deaths: p.secondHalf.deaths,
          adr: p.secondHalf.adr,
          hsPercent: p.secondHalf.hsPercent,
        };
      case "ctSide":
        return {
          kills: p.ctSide.kills,
          deaths: p.ctSide.deaths,
          adr: p.ctSide.adr,
          hsPercent: p.ctSide.hsPercent,
        };
      case "tSide":
        return {
          kills: p.tSide.kills,
          deaths: p.tSide.deaths,
          adr: p.tSide.adr,
          hsPercent: p.tSide.hsPercent,
        };
      default:
        return {
          kills: p.kills,
          deaths: p.deaths,
          adr: p.adr,
          hsPercent: p.hsPercent,
        };
    }
  };

  const sortedPlayers = [...players].sort(
    (a, b) => getStats(b).kills - getStats(a).kills
  );

  return (
    <div>
      <h4 className="text-lg font-semibold mb-2 text-white">{teamName}</h4>
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
            const assists =
              viewMode === "timeline" && cumulativeStats
                ? cumulativeStats.get(player.name)?.assists || 0
                : player.assists;
            return (
              <tr
                key={player.name}
                className="border-b border-gray-700/50 hover:bg-gray-700/30"
              >
                <td className="py-2 font-medium">{player.name}</td>
                <td className="text-center text-green-400">{stats.kills}</td>
                <td className="text-center text-red-400">{stats.deaths}</td>
                <td className="text-center text-gray-400">{assists}</td>
                <td className="text-center">{stats.adr}</td>
                <td className="text-center text-yellow-400">
                  {stats.hsPercent}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Advanced stats table with expandable flash accordion
function AdvancedTeamTable({
  teamName,
  players,
}: {
  teamName: string;
  players: PlayerStats[];
}) {
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  const [hoveredLegPlayer, setHoveredLegPlayer] = useState<string | null>(null);
  const [hoveredMKPlayer, setHoveredMKPlayer] = useState<string | null>(null);

  // Sort by opening kills
  const sortedPlayers = [...players].sort(
    (a, b) => b.openingKills - a.openingKills
  );

  return (
    <div>
      <h4 className="text-lg font-semibold mb-2 text-white">{teamName}</h4>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-400 border-b border-gray-700">
            <th className="text-left py-2">Player</th>
            <th className="text-center w-20">Opening</th>
            <th className="text-center w-16">Flashes</th>
            <th className="text-center w-16">Clutches</th>
            <th className="text-center w-12">MK</th>
            <th className="text-center w-14">Legs</th>
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.map((player) => {
            const openingDuels = player.openingKills + player.openingDeaths;
            const openingPercent =
              openingDuels > 0
                ? Math.round((player.openingKills / openingDuels) * 100)
                : 0;
            const clutchPercent =
              player.clutchesAttempted > 0
                ? Math.round(
                    (player.clutchesWon / player.clutchesAttempted) * 100
                  )
                : 0;
            const isExpanded = expandedPlayer === player.name;
            const isLegHovered = hoveredLegPlayer === player.name;

            return (
              <>
                <tr
                  key={player.name}
                  className="border-b border-gray-700/50 hover:bg-gray-700/30"
                >
                  <td className="py-2 font-medium">{player.name}</td>
                  <td className="text-center">
                    <span className="text-green-400">
                      {player.openingKills}
                    </span>
                    <span className="text-gray-500">/</span>
                    <span className="text-gray-400">{openingDuels}</span>
                    {openingDuels > 0 && (
                      <span className="text-gray-500 text-xs ml-1">
                        ({openingPercent}%)
                      </span>
                    )}
                  </td>
                  <td className="text-center">
                    <button
                      onClick={() =>
                        setExpandedPlayer(isExpanded ? null : player.name)
                      }
                      className={`px-2 py-0.5 rounded transition-colors ${
                        isExpanded
                          ? "bg-yellow-500/30 text-yellow-300"
                          : "hover:bg-gray-600 text-gray-300"
                      }`}
                    >
                      {player.flashStats.thrown}
                      <span className="text-xs ml-1">
                        {isExpanded ? "▲" : "▼"}
                      </span>
                    </button>
                  </td>
                  <td className="text-center">
                    <span
                      className={
                        player.clutchesWon > 0
                          ? "text-green-400"
                          : "text-gray-400"
                      }
                    >
                      {player.clutchesWon}
                    </span>
                    <span className="text-gray-500">/</span>
                    <span className="text-gray-400">
                      {player.clutchesAttempted}
                    </span>
                    {player.clutchesAttempted > 0 && (
                      <span className="text-gray-500 text-xs ml-1">
                        ({clutchPercent}%)
                      </span>
                    )}
                  </td>
                  <td
                    className="text-center relative"
                    onMouseEnter={() => setHoveredMKPlayer(player.name)}
                    onMouseLeave={() => setHoveredMKPlayer(null)}
                  >
                    {(() => {
                      const mk = player.multiKillRounds;
                      const total = mk.twoK + mk.threeK + mk.fourK + mk.ace;
                      const isMKHovered = hoveredMKPlayer === player.name;
                      return (
                        <>
                          <span
                            className={
                              total > 0 ? "text-cyan-400" : "text-gray-400"
                            }
                          >
                            {total}
                          </span>
                          {isMKHovered && total > 0 && (
                            <div className="absolute z-10 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs whitespace-nowrap -translate-x-1/2 left-1/2 -top-8">
                              2K: {mk.twoK} | 3K: {mk.threeK} | 4K: {mk.fourK} |
                              5K: {mk.ace}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </td>
                  <td
                    className="text-center relative"
                    onMouseEnter={() => setHoveredLegPlayer(player.name)}
                    onMouseLeave={() => setHoveredLegPlayer(null)}
                  >
                    <span
                      className={
                        player.legShotPercent > 10
                          ? "text-orange-400"
                          : "text-gray-400"
                      }
                    >
                      {player.legShotPercent}%
                    </span>
                    {/* Leg damage tooltip */}
                    {isLegHovered &&
                      (player.leftLegDamage > 0 ||
                        player.rightLegDamage > 0) && (
                        <div className="absolute z-10 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs whitespace-nowrap -translate-x-1/2 left-1/2 -top-8">
                          L: {player.leftLegDamage} | R: {player.rightLegDamage}
                        </div>
                      )}
                  </td>
                </tr>
                {/* Expanded flash stats row */}
                {isExpanded && (
                  <tr key={`${player.name}-flash`} className="bg-gray-700/20">
                    <td colSpan={6} className="py-2 px-4">
                      <FlashStatsPanel stats={player.flashStats} />
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Flash stats expansion panel
function FlashStatsPanel({stats}: {stats: FlashStats}) {
  // Calculate total spectator blind time
  const totalSpectatorTime = stats.spectatorBlinds.reduce(
    (sum, s) => sum + s.totalTime,
    0
  );

  return (
    <div className="grid grid-cols-4 gap-4 text-xs">
      <div>
        <span className="text-gray-400">Enemies blinded:</span>
        <div className="text-red-400 font-medium">
          {stats.enemiesBlinded}
          <span className="text-gray-500 ml-1">
            ({stats.enemyBlindTime.toFixed(1)}s)
          </span>
        </div>
      </div>
      <div>
        <span className="text-gray-400">Teammates:</span>
        <div className="text-blue-400 font-medium">
          {stats.teammatesBlinded}
          <span className="text-gray-500 ml-1">
            ({stats.teammateBlindTime.toFixed(1)}s)
          </span>
        </div>
      </div>
      <div>
        <span className="text-gray-400">Self:</span>
        <div className="text-yellow-400 font-medium">
          {stats.selfFlashes}
          <span className="text-gray-500 ml-1">
            ({stats.selfBlindTime.toFixed(1)}s)
          </span>
        </div>
      </div>
      <div>
        <span className="text-gray-400">Spectators:</span>
        <div className="text-purple-400 font-medium">
          {stats.spectatorsFlashed}
          <span className="text-gray-500 ml-1">
            ({totalSpectatorTime.toFixed(1)}s)
          </span>
        </div>
        {stats.spectatorBlinds.length > 0 && (
          <div className="text-gray-500 mt-1">
            {stats.spectatorBlinds.map((s, i) => (
              <span key={s.name}>
                {i > 0 && ", "}
                <span className="text-purple-300">{s.name}</span>
                <span className="text-gray-600">
                  {" "}
                  ({s.totalTime.toFixed(1)}s)
                </span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
