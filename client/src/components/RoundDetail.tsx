import type { RoundData, PlayerStats, Side, TeamStats } from '@shared';
import { CT_COLOR, T_COLOR, formatDuration } from '@shared';
import { SideIcon } from './RoundTimeline';
import { RoundChat } from './RoundChat';
import { assetUrl } from '../utils/assetUrl';

interface Props {
  round: RoundData;
  allPlayers: PlayerStats[];
  teams: [TeamStats, TeamStats];
}

const WIN_REASON_LABELS: Record<string, string> = {
  elimination: "Elimination",
  bomb_defused: "Bomb Defused",
  bomb_exploded: "Bomb Exploded",
  timeout: "Time Out",
};

export function RoundDetail({round, allPlayers, teams}: Props) {
  // Build a map of player name to their round stats
  const playerRoundStatsMap = new Map(
    round.playerStats.map((p) => [p.name, p])
  );

  // Determine side for each player this round based on round number and starting sides
  const isFirstHalf = round.number <= 15;
  const getPlayerSide = (playerTeam: string): Side => {
    // teams[0] started CT, teams[1] started T
    if (isFirstHalf) {
      return playerTeam === teams[0].name ? "CT" : "T";
    } else {
      // Sides swap in second half
      return playerTeam === teams[0].name ? "T" : "CT";
    }
  };

  // Build complete player stats for this round (including players with 0 stats)
  const completePlayerStats = allPlayers.map((player) => {
    const roundStats = playerRoundStatsMap.get(player.name);
    const side = getPlayerSide(player.team);

    if (roundStats) {
      return roundStats;
    }

    // Player had no events this round - create default stats
    return {
      name: player.name,
      team: player.team,
      side,
      kills: 0,
      deaths: 0,
      assists: 0,
      damage: 0,
      survived: true, // If they have no death event, they survived
    };
  });

  // Build a map of player name to their side for kill feed colors
  const playerSideMap = new Map<string, "CT" | "T">();
  completePlayerStats.forEach((p) => {
    playerSideMap.set(p.name, p.side);
  });

  // Find who defused the bomb (last surviving CT if bomb was defused)
  const defuser =
    round.winReason === "bomb_defused"
      ? round.playerStats.find((p) => p.side === "CT" && p.survived)?.name
      : null;

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      {/* Round Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Round {round.number}</h3>
        <div className="text-right flex items-center gap-2">
          <span
            className="font-bold"
            style={{color: round.winnerSide === "CT" ? CT_COLOR : T_COLOR}}
          >
            {round.winner}
          </span>
          <span className="text-gray-400">wins</span>
          <span className="text-gray-500">
            ({WIN_REASON_LABELS[round.winReason]})
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
        <span>Duration: {formatDuration(round.duration)}</span>
        <span className="flex items-center gap-1">
          Score: <SideIcon side="CT" size={14} /> {round.score.ct} -{" "}
          {round.score.t} <SideIcon side="T" size={14} />
        </span>
      </div>

      {/* Kill Feed */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-400 mb-2">
          Round Events
        </h4>
        <div className="space-y-1">
          {round.kills.length === 0 && !defuser ? (
            <p className="text-gray-500 text-sm">No events this round</p>
          ) : (
            <>
              {round.kills.map((kill, idx) => {
                const killerSide = playerSideMap.get(kill.killer);
                const victimSide = playerSideMap.get(kill.victim);
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-sm bg-gray-700/30 rounded px-2 py-1"
                  >
                    <span
                      style={{color: killerSide === "CT" ? CT_COLOR : T_COLOR}}
                    >
                      {kill.killer}
                    </span>
                    <img
                      src={assetUrl(kill.headshot ? "headshot.png" : "skull-white.png")}
                      alt={kill.headshot ? "headshot" : "kill"}
                      className="w-8 h-8 object-contain"
                    />
                    <span
                      style={{color: victimSide === "CT" ? CT_COLOR : T_COLOR}}
                    >
                      {kill.victim}
                    </span>
                    <span className="text-gray-500 text-xs ml-auto">
                      {kill.weapon}
                    </span>
                  </div>
                );
              })}
              {defuser && (
                <div
                  className="flex items-center gap-2 text-sm rounded px-2 py-1 border"
                  style={{
                    backgroundColor: `${CT_COLOR}20`,
                    borderColor: `${CT_COLOR}50`,
                  }}
                >
                  <span className="font-medium" style={{color: CT_COLOR}}>
                    {defuser}
                  </span>
                  <span className="text-gray-400">defused the bomb</span>
                  <img
                    src={assetUrl("defuse-pliers.png")}
                    alt="Defused"
                    className="ml-auto"
                    style={{width: 16, height: 16}}
                  />
                </div>
              )}
              {round.winReason === "bomb_exploded" && (
                <div
                  className="flex items-center gap-2 text-sm rounded px-2 py-1 border"
                  style={{
                    backgroundColor: `${T_COLOR}20`,
                    borderColor: `${T_COLOR}50`,
                  }}
                >
                  <span className="font-medium" style={{color: T_COLOR}}>
                    Bomb exploded
                  </span>
                  <span className="ml-auto">💥</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Round Player Stats */}
      <div>
        <h4 className="text-sm font-semibold text-gray-400 mb-3">
          Player Stats
        </h4>
        <div className="grid grid-cols-2 gap-6">
          {(["CT", "T"] as const).map((side) => (
            <div
              key={side}
              className="rounded-lg overflow-hidden"
              style={{
                backgroundColor:
                  side === "CT" ? `${CT_COLOR}15` : `${T_COLOR}15`,
                border: `1px solid ${
                  side === "CT" ? `${CT_COLOR}40` : `${T_COLOR}40`
                }`,
              }}
            >
              <div
                className="px-3 py-2 flex items-center gap-2"
                style={{
                  backgroundColor:
                    side === "CT" ? `${CT_COLOR}30` : `${T_COLOR}30`,
                  borderBottom: `1px solid ${
                    side === "CT" ? `${CT_COLOR}40` : `${T_COLOR}40`
                  }`,
                }}
              >
                <SideIcon side={side} size={18} />
                <span
                  className="text-sm font-semibold"
                  style={{color: side === "CT" ? CT_COLOR : T_COLOR}}
                >
                  {side === "CT" ? "Counter-Terrorists" : "Terrorists"}
                </span>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr
                    className="text-gray-400"
                    style={{
                      borderBottom: `1px solid ${
                        side === "CT" ? `${CT_COLOR}30` : `${T_COLOR}30`
                      }`,
                    }}
                  >
                    <th className="text-left px-3 py-2">Player</th>
                    <th className="text-center w-10 py-2">K</th>
                    <th className="text-center w-10 py-2">D</th>
                    <th className="text-center w-14 py-2">DMG</th>
                  </tr>
                </thead>
                <tbody>
                  {completePlayerStats
                    .filter((p) => p.side === side)
                    .sort((a, b) => b.damage - a.damage)
                    .map((p, idx, arr) => (
                      <tr
                        key={p.name}
                        className={!p.survived ? "text-gray-500" : ""}
                        style={{
                          borderBottom:
                            idx < arr.length - 1
                              ? `1px solid ${
                                  side === "CT"
                                    ? `${CT_COLOR}20`
                                    : `${T_COLOR}20`
                                }`
                              : "none",
                        }}
                      >
                        <td className="px-3 py-1.5">{p.name}</td>
                        <td className="text-center text-green-400">
                          {p.kills}
                        </td>
                        <td className="text-center text-red-400">{p.deaths}</td>
                        <td className="text-center">{p.damage}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>

      <RoundChat messages={round.chat} />
    </div>
  );
}
