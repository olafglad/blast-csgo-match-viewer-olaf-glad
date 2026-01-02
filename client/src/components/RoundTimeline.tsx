import type { RoundData } from '@shared';
import { CT_COLOR, T_COLOR } from '@shared';

interface Props {
  rounds: RoundData[];
  selectedRound: number | null;
  onSelectRound: (round: number | null) => void;
}

const WIN_REASON_ICONS: Record<string, string> = {
  elimination: "💀",
  bomb_exploded: "💥",
  timeout: "⏱️",
};

const WinReasonIcon = ({ winReason }: { winReason: string }) => {
  if (winReason === "bomb_defused") {
    return (
      <img
        src="/defuse-pliers.png"
        alt="Defused"
        className="inline-block"
        style={{ width: 16, height: 16 }}
      />
    );
  }
  return <span>{WIN_REASON_ICONS[winReason]}</span>;
};

const SideIcon = ({side, size = 16}: {side: "CT" | "T"; size?: number}) => (
  <img
    src={side === "CT" ? "/ct.png" : "/t.png"}
    alt={side}
    className="inline-block"
    style={{width: size, height: size}}
  />
);

export function RoundTimeline({rounds, selectedRound, onSelectRound}: Props) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold mb-4 text-center">Round Timeline</h3>

      <div className="mb-4">
        <p className="text-xs text-gray-400 mb-2 text-center">First Half</p>
        <div className="flex justify-center gap-2 flex-wrap">
          {rounds.slice(0, 15).map((round) => (
            <RoundBox
              key={round.number}
              round={round}
              isSelected={selectedRound === round.number}
              onClick={() =>
                onSelectRound(
                  selectedRound === round.number ? null : round.number
                )
              }
            />
          ))}
        </div>
      </div>

      {rounds.length > 15 && (
        <div>
          <p className="text-xs text-gray-400 mb-2 text-center">Second Half</p>
          <div className="flex justify-center gap-2 flex-wrap">
            {rounds.slice(15).map((round) => (
              <RoundBox
                key={round.number}
                round={round}
                isSelected={selectedRound === round.number}
                onClick={() =>
                  onSelectRound(
                    selectedRound === round.number ? null : round.number
                  )
                }
              />
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-4 text-center">
        Click a round to see details
      </p>
    </div>
  );
}

export {SideIcon};

function RoundBox({
  round,
  isSelected,
  onClick,
}: {
  round: RoundData;
  isSelected: boolean;
  onClick: () => void;
}) {
  const isCTWin = round.winnerSide === "CT";

  return (
    <button
      onClick={onClick}
      style={{backgroundColor: isCTWin ? CT_COLOR : T_COLOR}}
      className={`
        w-12 h-12 rounded-lg flex flex-col items-center justify-center text-xs font-bold text-white
        transition-all hover:scale-110 hover:z-10 hover:brightness-110
        ${
          isSelected
            ? "ring-2 ring-white ring-offset-2 ring-offset-gray-800"
            : ""
        }
      `}
      title={`Round ${round.number}: ${round.winner} (${round.winReason})`}
    >
      <span>{round.number}</span>
      <span className="text-sm"><WinReasonIcon winReason={round.winReason} /></span>
    </button>
  );
}
