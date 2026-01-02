import { useRef, useState, useEffect } from 'react';
import type { RoundData, TeamStats } from '@shared';
import { CT_COLOR, T_COLOR, TEAM_LOGOS } from '@shared';

interface Props {
  rounds: RoundData[];
  teams: [TeamStats, TeamStats];
  currentRound: number;
  onRoundChange: (round: number) => void;
}

export function RoundScrubber({ rounds, teams, currentRound, onRoundChange }: Props) {
  const totalRounds = rounds.length;
  const halfPoint = 15;
  const wheelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRound = useRef(currentRound);

  const roundsUpToCurrent = rounds.slice(0, currentRound);
  const team1Score = roundsUpToCurrent.filter(r => r.winner === teams[0].name).length;
  const team2Score = roundsUpToCurrent.filter(r => r.winner === teams[1].name).length;

  const currentRoundData = rounds[currentRound - 1];
  const dialColor = currentRoundData?.winnerSide === 'CT' ? CT_COLOR : T_COLOR;

  useEffect(() => {
    const wheel = wheelRef.current;
    if (!wheel) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY > 0 ? 1 : -1;
      onRoundChange(Math.max(1, Math.min(totalRounds, currentRound + delta)));
    };

    wheel.addEventListener('wheel', handleWheel, { passive: false });
    return () => wheel.removeEventListener('wheel', handleWheel);
  }, [currentRound, totalRounds, onRoundChange]);

  const dragStartY = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartRound.current = currentRound;
  };

  useEffect(() => {
    if (!isDragging) return;

    document.body.style.cursor = 'ns-resize';

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = dragStartY.current - e.clientY;
      const roundDelta = Math.round(deltaY / 12);
      const newRound = Math.max(1, Math.min(totalRounds, dragStartRound.current + roundDelta));
      if (newRound !== currentRound) {
        onRoundChange(newRound);
      }
    };

    const handleMouseUp = () => {
      document.body.style.cursor = '';
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.body.style.cursor = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, currentRound, totalRounds, onRoundChange]);

  const visibleRounds = [];
  for (let i = -2; i <= 2; i++) {
    const roundNum = currentRound + i;
    if (roundNum >= 1 && roundNum <= totalRounds) {
      visibleRounds.push({ number: roundNum, offset: i });
    }
  }

  return (
    <div className="bg-gray-700/30 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-6">
        <div className="shrink-0">
          <h3 className="text-sm font-semibold text-gray-400">After Round {currentRound}</h3>
        </div>

        <div className="flex-1 flex items-center justify-center gap-12 self-center">
          <div className="flex flex-col items-center">
            <span className="text-lg font-semibold text-white mb-2">{teams[0].name}</span>
            <div className="flex items-center gap-3">
              {TEAM_LOGOS[teams[0].name] && (
                <img
                  src={TEAM_LOGOS[teams[0].name]}
                  alt={teams[0].name}
                  className="w-12 h-12 object-contain"
                />
              )}
              <span
                className="text-4xl font-bold tabular-nums"
                style={{ color: team1Score > team2Score ? '#4ade80' : 'white' }}
              >
                {team1Score}
              </span>
            </div>
          </div>

          <span className="text-3xl text-gray-500">:</span>

          <div className="flex flex-col items-center">
            <span className="text-lg font-semibold text-white mb-2">{teams[1].name}</span>
            <div className="flex items-center gap-3">
              <span
                className="text-4xl font-bold tabular-nums"
                style={{ color: team2Score > team1Score ? '#4ade80' : 'white' }}
              >
                {team2Score}
              </span>
              {TEAM_LOGOS[teams[1].name] && (
                <img
                  src={TEAM_LOGOS[teams[1].name]}
                  alt={teams[1].name}
                  className="w-12 h-12 object-contain"
                />
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 shrink-0">
          <div
            ref={wheelRef}
            className="relative select-none overflow-hidden rounded-lg cursor-ns-resize"
            style={{ width: 80, height: 100 }}
            onMouseDown={handleMouseDown}
          >
            <div
              className="absolute inset-x-0 top-0 h-8 z-10 pointer-events-none"
              style={{ background: 'linear-gradient(to bottom, rgba(55, 65, 81, 1), transparent)' }}
            />
            <div
              className="absolute inset-x-0 bottom-0 h-8 z-10 pointer-events-none"
              style={{ background: 'linear-gradient(to top, rgba(55, 65, 81, 1), transparent)' }}
            />

            <div
              className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-9 z-0 pointer-events-none border-y"
              style={{
                borderColor: dialColor,
                background: `${dialColor}20`,
              }}
            />

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {visibleRounds.map(({ number, offset }) => {
                const isCenter = offset === 0;
                const rotateX = offset * 30;
                const scale = 1 - Math.abs(offset) * 0.2;
                const opacity = 1 - Math.abs(offset) * 0.4;

                return (
                  <div
                    key={number}
                    className="absolute transition-all duration-100 ease-out"
                    style={{
                      transform: `
                        translateY(${offset * 26}px)
                        perspective(150px)
                        rotateX(${rotateX}deg)
                        scale(${scale})
                      `,
                      opacity,
                    }}
                  >
                    <span
                      className={`font-bold ${isCenter ? 'text-2xl' : 'text-lg'}`}
                      style={{ color: isCenter ? 'white' : '#6b7280' }}
                    >
                      {number}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="absolute top-0.5 left-1/2 -translate-x-1/2 text-gray-500 text-[10px]">▲</div>
            <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-gray-500 text-[10px]">▼</div>
          </div>

          <div className={`flex gap-1 ${isDragging ? 'pointer-events-none' : ''}`}>
            <button
              onClick={() => onRoundChange(1)}
              className={`px-2 py-1 text-xs rounded transition-colors ${currentRound === 1 ? 'bg-gray-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'}`}
            >
              Start
            </button>
            {totalRounds > halfPoint && (
              <button
                onClick={() => onRoundChange(halfPoint)}
                className={`px-2 py-1 text-xs rounded transition-colors ${currentRound === halfPoint ? 'bg-gray-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'}`}
              >
                Half
              </button>
            )}
            <button
              onClick={() => onRoundChange(totalRounds)}
              className={`px-2 py-1 text-xs rounded transition-colors ${currentRound === totalRounds ? 'bg-gray-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'}`}
            >
              Final
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function computeCumulativeStats(
  rounds: RoundData[],
  upToRound: number
): Map<string, { kills: number; deaths: number; assists: number; damage: number; headshots: number; team: string }> {
  const stats = new Map<string, { kills: number; deaths: number; assists: number; damage: number; headshots: number; team: string }>();

  const roundsToProcess = rounds.slice(0, upToRound);

  for (const round of roundsToProcess) {
    // Count headshots per player from kill events
    const playerHeadshots = new Map<string, number>();
    for (const kill of round.kills) {
      if (kill.headshot) {
        playerHeadshots.set(kill.killer, (playerHeadshots.get(kill.killer) || 0) + 1);
      }
    }

    for (const player of round.playerStats) {
      const existing = stats.get(player.name) || {
        kills: 0,
        deaths: 0,
        assists: 0,
        damage: 0,
        headshots: 0,
        team: player.team,
      };

      stats.set(player.name, {
        kills: existing.kills + player.kills,
        deaths: existing.deaths + player.deaths,
        assists: existing.assists + player.assists,
        damage: existing.damage + player.damage,
        headshots: existing.headshots + (playerHeadshots.get(player.name) || 0),
        team: player.team,
      });
    }
  }

  return stats;
}
