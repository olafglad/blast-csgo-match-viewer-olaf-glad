import {useState} from "react";
import {useMatchData} from "./hooks/useMatchData";
import {MatchHeader} from "./components/MatchHeader";
import {RoundTimeline} from "./components/RoundTimeline";
import {Scoreboard} from "./components/Scoreboard";
import {RoundDetail} from "./components/RoundDetail";
import type {RoundData} from "./types";

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function calculateAvgRoundLength(rounds: RoundData[]): string {
  if (rounds.length === 0) return "0:00";
  const total = rounds.reduce((sum, r) => sum + r.duration, 0);
  return formatDuration(total / rounds.length);
}

function App() {
  const {data, loading, error} = useMatchData();
  const [selectedRound, setSelectedRound] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-400">Loading match data...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-400">
          Error: {error || "Failed to load match data"}
        </div>
      </div>
    );
  }

  const selectedRoundData = selectedRound
    ? data.rounds.find((r) => r.number === selectedRound)
    : null;

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-bold text-center mb-6 flex items-center justify-center gap-3">
          <img
            src="/csgo-logo.png"
            alt="CS:GO"
            className="h-15 object-contain"
          />
          <span>Match Statistics</span>
        </h1>

        {/* Match Header */}
        <MatchHeader
          teams={data.teams}
          map={data.map}
          duration={data.duration}
          date={data.date}
          avgRoundLength={calculateAvgRoundLength(data.rounds)}
        />

        {/* Scoreboard */}
        <Scoreboard
          players={data.players}
          teams={data.teams}
          rounds={data.rounds}
        />

        {/* Round Timeline */}
        <RoundTimeline
          rounds={data.rounds}
          selectedRound={selectedRound}
          onSelectRound={setSelectedRound}
        />

        {/* Round Detail (when selected) */}
        {selectedRoundData && (
          <RoundDetail
            round={selectedRoundData}
            allPlayers={data.players}
            teams={data.teams}
          />
        )}
      </div>
    </div>
  );
}

export default App;
